import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useStoryStore } from "../store/useStoryStore";
import { useCallStore } from "../store/useCallStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import AvatarLightbox from "./AvatarLightbox";
import StoryRow from "./StoryRow";
import StoryViewer from "./StoryViewer";
import AddStorySheet from "./AddStorySheet";
import {
  Users,
  UserPlus,
  Phone,
  Video,
  Trash2,
  PhoneMissed,
  PhoneCall,
  PhoneOff,
  Search,
  Sparkles,
} from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const Sidebar = ({ onOpenSearch }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { activeGroup } = useStoryStore();
  const {
    callHistory,
    isHistoryLoading,
    fetchCallHistory,
    deleteCallFromHistory,
    initiateCall,
  } = useCallStore();

  const [activeTab, setActiveTab] = useState("chats");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [lightboxUser, setLightboxUser] = useState(null);
  const [showAddStory, setShowAddStory] = useState(false);

  useEffect(() => {
    if (activeTab === "calls") {
      fetchCallHistory();
    }
  }, [activeTab, fetchCallHistory]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => {
    if (showOnlineOnly && !onlineUsers.includes(user._id)) return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        user.fullName?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  const onlineCount = users.filter((u) => onlineUsers.includes(u._id)).length;

  return (
    <>
      <aside className="h-full w-16 sm:w-20 lg:w-80 bg-card border-r border-border-subtle flex flex-col transition-all duration-200 flex-shrink-0">
        {/* Header */}
        <div className="border-b border-border-subtle w-full px-4 py-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-connect-blue" />
              <span className="font-bold text-sm text-ink hidden lg:block">
                Direct Messages
              </span>
            </div>
            {onlineCount > 0 && (
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-online-green">
                <span className="size-1.5 rounded-full bg-online-green animate-pulse" />
                {onlineCount} online
              </span>
            )}
          </div>

          {/* Search input inside Sidebar (Desktop) */}
          {activeTab === "chats" && (
            <div className="hidden lg:block space-y-2">
              <div className="relative">
                <Search className="size-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-xl bg-surface border border-border-subtle pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-muted outline-none focus:border-connect-blue transition-colors"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="cursor-pointer flex items-center gap-1.5 select-none" htmlFor="online-filter">
                  <input
                    id="online-filter"
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-connect-blue cursor-pointer"
                  />
                  <span className="text-[11px] text-ink-muted">Active now only</span>
                </label>
                <span className="text-[10px] text-ink-muted font-medium">
                  {filteredUsers.length} contacts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Switcher — Chats vs Calls */}
        <div className="flex border-b border-border-subtle bg-surface/40">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 focus:outline-none ${
              activeTab === "chats"
                ? "border-connect-blue text-connect-blue bg-card"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 focus:outline-none ${
              activeTab === "calls"
                ? "border-connect-blue text-connect-blue bg-card"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Calls
          </button>
        </div>

        {/* Story row — desktop only (lg+) */}
        {activeTab === "chats" && (
          <div className="hidden lg:block flex-shrink-0">
            <StoryRow onAddStory={() => setShowAddStory(true)} />
          </div>
        )}

        {/* Main Tab content area */}
        <div className="overflow-y-auto flex-1 py-1.5">
          {activeTab === "calls" ? (
            isHistoryLoading && callHistory.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <span className="loading loading-spinner text-connect-blue size-6"></span>
              </div>
            ) : callHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                <Phone className="size-10 text-ink-muted mb-2 opacity-50" />
                <p className="text-sm font-semibold text-ink">No calls yet</p>
                <p className="text-xs text-ink-muted mt-1">Your call logs will appear here</p>
              </div>
            ) : (
              callHistory.map((log) => {
                const isOutgoing = log.callerId?._id === authUser?._id;
                const partnerUser = isOutgoing ? log.receiverId : log.callerId;
                if (!partnerUser) return null;
                const isMissed = log.status === "missed";
                const isDeclined = log.status === "declined";
                const isOnline = onlineUsers.includes(partnerUser._id);

                return (
                  <div
                    key={log._id}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-surface transition-colors border-b border-border-subtle/30 group"
                  >
                    <div
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => setLightboxUser({ src: partnerUser.profilePic, name: partnerUser.fullName })}
                      title={`View ${partnerUser.fullName}'s photo`}
                    >
                      <img
                        src={partnerUser.profilePic || "./avatar.png"}
                        alt={partnerUser.fullName}
                        className="size-11 object-cover rounded-full border border-border-subtle"
                      />
                      {isOnline && <span className="online-dot" />}
                    </div>

                    <div className="flex-1 min-w-0 text-left hidden lg:block">
                      <p className="text-sm font-semibold text-ink truncate">
                        {partnerUser.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        {isOutgoing ? (
                          <PhoneCall size={12} className="text-connect-blue" />
                        ) : isMissed ? (
                          <PhoneMissed size={12} className="text-rose-400" />
                        ) : isDeclined ? (
                          <PhoneOff size={12} className="text-zinc-400" />
                        ) : (
                          <PhoneCall size={12} className="text-online-green rotate-180" />
                        )}

                        <span className={`truncate ${isMissed ? "text-rose-400 font-medium" : "text-ink-muted"}`}>
                          {isOutgoing
                            ? `Outgoing ${log.type}`
                            : isMissed
                            ? `Missed ${log.type}`
                            : isDeclined
                            ? `Declined ${log.type}`
                            : `Incoming ${log.type}`}
                        </span>

                        {log.status === "answered" && log.duration > 0 && (
                          <span className="text-[10px] text-ink-muted">
                            ({formatDuration(log.duration)})
                          </span>
                        )}
                      </div>
                      <time className="text-[10px] text-ink-muted block mt-0.5">
                        {formatMessageTime(log.createdAt)}
                      </time>
                    </div>

                    <div className="hidden lg:flex items-center gap-1.5">
                      <button
                        onClick={() => initiateCall(partnerUser, log.type)}
                        className="p-2 rounded-full bg-connect-blue-light hover:bg-connect-blue hover:text-white text-connect-blue transition-colors focus:outline-none"
                        title={`Call ${partnerUser.fullName} back`}
                      >
                        {log.type === "video" ? <Video size={14} /> : <Phone size={14} />}
                      </button>

                      <button
                        onClick={() => deleteCallFromHistory(log._id)}
                        className="p-2 rounded-full hover:bg-rose-500 hover:text-white text-ink-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                        title="Delete log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <>
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-10 px-4 gap-3">
                  <div className="size-12 rounded-full bg-connect-blue-light flex items-center justify-center">
                    <UserPlus size={20} className="text-connect-blue" />
                  </div>
                  <div className="hidden lg:block text-center">
                    <p className="text-sm font-semibold text-ink">No matching contacts</p>
                    <p className="text-xs text-ink-muted mt-1">Search or add people to chat</p>
                    {onOpenSearch && (
                      <button
                        onClick={onOpenSearch}
                        className="btn-meta text-xs px-4 py-2 mt-3"
                      >
                        Find People
                      </button>
                    )}
                  </div>
                </div>
              )}

              {filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const isActive = selectedUser?._id === user._id;
                const unreadCount = unreadCounts[user._id] || 0;

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 transition-all border-l-2 focus:outline-none ${
                      isActive
                        ? "bg-connect-blue-light border-connect-blue"
                        : "border-transparent hover:bg-surface/70"
                    }`}
                    aria-label={`Open chat with ${user.fullName}`}
                    aria-pressed={isActive}
                  >
                    <div
                      className="relative mx-auto lg:mx-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxUser({ src: user.profilePic, name: user.fullName });
                      }}
                      title={`View ${user.fullName}'s photo`}
                    >
                      <img
                        src={user.profilePic || "./avatar.png"}
                        alt={user.fullName}
                        className="size-11 object-cover rounded-full border border-border-subtle hover:opacity-85 transition-opacity cursor-zoom-in"
                      />
                      {isOnline && (
                        <span className="online-dot" aria-label="Online" />
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-connect-blue border-2 border-card flex items-center justify-center lg:hidden" />
                      )}
                    </div>

                    <div className="hidden lg:flex items-center justify-between min-w-0 flex-1">
                      <div className="min-w-0 text-left">
                        <p className={`text-sm font-semibold truncate ${unreadCount > 0 ? "text-ink font-bold" : isActive ? "text-indigo-300" : "text-ink"}`}>
                          {user.fullName}
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          {isOnline ? (
                            <span className="text-online-green font-medium">● Online</span>
                          ) : (
                            <span>Offline</span>
                          )}
                          <span className="mx-1.5 opacity-50">·</span>
                          <span>@{user.username || ""}</span>
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 min-w-5 h-5 rounded-full bg-connect-blue text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Author Credit Strip */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-surface/50 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5 font-semibold text-ink/90">
            <Sparkles size={12} className="text-connect-blue" />
            Built by Jayesh Lamba
          </span>
          <a
            href="https://github.com/jayesh-lamba"
            target="_blank"
            rel="noopener noreferrer"
            className="text-connect-blue hover:underline font-medium"
          >
            @jayesh-lamba
          </a>
        </div>
      </aside>

      {activeGroup && <StoryViewer />}
      {showAddStory && <AddStorySheet onClose={() => setShowAddStory(false)} />}
      {lightboxUser && (
        <AvatarLightbox
          src={lightboxUser.src}
          name={lightboxUser.name}
          onClose={() => setLightboxUser(null)}
        />
      )}
    </>
  );
};

export default Sidebar;
