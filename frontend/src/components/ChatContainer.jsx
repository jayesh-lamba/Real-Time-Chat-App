import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { 
  Phone, 
  PhoneMissed, 
  PhoneOff, 
  Video, 
  VideoOff, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Forward, 
  Download, 
  CheckSquare, 
  Square, 
  Check, 
  X 
} from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ForwardModal from "./ForwardModal";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import stickersData from "../data/stickers.json";
import toast from "react-hot-toast";

// Fast lookup: stickerId → sticker object
const STICKER_MAP = Object.fromEntries(stickersData.map((s) => [s.id, s]));

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessage,
    chatThemes,
    isPartnerTyping,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const activeTheme = chatThemes[selectedUser?._id] || "default";

  const themeClasses = {
    default: "bg-surface",
    love: "bg-gradient-to-br from-rose-950/40 via-surface to-pink-950/30",
    happy: "bg-gradient-to-br from-amber-950/35 via-surface to-orange-950/25",
    midnight: "bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-slate-100",
    ocean: "bg-gradient-to-br from-cyan-950/40 via-surface to-indigo-950/35",
  };

  const themePatternStyles = {
    default: {},
    love: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath fill='%23ec4899' fill-opacity='0.08' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`,
    },
    happy: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'%3E%3Cg fill='%23f59e0b' fill-opacity='0.06'%3E%3Cpath d='M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 3c.5 1.5 2 2.5 3.5 2.5s3-1 3.5-2.5h-7z'/%3E%3C/g%3E%3C/svg%3E")`,
    },
    midnight: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 40 40'%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M20 2.5l1.2 3.8 4-.2-3.1 2.6 1.1 3.8-3.2-2.3-3.2 2.3 1.1-3.8-3.1-2.6 4 .2zm10 20l.8 2.6 2.7-.1-2.1 1.7.7 2.6-2.1-1.5-2.1 1.5.7-2.6-2.1-1.7 2.7.1zm-20 10l.6 1.8 1.9-.1-1.5 1.2.5 1.8-1.5-1.1-1.5 1.1.5-1.8-1.5-1.2 1.9.1z'/%3E%3C/svg%3E")`,
    },
    ocean: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 30 30'%3E%3Cpath fill='%2306b6d4' fill-opacity='0.06' d='M0 10c5 0 5-5 10-5s5 5 10 5 5-5 10-5v2c-5 0-5 5-10 5s-5-5-10-5-5 5-10 5zm0 10c5 0 5-5 10-5s5 5 10 5 5-5 10-5v2c-5 0-5 5-10 5s-5-5-10-5-5 5-10 5z'/%3E%3C/svg%3E")`,
    },
  };



  // Message option/actions states
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Multi-select states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set());

  // Forwarding states
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState([]);

  // Auto-scroll on new messages
  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Click outside to close options menu
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuMsgId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  if (isMessagesLoading) {
    return (
      <div className={`flex-1 flex flex-col overflow-auto ${themeClasses[activeTheme]}`}>
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Group messages by day
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const getDayLabel = (dateStr) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  // Download media assets (convert to blob to force system download or fallback to direct download)
  const handleDownloadMedia = async (url, filename) => {
    try {
      if (url.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = url;
        const ext = url.split(";")[0].split("/")[1] || "file";
        link.download = `${filename}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("File download started");
        return;
      }
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("File download started");
    } catch (error) {
      // Fallback
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File download opened in new tab");
    }
  };

  // Toggle selection of a message
  const handleBubbleClick = (e, message) => {
    if (isSelectionMode) {
      e.stopPropagation();
      const next = new Set(selectedMsgIds);
      if (next.has(message._id)) {
        next.delete(message._id);
      } else {
        next.add(message._id);
      }
      setSelectedMsgIds(next);
    }
  };

  // Actions on multiple selected messages
  const handleForwardSelected = () => {
    const selectedMsgs = messages.filter((m) => selectedMsgIds.has(m._id));
    setMessagesToForward(selectedMsgs);
    setIsForwardModalOpen(true);
  };

  const handleDeleteSelected = async (type) => {
    const ids = Array.from(selectedMsgIds);
    try {
      for (const id of ids) {
        await deleteMessage(id, type);
      }
      setIsSelectionMode(false);
      setSelectedMsgIds(new Set());
    } catch (error) {
      console.error("Failed to delete selected messages:", error);
    }
  };

  // Action Menu dropdown markup
  const renderActionMenu = (message, isSent) => {
    return (
      <div 
        className={`absolute bottom-full mb-1 z-30 bg-card border border-border-subtle rounded-2xl shadow-xl py-1.5 w-44 animate-scale-in text-left ${
          isSent ? "right-0" : "left-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Edit text (own text messages only) */}
        {isSent && (message.messageType === "text" || !message.messageType) && (
          <button
            onClick={() => {
              setEditingMsgId(message._id);
              setEditingText(message.text || "");
              setActiveMenuMsgId(null);
            }}
            className="w-full px-4 py-2 hover:bg-surface text-xs text-ink flex items-center gap-2 transition-colors"
          >
            <Edit2 size={13} />
            Edit
          </button>
        )}

        {/* Forward */}
        <button
          onClick={() => {
            setMessagesToForward([message]);
            setIsForwardModalOpen(true);
            setActiveMenuMsgId(null);
          }}
          className="w-full px-4 py-2 hover:bg-surface text-xs text-ink flex items-center gap-2 transition-colors"
        >
          <Forward size={13} />
          Forward
        </button>

        {/* Download media (images & videos) */}
        {(message.image || message.video) && (
          <button
            onClick={() => {
              handleDownloadMedia(message.image || message.video, message.image ? "image_attachment" : "video_attachment");
              setActiveMenuMsgId(null);
            }}
            className="w-full px-4 py-2 hover:bg-surface text-xs text-ink flex items-center gap-2 transition-colors"
          >
            <Download size={13} />
            Download
          </button>
        )}

        {/* Select (enter multi-select mode) */}
        <button
          onClick={() => {
            setIsSelectionMode(true);
            setSelectedMsgIds(new Set([message._id]));
            setActiveMenuMsgId(null);
          }}
          className="w-full px-4 py-2 hover:bg-surface text-xs text-ink flex items-center gap-2 transition-colors"
        >
          <CheckSquare size={13} />
          Select
        </button>

        <div className="h-px bg-border-subtle my-1" />

        {/* Delete for Me */}
        <button
          onClick={() => {
            deleteMessage(message._id, "me");
            setActiveMenuMsgId(null);
          }}
          className="w-full px-4 py-2 hover:bg-surface text-xs text-red-500 flex items-center gap-2 transition-colors"
        >
          <Trash2 size={13} />
          Delete for Me
        </button>

        {/* Unsend for Everyone (own messages only) */}
        {isSent && (
          <button
            onClick={() => {
              deleteMessage(message._id, "unsend");
              setActiveMenuMsgId(null);
            }}
            className="w-full px-4 py-2 hover:bg-surface text-xs text-red-500 flex items-center gap-2 transition-colors font-semibold"
          >
            <Trash2 size={13} />
            Unsend (Everyone)
          </button>
        )}
      </div>
    );
  };

  const renderCallLog = (message) => {
    const isSent = message.senderId === authUser._id;
    const isVideo = message.callType === "video";
    const status = message.callStatus;
    const duration = message.callDuration || 0;
    const partnerName = selectedUser?.fullName || "User";

    let durationStr = "";
    if (duration > 0) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    let labelText = "";
    let iconColor = "";
    let bgColor = "";
    let textStyle = "text-ink-muted";
    
    if (status === "answered") {
      labelText = isSent 
        ? `You called ${partnerName} (Answered · ${durationStr})`
        : `${partnerName} called you (Answered · ${durationStr})`;
      iconColor = "text-green-500";
      bgColor = "bg-green-500/10";
    } else if (status === "declined") {
      labelText = isSent
        ? `You called ${partnerName} (Declined)`
        : `You declined a call from ${partnerName}`;
      iconColor = "text-zinc-400";
      bgColor = "bg-zinc-500/15";
    } else {
      // missed / unanswered
      labelText = isSent 
        ? `Unanswered call to ${partnerName}`
        : `Missed call from ${partnerName}`;
      iconColor = "text-red-500";
      bgColor = "bg-red-500/10";
      textStyle = isSent ? "text-ink-muted" : "text-red-500 font-semibold";
    }

    return (
      <div className="flex flex-col items-center justify-center my-3 w-full animate-fade-in-up">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-subtle/50 text-xs shadow-sm bg-card">
          <div className={`p-1 rounded-full ${bgColor}`}>
            {isVideo ? (
              status === "missed" || status === "declined" ? (
                <VideoOff size={14} className={iconColor} />
              ) : (
                <Video size={14} className={iconColor} />
              )
            ) : (
              status === "missed" ? (
                <PhoneMissed size={14} className={iconColor} />
              ) : status === "declined" ? (
                <PhoneOff size={14} className={iconColor} />
              ) : (
                <Phone size={14} className={iconColor} />
              )
            )}
          </div>
          <span className={textStyle}>{labelText}</span>
          <span className="text-[10px] text-ink-muted opacity-80 border-l border-border-subtle pl-2">
            {formatMessageTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  };




  return (
    <div className={`flex-1 flex flex-col overflow-auto ${themeClasses[activeTheme]}`}>
      <ChatHeader />

      <div 
        className="flex-1 overflow-y-auto px-4 py-4"
        style={themePatternStyles[activeTheme]}
      >
        {/* E2EE Verification Banner */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card/80 border border-border-subtle text-[11px] text-ink-muted shadow-sm">
            <span>🔒</span>
            <span>
              End-to-End Encrypted via X25519 · <strong className="text-indigo-300">JayeshChat</strong> by Jayesh Lamba
            </span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-ink-muted">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-xs">Say hello to {selectedUser.fullName}!</p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([dateStr, dayMessages]) => (
          <div key={dateStr}>
            {/* Day divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-[11px] font-semibold text-ink-muted bg-surface px-2 rounded-full border border-border-subtle">
                {getDayLabel(dateStr)}
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Messages for this day */}
            <div className="space-y-1.5">
              {dayMessages.map((message, index) => {
                if (message.messageType === "call_log") {
                  return (
                    <div key={message._id}>
                      {renderCallLog(message)}
                    </div>
                  );
                }

                const isSent = message.senderId === authUser._id;

                const isLastInGroup =
                  index === dayMessages.length - 1 ||
                  dayMessages[index + 1]?.senderId !== message.senderId;

                return (
                  <div
                    key={message._id}
                    onClick={(e) => handleBubbleClick(e, message)}
                    className={`flex items-end gap-2 group relative animate-fade-in-up ${
                      isSelectionMode ? "cursor-pointer select-none" : ""
                    } ${isSent ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Multi-select check icon */}
                    {isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = new Set(selectedMsgIds);
                          if (next.has(message._id)) {
                            next.delete(message._id);
                          } else {
                            next.add(message._id);
                          }
                          setSelectedMsgIds(next);
                        }}
                        className="p-1 rounded-full text-connect-blue hover:bg-surface transition-colors self-center flex-shrink-0"
                      >
                        {selectedMsgIds.has(message._id) ? (
                          <CheckSquare size={18} className="fill-connect-blue-light text-connect-blue" />
                        ) : (
                          <Square size={18} className="text-ink-muted" />
                        )}
                      </button>
                    )}

                    {/* Avatar */}
                    {isLastInGroup ? (
                      <img
                        src={isSent ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                        alt="avatar"
                        className="size-7 rounded-full object-cover flex-shrink-0 mb-0.5"
                      />
                    ) : (
                      <div className="size-7 flex-shrink-0" />
                    )}

                    {/* Bubble body wrapper */}
                    <div className="relative flex items-center gap-1.5 max-w-[72%] sm:max-w-[60%]">
                      {/* Hover action menu button (left of bubble if sent) */}
                      {isSent && !isSelectionMode && (
                        <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(activeMenuMsgId === message._id ? null : message._id);
                            }}
                            className="p-1 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-all"
                            title="Message options"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {activeMenuMsgId === message._id && renderActionMenu(message, isSent)}
                        </div>
                      )}

                      <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                        {/* ── Sticker message ── */}
                        {message.messageType === "sticker" ? (
                          <div
                            className="select-none"
                            title={STICKER_MAP[message.stickerId]?.label || "Sticker"}
                            aria-label={`Sticker: ${STICKER_MAP[message.stickerId]?.label || "unknown"}`}
                          >
                            <span
                              className="block leading-none animate-fade-in-up"
                              style={{ fontSize: "140px", lineHeight: 1 }}
                            >
                              {STICKER_MAP[message.stickerId]?.emoji || "❓"}
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* ── Image attachment ── */}
                            {message.image && (
                              <img
                                src={message.image}
                                alt="Attachment"
                                className="max-w-[240px] rounded-xl mb-1 border border-border-subtle"
                              />
                            )}
                            {/* ── Video attachment ── */}
                            {message.video && (
                              <video
                                src={message.video}
                                controls
                                className="max-w-[280px] rounded-xl mb-1 border border-border-subtle shadow-sm bg-black"
                              />
                            )}

                            {/* ── Text bubble / editing input ── */}
                            {message.text && (
                              editingMsgId === message._id ? (
                                <div className="flex flex-col gap-2 p-3 bg-card border border-border-subtle rounded-2xl min-w-[220px]" onClick={(e) => e.stopPropagation()}>
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 text-xs bg-surface border border-border-subtle rounded-xl text-ink outline-none focus:border-connect-blue min-h-[60px]"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setEditingMsgId(null)}
                                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface hover:bg-border-subtle text-ink-muted transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (editingText.trim()) {
                                          editMessage(message._id, editingText.trim());
                                        }
                                        setEditingMsgId(null);
                                      }}
                                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-connect-blue hover:bg-connect-blue-dark text-white transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${isSent ? "bubble-sent" : "bubble-received"}`}>
                                  {message.text}
                                  {message.isEdited && (
                                    <span className="block text-[9px] opacity-60 text-right mt-1 italic">
                                      edited
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </>
                        )}

                        {/* Timestamp */}
                        <time className="text-[10px] text-ink-muted mt-0.5 px-1">
                          {formatMessageTime(message.createdAt)}
                        </time>
                      </div>

                      {/* Hover action menu button (right of bubble if received) */}
                      {!isSent && !isSelectionMode && (
                        <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(activeMenuMsgId === message._id ? null : message._id);
                            }}
                            className="p-1 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-all"
                            title="Message options"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {activeMenuMsgId === message._id && renderActionMenu(message, isSent)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Live Partner Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-end gap-2 mt-3 animate-fade-in-up">
            <img
              src={selectedUser.profilePic || "./avatar.png"}
              alt={selectedUser.fullName}
              className="size-7 rounded-full object-cover flex-shrink-0 mb-0.5"
            />
            <div className="bubble-received px-4 py-2.5 text-xs text-ink-muted flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              <span className="ml-1 text-[11px] text-ink-muted">{selectedUser.fullName.split(" ")[0]} is typing…</span>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Multi-Select Panel vs normal MessageInput */}
      {isSelectionMode ? (
        <div className="px-4 py-3 bg-card border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMsgIds(new Set());
              }}
              className="p-1.5 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none"
              aria-label="Cancel selection"
            >
              <X size={18} />
            </button>
            <span className="text-xs font-semibold text-ink">
              {selectedMsgIds.size} message{selectedMsgIds.size > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleForwardSelected}
              disabled={selectedMsgIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-connect-blue hover:bg-connect-blue-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Forward size={12} />
              Forward
            </button>
            
            <button
              onClick={() => handleDeleteSelected("me")}
              disabled={selectedMsgIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-border-subtle text-red-500 border border-border-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Trash2 size={12} />
              Delete for Me
            </button>

            <button
              onClick={() => handleDeleteSelected("unsend")}
              disabled={
                selectedMsgIds.size === 0 ||
                Array.from(selectedMsgIds).some(
                  (id) => messages.find((m) => m._id === id)?.senderId !== authUser._id
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-650 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Only enabled if you sent all selected messages"
            >
              <Trash2 size={12} />
              Unsend (Everyone)
            </button>
          </div>
        </div>
      ) : (
        <MessageInput />
      )}

      {/* Forward Modal Overlay */}
      {isForwardModalOpen && (
        <ForwardModal
          messagesToForward={messagesToForward}
          onClose={() => {
            setIsForwardModalOpen(false);
            setMessagesToForward([]);
            setIsSelectionMode(false);
            setSelectedMsgIds(new Set());
          }}
        />
      )}
    </div>
  );
};

export default ChatContainer;
