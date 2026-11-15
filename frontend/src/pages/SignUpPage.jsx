import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, AtSign, Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });
  const [usernameState, setUsernameState] = useState("idle");
  const debounceRef = useRef(null);
  const { signup, loginAsDemo, isSigningUp, isDemoMode } = useAuthStore();

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameState(username.length > 0 ? "invalid" : "idle");
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(username)) {
      setUsernameState("invalid");
      return;
    }
    if (isDemoMode) {
      setUsernameState("available");
      return;
    }
    setUsernameState("checking");
    try {
      const res = await axiosInstance.get(`/auth/check-username/${username}`);
      setUsernameState(res.data.available ? "available" : "taken");
    } catch {
      setUsernameState("available");
    }
  }, [isDemoMode]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(formData.username), 350);
    return () => clearTimeout(debounceRef.current);
  }, [formData.username, checkUsername]);

  const validateForm = () => {
    if (!formData.fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!formData.username.trim()) { toast.error("Username is required"); return false; }
    if (usernameState === "taken") { toast.error("Username already taken"); return false; }
    if (usernameState === "invalid") { toast.error("Invalid username format"); return false; }
    if (!formData.email.trim()) { toast.error("Email is required"); return false; }
    if (!/\S+@\S+\.\S+/.test(formData.email)) { toast.error("Invalid email format"); return false; }
    if (!formData.password) { toast.error("Password is required"); return false; }
    if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) signup(formData);
  };

  const getUsernameHint = () => {
    if (usernameState === "checking") return { icon: <Loader2 size={14} className="animate-spin text-ink-muted" />, text: "Checking…", color: "text-ink-muted" };
    if (usernameState === "available") return { icon: <Check size={14} className="text-online-green" />, text: "Username available", color: "text-online-green" };
    if (usernameState === "taken") return { icon: <X size={14} className="text-red-500" />, text: "Already taken", color: "text-red-500" };
    if (usernameState === "invalid") return { icon: <X size={14} className="text-red-500" />, text: "Letters, numbers, _ and . only (min 3)", color: "text-red-500" };
    return null;
  };

  const hint = getUsernameHint();
  const inputBase = "w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-muted outline-none transition-all focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20";

  return (
    <div className="min-h-screen pt-14 grid lg:grid-cols-2 bg-surface">
      {/* Left: Form panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-card">
        <div className="w-full max-w-sm space-y-5">
          {/* Logo */}
          <div className="text-center">
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">
              Join Jayesh<span className="text-connect-blue">Chat</span>
            </h1>
            <p className="text-ink-muted text-xs mt-1">
              Engineered by <span className="text-indigo-300 font-semibold">Jayesh Lamba</span>
            </p>
          </div>

          <button
            type="button"
            onClick={loginAsDemo}
            className="w-full py-2 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} />
            Instant Demo: Continue as Jayesh Lamba →
          </button>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="signup-fullname" className="block text-xs font-semibold text-ink mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="signup-fullname"
                  type="text"
                  className={inputBase}
                  placeholder="Jayesh Lamba"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-username" className="block text-xs font-semibold text-ink mb-1">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="signup-username"
                  type="text"
                  className={`${inputBase} ${usernameState === "taken" || usernameState === "invalid" ? "border-red-400" : usernameState === "available" ? "border-online-green" : ""}`}
                  placeholder="jayesh_lamba"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  autoComplete="username"
                  maxLength={20}
                  aria-describedby="username-hint"
                />
              </div>
              {hint && (
                <div id="username-hint" className={`flex items-center gap-1 mt-1 text-xs ${hint.color}`} role="status" aria-live="polite">
                  {hint.icon}
                  {hint.text}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-ink mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  className={inputBase}
                  placeholder="jayeshanand160@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className={`${inputBase} pr-10`}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
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
              id="signup-submit-btn"
              className="btn-meta w-full py-2.5 text-sm mt-2"
              disabled={isSigningUp || usernameState === "checking" || usernameState === "taken" || usernameState === "invalid"}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create JayeshChat Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-connect-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Studio showcase pattern */}
      <AuthImagePattern
        title="Privacy by Design — JayeshChat v2.4"
        subtitle="Built by Jayesh Lamba with X25519 asymmetric key exchange, mutual connection graph, and instant WebSocket delivery."
      />
    </div>
  );
};

export default SignUpPage;
