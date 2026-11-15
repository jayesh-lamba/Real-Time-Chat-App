import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { encryptMessage, decryptMessage } from "../lib/crypto";
import { playNotificationSound } from "../lib/sounds";
import { DEMO_USERS } from "../lib/demoData";

const STORAGE_KEY = "jayeshchat_persisted_messages_v2";
const USERS_STORAGE_KEY = "jayeshchat_persisted_users_v2";

const loadSavedMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveMessagesToStorage = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to persist messages:", e);
  }
};

const loadSavedUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_USERS;
  } catch {
    return DEMO_USERS;
  }
};

const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
};

// Helper to decrypt a single message if it is an encrypted text message
const decryptSingleMessage = async (msg, myId) => {
  if (msg.messageType === "text" || !msg.messageType) {
    if (msg.cipherText && msg.nonce) {
      const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
      const decryptedText = await decryptMessage(msg.cipherText, msg.nonce, myId, partnerId);
      return { ...msg, text: decryptedText };
    }
  }
  return msg;
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: loadSavedUsers(),
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  demoMessagesMap: loadSavedMessages(),
  chatThemes: JSON.parse(localStorage.getItem("chat-themes") || "{}"),

  getUsers: async () => {
    set({ isUsersLoading: true });
    const { isDemoMode } = useAuthStore.getState();
    const persistedUsers = loadSavedUsers();

    if (isDemoMode) {
      const currentSelected = get().selectedUser || persistedUsers[0] || null;
      set({
        users: persistedUsers,
        selectedUser: currentSelected,
        demoMessagesMap: loadSavedMessages(),
        isUsersLoading: false,
      });
      return;
    }

    try {
      const res = await axiosInstance.get("/messages/users", { timeout: 2500 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        set({ users: res.data });
        get().fetchUnreadCounts();
        return;
      }
      throw new Error("Empty or invalid users payload");
    } catch {
      const currentSelected = get().selectedUser || persistedUsers[0] || null;
      set({
        users: persistedUsers,
        selectedUser: currentSelected,
        demoMessagesMap: loadSavedMessages(),
      });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addDemoConnectionUser: (newUser) => {
    set((state) => {
      if (state.users.some((u) => u._id === newUser._id)) return state;
      const updatedUsers = [newUser, ...state.users];
      saveUsersToStorage(updatedUsers);
      return {
        users: updatedUsers,
      };
    });
  },

  fetchUnreadCounts: async () => {
    if (useAuthStore.getState().isDemoMode) return;
    try {
      const res = await axiosInstance.get("/messages/unread");
      set({ unreadCounts: res.data || {} });
    } catch (error) {
      console.error("fetchUnreadCounts error:", error);
    }
  },

  markAsRead: async (userId) => {
    set((state) => {
      const newCounts = { ...state.unreadCounts };
      delete newCounts[userId];
      return { unreadCounts: newCounts };
    });
    if (useAuthStore.getState().isDemoMode) return;
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
    } catch (error) {
      console.error("markAsRead error:", error);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    const { isDemoMode } = useAuthStore.getState();
    const latestMap = loadSavedMessages();

    if (isDemoMode) {
      const thread = latestMap[userId] || [];
      set({
        demoMessagesMap: latestMap,
        messages: thread,
        isMessagesLoading: false,
      });
      get().markAsRead(userId);
      return;
    }

    try {
      const res = await axiosInstance.get(`/messages/${userId}`, { timeout: 2500 });
      const myId = useAuthStore.getState().authUser?._id;
      const decrypted = await Promise.all(
        res.data.map((msg) => decryptSingleMessage(msg, myId))
      );
      set({ messages: decrypted });
      get().markAsRead(userId);
    } catch {
      const thread = latestMap[userId] || [];
      set({
        demoMessagesMap: latestMap,
        messages: thread,
      });
      get().markAsRead(userId);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser, isDemoMode } = useAuthStore.getState();
    const myId = authUser?._id || "jayesh-lamba-admin";

    if (!selectedUser) return;

    const persistUserMessage = () => {
      const latestMap = loadSavedMessages();
      const currentThread = latestMap[selectedUser._id] || messages || [];
      const newMsg = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: myId,
        senderName: authUser?.fullName || "Jayesh Lamba",
        senderAvatar: authUser?.profilePic || "./avatar.png",
        receiverId: selectedUser._id,
        isSentByUser: true,
        text: messageData.text || "",
        image: messageData.image || null,
        video: messageData.video || null,
        messageType: messageData.messageType || "text",
        stickerId: messageData.stickerId || null,
        createdAt: new Date().toISOString(),
        isRead: true,
      };
      const updatedThread = [...currentThread, newMsg];
      const nextMap = {
        ...latestMap,
        [selectedUser._id]: updatedThread,
      };
      saveMessagesToStorage(nextMap);
      set({
        messages: updatedThread,
        demoMessagesMap: nextMap,
      });
    };

    if (isDemoMode) {
      persistUserMessage();
      return;
    }

    try {
      let finalData = { ...messageData };
      const isTextMsg = !messageData.messageType || messageData.messageType === "text";
      if (messageData.text && isTextMsg && myId && selectedUser) {
        const encrypted = await encryptMessage(messageData.text, myId, selectedUser._id);
        if (encrypted.cipherText) {
          finalData = {
            ...messageData,
            cipherText: encrypted.cipherText,
            nonce: encrypted.nonce,
            text: "[Encrypted Message]",
          };
        }
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, finalData);
      const decrypted = await decryptSingleMessage(res.data, myId);
      const updatedThread = [...messages, decrypted];
      const nextMap = { ...loadSavedMessages(), [selectedUser._id]: updatedThread };
      saveMessagesToStorage(nextMap);
      set({ messages: updatedThread, demoMessagesMap: nextMap });
    } catch {
      persistUserMessage();
    }
  },

  editMessage: async (messageId, newText) => {
    const { selectedUser, messages } = get();
    const { authUser, isDemoMode } = useAuthStore.getState();
    const myId = authUser?._id;

    if (isDemoMode) {
      const updated = messages.map((msg) =>
        msg._id === messageId ? { ...msg, text: newText, isEdited: true } : msg
      );
      const latestMap = loadSavedMessages();
      const nextMap = selectedUser
        ? { ...latestMap, [selectedUser._id]: updated }
        : latestMap;
      saveMessagesToStorage(nextMap);
      set({
        messages: updated,
        demoMessagesMap: nextMap,
      });
      toast.success("Message edited");
      return;
    }

    try {
      let payload = { text: newText };
      if (myId && selectedUser) {
        const encrypted = await encryptMessage(newText, myId, selectedUser._id);
        if (encrypted.cipherText) {
          payload = {
            text: "[Encrypted Message]",
            cipherText: encrypted.cipherText,
            nonce: encrypted.nonce,
          };
        }
      }

      const res = await axiosInstance.put(`/messages/edit/${messageId}`, payload);
      const decrypted = await decryptSingleMessage(res.data, myId);
      const updated = messages.map((msg) => (msg._id === messageId ? decrypted : msg));
      set({ messages: updated });
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId, type) => {
    const { selectedUser, messages } = get();
    const { isDemoMode } = useAuthStore.getState();

    if (isDemoMode) {
      const filtered = messages.filter((msg) => msg._id !== messageId);
      const latestMap = loadSavedMessages();
      const nextMap = selectedUser
        ? { ...latestMap, [selectedUser._id]: filtered }
        : latestMap;
      saveMessagesToStorage(nextMap);
      set({
        messages: filtered,
        demoMessagesMap: nextMap,
      });
      toast.success(type === "unsend" ? "Message unsent" : "Message deleted");
      return;
    }

    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`, { data: { type } });
      set({
        messages: messages.filter((msg) => msg._id !== messageId),
      });
      toast.success(type === "unsend" ? "Message unsent" : "Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  forwardMessage: async (targetUserId, messageData) => {
    const { authUser, isDemoMode } = useAuthStore.getState();
    const myId = authUser?._id || "jayesh-lamba-admin";

    if (isDemoMode) {
      const fwdMsg = {
        _id: `msg-fwd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        senderId: myId,
        senderName: authUser?.fullName || "Jayesh Lamba",
        senderAvatar: authUser?.profilePic || "./avatar.png",
        receiverId: targetUserId,
        isSentByUser: true,
        text: messageData.text || "",
        image: messageData.image || null,
        video: messageData.video || null,
        messageType: messageData.messageType || "text",
        stickerId: messageData.stickerId || null,
        createdAt: new Date().toISOString(),
        isRead: true,
      };
      const latestMap = loadSavedMessages();
      const targetThread = [...(latestMap[targetUserId] || []), fwdMsg];
      const nextMap = {
        ...latestMap,
        [targetUserId]: targetThread,
      };
      saveMessagesToStorage(nextMap);
      const isCurrent = get().selectedUser?._id === targetUserId;
      set((state) => ({
        messages: isCurrent ? targetThread : state.messages,
        demoMessagesMap: nextMap,
      }));
      return;
    }

    try {
      let finalData = { ...messageData };
      const isTextMsg = !messageData.messageType || messageData.messageType === "text";
      if (messageData.text && isTextMsg && myId) {
        const encrypted = await encryptMessage(messageData.text, myId, targetUserId);
        if (encrypted.cipherText) {
          finalData = {
            ...messageData,
            cipherText: encrypted.cipherText,
            nonce: encrypted.nonce,
            text: "[Encrypted Message]",
          };
        }
      }
      const res = await axiosInstance.post(`/messages/send/${targetUserId}`, finalData);
      const { selectedUser, messages } = get();
      if (selectedUser && selectedUser._id === targetUserId) {
        const decrypted = await decryptSingleMessage(res.data, myId);
        set({ messages: [...messages, decrypted] });
      }
    } catch (error) {
      console.error("Failed to forward message:", error);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      const { selectedUser } = get();
      const myId = useAuthStore.getState().authUser?._id;
      const decrypted = await decryptSingleMessage(newMessage, myId);

      const isCurrentConversation = selectedUser && (
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id
      );

      if (isCurrentConversation) {
        set({
          messages: [...get().messages, decrypted],
        });
        if (newMessage.senderId === selectedUser._id) {
          get().markAsRead(newMessage.senderId);
        }
      } else {
        if (newMessage.senderId !== myId) {
          set((state) => {
            const currentCount = state.unreadCounts[newMessage.senderId] || 0;
            return {
              unreadCounts: {
                ...state.unreadCounts,
                [newMessage.senderId]: currentCount + 1,
              },
            };
          });
          playNotificationSound();
        }
      }
    });

    socket.on("message:seen", ({ byUser }) => {
      const myId = useAuthStore.getState().authUser?._id;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.senderId === myId && m.receiverId === byUser ? { ...m, isRead: true } : m
        ),
      }));
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });

    socket.on("messageEdited", async (editedMsg) => {
      const myId = useAuthStore.getState().authUser?._id;
      const decrypted = await decryptSingleMessage(editedMsg, myId);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === editedMsg._id ? decrypted : m)),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("message:seen");
      socket.off("messageDeleted");
      socket.off("messageEdited");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  setChatTheme: (userId, theme) => {
    const updated = { ...get().chatThemes, [userId]: theme };
    localStorage.setItem("chat-themes", JSON.stringify(updated));
    set({ chatThemes: updated });
  },
}));
