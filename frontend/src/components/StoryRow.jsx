import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useStoryStore } from "../store/useStoryStore";
import { Plus, Loader2 } from "lucide-react";

/**
 * StoryRow
 * Horizontal scrollable row of story avatars.
 * - Own avatar always first with a "+" badge if no story yet.
 * - Colored ring = has unviewed stories; grey ring = all viewed.
 * Props: onAddStory {Function} – opens the add-story sheet
 */
const StoryRow = ({ onAddStory }) => {
  const { authUser } = useAuthStore();
  const { storyGroups, isLoading, fetchFeed, openStoryViewer } = useStoryStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchFeed();
    }
  }, [fetchFeed]);

  if (isLoading && storyGroups.length === 0) {
    return (
      <div className="flex items-center justify-center py-3 border-b border-border-subtle">
        <Loader2 size={16} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  // Find own group (if any)
  const ownGroup = storyGroups.find((g) => g.isOwn);
  // All others
  const otherGroups = storyGroups.filter((g) => !g.isOwn);

  return (
    <div
      className="border-b border-border-subtle overflow-x-auto py-3 px-3 flex items-center gap-3 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent flex-shrink-0"
      role="list"
      aria-label="Stories"
    >
      {/* ── Own story bubble ── */}
      <div
        className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
        role="listitem"
        onClick={() => {
          if (ownGroup) {
            openStoryViewer(ownGroup, 0);
          } else {
            onAddStory();
          }
        }}
      >
        <div className="relative">
          {/* Ring */}
          <div className={`size-14 rounded-full p-0.5 ${
            ownGroup?.hasUnviewed
              ? "bg-gradient-to-tr from-connect-blue to-purple-500"
              : ownGroup
              ? "bg-border-subtle"
              : "bg-border-subtle"
          }`}>
            <div className="size-full rounded-full p-0.5 bg-card">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt="Your story"
                className="size-full rounded-full object-cover"
              />
            </div>
          </div>
          {/* + badge */}
          <div
            onClick={(e) => { e.stopPropagation(); onAddStory(); }}
            className="absolute bottom-0 right-0 size-5 rounded-full bg-connect-blue flex items-center justify-center border-2 border-card cursor-pointer hover:bg-connect-blue-dark transition-colors"
            aria-label="Add story"
          >
            <Plus size={11} className="text-white" />
          </div>
        </div>
        <span className="text-[10px] text-ink-muted font-medium leading-none truncate max-w-[56px]">
          {ownGroup ? "Your story" : "Add story"}
        </span>
      </div>

      {/* ── Other users' story bubbles ── */}
      {otherGroups.map((group) => (
        <div
          key={group.user._id}
          role="listitem"
          onClick={() => openStoryViewer(group, 0)}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="relative">
            <div className={`size-14 rounded-full p-0.5 transition-all ${
              group.hasUnviewed
                ? "bg-gradient-to-tr from-connect-blue to-purple-500"
                : "bg-border-subtle"
            }`}>
              <div className="size-full rounded-full p-0.5 bg-card">
                <img
                  src={group.user.profilePic || "/avatar.png"}
                  alt={group.user.fullName}
                  className="size-full rounded-full object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
            </div>
          </div>
          <span className="text-[10px] text-ink-muted font-medium leading-none truncate max-w-[56px]">
            {group.user.fullName.split(" ")[0]}
          </span>
        </div>
      ))}

      {/* Empty state — no connections have stories */}
      {storyGroups.length === 0 && !isLoading && (
        <p className="text-xs text-ink-muted italic pl-1">No stories yet</p>
      )}
    </div>
  );
};

export default StoryRow;
