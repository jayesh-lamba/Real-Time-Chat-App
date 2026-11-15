import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  getUnreadCounts,
  markConversationAsRead,
  deleteMessage,
  editMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/unread", protectRoute, getUnreadCounts);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/read/:id", protectRoute, markConversationAsRead);
router.delete("/delete/:id", protectRoute, deleteMessage);
router.put("/edit/:id", protectRoute, editMessage);


export default router;

