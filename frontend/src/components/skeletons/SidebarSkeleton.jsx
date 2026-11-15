import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(7).fill(null);

  return (
    <aside className="h-full w-16 sm:w-20 lg:w-72 bg-card border-r border-border-subtle flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="border-b border-border-subtle w-full px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-ink-muted" />
          <span className="font-bold text-sm text-ink hidden lg:block">Connections</span>
        </div>
      </div>

      {/* Skeleton rows */}
      <div className="overflow-y-auto py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
            {/* Avatar */}
            <div className="size-11 rounded-full bg-border-subtle animate-pulse flex-shrink-0 mx-auto lg:mx-0" />
            {/* Text lines — desktop only */}
            <div className="hidden lg:block flex-1 space-y-2">
              <div
                className="h-3.5 bg-border-subtle rounded-full animate-pulse"
                style={{ width: `${60 + (idx * 29) % 60}%` }}
              />
              <div
                className="h-2.5 bg-border-subtle/60 rounded-full animate-pulse"
                style={{ width: `${30 + (idx * 17) % 30}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
