import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useConnectionStore } from "../store/useConnectionStore";
import { useChatStore } from "../store/useChatStore";
import {
  LogOut,
  MessageSquare,
  Settings,
  UserCircle,
  Bell,
  UserPlus,
  Users,
} from "lucide-react";
import SearchPeopleModal from "./SearchPeopleModal";
import RequestsPanel from "./RequestsPanel";
import UnseenMessagesPanel from "./UnseenMessagesPanel";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { pendingCount } = useConnectionStore();
  const { unreadCounts } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showUnseen, setShowUnseen] = useState(false);

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, val) => sum + val, 0);

  return (
    <>
      <header className="bg-card border-b border-border-subtle fixed inset-x-0 top-0 z-40 h-14">
        <div className="w-full h-full px-5 flex items-center justify-between">
          {/* Left: Clean Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="JayeshChat Home"
            >
              <div className="size-8 rounded-lg bg-connect-blue flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold text-ink tracking-tight">
                JayeshChat
              </span>
            </Link>

            <span className="hidden sm:inline-block text-border-subtle select-none">/</span>

            <a
              href="https://github.com/jayesh-lamba"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-xs text-ink-muted hover:text-ink transition-colors"
            >
              Jayesh Lamba
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {authUser && (
              <>
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface border border-border-subtle transition-colors focus:outline-none"
                  aria-label="Find people"
                  id="find-people-btn"
                >
                  <UserPlus size={14} />
                  <span className="hidden sm:inline">Add Contact</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUnseen((v) => !v);
                      setShowRequests(false);
                    }}
                    className="relative flex items-center justify-center size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none"
                    aria-label="Notifications"
                    id="unread-messages-bell-btn"
                  >
                    <Bell size={16} />
                    {totalUnreadCount > 0 && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-connect-blue" />
                    )}
                  </button>

                  {showUnseen && (
                    <UnseenMessagesPanel onClose={() => setShowUnseen(false)} />
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowRequests((v) => !v);
                      setShowUnseen(false);
                    }}
                    className="relative flex items-center justify-center size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none"
                    aria-label="Requests"
                    id="requests-bell-btn"
                  >
                    <Users size={16} />
                    {pendingCount > 0 && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-connect-blue" />
                    )}
                  </button>

                  {showRequests && (
                    <RequestsPanel onClose={() => setShowRequests(false)} />
                  )}
                </div>
              </>
            )}

            <Link
              to="/settings"
              className="flex items-center justify-center size-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none"
              aria-label="Settings"
            >
              <Settings size={16} />
            </Link>

            {authUser && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-surface transition-colors focus:outline-none"
                  aria-label="Profile"
                >
                  {authUser.profilePic ? (
                    <img
                      src={authUser.profilePic}
                      alt={authUser.fullName}
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle size={20} className="text-ink-muted" />
                  )}
                  <span className="hidden md:block text-xs font-medium text-ink">
                    {authUser.fullName}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center justify-center size-8 rounded-lg text-ink-muted hover:bg-surface hover:text-red-400 transition-colors focus:outline-none"
                  aria-label="Log out"
                  title="Sign out"
                  id="logout-btn"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showSearch && <SearchPeopleModal onClose={() => setShowSearch(false)} />}
    </>
  );
};

export default Navbar;
