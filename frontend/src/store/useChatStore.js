import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { encryptMessage, decryptMessage } from "../lib/crypto";
import { playNotificationSound } from "../lib/sounds";
import {
  DEMO_USERS,
  INITIAL_DEMO_MESSAGES,
  DEMO_AUTO_REPLIES,
} from "../lib/demoData";

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

let replyIndex = 0;

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isPartnerTyping: false,
  unreadCounts: {
    "user-priya-02": 1,
    "user-ananya-04": 1,
  },
  demoMessagesMap: { ...INITIAL_DEMO_MESSAGES },
  chatThemes: JSON.parse(localStorage.getItem("chat-themes") || "{}"),

  getUsers: async () => {
    set({ isUsersLoading: true });
    const { isDemoMode } = useAuthStore.getState();

    if (isDemoMode) {
      const currentUsers = get().users.length > 0 ? get().users : DEMO_USERS;
      const currentSelected = get().selectedUser || currentUsers[0] || null;
      set({
        users: currentUsers,
        selectedUser: currentSelected,
        isUsersLoading: false,
      });
      return;
    }

    try {
      const res = await axiosInstance.get("/messages/users", { timeout: 2500 });
      if (Array.isArray(res.data)) {
        set({ users: res.data });
        get().fetchUnreadCounts();
        return;
      }
      throw new Error("Invalid users payload");
    } catch {
      const currentUsers = get().users.length > 0 ? get().users : DEMO_USERS;
      const currentSelected = get().selectedUser || currentUsers[0] || null;
      set({
        users: currentUsers,
        selectedUser: currentSelected,
      });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addDemoConnectionUser: (newUser) => {
    set((state) => {
      if (state.users.some((u) => u._id === newUser._id)) return state;
      const myId = useAuthStore.getState().authUser?._id || "jayesh-lamba-admin";
      const welcomeMsg = {
        _id: `msg-welcome-${Date.now()}`,
        senderId: newUser._id,
        receiverId: myId,
        text: `Hey Jayesh! Excited to connect with you on JayeshChat 👋`,
        messageType: "text",
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      return {
        users: [newUser, ...state.users],
        demoMessagesMap: {
          ...state.demoMessagesMap,
          [newUser._id]: [welcomeMsg],
        },
        unreadCounts: {
          ...state.unreadCounts,
          [newUser._id]: 1,
        },
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
    set({ isMessagesLoading: true, isPartnerTyping: false });
    const { isDemoMode } = useAuthStore.getState();

    if (isDemoMode) {
      const map = get().demoMessagesMap;
      const thread = map[userId] || [];
      set({ messages: thread, isMessagesLoading: false });
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
      const map = get().demoMessagesMap;
      const thread = map[userId] || [];
      set({ messages: thread });
      get().markAsRead(userId);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, demoMessagesMap } = get();
    const { authUser, isDemoMode } = useAuthStore.getState();
    const myId = authUser?._id || "jayesh-lamba-admin";

    if (!selectedUser) return;

    const appendLocalDemoMessage = () => {
      const newMsg = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: myId,
        receiverId: selectedUser._id,
        text: messageData.text || "",
        image: messageData.image || null,
        video: messageData.video || null,
        messageType: messageData.messageType || "text",
        stickerId: messageData.stickerId || null,
        createdAt: new Date().toISOString(),
        isRead: true,
      };
      const updatedThread = [...messages, newMsg];
      set({
        messages: updatedThread,
        demoMessagesMap: {
          ...demoMessagesMap,
          [selectedUser._id]: updatedThread,
        },
      });

      // Trigger realistic live partner typing + auto-reply in interactive workspace
      const targetPartnerId = selectedUser._id;
      setTimeout(() => {
        if (get().selectedUser?._id === targetPartnerId) {
          set({ isPartnerTyping: true });
        }
      }, 450);

      setTimeout(() => {
        const replyText = DEMO_AUTO_REPLIES[replyIndex % DEMO_AUTO_REPLIES.length];
        replyIndex += 1;
        const replyMsg = {
          _id: `msg-reply-${Date.now()}`,
          senderId: targetPartnerId,
          receiverId: myId,
          text: replyText,
          messageType: "text",
          createdAt: new Date().toISOString(),
          isRead: true,
        };
        const currentMap = get().demoMessagesMap;
        const prevList = currentMap[targetPartnerId] || [];
        const nextList = [...prevList, replyMsg];
        const isStillViewing = get().selectedUser?._id === targetPartnerId;

        set((state) => ({
          isPartnerTyping: false,
          messages: isStillViewing ? nextList : state.messages,
          demoMessagesMap: {
            ...currentMap,
            [targetPartnerId]: nextList,
          },
          unreadCounts: isStillViewing
            ? state.unreadCounts
            : {
                ...state.unreadCounts,
                [targetPartnerId]: (state.unreadCounts[targetPartnerId] || 0) + 1,
              },
        }));
        playNotificationSound();
      }, 1600);
    };

    if (isDemoMode) {
      appendLocalDemoMessage();
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
      set({ messages: [...messages, decrypted] });
    } catch {
      appendLocalDemoMessage();
    }
  },

  editMessage: async (messageId, newText) => {
    const { selectedUser, messages, demoMessagesMap } = get();
    const { authUser, isDemoMode } = useAuthStore.getState();
    const myId = authUser?._id;

    if (isDemoMode) {
      const updated = messages.map((msg) =>
        msg._id === messageId ? { ...msg, text: newText, isEdited: true } : msg
      );
      set({
        messages: updated,
        demoMessagesMap: selectedUser
          ? { ...demoMessagesMap, [selectedUser._id]: updated }
          : demoMessagesMap,
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
      set({
        messages: messages.map((msg) => (msg._id === messageId ? decrypted : msg)),
      });
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId, type) => {
    const { selectedUser, messages, demoMessagesMap } = get();
    const { isDemoMode } = useAuthStore.getState();

    if (isDemoMode) {
      const filtered = messages.filter((msg) => msg._id !== messageId);
      set({
        messages: filtered,
        demoMessagesMap: selectedUser
          ? { ...demoMessagesMap, [selectedUser._id]: filtered }
          : demoMessagesMap,
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
        receiverId: targetUserId,
        text: messageData.text || "",
        image: messageData.image || null,
        video: messageData.video || null,
        messageType: messageData.messageType || "text",
        stickerId: messageData.stickerId || null,
        createdAt: new Date().toISOString(),
        isRead: true,
      };
      const currentMap = get().demoMessagesMap;
      const targetThread = [...(currentMap[targetUserId] || []), fwdMsg];
      const isCurrent = get().selectedUser?._id === targetUserId;
      set((state) => ({
        messages: isCurrent ? targetThread : state.messages,
        demoMessagesMap: {
          ...currentMap,
          [targetUserId]: targetThread,
        },
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

  setSelectedUser: (selectedUser) => set({ selectedUser, isPartnerTyping: false }),

  setChatTheme: (userId, theme) => {
    const updated = { ...get().chatThemes, [userId]: theme };
    localStorage.setItem("chat-themes", JSON.stringify(updated));
    set({ chatThemes: updated });
  },
}));
