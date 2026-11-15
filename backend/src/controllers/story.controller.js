import Story from "../models/story.model.js";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

const STORY_TTL_HOURS = 24;

// ── Helper: get accepted connection IDs for a user ──
const getConnectionIds = async (userId) => {
  const connections = await Connection.find({
    $or: [
      { requesterId: userId, status: "accepted" },
      { recipientId: userId, status: "accepted" },
    ],
  });
  return connections.map((c) =>
    c.requesterId.toString() === userId.toString() ? c.recipientId : c.requesterId
  );
};

// POST /api/stories
// Upload image or video to Cloudinary, create story document (24h TTL)
export const createStory = async (req, res) => {
  try {
    const { media, mediaType, caption } = req.body;
    const userId = req.user._id;

    if (!media || !mediaType) {
      return res.status(400).json({ message: "media and mediaType are required" });
    }
    if (!["image", "video"].includes(mediaType)) {
      return res.status(400).json({ message: "mediaType must be 'image' or 'video'" });
    }

    // Upload to Cloudinary
    const uploadOptions = {
      folder: "chatapp/stories",
      resource_type: mediaType === "video" ? "video" : "image",
    };

    // For images — resize to fit story aspect (9:16) and cap quality
    if (mediaType === "image") {
      uploadOptions.transformation = [
        { width: 1080, height: 1920, crop: "limit" },
        { quality: "auto" },
      ];
    }

    // For videos — enforce 30s duration limit via Cloudinary eager transformation
    if (mediaType === "video") {
      uploadOptions.eager = [{ duration: "30" }];
      uploadOptions.eager_async = false;
    }

    let mediaUrl = "";
    try {
      const uploadResult = await cloudinary.uploader.upload(media, uploadOptions);
      mediaUrl = uploadResult.secure_url;
    } catch (cloudinaryError) {
      console.warn("Cloudinary story upload failed, falling back to direct base64 storage:", cloudinaryError.message);
      mediaUrl = media; // Direct base64 fallback
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STORY_TTL_HOURS * 60 * 60 * 1000);

    const story = await Story.create({
      userId,
      mediaUrl,
      mediaType,
      caption: caption || "",
      expiresAt,
    });

    res.status(201).json(story);

  } catch (error) {
    console.error("Error in createStory:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/feed
// Returns stories from accepted connections + own stories, grouped by user
// Each story includes isViewed flag based on current user's presence in viewers[]
export const getStoryFeed = async (req, res) => {
  try {
    const myId = req.user._id;
    const connectionIds = await getConnectionIds(myId);

    // Include self so own stories appear in the feed
    const allowedUserIds = [...connectionIds, myId];

    const now = new Date();
    const stories = await Story.find({
      userId: { $in: allowedUserIds },
      expiresAt: { $gt: now }, // belt-and-suspenders, TTL handles real deletion
    })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName username profilePic");

    // Map with isViewed flag
    const mapped = stories.map((s) => ({
      _id: s._id,
      userId: s.userId,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      viewerCount: s.viewers.length,
      isViewed: s.viewers.some((v) => v.userId.toString() === myId.toString()),
      isOwn: s.userId._id.toString() === myId.toString(),
    }));

    // Group by userId
    const grouped = {};
    for (const story of mapped) {
      const uid = story.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: story.userId,
          stories: [],
          hasUnviewed: false,
          isOwn: story.isOwn,
        };
      }
      grouped[uid].stories.push(story);
      if (!story.isViewed) grouped[uid].hasUnviewed = true;
    }

    // Sort: own first, then unviewed, then viewed
    const result = Object.values(grouped).sort((a, b) => {
      if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
      if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
      return 0;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getStoryFeed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories/:id/view
// Add the current user to viewers (idempotent — no-op if already viewed)
export const markStoryViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Enforce connection privacy — can only view stories of connections (or own)
    const connectionIds = await getConnectionIds(myId);
    const isAllowed =
      story.userId.toString() === myId.toString() ||
      connectionIds.some((cid) => cid.toString() === story.userId.toString());

    if (!isAllowed) {
      return res.status(403).json({ message: "Not allowed to view this story" });
    }

    // Idempotent add
    const alreadyViewed = story.viewers.some(
      (v) => v.userId.toString() === myId.toString()
    );
    if (!alreadyViewed) {
      story.viewers.push({ userId: myId, viewedAt: new Date() });
      await story.save();
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error in markStoryViewed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/stories/:id
// Owner-only early delete
export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Not your story" });
    }

    await story.deleteOne();
    res.status(200).json({ message: "Story deleted" });
  } catch (error) {
    console.error("Error in deleteStory:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/:id/viewers
// Owner-only — returns list of viewers with name, avatar, viewedAt
export const getStoryViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const story = await Story.findById(id).populate("viewers.userId", "fullName username profilePic");
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Not your story" });
    }

    const viewers = story.viewers.map((v) => ({
      user: v.userId,
      viewedAt: v.viewedAt,
    }));

    res.status(200).json(viewers);
  } catch (error) {
    console.error("Error in getStoryViewers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
