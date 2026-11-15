import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";
import {
  DEMO_PENDING_REQUESTS,
  DEMO_SUGGESTIONS,
} from "../lib/demoData.js";

const getChatStore = () => import("./useChatStore.js").then((m) => m.useChatStore.getState());

export const useConnectionStore = create((set, get) => ({
  pendingRequests: DEMO_PENDING_REQUESTS,
  sentRequests: [],
  searchResults: [],
  suggestions: DEMO_SUGGESTIONS,
  isSearching: false,
  isFetchingSuggestions: false,
  pendingCount: DEMO_PENDING_REQUESTS.length,
  searchQuery: "",

  fetchPending: async () => {
    if (useAuthStore.getState().isDemoMode) {
      const current = get().pendingRequests;
      set({ pendingCount: current.length });
      return;
    }
    try {
      const res = await axiosInstance.get("/connections/pending");
      set({ pendingRequests: res.data, pendingCount: res.data.length });
    } catch {
      const current = get().pendingRequests;
      set({ pendingCount: current.length });
    }
  },

  fetchSent: async () => {
    if (useAuthStore.getState().isDemoMode) return;
    try {
      const res = await axiosInstance.get("/connections/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("fetchSent error:", error);
    }
  },

  fetchSuggestions: async () => {
    if (useAuthStore.getState().isDemoMode) {
      if (get().suggestions.length === 0) {
        set({ suggestions: DEMO_SUGGESTIONS });
      }
      return;
    }
    set({ isFetchingSuggestions: true });
    try {
      const res = await axiosInstance.get("/connections/suggestions");
      set({ suggestions: res.data });
    } catch {
      set({ suggestions: DEMO_SUGGESTIONS });
    } finally {
      set({ isFetchingSuggestions: false });
    }
  },

  searchUsers: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [], searchQuery: query });
      return;
    }

    set({ isSearching: true, searchQuery: query });

    const { useChatStore } = await import("./useChatStore.js");
    const connectedUsers = useChatStore.getState().users || [];
    const q = query.toLowerCase();
    const localMatches = connectedUsers
      .filter((u) => u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q))
      .map((u) => ({
        _id: u._id,
        fullName: u.fullName,
        username: u.username,
        profilePic: u.profilePic,
        relationshipStatus: "connected",
        connectionId: null,
        isLocalMatch: true,
      }));

    const suggestionMatches = (get().suggestions || []).filter(
      (u) => u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q)
    );

    if (useAuthStore.getState().isDemoMode) {
      const localIds = new Set(localMatches.map((u) => u._id));
      const mergedDemo = [
        ...localMatches,
        ...suggestionMatches.filter((u) => !localIds.has(u._id)),
      ];
      set({ searchResults: mergedDemo, isSearching: false });
      return;
    }

    if (localMatches.length > 0) {
      set({ searchResults: localMatches });
    }

    try {
      const res = await axiosInstance.get(`/connections/search?username=${encodeURIComponent(query)}`);
      const networkResults = res.data;
      const localIds = new Set(localMatches.map((u) => u._id.toString()));
      const merged = [
        ...localMatches,
        ...networkResults.filter((u) => !localIds.has(u._id.toString())),
      ];
      set({ searchResults: merged });
    } catch {
      const localIds = new Set(localMatches.map((u) => u._id));
      set({
        searchResults: [
          ...localMatches,
          ...suggestionMatches.filter((u) => !localIds.has(u._id)),
        ],
      });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false, searchQuery: "" }),

  sendRequest: async (username) => {
    const updateLocalSentState = () => {
      const targetUser =
        get().suggestions.find((u) => u.username === username) ||
        get().searchResults.find((u) => u.username === username);
      toast.success("Connection request sent!");
      set((state) => ({
        searchResults: state.searchResults.map((u) =>
          u.username === username ? { ...u, relationshipStatus: "pending_sent" } : u
        ),
        suggestions: state.suggestions.map((u) =>
          u.username === username ? { ...u, relationshipStatus: "pending_sent" } : u
        ),
        sentRequests: targetUser
          ? [
              {
                _id: `sent-${Date.now()}`,
                recipientId: targetUser,
                status: "pending",
              },
              ...state.sentRequests,
            ]
          : state.sentRequests,
      }));
    };

    if (useAuthStore.getState().isDemoMode) {
      updateLocalSentState();
      return;
    }

    try {
      await axiosInstance.post(`/connections/request/${username}`);
      updateLocalSentState();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  },

  acceptRequest: async (requestId, requesterId) => {
    const handleAcceptState = async () => {
      const reqObj = get().pendingRequests.find((r) => r._id === requestId);
      toast.success("Connected!");
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
        pendingCount: Math.max(0, state.pendingCount - 1),
        searchResults: state.searchResults.map((u) =>
          u.connectionId === requestId || u._id === requesterId ? { ...u, relationshipStatus: "connected" } : u
        ),
        suggestions: state.suggestions.map((u) =>
          u.connectionId === requestId || u._id === requesterId ? { ...u, relationshipStatus: "connected" } : u
        ),
      }));
      const chatState = await getChatStore();
      if (useAuthStore.getState().isDemoMode && reqObj?.requesterId) {
        chatState.addDemoConnectionUser(reqObj.requesterId);
      } else {
        chatState.getUsers();
      }
    };

    if (useAuthStore.getState().isDemoMode) {
      await handleAcceptState();
      return;
    }

    try {
      await axiosInstance.put(`/connections/accept/${requestId}`);
      await handleAcceptState();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  },

  rejectRequest: async (requestId) => {
    const handleRejectState = () => {
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
        pendingCount: Math.max(0, state.pendingCount - 1),
        searchResults: state.searchResults.map((u) =>
          u.connectionId === requestId ? { ...u, relationshipStatus: "none", connectionId: null } : u
        ),
        suggestions: state.suggestions.map((u) =>
          u.connectionId === requestId ? { ...u, relationshipStatus: "none", connectionId: null } : u
        ),
      }));
    };

    if (useAuthStore.getState().isDemoMode) {
      handleRejectState();
      return;
    }

    try {
      await axiosInstance.put(`/connections/reject/${requestId}`);
      handleRejectState();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  },

  removeConnection: async (connectionId) => {
    try {
      await axiosInstance.delete(`/connections/remove/${connectionId}`);
      toast.success("Connection removed");
      const chatState = await getChatStore();
      chatState.getUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove connection");
    }
  },

  onConnectionRequest: (data) => {
    set((state) => ({
      pendingRequests: [data, ...state.pendingRequests],
      pendingCount: state.pendingCount + 1,
    }));
    toast(`${data.requester.fullName} wants to connect with you`, {
      icon: "👋",
    });
  },

  onConnectionAccepted: () => {
    getChatStore().then((chatState) => chatState.getUsers());
  },
}));
