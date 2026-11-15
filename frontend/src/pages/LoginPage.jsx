import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, Sparkles } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "jayeshanand160@gmail.com",
    password: "••••••••",
  });
  const { login, loginAsDemo, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen pt-14 grid lg:grid-cols-2 bg-surface">
      {/* Left: Form panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-card">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">
              Welcome to Jayesh<span className="text-connect-blue">Chat</span>
            </h1>
            <p className="text-ink-muted text-xs mt-1">
              Real-Time E2EE Messenger · Built by{" "}
              <span className="text-indigo-300 font-semibold">Jayesh Lamba</span>
            </p>
          </div>

          {/* Instant 1-Click Live Workspace Entry */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} />
                Instant Live Demo
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">● Ready</span>
            </div>
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Launch Workspace as Jayesh Lamba →
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[11px] text-ink-muted uppercase font-semibold">or sign in with email</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-ink mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  className="w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition-all focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20"
                  placeholder="jayeshanand160@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-10 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition-all focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn-meta w-full py-2.5 text-sm mt-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in to JayeshChat"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-connect-blue hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Studio showcase pattern */}
      <AuthImagePattern
        title="Real-Time Messaging, Engineered by Jayesh Lamba"
        subtitle="Experience low-latency WebSockets, X25519 end-to-end encryption, WebRTC voice/video calls, and ephemeral stories."
      />
    </div>
  );
};

export default LoginPage;
