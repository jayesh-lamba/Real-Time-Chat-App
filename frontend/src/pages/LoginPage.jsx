import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

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
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-card">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="size-10 rounded-xl bg-connect-blue flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink">Sign in to JayeshChat</h1>
            <p className="text-ink-muted text-xs mt-1">Built by Jayesh Lamba</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-ink mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  className="w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition-colors focus:border-connect-blue"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-10 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition-colors focus:border-connect-blue"
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
                "Sign in"
              )}
            </button>

            <button
              type="button"
              onClick={loginAsDemo}
              className="btn-meta-ghost w-full py-2 text-xs"
            >
              Continue as Jayesh Lamba
            </button>
          </form>

          <p className="text-center text-xs text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-connect-blue hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>

      <AuthImagePattern
        title="Private, Real-Time Messaging"
        subtitle="End-to-end encrypted conversations built with React, Node.js, and Socket.IO by Jayesh Lamba."
      />
    </div>
  );
};

export default LoginPage;
