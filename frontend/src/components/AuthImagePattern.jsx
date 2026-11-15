import { ShieldCheck, Sparkles, Zap, Lock } from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div
      className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden border-l border-border-subtle"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.22), transparent 55%), linear-gradient(145deg, #0B0F19 0%, #111827 50%, #1E1B4B 100%)",
      }}
    >
      {/* Background decoration glows */}
      <div className="absolute top-[-80px] right-[-80px] size-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] size-64 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Centered content */}
      <div className="relative z-10 max-w-md px-10 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6">
          <Sparkles size={13} />
          Architected & Engineered by Jayesh Lamba
        </div>

        {/* Interactive Mock Chat Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border-subtle rounded-2xl p-5 mb-8 text-left shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-extrabold">
                JL
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Jayesh Lamba</p>
                <p className="text-[10px] text-online-green font-semibold">● Online · Creator</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              X25519 E2EE
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="bg-surface border border-border-subtle rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs text-ink max-w-[85%]">
              Hey Jayesh! How fast is the WebSocket + WebRTC sync on JayeshChat?
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl rounded-br-sm px-3.5 py-2 text-xs text-white ml-auto max-w-[85%] shadow-md">
              Sub-20ms real-time delivery with client-side X25519 encryption! 🚀
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-3 leading-tight">{title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed">{subtitle}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[
            { icon: <Lock size={11} />, label: "X25519 E2EE" },
            { icon: <Zap size={11} />, label: "Socket.IO + WebRTC" },
            { icon: <ShieldCheck size={11} />, label: "Built by Jayesh Lamba" },
          ].map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/90 text-xs font-semibold"
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
