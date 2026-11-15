import { X, Mail, AtSign, Calendar, Shield, User, FileText } from "lucide-react";

const PartnerProfileModal = ({ user, isOnline, onClose }) => {
  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-card w-full max-w-md rounded-3xl border border-border-subtle shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header strip */}
        <div className="h-24 bg-gradient-to-r from-connect-blue to-connect-blue-dark relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-all focus:outline-none"
            aria-label="Close profile"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Header Block */}
        <div className="px-6 pb-5 -mt-12 flex items-end gap-4 border-b border-border-subtle">
          <div className="relative flex-shrink-0">
            <img
              src={user.profilePic || "/avatar.png"}
              alt={user.fullName}
              className="size-24 rounded-full object-cover border-4 border-card shadow-md"
            />
            {isOnline && (
              <span className="absolute bottom-1 right-1 size-4 rounded-full bg-online-green border-2 border-card" />
            )}
          </div>

          <div className="min-w-0 pb-1">
            <h3 className="text-lg font-bold text-ink truncate leading-tight">
              {user.fullName}
            </h3>
            <p className="text-sm font-semibold text-connect-blue mt-0.5">
              @{user.username || "user"}
            </p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1.5 rounded-full ${
              isOnline ? "bg-green-500/10 text-online-green" : "bg-zinc-500/10 text-ink-muted"
            }`}>
              {isOnline ? "Active Now" : "Offline"}
            </span>
          </div>
        </div>

        {/* Info Rows Area */}
        <div className="p-6 space-y-4">
          <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Basic Details</h4>
          
          <div className="space-y-3.5">
            {/* Bio info */}
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={16} className="text-ink-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">Bio Description</p>
                <p className="text-sm font-medium text-ink break-words mt-0.5">
                  "{user.bio || "Hey there! I am using JayeshChat by Jayesh Lamba."}"
                </p>
              </div>
            </div>

            {/* Email info */}
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-ink-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">Email Address</p>
                <p className="text-sm font-semibold text-ink truncate mt-0.5">
                  {user.email || "No email available"}
                </p>
              </div>
            </div>

            {/* Member since info */}
            {user.createdAt && (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-ink-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">Member Since</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">
                    {user.createdAt.split("T")[0]}
                  </p>
                </div>
              </div>
            )}

            {/* Account Status info */}
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-online-green" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">Account Status</p>
                <p className="text-sm font-semibold text-online-green mt-0.5">Verified Connection</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfileModal;
