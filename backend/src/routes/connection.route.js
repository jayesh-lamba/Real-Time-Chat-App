import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendConnectionRequest,
  getPendingRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  searchUsers,
  getSuggestedUsers,
} from "../controllers/connection.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/suggestions", protectRoute, getSuggestedUsers);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/sent", protectRoute, getSentRequests);

router.post("/request/:username", protectRoute, sendConnectionRequest);
router.put("/accept/:requestId", protectRoute, acceptConnectionRequest);
router.put("/reject/:requestId", protectRoute, rejectConnectionRequest);
router.delete("/remove/:connectionId", protectRoute, removeConnection);

export default router;
