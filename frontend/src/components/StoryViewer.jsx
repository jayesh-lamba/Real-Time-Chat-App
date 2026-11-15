import { useEffect, useRef, useState, useCallback } from "react";
import { useStoryStore } from "../store/useStoryStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  X,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const STORY_DURATION_MS = 5000; // auto-advance after 5s

/**
 * StoryViewer
 * Full-screen story viewer — Instagram-style with progress bars,
 * tap left/right to navigate, auto-advance, swipe-down to close.
 */
const StoryViewer = () => {
  const {
    activeGroup,
    goNextStory,
    goPrevStory,
    closeStoryViewer,
    markViewed,
    deleteStory,
    fetchViewers,
    viewerList,
    storyGroups,
  } = useStoryStore();
  const { authUser } = useAuthStore();

  const [progress, setProgress] = useState(0);        // 0–100
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const progressRef = useRef(null);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const touchStartY = useRef(null);

  const currentStory = activeGroup?.stories?.[activeGroup?.currentIndex];
  const isOwn = authUser?._id === activeGroup?.user?._id;

  // ── Mark as viewed when a story is displayed ──
  useEffect(() => {
    if (currentStory && !currentStory.isViewed && !isOwn) {
      markViewed(currentStory._id);
    }
  }, [currentStory?._id]);

  // ── Animated progress bar ──
  const runProgress = useCallback(() => {
    if (isPaused) return;
    const tick = (now) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        goNextStory();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isPaused, goNextStory]);

  useEffect(() => {
    setProgress(0);
    startTimeRef.current = null;
    cancelAnimationFrame(rafRef.current);
    runProgress();
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentStory?._id, isPaused, runProgress]);

  // ── Escape key ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeStoryViewer();
      if (e.key === "ArrowRight") { setProgress(0); startTimeRef.current = null; goNextStory(); }
      if (e.key === "ArrowLeft")  { setProgress(0); startTimeRef.current = null; goPrevStory(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ── Swipe down to close ──
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 80) closeStoryViewer();
    touchStartY.current = null;
  };

  // ── Tap zones: left = prev, right = next ──
  const handleTap = (e) => {
    const x = e.clientX;
    const w = window.innerWidth;
    setProgress(0);
    startTimeRef.current = null;
    cancelAnimationFrame(rafRef.current);
    if (x < w * 0.33) {
      goPrevStory();
    } else {
      goNextStory();
    }
  };

  const handleDeleteStory = async () => {
    if (!confirm("Delete this story?")) return;
    await deleteStory(currentStory._id);
    closeStoryViewer();
  };

  const handleShowViewers = () => {
    setIsPaused(true);
    setShowViewers(true);
    fetchViewers(currentStory._id);
  };

  if (!activeGroup || !currentStory) return null;

  const { stories, currentIndex, user } = activeGroup;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`${user.fullName}'s story`}
    >
      {/* ── Progress bars ── */}
      <div className="absolute top-0 inset-x-0 z-10 flex gap-1 px-3 pt-3">
        {stories.map((s, i) => (
          <div key={s._id} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width:
                  i < currentIndex
                    ? "100%"
                    : i === currentIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="absolute top-5 inset-x-0 z-10 flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <img
            src={user.profilePic || "/avatar.png"}
            alt={user.fullName}
            className="size-9 rounded-full object-cover border-2 border-white/60"
          />
          <div>
            <p className="text-white text-sm font-bold leading-tight drop-shadow">{user.fullName}</p>
            <p className="text-white/60 text-[10px] leading-tight">
              {formatMessageTime(currentStory.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause/play */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsPaused((v) => !v); }}
            className="size-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          {/* Owner — delete */}
          {isOwn && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteStory(); }}
              className="size-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Delete story"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); closeStoryViewer(); }}
            className="size-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Media ── */}
      <div
        className="flex-1 flex items-center justify-center relative select-none"
        onClick={handleTap}
      >
        {currentStory.mediaType === "video" ? (
          <video
            key={currentStory._id}
            src={currentStory.mediaUrl}
            autoPlay
            playsInline
            muted={false}
            className="max-h-full max-w-full object-contain"
            onEnded={goNextStory}
          />
        ) : (
          <img
            key={currentStory._id}
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain animate-fade-in"
          />
        )}

        {/* Left/right tap hint zones (invisible, just for visual feedback) */}
        <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-2 pointer-events-none">
          {currentIndex > 0 || storyGroups.findIndex(g => g.user._id === user._id) > 0 ? (
            <ChevronLeft size={28} className="text-white/30" />
          ) : null}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-2 pointer-events-none">
          <ChevronRight size={28} className="text-white/30" />
        </div>
      </div>

      {/* ── Caption + viewers indicator ── */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
        {currentStory.caption && (
          <p className="text-white text-sm text-center mb-3 drop-shadow leading-relaxed">
            {currentStory.caption}
          </p>
        )}

        {isOwn && (
          <button
            onClick={(e) => { e.stopPropagation(); handleShowViewers(); }}
            className="pointer-events-auto mx-auto flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors focus:outline-none"
            aria-label="See who viewed"
          >
            <Eye size={14} />
            <span>Viewed by {currentStory.viewerCount || 0}</span>
          </button>
        )}
      </div>

      {/* ── Viewer list modal (owner only) ── */}
      {showViewers && (
        <div
          className="absolute inset-0 z-20 bg-black/80 flex flex-col animate-fade-in"
          onClick={() => { setShowViewers(false); setIsPaused(false); }}
        >
          <div
            className="mt-auto bg-card rounded-t-2xl max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h3 className="font-bold text-sm text-ink">Viewed by {viewerList?.length || 0}</h3>
              <button
                onClick={() => { setShowViewers(false); setIsPaused(false); }}
                className="text-ink-muted hover:text-ink"
                aria-label="Close viewer list"
              >
                <X size={18} />
              </button>
            </div>
            {viewerList === null ? (
              <div className="flex justify-center py-8">
                <div className="size-5 border-2 border-connect-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : viewerList.length === 0 ? (
              <p className="text-center text-sm text-ink-muted py-8">No views yet</p>
            ) : (
              <div className="divide-y divide-border-subtle">
                {viewerList.map(({ user: viewer, viewedAt }) => (
                  <div key={viewer._id} className="flex items-center gap-3 px-5 py-3">
                    <img
                      src={viewer.profilePic || "/avatar.png"}
                      alt={viewer.fullName}
                      className="size-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{viewer.fullName}</p>
                      <p className="text-xs text-ink-muted">@{viewer.username}</p>
                    </div>
                    <time className="text-[10px] text-ink-muted flex-shrink-0">
                      {formatMessageTime(viewedAt)}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
