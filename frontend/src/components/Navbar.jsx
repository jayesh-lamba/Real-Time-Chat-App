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
  ShieldCheck,
  Sparkles,
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
      <header className="bg-card/95 backdrop-blur-md border-b border-border-subtle fixed w-full top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 h-14 max-w-7xl">
          <div className="flex items-center justify-between h-full">
            {/* Left: JayeshChat Brand + Author Badge */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2.5 group"
                aria-label="JayeshChat Home"
              >
                <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-ink tracking-tight">
                      Jayesh<span className="text-connect-blue">Chat</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-connect-blue/15 text-indigo-300 border border-indigo-500/30">
                      <Sparkles size={10} className="text-indigo-400" />
                      by Jayesh Lamba
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-muted hidden md:block leading-none">
                    Real-Time E2EE & WebRTC Messenger · Engineered by Jayesh Lamba
                  </span>
                </div>
              </Link>

              <a
                href="https://github.com/jayesh-lamba"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                title="Built by Jayesh Lamba (@jayesh-lamba)"
              >
                <ShieldCheck size={12} />
                <span>X25519 E2EE · @jayesh-lamba</span>
              </a>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {authUser && (
                <>
                  {/* Find People */}
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-ink bg-surface hover:bg-connect-blue/20 hover:text-indigo-300 border border-border-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
                    aria-label="Find people"
                    id="find-people-btn"
                  >
                    <UserPlus size={15} className="text-connect-blue" />
                    <span className="hidden sm:inline">Find People</span>
                  </button>

                  {/* E2EE Message Notification bell */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowUnseen((v) => !v);
                        setShowRequests(false);
                      }}
                      className="relative flex items-center justify-center size-9 rounded-full text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
                      aria-label={`Unseen messages${totalUnreadCount > 0 ? `, ${totalUnreadCount} unread` : ""}`}
                      id="unread-messages-bell-btn"
                    >
                      <Bell size={18} />
                      {totalUnreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-connect-blue text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse-dot">
                          {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                        </span>
                      )}
                    </button>

                    {showUnseen && (
                      <UnseenMessagesPanel onClose={() => setShowUnseen(false)} />
                    )}
                  </div>

                  {/* Connection requests bell */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowRequests((v) => !v);
                        setShowUnseen(false);
                      }}
                      className="relative flex items-center justify-center size-9 rounded-full text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
                      aria-label={`Connection requests${pendingCount > 0 ? `, ${pendingCount} pending` : ""}`}
                      id="requests-bell-btn"
                    >
                      <Users size={18} />
                      {pendingCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse-dot">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </button>

                    {showRequests && (
                      <RequestsPanel onClose={() => setShowRequests(false)} />
                    )}
                  </div>
                </>
              )}

              {/* Settings */}
              <Link
                to="/settings"
                className="flex items-center justify-center size-9 rounded-full text-ink-muted hover:text-ink hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
                aria-label="Settings"
              >
                <Settings size={18} />
              </Link>

              {authUser && (
                <>
                  {/* Profile */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface/80 hover:bg-surface border border-border-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
                    aria-label="Profile"
                  >
                    {authUser.profilePic ? (
                      <img
                        src={authUser.profilePic}
                        alt={authUser.fullName}
                        className="size-7 rounded-full object-cover border border-indigo-500/40"
                      />
                    ) : (
                      <UserCircle size={22} className="text-ink-muted" />
                    )}
                    <span className="hidden md:block text-xs font-bold text-ink">
                      {authUser.fullName}
                    </span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="flex items-center justify-center size-9 rounded-full text-ink-muted hover:bg-surface hover:text-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                    aria-label="Log out"
                    title="Switch Account / Sign Out"
                    id="logout-btn"
                  >
                    <LogOut size={17} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showSearch && <SearchPeopleModal onClose={() => setShowSearch(false)} />}
    </>
  );
};

export default Navbar;
