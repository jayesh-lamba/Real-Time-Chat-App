import { useState, useEffect, useRef } from "react";

import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { isSoundMuted, setSoundMuted, stopAllSounds } from "../lib/sounds";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  User,
} from "lucide-react";


// Self-contained helper component to bind stream to <video> safely
const VideoFeed = ({ stream, muted = false, className = "" }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`object-cover w-full h-full ${className}`}
    />
  );
};

const CallModal = () => {
  const {
    callState,
    callType,
    partner,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isMinimized,
    remoteCameraOn,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleMinimize,
  } = useCallStore();

  const { authUser } = useAuthStore();


  const [ringtoneMuted, setRingtoneMuted] = useState(isSoundMuted());

  const handleToggleRingtoneMute = () => {
    const newState = !ringtoneMuted;
    setRingtoneMuted(newState);
    setSoundMuted(newState);
    if (newState) {
      stopAllSounds();
    }
  };


  // Keep screen awake/active or handle sizing
  if (callState === "idle") return null;

  // ──────────────────────────────────────────────────────────
  // 1. Minimized Floating Widget
  // ──────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[90] w-48 aspect-video bg-zinc-900 border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col group animate-fade-in">
        <div className="relative flex-1 bg-black">
          {callType === "video" && remoteStream ? (
            <VideoFeed stream={remoteStream} />
          ) : callType === "video" && localStream ? (
            <VideoFeed stream={localStream} muted />
          ) : (
            <div className="size-full flex flex-col items-center justify-center bg-zinc-900 gap-1.5 p-2">
              <img
                src={partner?.profilePic || "/avatar.png"}
                alt={partner?.fullName}
                className="size-10 rounded-full object-cover border border-white/20"
              />
              <span className="text-[10px] text-white font-semibold truncate max-w-full text-center">
                {partner?.fullName}
              </span>
            </div>
          )}

          {/* Floating actions menu on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              title="Expand"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={endCall}
              className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white"
              title="End call"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </div>
        <div className="bg-zinc-800 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-semibold border-t border-zinc-700 select-none">
          <span className="truncate flex-1 pr-1">{partner?.fullName}</span>
          <span className="text-zinc-400 capitalize">{callType} call</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // 2. Full-Screen Call overlay
  // ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[85] bg-zinc-950 flex flex-col items-center justify-center text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Call in progress"
    >
      {/* Top Header details */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={toggleMinimize}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
            title="Minimize call"
          >
            <Minimize2 size={18} />
          </button>

          {(callState === "ringing-incoming" || callState === "ringing-outgoing") && (
            <button
              onClick={handleToggleRingtoneMute}
              className={`p-2.5 rounded-full transition-colors focus:outline-none ${
                ringtoneMuted ? "bg-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={ringtoneMuted ? "Unmute ringtone" : "Mute ringtone"}
            >
              {ringtoneMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>
        <span className="text-xs text-white/60 font-medium capitalize tracking-wider select-none">

          {callType} Call
        </span>
        <div className="w-10 h-10" /* placeholder for alignment */ />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-lg px-4 flex flex-col items-center justify-center gap-8 relative select-none">
        
        {/* Outgoing Ringing */}
        {callState === "ringing-outgoing" && (
          <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-connect-blue/20 animate-ping opacity-60" />
              <img
                src={partner?.profilePic || "/avatar.png"}
                alt={partner?.fullName}
                className="size-32 rounded-full object-cover border-4 border-connect-blue/50"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{partner?.fullName}</h2>
              <p className="text-sm text-white/50 mt-1">Ringing...</p>
            </div>
          </div>
        )}

        {/* Incoming Ringing */}
        {callState === "ringing-incoming" && (
          <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-purple-500/20 animate-ping opacity-60" />
              <img
                src={partner?.profilePic || "/avatar.png"}
                alt={partner?.fullName}
                className="size-32 rounded-full object-cover border-4 border-purple-500/50"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{partner?.fullName}</h2>
              <p className="text-sm text-white/50 mt-1">Incoming {callType} call...</p>
            </div>
          </div>
        )}

        {/* Connected call view */}
        {callState === "connected" && (
          <div className="size-full flex items-center justify-center relative rounded-2xl overflow-hidden bg-black max-h-[70vh] shadow-2xl border border-white/10">
            {callType === "video" ? (
              <>
                {/* Remote video (full) */}
                <div className="size-full bg-zinc-900 flex items-center justify-center relative">
                  {remoteCameraOn ? (
                    remoteStream ? (
                      <VideoFeed stream={remoteStream} />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/40">
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Connecting feed...</span>
                      </div>
                    )
                  ) : (
                    /* Remote Camera is Off: display blurred background + large circular avatar */
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in bg-zinc-950 overflow-hidden select-none">
                      {/* Blurred background profile image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110"
                        style={{ backgroundImage: `url(${partner?.profilePic || "/avatar.png"})` }}
                      />
                      {/* Centered avatar and camera off indicator */}
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="relative">
                          <img
                            src={partner?.profilePic || "/avatar.png"}
                            alt={partner?.fullName}
                            className="size-32 rounded-full object-cover border-4 border-zinc-700 shadow-xl"
                          />
                          <div className="absolute bottom-1 right-1 bg-red-600 border-2 border-zinc-950 p-2 rounded-full shadow-lg">
                            <VideoOff size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{partner?.fullName}</p>
                          <p className="text-xs text-white/60 mt-0.5">Camera off</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Local video (small floating thumbnail) */}
                {localStream && (
                  <div className="absolute top-4 right-4 w-28 aspect-[3/4] bg-zinc-900 border border-white/20 rounded-xl overflow-hidden shadow-2xl animate-fade-in flex items-center justify-center">
                    {!isCameraOff ? (
                      <VideoFeed stream={localStream} muted />
                    ) : (
                      /* Local Camera is Off: display static avatar thumbnail */
                      <div className="size-full flex flex-col items-center justify-center bg-zinc-950 p-2 select-none">
                        <div className="relative">
                          <img
                            src={authUser?.profilePic || "/avatar.png"}
                            alt="Me"
                            className="size-14 rounded-full object-cover border border-zinc-700 shadow-md"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 bg-red-600 border border-zinc-950 p-1 rounded-full">
                            <VideoOff size={8} className="text-white" />
                          </div>
                        </div>
                        <span className="text-[9px] text-white/60 mt-1.5 font-semibold">Camera off</span>
                      </div>
                    )}
                  </div>
                )}

              </>
            ) : (
              /* Voice Call Connected placeholder */
              <div className="flex flex-col items-center gap-4 text-center">
                <img
                  src={partner?.profilePic || "/avatar.png"}
                  alt={partner?.fullName}
                  className="size-28 rounded-full object-cover border-4 border-green-500/50"
                />
                <div>
                  <h2 className="text-xl font-bold">{partner?.fullName}</h2>
                  <p className="text-xs text-green-500 font-medium tracking-wide">Connected</p>
                </div>
                {/* Hidden audio element to output the remote partner's voice */}
                {remoteStream && (
                  <audio
                    ref={(el) => {
                      if (el && remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="hidden"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="pb-12 pt-6 w-full max-w-md px-6 flex justify-center gap-6 items-center">
        {callState === "ringing-incoming" ? (
          <>
            {/* Reject/decline button */}
            <button
              onClick={rejectCall}
              className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-colors focus:outline-none"
              aria-label="Decline Call"
            >
              <PhoneOff size={24} />
            </button>

            {/* Accept call button */}
            <button
              onClick={acceptCall}
              className="size-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white shadow-lg transition-colors focus:outline-none animate-bounce"
              aria-label="Accept Call"
            >
              {callType === "video" ? <Video size={24} /> : <Phone size={24} />}
            </button>
          </>
        ) : (
          <>
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className={`size-12 rounded-full flex items-center justify-center border transition-all focus:outline-none ${
                isMuted
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-white/10 border-white/10 text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Unmute mic" : "Mute mic"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* End call button */}
            <button
              onClick={endCall}
              className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-all active:scale-95 focus:outline-none"
              aria-label="End call"
            >
              <PhoneOff size={24} />
            </button>

            {/* Camera on/off toggle (only for video calls) */}
            {callType === "video" && (
              <button
                onClick={toggleCamera}
                className={`size-12 rounded-full flex items-center justify-center border transition-all focus:outline-none ${
                  isCameraOff
                    ? "bg-red-500 border-red-500 text-white"
                    : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                }`}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallModal;
