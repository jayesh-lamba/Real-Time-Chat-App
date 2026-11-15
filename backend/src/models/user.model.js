import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: [/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, underscores, and dots"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    publicKey: {
      type: String, // Hex-encoded X25519 public key
      default: "",
    },
    bio: {
      type: String,
      default: "Hey there! I am chatting on JayeshChat by Jayesh Lamba.",
    },

  },
  { timestamps: true }

);

const User = mongoose.model("User", userSchema);

export default User;
