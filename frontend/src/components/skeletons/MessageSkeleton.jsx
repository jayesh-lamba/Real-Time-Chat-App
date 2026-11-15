const MessageSkeleton = () => {
  const skeletonMessages = Array(5).fill(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-surface">
      {skeletonMessages.map((_, idx) => {
        const isSent = idx % 2 !== 0;
        return (
          <div
            key={idx}
            className={`flex items-end gap-2 ${isSent ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar shimmer */}
            <div className="size-7 rounded-full bg-border-subtle animate-pulse flex-shrink-0" />

            {/* Bubble shimmer */}
            <div
              className={`rounded-2xl animate-pulse bg-border-subtle ${
                isSent ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
              style={{
                width: `${120 + (idx * 37) % 80}px`,
                height: "38px",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;
