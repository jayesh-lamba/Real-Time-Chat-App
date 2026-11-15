import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password, username } = req.body;
  try {
    if (!fullName || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Validate username format
    if (!/^[a-z0-9_.]+$/.test(username.toLowerCase())) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, underscores, and dots" });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: "Username must be between 3 and 20 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      username: username.toLowerCase().trim(),
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
        publicKey: newUser.publicKey,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      publicKey: user.publicKey || "",
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    let updateData = {};

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({ message: "Full Name cannot be empty" });
      }
      updateData.fullName = fullName.trim();
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (profilePic === null) {
      // Explicit removal — clear the field
      updateData.profilePic = "";
    } else if (profilePic) {
      try {
        // Try uploading to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: "chatapp/avatars",
          transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
        });
        updateData.profilePic = uploadResponse.secure_url;
      } catch (cloudinaryError) {
        console.warn("Cloudinary upload failed, falling back to direct base64 storage:", cloudinaryError.message);
        // Fallback: store base64 directly in MongoDB (safe for cropped 400x400 avatars)
        updateData.profilePic = profilePic;
      }
    }

    // Ensure we actually have something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      username: updatedUser.username,
      profilePic: updatedUser.profilePic,
      bio: updatedUser.bio || "",
      publicKey: updatedUser.publicKey || "",
      createdAt: updatedUser.createdAt,
    });

  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.length < 3) {
      return res.status(200).json({ available: false, message: "Username too short" });
    }
    if (!/^[a-z0-9_.]+$/.test(username.toLowerCase())) {
      return res.status(200).json({ available: false, message: "Invalid characters" });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    res.status(200).json({ available: !existing });
  } catch (error) {
    console.log("Error in checkUsername controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// E2EE: Register current user's public key
export const registerPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ message: "publicKey is required" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { publicKey },
      { new: true }
    );
    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    console.log("Error in registerPublicKey:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// E2EE: Fetch partner's public key
export const getPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ publicKey: user.publicKey || "" });
  } catch (error) {
    console.log("Error in getPublicKey:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

