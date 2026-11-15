import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Sparkles } from "lucide-react";
import {
  isSoundMuted,
  setSoundMuted,
  isNotificationsMuted,
  setNotificationsMuted,
} from "../lib/sounds";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey Jayesh! How's the new JayeshChat v2.4 release?", isSent: false },
  { id: 2, content: "Running smoothly with E2EE X25519 & WebRTC calling! 🚀", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [callMuted, setCallMuted] = useState(isSoundMuted());
  const [notiMuted, setNotiMuted] = useState(isNotificationsMuted());

  return (
    <div className="min-h-screen bg-surface pt-16">
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">Workspace Settings</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Customize your JayeshChat experience · Engineered by Jayesh Lamba
            </p>
          </div>
          <a
            href="https://github.com/jayesh-lamba"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
          >
            <Sparkles size={13} />
            Built by Jayesh Lamba
          </a>
        </div>

        {/* Theme picker */}
        <div className="card-meta p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-ink">Interface Theme</h2>
            <p className="text-xs text-ink-muted mt-0.5">Pick a color theme for the JayeshChat workspace</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
                  theme === t
                    ? "bg-connect-blue-light ring-2 ring-connect-blue"
                    : "hover:bg-surface"
                }`}
                onClick={() => setTheme(t)}
                aria-label={`Set theme to ${t}`}
                aria-pressed={theme === t}
              >
                <div className="relative h-8 w-full rounded-lg overflow-hidden border border-border-subtle" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded-sm bg-primary" />
                    <div className="rounded-sm bg-secondary" />
                    <div className="rounded-sm bg-accent" />
                    <div className="rounded-sm bg-neutral" />
                  </div>
                </div>
                <span className={`text-[11px] font-semibold truncate w-full text-center ${theme === t ? "text-connect-blue" : "text-ink-muted"}`}>
                  {t === "jayesh" ? "Jayesh Dark" : t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sound & Notifications Settings */}
        <div className="card-meta p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-ink">Sound & Notifications</h2>
            <p className="text-xs text-ink-muted mt-0.5">Manage sound alerts and WebRTC ringtones</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Call Ringtones</p>
                <p className="text-xs text-ink-muted">Play ringtones for WebRTC voice & video calls</p>
              </div>
              <input
                type="checkbox"
                checked={!callMuted}
                onChange={(e) => {
                  const muted = !e.target.checked;
                  setCallMuted(muted);
                  setSoundMuted(muted);
                }}
                className="toggle toggle-primary toggle-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Message Notification Sounds</p>
                <p className="text-xs text-ink-muted">Play a notification chime for incoming messages</p>
              </div>
              <input
                type="checkbox"
                checked={!notiMuted}
                onChange={(e) => {
                  const muted = !e.target.checked;
                  setNotiMuted(muted);
                  setNotificationsMuted(muted);
                }}
                className="toggle toggle-primary toggle-sm"
              />
            </div>
          </div>
        </div>

        {/* Chat preview */}
        <div className="card-meta overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle">
            <h2 className="text-sm font-bold text-ink">Live Theme Preview</h2>
            <p className="text-xs text-ink-muted mt-0.5">See how your theme looks in JayeshChat</p>
          </div>

          <div className="p-4 bg-surface">
            <div className="max-w-sm mx-auto bg-card rounded-2xl shadow-sm overflow-hidden border border-border-subtle">
              <div data-theme={theme} className="px-4 py-3 border-b border-border-subtle bg-base-100 flex items-center gap-3">
                <div className="size-8 rounded-full bg-connect-blue flex items-center justify-center text-white text-xs font-bold">JL</div>
                <div>
                  <p className="text-sm font-semibold">Jayesh Lamba</p>
                  <p className="text-xs text-ink-muted">@jayesh_lamba · Online</p>
                </div>
              </div>

              <div data-theme={theme} className="p-4 space-y-3 bg-surface min-h-[140px]">
                {PREVIEW_MESSAGES.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3.5 py-2 text-xs ${msg.isSent ? "bubble-sent" : "bubble-received"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-border-subtle bg-card">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface rounded-full border border-border-subtle px-4 py-2 text-xs text-ink-muted">
                    Message Jayesh Lamba…
                  </div>
                  <div className="size-8 rounded-full bg-connect-blue flex items-center justify-center">
                    <Send size={13} className="text-white translate-x-px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
