import { MessageCircle, Users, Sparkles, ShieldCheck } from "lucide-react";

const NoChatSelected = ({ onOpenSearch }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="max-w-md text-center animate-fade-in">
        {/* Illustration: three stacked message bubbles */}
        <div className="flex justify-center items-end gap-2 mb-8 h-20">
          <div className="bubble-received px-4 py-2.5 text-xs font-medium shadow-sm self-end mb-2">
            Hey Jayesh! 👋
          </div>
          <div className="bubble-sent px-4 py-2.5 text-xs font-medium shadow-sm self-start">
            Welcome to JayeshChat 🚀
          </div>
          <div className="bubble-received px-4 py-2.5 text-xs font-medium shadow-sm self-end mb-2">
            E2EE is live! 🔒
          </div>
        </div>

        {/* Icon */}
        <div className="size-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/10">
          <MessageCircle size={28} className="text-connect-blue" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-3">
          <ShieldCheck size={13} />
          Engineered by Jayesh Lamba
        </div>

        <h2 className="text-2xl font-extrabold text-ink mb-2">
          Jayesh<span className="text-connect-blue">Chat</span> Messenger
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          Real-time end-to-end encrypted messaging, WebRTC voice & video calling, and 24-hour ephemeral stories built by{" "}
          <span className="text-ink font-semibold">Jayesh Lamba</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="btn-meta text-sm px-5 py-2.5"
            >
              <Users size={15} />
              Find People
            </button>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted px-4 py-2.5 rounded-full bg-card border border-border-subtle">
            <Sparkles size={13} className="text-connect-blue" />
            Select a conversation from the sidebar
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
