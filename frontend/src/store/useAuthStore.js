import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { DEMO_AUTH_USER, DEMO_ONLINE_IDS } from "../lib/demoData.js";

// Lazy getter to avoid circular dep at module init time
const getConnectionStore = () => import("./useConnectionStore.js").then((m) => m.useConnectionStore.getState());
const getCallStore = () => import("./useCallStore.js").then((m) => m.useCallStore.getState());
const getChatStore = () => import("./useChatStore.js").then((m) => m.useChatStore.getState());

const BASE_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.MODE === "development" ? "http://localhost:5001" : "/");

const getSavedDemoUser = () => {
  try {
    const saved = localStorage.getItem("jayeshchat_demo_user");
    return saved ? JSON.parse(saved) : DEMO_AUTH_USER;
  } catch {
    return DEMO_AUTH_USER;
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isDemoMode: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check", { timeout: 2200 });
      if (res?.data && res.data._id) {
        set({ authUser: res.data, isDemoMode: false });
        get().connectSocket();
        get().checkE2EEKeys(res.data);
        return;
      }
      throw new Error("Invalid auth response");
    } catch {
      // If running on static edge / GitHub Pages or backend is offline,
      // automatically launch the Jayesh Lamba Interactive Workspace unless user explicitly logged out
      const loggedOutExplicitly = sessionStorage.getItem("jayeshchat_logged_out") === "true";
      if (!loggedOutExplicitly) {
        const demoUser = getSavedDemoUser();
        set({
          authUser: demoUser,
          isDemoMode: true,
          onlineUsers: DEMO_ONLINE_IDS,
        });
        getConnectionStore().then((cs) => cs.fetchPending());
      } else {
        set({ authUser: null, isDemoMode: true, onlineUsers: DEMO_ONLINE_IDS });
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  loginAsDemo: () => {
    sessionStorage.removeItem("jayeshchat_logged_out");
    const demoUser = getSavedDemoUser();
    set({
      authUser: demoUser,
      isDemoMode: true,
      onlineUsers: DEMO_ONLINE_IDS,
    });
    getConnectionStore().then((cs) => cs.fetchPending());
    toast.success("Welcome to Jayesh Lamba's Live Workspace!");
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data, { timeout: 3000 });
      if (res?.data && res.data._id) {
        sessionStorage.removeItem("jayeshchat_logged_out");
        set({ authUser: res.data, isDemoMode: false });
        toast.success("Account created successfully");
        get().connectSocket();
        get().checkE2EEKeys(res.data);
        return;
      }
      throw new Error("Fallback to interactive signup");
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        // Interactive live mode signup
        sessionStorage.removeItem("jayeshchat_logged_out");
        const customUser = {
          ...DEMO_AUTH_USER,
          fullName: data.fullName || "Jayesh Lamba",
          username: data.username || "jayesh_lamba",
          email: data.email || "jayeshanand160@gmail.com",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("jayeshchat_demo_user", JSON.stringify(customUser));
        set({
          authUser: customUser,
          isDemoMode: true,
          onlineUsers: DEMO_ONLINE_IDS,
        });
        getConnectionStore().then((cs) => cs.fetchPending());
        toast.success(`Account created! Welcome, ${customUser.fullName}`);
      }
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data, { timeout: 3000 });
      if (res?.data && res.data._id) {
        sessionStorage.removeItem("jayeshchat_logged_out");
        set({ authUser: res.data, isDemoMode: false });
        toast.success("Logged in successfully");
        get().connectSocket();
        get().checkE2EEKeys(res.data);
        return;
      }
      throw new Error("Fallback to interactive login");
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        sessionStorage.removeItem("jayeshchat_logged_out");
        const demoUser = getSavedDemoUser();
        const updatedUser = {
          ...demoUser,
          email: data.email || demoUser.email,
        };
        set({
          authUser: updatedUser,
          isDemoMode: true,
          onlineUsers: DEMO_ONLINE_IDS,
        });
        getConnectionStore().then((cs) => cs.fetchPending());
        toast.success(`Signed in as ${updatedUser.fullName}`);
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    sessionStorage.setItem("jayeshchat_logged_out", "true");
    if (get().isDemoMode) {
      set({ authUser: null });
      toast.success("Signed out of workspace");
      return;
    }
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // ignore network error on logout
    } finally {
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    if (get().isDemoMode) {
      const current = get().authUser || DEMO_AUTH_USER;
      const updated = { ...current, ...data };
      if (data.profilePic === null) {
        updated.profilePic = DEMO_AUTH_USER.profilePic;
      }
      localStorage.setItem("jayeshchat_demo_user", JSON.stringify(updated));
      set({ authUser: updated, isUpdatingProfile: false });
      toast.success("Profile updated in workspace");
      return;
    }
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  checkE2EEKeys: async (user) => {
    if (!user || get().isDemoMode) return;
    try {
      const { getPrivateKey } = await import("../lib/indexedDB.js");
      const localKey = await getPrivateKey(user._id);
      if (!localKey || !user.publicKey) {
        const { generateAndRegisterKeys } = await import("../lib/crypto.js");
        const pubKey = await generateAndRegisterKeys(user._id);
        set({ authUser: { ...user, publicKey: pubKey } });
      }
    } catch (err) {
      console.error("checkE2EEKeys error:", err);
    }
  },

  connectSocket: () => {
    const { authUser, isDemoMode } = get();
    if (!authUser || isDemoMode || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connectionRequest", (data) => {
      getConnectionStore().then((cs) => cs.onConnectionRequest(data));
    });

    socket.on("connectionAccepted", () => {
      getConnectionStore().then((cs) => cs.onConnectionAccepted());
    });

    socket.on("call:initiated", async ({ callLogId }) => {
      const callStore = await getCallStore();
      callStore.setState({ callLogId });
    });

    socket.on("call:offer", async ({ from, offer, callType, callLogId }) => {
      const chatStore = await getChatStore();
      const callerUser = chatStore.users.find((u) => u._id === from) || {
        _id: from,
        fullName: "Connected User",
        profilePic: "/avatar.png",
      };
      const callStore = await getCallStore();
      callStore.handleIncomingOffer({ fromUser: callerUser, offer, callType, callLogId });
    });

    socket.on("call:answer", async ({ answer }) => {
      const callStore = await getCallStore();
      callStore.handleCallAnswered(answer);
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      const callStore = await getCallStore();
      callStore.handleIceCandidate(candidate);
    });

    socket.on("call:reject", async () => {
      const callStore = await getCallStore();
      callStore.handleCallRejected();
    });

    socket.on("call:end", async () => {
      const callStore = await getCallStore();
      callStore.handleCallEnded();
    });

    socket.on("call:camera-toggle", async ({ cameraOn }) => {
      const callStore = await getCallStore();
      callStore.setState({ remoteCameraOn: cameraOn });
    });

    socket.on("call:error", async ({ message }) => {
      toast.error(message || "Calling error");
      const callStore = await getCallStore();
      callStore.resetCallState();
    });

    socket.on("call:unavailable", async () => {
      const callStore = await getCallStore();
      callStore.handleCallUnavailable();
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
