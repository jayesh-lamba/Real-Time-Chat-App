import { useEffect, useRef, useState } from "react";
import { useConnectionStore } from "../store/useConnectionStore";
import { X, Inbox, Send, Check, XCircle, Clock } from "lucide-react";

const RequestsPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("received");
  const panelRef = useRef(null);

  const {
    pendingRequests,
    sentRequests,
    fetchPending,
    fetchSent,
    acceptRequest,
    rejectRequest,
  } = useConnectionStore();

  useEffect(() => {
    fetchPending();
    fetchSent();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    // Slight delay to avoid triggering on the button that opened this panel
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handleClick); };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-4 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-2xl border border-border-subtle animate-slide-in overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Connection requests"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
        <h2 className="text-sm font-bold text-ink">Connection Requests</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-surface transition-colors text-ink-muted"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "received"
              ? "text-connect-blue border-b-2 border-connect-blue"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Inbox size={13} />
          Received
          {pendingRequests.length > 0 && (
            <span className="ml-1 rounded-full bg-connect-blue text-white text-[10px] font-bold px-1.5 py-0.5">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "sent"
              ? "text-connect-blue border-b-2 border-connect-blue"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Send size={13} />
          Sent
          {sentRequests.length > 0 && (
            <span className="ml-1 rounded-full bg-surface text-ink-muted text-[10px] font-bold px-1.5 py-0.5">
              {sentRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {activeTab === "received" && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-ink-muted text-sm">
                <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                No pending requests
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors">
                  <img
                    src={req.requesterId?.profilePic || "/avatar.png"}
                    alt={req.requesterId?.fullName}
                    className="size-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{req.requesterId?.fullName}</p>
                    <p className="text-xs text-ink-muted truncate">@{req.requesterId?.username}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => acceptRequest(req._id, req.requesterId?._id)}
                      className="btn-meta text-xs px-2.5 py-1.5"
                      aria-label="Accept request"
                    >
                      <Check size={13} />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req._id)}
                      className="btn-meta-ghost text-xs px-2.5 py-1.5"
                      aria-label="Reject request"
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "sent" && (
          <>
            {sentRequests.length === 0 ? (
              <div className="text-center py-10 text-ink-muted text-sm">
                <Send size={28} className="mx-auto mb-2 opacity-30" />
                No pending sent requests
              </div>
            ) : (
              sentRequests.map((req) => (
                <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors">
                  <img
                    src={req.recipientId?.profilePic || "/avatar.png"}
                    alt={req.recipientId?.fullName}
                    className="size-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{req.recipientId?.fullName}</p>
                    <p className="text-xs text-ink-muted truncate">@{req.recipientId?.username}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-ink-muted font-medium flex-shrink-0">
                    <Clock size={12} />
                    Pending
                  </span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RequestsPanel;
