import User from "../models/user.model.js";
import Connection from "../models/connection.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// POST /api/connections/request/:username
export const sendConnectionRequest = async (req, res) => {
  try {
    const { username } = req.params;
    const requesterId = req.user._id;

    // Find recipient by username
    const recipient = await User.findOne({ username: username.toLowerCase() }).select("-password");
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }
    if (recipient._id.toString() === requesterId.toString()) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    // Check for existing connection in this direction
    const existingRequest = await Connection.findOne({
      requesterId,
      recipientId: recipient._id,
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already sent" });
    }

    // Check for reverse pending request → auto-accept both
    const reverseRequest = await Connection.findOne({
      requesterId: recipient._id,
      recipientId: requesterId,
      status: "pending",
    });

    if (reverseRequest) {
      // Auto-accept: update the reverse request and create the forward accepted one
      reverseRequest.status = "accepted";
      await reverseRequest.save();

      // Emit connectionAccepted to both parties
      const requesterSocketId = getReceiverSocketId(requesterId.toString());
      const recipientSocketId = getReceiverSocketId(recipient._id.toString());
      if (requesterSocketId) io.to(requesterSocketId).emit("connectionAccepted", { userId: recipient._id });
      if (recipientSocketId) io.to(recipientSocketId).emit("connectionAccepted", { userId: requesterId });

      return res.status(200).json({ message: "Mutual request detected — you are now connected!", status: "accepted" });
    }

    // Create new pending request
    const newConnection = new Connection({
      requesterId,
      recipientId: recipient._id,
      status: "pending",
    });
    await newConnection.save();

    // Emit connectionRequest to recipient if online
    const recipientSocketId = getReceiverSocketId(recipient._id.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("connectionRequest", {
        _id: newConnection._id,
        requester: {
          _id: req.user._id,
          fullName: req.user.fullName,
          username: req.user.username,
          profilePic: req.user.profilePic,
        },
      });
    }

    res.status(201).json({ message: "Connection request sent", connection: newConnection });
  } catch (error) {
    console.error("Error in sendConnectionRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/connections/pending — incoming requests to me
export const getPendingRequests = async (req, res) => {
  try {
    const myId = req.user._id;
    const requests = await Connection.find({ recipientId: myId, status: "pending" })
      .populate("requesterId", "-password")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getPendingRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/connections/sent — outgoing requests from me still pending
export const getSentRequests = async (req, res) => {
  try {
    const myId = req.user._id;
    const requests = await Connection.find({ requesterId: myId, status: "pending" })
      .populate("recipientId", "-password")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getSentRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/connections/accept/:requestId
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const myId = req.user._id;

    const connection = await Connection.findOne({
      _id: requestId,
      recipientId: myId,
      status: "pending",
    });
    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    connection.status = "accepted";
    await connection.save();

    // Emit connectionAccepted to the requester so their sidebar refreshes live
    const requesterSocketId = getReceiverSocketId(connection.requesterId.toString());
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("connectionAccepted", {
        userId: myId,
        fullName: req.user.fullName,
        username: req.user.username,
        profilePic: req.user.profilePic,
      });
    }

    res.status(200).json({ message: "Connection accepted", connection });
  } catch (error) {
    console.error("Error in acceptConnectionRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/connections/reject/:requestId
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const myId = req.user._id;

    const connection = await Connection.findOne({
      _id: requestId,
      recipientId: myId,
      status: "pending",
    });
    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    connection.status = "rejected";
    await connection.save();

    res.status(200).json({ message: "Connection rejected" });
  } catch (error) {
    console.error("Error in rejectConnectionRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/connections/remove/:connectionId
export const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const myId = req.user._id;

    const connection = await Connection.findOne({
      _id: connectionId,
      status: "accepted",
      $or: [{ requesterId: myId }, { recipientId: myId }],
    });
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    await connection.deleteOne();
    res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    console.error("Error in removeConnection:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/connections/search?username=xyz
// Results ranked: exact match → prefix match → contains match (each tier capped, total ≤ 10)
export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    const myId = req.user._id;

    if (!username || username.trim().length < 2) {
      return res.status(400).json({ message: "Search query too short" });
    }

    const q = username.trim().toLowerCase();
    const baseFilter = { _id: { $ne: myId } };
    const select = "-password";
    const LIMIT = 10;

    // Run all 3 tiers in parallel for speed
    const [exactMatches, prefixMatches, containsMatches] = await Promise.all([
      // Tier 1: exact username match
      User.find({ ...baseFilter, username: q }).select(select).limit(LIMIT),
      // Tier 2: prefix match (starts with query)
      User.find({ ...baseFilter, username: { $regex: `^${q}`, $options: "i" } }).select(select).limit(LIMIT),
      // Tier 3: contains match (query anywhere in username)
      User.find({ ...baseFilter, username: { $regex: q, $options: "i" } }).select(select).limit(LIMIT),
    ]);

    // Merge tiers, deduplicate by _id, preserve rank order, slice to LIMIT
    const seen = new Set();
    const merged = [];
    for (const user of [...exactMatches, ...prefixMatches, ...containsMatches]) {
      const idStr = user._id.toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        merged.push(user);
        if (merged.length === LIMIT) break;
      }
    }

    // Fetch all connections involving me (single query, not per-user)
    const myConnections = await Connection.find({
      $or: [{ requesterId: myId }, { recipientId: myId }],
    });

    // Map each result to include relationshipStatus
    const results = merged.map((user) => {
      const conn = myConnections.find(
        (c) =>
          c.requesterId.toString() === user._id.toString() ||
          c.recipientId.toString() === user._id.toString()
      );

      let relationshipStatus = "none";
      if (conn) {
        if (conn.status === "accepted") {
          relationshipStatus = "connected";
        } else if (conn.status === "pending") {
          relationshipStatus =
            conn.requesterId.toString() === myId.toString()
              ? "pending_sent"
              : "pending_received";
        }
      }

      return {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        profilePic: user.profilePic,
        relationshipStatus,
        connectionId: conn ? conn._id : null,
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/connections/suggestions — get up to 5 suggested users to connect with
export const getSuggestedUsers = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all connections/requests involving me
    const myConnections = await Connection.find({
      $or: [{ requesterId: myId }, { recipientId: myId }],
    });

    // Extract all user IDs connected to me (either as requester or recipient)
    const connectedUserIds = myConnections.map((c) =>
      c.requesterId.toString() === myId.toString() ? c.recipientId : c.requesterId
    );

    // Exclude myself and connected/pending user IDs
    const excludeIds = [myId, ...connectedUserIds];

    // Find up to 5 users who are NOT in the excluded list
    const suggestions = await User.find({
      _id: { $nin: excludeIds },
    })
      .select("-password")
      .limit(5);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error in getSuggestedUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
