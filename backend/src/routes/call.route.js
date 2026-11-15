import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import CallLog from "../models/call.model.js";

const router = express.Router();

// GET /api/calls/history?page=1&limit=20
// Returns the paginated calls for the logged-in user, filtered for soft-deleted entries
router.get("/history", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const myId = req.user._id;

    // Filter out soft-deleted call logs
    const query = {
      $or: [
        { callerId: myId, deletedByCaller: false },
        { receiverId: myId, deletedByReceiver: false },
      ],
    };

    const logs = await CallLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("callerId", "fullName profilePic username")
      .populate("receiverId", "fullName profilePic username");

    const total = await CallLog.countDocuments(query);

    res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
      },
    });
  } catch (error) {
    console.error("Error in getCallHistory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/calls/:id
// Soft deletes a call log for the current user so it disappears from their history view
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const log = await CallLog.findById(id);
    if (!log) return res.status(404).json({ message: "Call log not found" });

    // Enforce authorization
    const isCaller = log.callerId.toString() === myId.toString();
    const isReceiver = log.receiverId.toString() === myId.toString();

    if (!isCaller && !isReceiver) {
      return res.status(403).json({ message: "Not authorized to delete this log" });
    }

    if (isCaller) {
      log.deletedByCaller = true;
    } else {
      log.deletedByReceiver = true;
    }

    // If both users soft-deleted it, we can delete it from DB entirely
    if (log.deletedByCaller && log.deletedByReceiver) {
      await log.deleteOne();
    } else {
      await log.save();
    }

    res.status(200).json({ success: true, message: "Call log deleted from view" });
  } catch (error) {
    console.error("Error in deleteCallLog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
