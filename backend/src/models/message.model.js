import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    // E2EE fields
    cipherText: {
      type: String, // Encrypted payload
    },
    nonce: {
      type: String, // Hex-encoded nonce required for decryption
    },
    // Message read/seen fields
    isRead: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },




    // Sticker support — backward-compatible: existing messages default to "text"
    messageType: {
      type: String,
      enum: ["text", "image", "video", "sticker", "call_log"],
      default: "text",
    },

    stickerId: {
      type: String, // references the sticker id from the frontend manifest
      default: null,
    },
    callType: {
      type: String, // "voice" | "video"
    },
    callStatus: {
      type: String, // "answered" | "missed" | "declined"
    },
    callDuration: {
      type: Number, // in seconds
    },

  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

