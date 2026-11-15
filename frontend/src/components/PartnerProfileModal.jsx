import { X, Mail, Calendar, Shield, FileText } from "lucide-react";

const PartnerProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-20 bg-surface border-b border-border-subtle relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-card hover:bg-border-subtle text-ink-muted hover:text-ink transition-colors focus:outline-none"
            aria-label="Close profile"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-5 -mt-10 flex items-end gap-4 border-b border-border-subtle">
          <div className="relative flex-shrink-0">
            <img
              src={user.profilePic || "./avatar.png"}
              alt={user.fullName}
              className="size-20 rounded-full object-cover border-4 border-card"
            />
          </div>

          <div className="min-w-0 pb-1">
            <h3 className="text-base font-semibold text-ink truncate leading-tight">
              {user.fullName}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              @{user.username || "user"}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Contact Info
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={14} className="text-ink-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-ink-muted">Bio</p>
                <p className="text-xs text-ink break-words mt-0.5">
                  {user.bio || "JayeshChat user"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-ink-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-ink-muted">Email</p>
                <p className="text-xs text-ink truncate mt-0.5">
                  {user.email || "Not shared"}
                </p>
              </div>
            </div>

            {user.createdAt && (
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-ink-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-ink-muted">Joined</p>
                  <p className="text-xs text-ink mt-0.5">
                    {user.createdAt.split("T")[0]}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-connect-blue" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-ink-muted">Encryption</p>
                <p className="text-xs text-ink mt-0.5">End-to-End Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfileModal;
