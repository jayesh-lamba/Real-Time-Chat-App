import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useStoryStore } from "../store/useStoryStore";
import { useCallStore } from "../store/useCallStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import AvatarLightbox from "./AvatarLightbox";
import StoryViewer from "./StoryViewer";
import AddStorySheet from "./AddStorySheet";
import {
  UserPlus,
  Phone,
  Video,
  Trash2,
  PhoneMissed,
  PhoneCall,
  PhoneOff,
  Search,
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
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
    demoMessagesMap,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { activeGroup } = useStoryStore();
  const {
    callHistory,
    isHistoryLoading,
    fetchCallHistory,
    deleteCallFromHistory,
    initiateCall,
  } = useCallStore();

  const [activeTab, setActiveTab] = useState("chats");
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

  return (
    <>
      <aside className="h-full w-16 sm:w-20 lg:w-80 bg-surface border-r border-border-subtle flex flex-col flex-shrink-0 select-none">
        {/* Header + Search */}
        <div className="p-3.5 border-b border-border-subtle space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-semibold text-xs uppercase tracking-wider text-ink-muted hidden lg:block">
              Messages
            </span>
            <span className="text-[11px] text-ink-muted hidden lg:block">
              {filteredUsers.length}
            </span>
          </div>

          {activeTab === "chats" && (
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="size-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter conversations..."
                  className="w-full rounded-lg bg-card border border-border-subtle pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-muted outline-none focus:border-connect-blue transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-border-subtle bg-surface">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 focus:outline-none ${
              activeTab === "chats"
                ? "border-connect-blue text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 focus:outline-none ${
              activeTab === "calls"
                ? "border-connect-blue text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Calls
          </button>
        </div>

        {/* Contact / Call List */}
        <div className="overflow-y-auto flex-1 py-1">
          {activeTab === "calls" ? (
            isHistoryLoading && callHistory.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <span className="loading loading-spinner text-connect-blue size-5"></span>
              </div>
            ) : callHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                <Phone className="size-7 text-ink-muted mb-2 opacity-40" />
                <p className="text-xs font-medium text-ink">No recent calls</p>
              </div>
            ) : (
              callHistory.map((log) => {
                const isOutgoing = log.callerId?._id === authUser?._id;
                const partnerUser = isOutgoing ? log.receiverId : log.callerId;
                if (!partnerUser) return null;
                const isMissed = log.status === "missed";
                const isDeclined = log.status === "declined";

                return (
                  <div
                    key={log._id}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-card/60 transition-colors group"
                  >
                    <div
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => setLightboxUser({ src: partnerUser.profilePic, name: partnerUser.fullName })}
                    >
                      <img
                        src={partnerUser.profilePic || "./avatar.png"}
                        alt={partnerUser.fullName}
                        className="size-10 object-cover rounded-full border border-border-subtle"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left hidden lg:block">
                      <p className="text-sm font-medium text-ink truncate">
                        {partnerUser.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        {isOutgoing ? (
                          <PhoneCall size={11} className="text-connect-blue" />
                        ) : isMissed ? (
                          <PhoneMissed size={11} className="text-red-400" />
                        ) : isDeclined ? (
                          <PhoneOff size={11} className="text-zinc-400" />
                        ) : (
                          <PhoneCall size={11} className="text-emerald-400 rotate-180" />
                        )}

                        <span className="truncate text-ink-muted">
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
                    </div>

                    <div className="hidden lg:flex items-center gap-1">
                      <button
                        onClick={() => initiateCall(partnerUser, log.type)}
                        className="p-1.5 rounded-lg hover:bg-card text-ink-muted hover:text-ink transition-colors focus:outline-none"
                        title={`Call ${partnerUser.fullName}`}
                      >
                        {log.type === "video" ? <Video size={14} /> : <Phone size={14} />}
                      </button>

                      <button
                        onClick={() => deleteCallFromHistory(log._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-ink-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:outline-none"
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
                <div className="flex flex-col items-center justify-center h-full py-10 px-4 gap-2">
                  <UserPlus size={18} className="text-ink-muted" />
                  <div className="hidden lg:block text-center">
                    <p className="text-xs font-medium text-ink">No contacts found</p>
                    {onOpenSearch && (
                      <button
                        onClick={onOpenSearch}
                        className="text-xs text-connect-blue hover:underline mt-1"
                      >
                        Add a contact
                      </button>
                    )}
                  </div>
                </div>
              )}

              {filteredUsers.map((user) => {
                const isActive = selectedUser?._id === user._id;
                const unreadCount = unreadCounts[user._id] || 0;
                const thread = demoMessagesMap?.[user._id] || [];
                const lastMessage = thread.length > 0 ? thread[thread.length - 1] : null;

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors focus:outline-none ${
                      isActive
                        ? "bg-card text-ink"
                        : "hover:bg-card/50 text-ink-muted"
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
                    >
                      <img
                        src={user.profilePic || "./avatar.png"}
                        alt={user.fullName}
                        className="size-10 object-cover rounded-full border border-border-subtle"
                      />
                    </div>

                    <div className="hidden lg:flex items-center justify-between min-w-0 flex-1">
                      <div className="min-w-0 text-left flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${isActive ? "font-semibold text-ink" : "font-medium text-ink/90"}`}>
                            {user.fullName}
                          </p>
                          {lastMessage && (
                            <span className="text-[10px] text-ink-muted flex-shrink-0">
                              {formatMessageTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted truncate mt-0.5">
                          {lastMessage
                            ? lastMessage.text || "Attachment"
                            : `@${user.username || ""}`}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 min-w-4 h-4 rounded-full bg-connect-blue text-white text-[10px] font-semibold flex items-center justify-center px-1">
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

        {/* Subtle Footer */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2.5 border-t border-border-subtle text-[11px] text-ink-muted">
          <span>Jayesh Lamba</span>
          <a
            href="https://github.com/jayesh-lamba"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            github.com/jayesh-lamba
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
