import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createStory,
  getStoryFeed,
  markStoryViewed,
  deleteStory,
  getStoryViewers,
} from "../controllers/story.controller.js";

const router = express.Router();

// All story routes require authentication
router.post("/", protectRoute, createStory);
router.get("/feed", protectRoute, getStoryFeed);
router.post("/:id/view", protectRoute, markStoryViewed);
router.delete("/:id", protectRoute, deleteStory);
router.get("/:id/viewers", protectRoute, getStoryViewers);

export default router;
