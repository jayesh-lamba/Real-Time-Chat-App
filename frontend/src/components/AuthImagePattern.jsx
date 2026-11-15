import { Lock, Zap, Shield } from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden border-l border-border-subtle bg-surface">
      <div className="relative z-10 max-w-md px-10 text-center">
        <div className="bg-card border border-border-subtle rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-connect-blue flex items-center justify-center text-white text-xs font-semibold">
                JL
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Jayesh Lamba</p>
                <p className="text-[11px] text-ink-muted">@jayesh_lamba</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-ink-muted border border-border-subtle font-medium">
              Encrypted
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="bg-surface border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-ink max-w-[85%]">
              Hey Jayesh, is the new messaging build live?
            </div>
            <div className="bg-connect-blue rounded-xl px-3.5 py-2 text-xs text-white ml-auto max-w-[85%]">
              Yes, deployed and ready.
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-ink mb-2 leading-tight">{title}</h2>
        <p className="text-ink-muted text-xs leading-relaxed">{subtitle}</p>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[
            { icon: <Lock size={11} />, label: "End-to-End Encrypted" },
            { icon: <Zap size={11} />, label: "Real-Time Sync" },
            { icon: <Shield size={11} />, label: "Jayesh Lamba" },
          ].map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border-subtle text-ink-muted text-[11px] font-medium"
            >
              {tag.icon}
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;
