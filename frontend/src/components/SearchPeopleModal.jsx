import { useEffect, useRef, useState, useCallback } from "react";
import { useConnectionStore } from "../store/useConnectionStore";
import { useChatStore } from "../store/useChatStore";
import {
  X,
  Search,
  Loader2,
  UserPlus,
  Check,
  MessageCircle,
  Users,
} from "lucide-react";

const SearchPeopleModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1); // keyboard nav index

  const {
    searchResults,
    isSearching,
    searchUsers,
    sendRequest,
    clearSearch,
    suggestions,
    isFetchingSuggestions,
    fetchSuggestions,
    acceptRequest,
    rejectRequest,
  } = useConnectionStore();
  const { setSelectedUser, users } = useChatStore();

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const debounceRef = useRef(null);

  // ── Focus input and fetch suggestions on mount ──
  useEffect(() => {
    inputRef.current?.focus();
    fetchSuggestions();
    return () => clearSearch();
  }, []);

  // ── Debounced network search (300ms) ──
  useEffect(() => {
    setActiveIndex(-1); // reset keyboard position on new query
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Scroll active item into view ──
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e) => {
      const len = searchResults.length;
      if (len === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % len);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + len) % len);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < len) {
          handleAction(searchResults[activeIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [searchResults, activeIndex, onClose]
  );

  // ── Action: open chat, send request, or accept request ──
  const handleAction = useCallback(
    (user) => {
      if (user.relationshipStatus === "connected") {
        const chatUser = users.find((u) => u._id === user._id) || user;
        setSelectedUser(chatUser);
        onClose();
      } else if (user.relationshipStatus === "none") {
        sendRequest(user.username);
      } else if (user.relationshipStatus === "pending_received") {
        acceptRequest(user.connectionId, user._id);
      }
    },
    [users, setSelectedUser, onClose, sendRequest, acceptRequest]
  );

  // ── Render action button by relationship ──
  const getActionButton = (user, idx) => {
    const isActive = idx === activeIndex;
    const ring = isActive ? "ring-2 ring-connect-blue/60" : "";

    switch (user.relationshipStatus) {
      case "none":
        return (
          <button
            onClick={() => sendRequest(user.username)}
            className={`btn-meta text-xs px-3 py-1.5 ${ring}`}
            aria-label={`Add ${user.fullName}`}
          >
            <UserPlus size={13} />
            Add
          </button>
        );
      case "pending_sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-connect-blue-light px-3 py-1.5 text-xs font-semibold text-connect-blue">
            Pending
          </span>
        );
      case "pending_received":
        return (
          <div className="flex gap-1.5">
            <button
              onClick={() => acceptRequest(user.connectionId, user._id)}
              className={`btn-meta text-xs px-2.5 py-1.5 bg-online-green hover:bg-online-green/90 focus:ring-online-green/40 ${ring}`}
              aria-label={`Accept ${user.fullName}`}
            >
              <Check size={12} />
              Accept
            </button>
            <button
              onClick={() => rejectRequest(user.connectionId)}
              className={`btn-meta-ghost text-xs px-2.5 py-1.5 border border-border-subtle ${ring}`}
              aria-label={`Decline ${user.fullName}`}
            >
              Decline
            </button>
          </div>
        );
      case "connected":
        return (
          <button
            onClick={() => handleAction(user)}
            className={`btn-meta-ghost text-xs px-3 py-1.5 ${ring}`}
            aria-label={`Message ${user.fullName}`}
          >
            <MessageCircle size={13} />
            Message
          </button>
        );
      default:
        return null;
    }
  };

  const showPrompt = query.length < 2 && searchResults.length === 0;
  const showEmpty = !isSearching && query.length >= 2 && searchResults.length === 0;
  const showResults = searchResults.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-4 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label="Find people"
      aria-live="polite"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl animate-slide-in overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-bold text-ink">Find People</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface transition-colors text-ink-muted focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Search input (spinner lives inside the pill) ── */}
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="relative">
            {/* Left icon: spinner while loading, search icon otherwise */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {isSearching ? (
                <Loader2 size={15} className="animate-spin text-connect-blue" />
              ) : (
                <Search size={15} className="text-ink-muted" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by username…"
              className="input-pill pl-9 py-2 pr-9"
              aria-label="Search by username"
              aria-autocomplete="list"
              aria-controls="search-results-list"
              aria-activedescendant={activeIndex >= 0 ? `result-${activeIndex}` : undefined}
              role="combobox"
              aria-expanded={showResults}
              autoComplete="off"
            />

            {/* Clear button — appears when there's a query */}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none"
                aria-label="Clear search"
                tabIndex={-1}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Keyboard hint — only when results are showing */}
          {showResults && (
            <p className="mt-1.5 text-[10px] text-ink-muted flex items-center gap-1.5 pl-1">
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border-subtle text-[9px] font-mono">↑↓</kbd>
              navigate
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border-subtle text-[9px] font-mono">↵</kbd>
              select
              <kbd className="px-1 py-0.5 rounded bg-surface border border-border-subtle text-[9px] font-mono">Esc</kbd>
              close
            </p>
          )}
        </div>

        {/* ── Results list ── */}
        <div
          id="search-results-list"
          ref={listRef}
          className="max-h-[380px] overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {/* Suggested People / Prompt State */}
          {showPrompt && (
            <div className="animate-fade-in pb-2">
              {isFetchingSuggestions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-connect-blue" size={24} />
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  <div className="px-4 py-2 border-b border-border-subtle bg-surface/50">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Suggested People</p>
                  </div>
                  {suggestions.map((user) => {
                    const status = user.relationshipStatus || "none";
                    return (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors cursor-pointer"
                        onClick={() => {
                          if (status === "connected") {
                            const chatUser = users.find((u) => u._id === user._id) || user;
                            setSelectedUser(chatUser);
                            onClose();
                          }
                        }}
                      >
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="size-11 rounded-full object-cover border border-border-subtle"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{user.fullName}</p>
                          <p className="text-xs text-ink-muted truncate">@{user.username}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          {status === "none" && (
                            <button
                              onClick={() => sendRequest(user.username)}
                              className="btn-meta text-xs px-3 py-1.5"
                              aria-label={`Add ${user.fullName}`}
                            >
                              <UserPlus size={13} />
                              Add
                            </button>
                          )}
                          {status === "pending_sent" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-connect-blue-light px-3 py-1.5 text-xs font-semibold text-connect-blue">
                              Pending
                            </span>
                          )}
                          {status === "connected" && (
                            <button
                              onClick={() => {
                                const chatUser = users.find((u) => u._id === user._id) || user;
                                setSelectedUser(chatUser);
                                onClose();
                              }}
                              className="btn-meta-ghost text-xs px-3 py-1.5"
                              aria-label={`Message ${user.fullName}`}
                            >
                              <MessageCircle size={13} />
                              Message
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-ink-muted">
                  <div className="size-10 rounded-full bg-surface flex items-center justify-center">
                    <Users size={18} className="text-ink-muted" />
                  </div>
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="text-center py-10 px-4 text-ink-muted text-sm">
              <p className="mb-1">No users found for</p>
              <p className="font-semibold text-ink">@{query}</p>
            </div>
          )}

          {/* Results */}
          {showResults && searchResults.map((user, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={user._id}
                id={`result-${idx}`}
                ref={(el) => (itemRefs.current[idx] = el)}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleAction(user)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isActive ? "bg-connect-blue-light" : "hover:bg-surface"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-11 rounded-full object-cover border border-border-subtle"
                  />
                  {/* "Already connected" pill badge */}
                  {user.relationshipStatus === "connected" && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-online-green border-2 border-card"
                      aria-label="Connected"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? "text-connect-blue" : "text-ink"}`}>
                    {/* Highlight the matched portion */}
                    <HighlightMatch text={user.fullName} query={query} />
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    @<HighlightMatch text={user.username || ""} query={query} />
                    {user.isLocalMatch && (
                      <span className="ml-1.5 text-online-green font-medium">· connected</span>
                    )}
                  </p>
                </div>

                {/* Action — stop propagation so row click doesn't double-fire */}
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getActionButton(user, idx)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Utility: highlight query text within a string ──
const HighlightMatch = ({ text, query }) => {
  if (!query || query.length < 2) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-connect-blue/15 text-connect-blue rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
};

export default SearchPeopleModal;
