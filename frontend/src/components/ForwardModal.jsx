import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ForwardModal = ({ onClose, messagesToForward }) => {
  const { users, forwardMessage } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [forwardingUserId, setForwardingUserId] = useState(null);

  // Filter users based on search query
  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForwardToUser = async (targetUser) => {
    if (!messagesToForward || messagesToForward.length === 0) return;
    setForwardingUserId(targetUser._id);
    
    try {
      // Forward each message sequentially
      for (const msg of messagesToForward) {
        // Construct the payload to forward
        const payload = {
          messageType: msg.messageType || "text",
          text: msg.text || "",
        };

        if (msg.image) payload.image = msg.image;
        if (msg.video) payload.video = msg.video;
        if (msg.stickerId) payload.stickerId = msg.stickerId;

        await forwardMessage(targetUser._id, payload);
      }
      
      toast.success(`Forwarded to ${targetUser.fullName}`);
      onClose();
    } catch (error) {
      toast.error(`Failed to forward to ${targetUser.fullName}`);
    } finally {
      setForwardingUserId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-card w-full max-w-md rounded-3xl border border-border-subtle shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink text-base">Forward Message</h3>
            <p className="text-[11px] text-ink-muted">
              Select a friend to forward {messagesToForward?.length || 0} message{messagesToForward?.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border-subtle bg-surface/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border-subtle rounded-full py-2 pl-10 pr-4 text-sm text-ink placeholder-ink-muted outline-none focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20 transition-all"
            />
          </div>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-ink-muted text-sm">
              No matching friends found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSending = forwardingUserId === user._id;
              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-surface transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-ink truncate leading-tight">
                        {user.fullName}
                      </h4>
                      <p className="text-[11px] text-ink-muted truncate">
                        @{user.username || "user"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleForwardToUser(user)}
                    disabled={forwardingUserId !== null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-connect-blue/30 ${
                      isSending
                        ? "bg-surface text-ink-muted cursor-not-allowed"
                        : "bg-connect-blue hover:bg-connect-blue-dark text-white active:scale-95"
                    }`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="animate-spin" size={12} />
                        Sending
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        Send
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
