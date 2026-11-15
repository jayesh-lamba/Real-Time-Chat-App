import { MessageSquare, UserPlus } from "lucide-react";

const NoChatSelected = ({ onOpenSearch }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card">
      <div className="max-w-sm text-center">
        <div className="size-12 rounded-xl bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={20} className="text-ink-muted" />
        </div>

        <h2 className="text-base font-semibold text-ink mb-1.5">
          Select a conversation
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed mb-5">
          Choose a contact from the sidebar to view your conversation or start a new message.
        </p>

        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="btn-meta text-xs px-4 py-2"
          >
            <UserPlus size={14} />
            Add Contact
          </button>
        )}
      </div>
    </div>
  );
};

export default NoChatSelected;
