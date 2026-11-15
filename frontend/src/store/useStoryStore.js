import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";
import { DEMO_STORIES } from "../lib/demoData.js";

export const useStoryStore = create((set, get) => ({
  storyGroups: DEMO_STORIES,
  isLoading: false,
  isUploading: false,
  activeGroup: null,
  viewerList: null,

  fetchFeed: async () => {
    if (useAuthStore.getState().isDemoMode) {
      if (get().storyGroups.length === 0) {
        set({ storyGroups: DEMO_STORIES });
      }
      return;
    }
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/stories/feed");
      set({ storyGroups: res.data });
    } catch {
      if (get().storyGroups.length === 0) {
        set({ storyGroups: DEMO_STORIES });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  createStory: async ({ media, mediaType, caption }) => {
    set({ isUploading: true });
    const { authUser, isDemoMode } = useAuthStore.getState();

    if (isDemoMode) {
      const newStory = {
        _id: `story-local-${Date.now()}`,
        mediaUrl: media,
        mediaType: mediaType || "image",
        caption: caption || "",
        createdAt: new Date().toISOString(),
        isViewed: false,
        viewerCount: 1,
      };
      set((state) => {
        const existingOwn = state.storyGroups.find((g) => g.isOwn);
        if (existingOwn) {
          return {
            storyGroups: state.storyGroups.map((g) =>
              g.isOwn
                ? { ...g, stories: [...g.stories, newStory], hasUnviewed: true }
                : g
            ),
            isUploading: false,
          };
        }
        return {
          storyGroups: [
            {
              user: authUser,
              isOwn: true,
              hasUnviewed: true,
              stories: [newStory],
            },
            ...state.storyGroups,
          ],
          isUploading: false,
        };
      });
      toast.success("Story posted!");
      return;
    }

    try {
      await axiosInstance.post("/stories", { media, mediaType, caption });
      toast.success("Story posted!");
      await get().fetchFeed();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post story");
    } finally {
      set({ isUploading: false });
    }
  },

  openStoryViewer: (group, startIndex = 0) => {
    set({ activeGroup: { ...group, currentIndex: startIndex } });
  },

  closeStoryViewer: () => {
    set({ activeGroup: null, viewerList: null });
  },

  goNextStory: () => {
    const { activeGroup, storyGroups, closeStoryViewer } = get();
    if (!activeGroup) return;

    const nextIndex = activeGroup.currentIndex + 1;
    if (nextIndex < activeGroup.stories.length) {
      set({ activeGroup: { ...activeGroup, currentIndex: nextIndex } });
    } else {
      const groupIndex = storyGroups.findIndex(
        (g) => g.user._id === activeGroup.user._id
      );
      const nextGroup = storyGroups[groupIndex + 1];
      if (nextGroup) {
        set({ activeGroup: { ...nextGroup, currentIndex: 0 } });
      } else {
        closeStoryViewer();
      }
    }
  },

  goPrevStory: () => {
    const { activeGroup, storyGroups } = get();
    if (!activeGroup) return;

    if (activeGroup.currentIndex > 0) {
      set({ activeGroup: { ...activeGroup, currentIndex: activeGroup.currentIndex - 1 } });
    } else {
      const groupIndex = storyGroups.findIndex(
        (g) => g.user._id === activeGroup.user._id
      );
      const prevGroup = storyGroups[groupIndex - 1];
      if (prevGroup) {
        set({ activeGroup: { ...prevGroup, currentIndex: prevGroup.stories.length - 1 } });
      }
    }
  },

  markViewed: async (storyId) => {
    set((state) => ({
      storyGroups: state.storyGroups.map((g) => ({
        ...g,
        stories: g.stories.map((s) =>
          s._id === storyId ? { ...s, isViewed: true } : s
        ),
        hasUnviewed: g.stories.some((s) => s._id !== storyId && !s.isViewed),
      })),
    }));
    if (useAuthStore.getState().isDemoMode) return;
    try {
      await axiosInstance.post(`/stories/${storyId}/view`);
    } catch (error) {
      console.error("markViewed error:", error);
    }
  },

  deleteStory: async (storyId) => {
    if (useAuthStore.getState().isDemoMode) {
      set((state) => ({
        storyGroups: state.storyGroups
          .map((g) => ({
            ...g,
            stories: g.stories.filter((s) => s._id !== storyId),
          }))
          .filter((g) => g.stories.length > 0),
      }));
      toast.success("Story deleted");
      return;
    }
    try {
      await axiosInstance.delete(`/stories/${storyId}`);
      toast.success("Story deleted");
      await get().fetchFeed();
    } catch {
      toast.error("Failed to delete story");
    }
  },

  fetchViewers: async (storyId) => {
    if (useAuthStore.getState().isDemoMode) {
      set({ viewerList: [] });
      return;
    }
    try {
      const res = await axiosInstance.get(`/stories/${storyId}/viewers`);
      set({ viewerList: res.data });
    } catch {
      set({ viewerList: [] });
    }
  },
}));
