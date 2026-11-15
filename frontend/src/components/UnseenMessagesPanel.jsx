import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { MessageSquare, BellOff } from "lucide-react";

/**
 * UnseenMessagesPanel
 * Dropdown list displaying conversations with unread messages.
 * Props: onClose {Function}
 */
const UnseenMessagesPanel = ({ onClose }) => {
  const { users, unreadCounts, setSelectedUser, messages } = useChatStore();
  const panelRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timerId = setTimeout(() => document.addEventListener("mousedown", handleClick), 50);
    return () => {
      clearTimeout(timerId);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Find contacts who have unread messages
  const unreadConversations = users
    .filter((u) => (unreadCounts[u._id] || 0) > 0)
    .map((user) => ({
      user,
      count: unreadCounts[user._id],
    }));

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 bg-card border border-border-subtle rounded-2xl shadow-2xl py-2 z-50 animate-slide-in"
      role="menu"
      aria-label="Unread messages panel"
    >
      <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between">
        <span className="font-bold text-sm text-ink">Unseen Messages</span>
        <span className="text-[10px] text-ink-muted bg-surface px-2 py-0.5 rounded-full font-semibold">
          {unreadConversations.length} chats
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-border-subtle/50 overscroll-contain">
        {unreadConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4 gap-2 text-ink-muted">
            <BellOff size={24} className="opacity-40" />
            <p className="text-xs font-medium">All caught up!</p>
            <p className="text-[10px]">No unread messages</p>
          </div>
        ) : (
          unreadConversations.map(({ user, count }) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface text-left transition-colors focus:outline-none focus:bg-connect-blue-light"
              role="menuitem"
            >
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-10 rounded-full object-cover border border-border-subtle flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink truncate">{user.fullName}</span>
                  <span className="text-[10px] bg-connect-blue text-white font-bold size-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {count}
                  </span>
                </div>
                <p className="text-[10px] text-ink-muted truncate mt-0.5">
                  Click to open conversation
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default UnseenMessagesPanel;
