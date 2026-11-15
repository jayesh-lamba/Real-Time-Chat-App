import { useState } from "react";
import { X, ChevronLeft, Phone, Video, Palette } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import AvatarLightbox from "./AvatarLightbox";
import PartnerProfileModal from "./PartnerProfileModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, chatThemes, setChatTheme } = useChatStore();
  const { initiateCall } = useCallStore();
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const currentTheme = chatThemes[selectedUser._id] || "default";

  const themeOptions = [
    { id: "default", label: "Default Dark", color: "bg-zinc-800 border border-zinc-600" },
    { id: "midnight", label: "Midnight Slate", color: "bg-slate-900" },
    { id: "ocean", label: "Deep Ocean", color: "bg-cyan-700" },
    { id: "love", label: "Crimson", color: "bg-rose-700" },
    { id: "happy", label: "Warm Amber", color: "bg-amber-600" },
  ];

  return (
    <>
      <div className="h-14 px-5 border-b border-border-subtle bg-card flex items-center justify-between gap-3 flex-shrink-0">
        {/* Left: back button + avatar + name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSelectedUser(null)}
            className="sm:hidden flex-shrink-0 p-1.5 -ml-1 rounded-lg hover:bg-surface text-ink-muted transition-colors focus:outline-none"
            aria-label="Back to contacts"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => setShowLightbox(true)}
            className="relative flex-shrink-0 rounded-full focus:outline-none group"
            aria-label={`View ${selectedUser.fullName}'s profile photo`}
          >
            <img
              src={selectedUser.profilePic || "./avatar.png"}
              alt={selectedUser.fullName}
              className="size-9 rounded-full object-cover border border-border-subtle transition-opacity group-hover:opacity-85"
            />
          </button>

          <button
            onClick={() => setShowPartnerProfile(true)}
            className="min-w-0 text-left hover:opacity-90 transition-opacity focus:outline-none"
            aria-label="View profile details"
          >
            <h3 className="text-sm font-semibold text-ink truncate leading-tight">
              {selectedUser.fullName}
            </h3>
            {selectedUser.username && (
              <p className="text-xs text-ink-muted truncate mt-0.5">
                @{selectedUser.username}
              </p>
            )}
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => initiateCall(selectedUser, "voice")}
            className="p-2 rounded-lg hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none"
            aria-label="Voice call"
            title="Voice call"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => initiateCall(selectedUser, "video")}
            className="p-2 rounded-lg hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none"
            aria-label="Video call"
            title="Video call"
          >
            <Video size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`p-2 rounded-lg hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none ${
                showThemeMenu ? "text-ink bg-surface" : ""
              }`}
              aria-label="Change chat background"
              title="Appearance"
            >
              <Palette size={16} />
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border-subtle rounded-xl shadow-xl py-1.5 w-44 animate-scale-in">
                  <p className="px-3.5 py-1 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                    Background
                  </p>
                  <div className="h-px bg-border-subtle my-1" />
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setChatTheme(selectedUser._id, opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-3.5 py-1.5 hover:bg-surface text-xs text-ink flex items-center justify-between transition-colors ${
                        currentTheme === opt.id ? "font-medium bg-surface/60 text-connect-blue" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${opt.color}`} />
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
            className="hidden sm:flex flex-shrink-0 items-center justify-center size-8 rounded-lg hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none"
            aria-label="Close chat"
          >
            <X size={16} />
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
          onClose={() => setShowPartnerProfile(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
