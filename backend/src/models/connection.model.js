import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests in the same direction
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
