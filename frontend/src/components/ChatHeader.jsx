import { useState } from "react";
import { X, ChevronLeft, Phone, Video, Palette, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import AvatarLightbox from "./AvatarLightbox";
import PartnerProfileModal from "./PartnerProfileModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, chatThemes, setChatTheme, isPartnerTyping } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall } = useCallStore();
  const isOnline = onlineUsers.includes(selectedUser._id);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const currentTheme = chatThemes[selectedUser._id] || "default";

  const themeOptions = [
    { id: "default", label: "Obsidian Studio", color: "bg-slate-800 border border-indigo-500/40" },
    { id: "midnight", label: "Midnight Starlight", color: "bg-indigo-950" },
    { id: "ocean", label: "Cyber Ocean", color: "bg-cyan-500" },
    { id: "love", label: "Crimson Pulse", color: "bg-rose-500" },
    { id: "happy", label: "Amber Gold", color: "bg-amber-400" },
  ];

  return (
    <>
      <div className="px-4 py-3 border-b border-border-subtle bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3">
        {/* Left: back button + avatar + info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSelectedUser(null)}
            className="sm:hidden flex-shrink-0 p-1.5 -ml-1 rounded-full hover:bg-surface text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
            aria-label="Back to contacts"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => setShowLightbox(true)}
            className="relative flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-connect-blue/50 group"
            aria-label={`View ${selectedUser.fullName}'s profile photo`}
          >
            <img
              src={selectedUser.profilePic || "./avatar.png"}
              alt={selectedUser.fullName}
              className="size-10 rounded-full object-cover border border-border-subtle transition-opacity group-hover:opacity-85"
            />
            {isOnline && (
              <span className="online-dot" aria-label="Online" />
            )}
          </button>

          <button
            onClick={() => setShowPartnerProfile(true)}
            className="min-w-0 text-left hover:opacity-90 transition-opacity focus:outline-none"
            aria-label="View profile details"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink truncate leading-tight">
                {selectedUser.fullName}
              </h3>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Lock size={9} />
                E2EE
              </span>
            </div>
            <p className="text-xs text-ink-muted truncate mt-0.5">
              {isPartnerTyping ? (
                <span className="text-indigo-400 font-semibold animate-pulse">
                  typing a message...
                </span>
              ) : (
                <>
                  <span className={isOnline ? "text-online-green font-semibold" : ""}>
                    {isOnline ? "● Online" : "Offline"}
                  </span>
                  {selectedUser.username && ` · @${selectedUser.username}`}
                </>
              )}
            </p>
          </button>
        </div>

        {/* Right actions: call buttons + theme + close */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => initiateCall(selectedUser, "voice")}
            className="p-2 rounded-full hover:bg-surface text-ink-muted hover:text-connect-blue transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
            aria-label="Start voice call"
            title="Start Voice Call"
          >
            <Phone size={17} />
          </button>
          <button
            onClick={() => initiateCall(selectedUser, "video")}
            className="p-2 rounded-full hover:bg-surface text-ink-muted hover:text-connect-blue transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
            aria-label="Start video call"
            title="Start Video Call"
          >
            <Video size={17} />
          </button>

          {/* Theme Palette Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`p-2 rounded-full hover:bg-surface text-ink-muted hover:text-connect-blue transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
                showThemeMenu ? "text-connect-blue bg-connect-blue-light" : ""
              }`}
              aria-label="Change chat background theme"
              title="Customize Chat Wallpaper"
            >
              <Palette size={17} />
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border-subtle rounded-2xl shadow-xl py-2 w-48 animate-scale-in">
                  <p className="px-4 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                    Chat Wallpaper
                  </p>
                  <div className="h-px bg-border-subtle my-1" />
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setChatTheme(selectedUser._id, opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-4 py-2 hover:bg-surface text-xs text-ink flex items-center justify-between transition-colors ${
                        currentTheme === opt.id ? "font-semibold bg-surface/50 text-connect-blue" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-3 rounded-full ${opt.color}`} />
                        {opt.label}
                      </span>
                      {currentTheme === opt.id && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setSelectedUser(null)}
            className="hidden sm:flex flex-shrink-0 items-center justify-center size-8 rounded-full hover:bg-surface text-ink-muted transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showLightbox && (
        <AvatarLightbox
          src={selectedUser.profilePic || "./avatar.png"}
          name={selectedUser.fullName}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {showPartnerProfile && (
        <PartnerProfileModal
          user={selectedUser}
          isOnline={isOnline}
          onClose={() => setShowPartnerProfile(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
