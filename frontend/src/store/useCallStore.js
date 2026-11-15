import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { startRingtone, startOutgoingTone, stopAllSounds } from "../lib/sounds";
import { DEMO_CALL_HISTORY } from "../lib/demoData";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

export const useCallStore = create((set, get) => ({
  callState: "idle",
  callType: null,
  partner: null,
  callLogId: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  isMinimized: false,
  remoteCameraOn: true,
  peerConnection: null,
  pendingOffer: null,
  iceCandidateQueue: [],
  callHistory: DEMO_CALL_HISTORY,
  isHistoryLoading: false,

  initiateCall: async (targetUser, type) => {
    if (get().callState !== "idle") return;

    set({
      callState: "ringing-outgoing",
      callType: type,
      partner: targetUser,
      isMuted: false,
      isCameraOff: false,
      isMinimized: false,
      remoteCameraOn: true,
    });

    startOutgoingTone();

    const { socket, isDemoMode, authUser } = useAuthStore.getState();

    // Interactive Demo Mode Call Simulation
    if (isDemoMode || !socket) {
      setTimeout(() => {
        if (get().callState === "ringing-outgoing") {
          stopAllSounds();
          set({
            callState: "connected",
            remoteCameraOn: false,
          });
          const newLog = {
            _id: `call-demo-${Date.now()}`,
            callerId: authUser,
            receiverId: targetUser,
            type,
            status: "answered",
            duration: 42,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            callHistory: [newLog, ...state.callHistory],
          }));
        }
      }, 2200);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(RTC_CONFIG);
      set({ peerConnection: pc });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:offer", {
        to: targetUser._id,
        offer,
        callType: type,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Could not access camera or microphone");
      get().resetCallState();
    }
  },

  handleIncomingOffer: ({ fromUser, offer, callType, callLogId }) => {
    if (get().callState !== "idle") {
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("call:reject", { to: fromUser._id, callLogId });
      }
      return;
    }

    set({
      callState: "ringing-incoming",
      callType,
      partner: fromUser,
      pendingOffer: offer,
      callLogId,
      isMuted: false,
      isCameraOff: false,
      isMinimized: false,
      remoteCameraOn: true,
    });

    startRingtone();
  },

  acceptCall: async () => {
    const { partner, pendingOffer, callType, callLogId } = get();
    if (!partner || !pendingOffer) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      set({ localStream: stream });

      const pc = new RTCPeerConnection(RTC_CONFIG);
      set({ peerConnection: pc });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            to: partner._id,
            candidate: event.candidate,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      await get().processIceQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", {
        to: partner._id,
        answer,
        callLogId,
      });

      stopAllSounds();
      set({ callState: "connected", pendingOffer: null });
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Could not answer call");
      get().rejectCall();
    }
  },

  handleCallAnswered: async (answer) => {
    const { peerConnection } = get();
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await get().processIceQueue();
      stopAllSounds();
      set({ callState: "connected" });
    } catch (error) {
      console.error("Error setting remote description:", error);
      get().endCall();
    }
  },

  processIceQueue: async () => {
    const { peerConnection, iceCandidateQueue } = get();
    if (!peerConnection || !peerConnection.remoteDescription) return;

    for (const candidate of iceCandidateQueue) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding queued ICE candidate:", error);
      }
    }
    set({ iceCandidateQueue: [] });
  },

  handleIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (!peerConnection || !peerConnection.remoteDescription) {
      set((state) => ({
        iceCandidateQueue: [...state.iceCandidateQueue, candidate],
      }));
      return;
    }
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  },

  rejectCall: () => {
    const { partner, callLogId } = get();
    const socket = useAuthStore.getState().socket;
    if (socket && partner) {
      socket.emit("call:reject", { to: partner._id, callLogId });
    }
    get().resetCallState();
  },

  handleCallRejected: () => {
    toast.error("Call declined");
    get().resetCallState();
  },

  handleCallUnavailable: () => {
    toast.error("User is offline or unavailable");
    get().resetCallState();
  },

  endCall: () => {
    const { partner, callLogId } = get();
    const socket = useAuthStore.getState().socket;
    if (socket && partner) {
      socket.emit("call:end", { to: partner._id, callLogId });
    }
    get().resetCallState();
  },

  handleCallEnded: () => {
    toast("Call ended");
    get().resetCallState();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    const nextIsMuted = !isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextIsMuted;
      });
    }
    set({ isMuted: nextIsMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, partner } = get();
    const nextIsCameraOff = !isCameraOff;
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextIsCameraOff;
      });
      const socket = useAuthStore.getState().socket;
      if (socket && partner) {
        socket.emit("call:camera-toggle", {
          to: partner._id,
          cameraOn: !nextIsCameraOff,
        });
      }
    }
    set({ isCameraOff: nextIsCameraOff });
  },

  toggleMinimize: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },

  fetchCallHistory: async () => {
    if (useAuthStore.getState().isDemoMode) {
      if (get().callHistory.length === 0) {
        set({ callHistory: DEMO_CALL_HISTORY });
      }
      return;
    }
    set({ isHistoryLoading: true });
    try {
      const { axiosInstance } = await import("../lib/axios");
      const res = await axiosInstance.get("/calls/history");
      set({ callHistory: res.data.logs || [] });
    } catch {
      if (get().callHistory.length === 0) {
        set({ callHistory: DEMO_CALL_HISTORY });
      }
    } finally {
      set({ isHistoryLoading: false });
    }
  },

  deleteCallFromHistory: async (id) => {
    if (useAuthStore.getState().isDemoMode) {
      set((state) => ({
        callHistory: state.callHistory.filter((c) => c._id !== id),
      }));
      toast.success("Call removed from history");
      return;
    }
    try {
      const { axiosInstance } = await import("../lib/axios");
      await axiosInstance.delete(`/calls/${id}`);
      set((state) => ({
        callHistory: state.callHistory.filter((c) => c._id !== id),
      }));
      toast.success("Call removed from history");
    } catch {
      toast.error("Failed to delete call record");
    }
  },

  resetCallState: () => {
    const { localStream, peerConnection } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    stopAllSounds();

    set({
      callState: "idle",
      callType: null,
      partner: null,
      callLogId: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      pendingOffer: null,
      iceCandidateQueue: [],
      isMuted: false,
      isCameraOff: false,
      isMinimized: false,
      remoteCameraOn: true,
    });
  },
}));
