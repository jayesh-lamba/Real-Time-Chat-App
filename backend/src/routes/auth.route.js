import express from "express";
import {
  checkAuth,
  checkUsername,
  login,
  logout,
  signup,
  updateProfile,
  registerPublicKey,
  getPublicKey,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.put("/register-key", protectRoute, registerPublicKey);
router.get("/public-key/:userId", protectRoute, getPublicKey);

router.get("/check", protectRoute, checkAuth);
router.get("/check-username/:username", checkUsername); // public — no auth needed
export default router;


