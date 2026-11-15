import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Connection from "../models/connection.model.js";
import { isConnected } from "../lib/connection.lib.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Only return users with an accepted connection — core privacy requirement
    const acceptedConnections = await Connection.find({
      $or: [
        { requesterId: loggedInUserId, status: "accepted" },
        { recipientId: loggedInUserId, status: "accepted" },
      ],
    });

    const connectedUserIds = acceptedConnections.map((conn) =>
      conn.requesterId.toString() === loggedInUserId.toString()
        ? conn.recipientId
        : conn.requesterId
    );

    const connectedUsers = await User.find({ _id: { $in: connectedUserIds } }).select("-password");

    res.status(200).json(connectedUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Privacy check — enforce server-side
    const connected = await isConnected(myId, userToChatId);
    if (!connected) {
      return res.status(403).json({ message: "You must be connected to message this user" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedBy: { $ne: myId },
    });


    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, messageType = "text", stickerId, cipherText, nonce } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Privacy check — enforce server-side (same rule for all message types)
    const connected = await isConnected(senderId, receiverId);
    if (!connected) {
      return res.status(403).json({ message: "You must be connected to message this user" });
    }

    // Validate sticker messages
    if (messageType === "sticker" && !stickerId) {
      return res.status(400).json({ message: "stickerId is required for sticker messages" });
    }

    let imageUrl;
    if (image && messageType !== "sticker") {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "chatapp/messages/images",
        });
        imageUrl = uploadResponse.secure_url;
      } catch (cloudinaryError) {
        console.warn("Cloudinary message image upload failed, storing base64 directly:", cloudinaryError.message);
        imageUrl = image; // direct base64 fallback
      }
    }

    let videoUrl;
    if (req.body.video) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(req.body.video, {
          folder: "chatapp/messages/videos",
          resource_type: "video",
        });
        videoUrl = uploadResponse.secure_url;
      } catch (cloudinaryError) {
        console.warn("Cloudinary message video upload failed, storing base64 directly:", cloudinaryError.message);
        videoUrl = req.body.video; // direct base64 fallback
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text, // Optional fallback/unencrypted text (e.g. for legacy messages)
      cipherText,
      nonce,
      image: imageUrl,
      video: videoUrl,
      messageType,
      stickerId: messageType === "sticker" ? stickerId : null,
    });


    await newMessage.save();


    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/messages/unread
// Aggregates count of unread messages sent to the logged-in user, grouped by sender
export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;
    const unreads = await Message.aggregate([
      { $match: { receiverId: myId, isRead: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);
    // Transform array to key-value map for instant O(1) frontend lookup: { [senderId]: count }
    const unreadMap = {};
    unreads.forEach((u) => {
      unreadMap[u._id.toString()] = u.count;
    });
    res.status(200).json(unreadMap);
  } catch (error) {
    console.error("Error in getUnreadCounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/messages/read/:id
// Marks all unread messages from a contact as read, and notifies them via socket
export const markConversationAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: senderId } = req.params;

    await Message.updateMany(
      { senderId, receiverId: myId, isRead: false },
      { $set: { isRead: true, seenAt: new Date() } }
    );

    // Notify sender that their messages have been read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message:seen", { byUser: myId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: messageId } = req.params;
    const { type } = req.body; // "unsend" | "me"

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (type === "unsend") {
      if (message.senderId.toString() !== myId.toString()) {
        return res.status(403).json({ message: "You can only unsend your own messages" });
      }
      await Message.findByIdAndDelete(messageId);

      // Notify both participants
      const senderSocket = getReceiverSocketId(message.senderId);
      const receiverSocket = getReceiverSocketId(message.receiverId);

      if (senderSocket) io.to(senderSocket).emit("messageDeleted", { messageId, deleteType: "unsend" });
      if (receiverSocket) io.to(receiverSocket).emit("messageDeleted", { messageId, deleteType: "unsend" });
    } else {
      // Delete for me
      await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedBy: myId } });

      // Notify sender (for multi-tab sync)
      const senderSocket = getReceiverSocketId(myId);
      if (senderSocket) {
        io.to(senderSocket).emit("messageDeleted", { messageId, deleteType: "me" });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: messageId } = req.params;
    const { text, cipherText, nonce } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.text = text;
    if (cipherText) message.cipherText = cipherText;
    if (nonce) message.nonce = nonce;
    message.isEdited = true;

    await message.save();

    // Notify both participants
    const senderSocket = getReceiverSocketId(message.senderId);
    const receiverSocket = getReceiverSocketId(message.receiverId);

    if (senderSocket) io.to(senderSocket).emit("messageEdited", message);
    if (receiverSocket) io.to(receiverSocket).emit("messageEdited", message);

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



