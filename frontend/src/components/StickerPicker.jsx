import { useState, useEffect, useRef } from "react";
import stickers from "../data/stickers.json";

// Group stickers by category
const CATEGORIES = [...new Set(stickers.map((s) => s.category))];

const CATEGORY_LABELS = {
  faces:    { label: "Faces",    icon: "😄" },
  love:     { label: "Love",     icon: "❤️" },
  gestures: { label: "Gestures", icon: "👍" },
  vibes:    { label: "Vibes",    icon: "🔥" },
};

/**
 * StickerPicker
 * A compact popover that lists stickers grouped by category.
 * Calls onSelect(sticker) when a sticker is tapped.
 * Calls onClose() to dismiss.
 *
 * Props:
 *   onSelect  {Function(sticker)} – sticker object from stickers.json
 *   onClose   {Function}
 */
const StickerPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const pickerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Small timeout so the triggering button click doesn't immediately close
    const timerId = setTimeout(() => document.addEventListener("mousedown", handleClick), 50);
    return () => {
      clearTimeout(timerId);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filteredStickers = stickers.filter((s) => s.category === activeCategory);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full mb-2 left-0 z-40 w-[min(320px,90vw)] bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-slide-in"
      role="dialog"
      aria-label="Sticker picker"
    >
      {/* ── Category tabs ── */}
      <div className="flex items-center border-b border-border-subtle px-2 pt-2 gap-1">
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_LABELS[cat] || { label: cat, icon: "🎭" };
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors focus:outline-none ${
                isActive
                  ? "bg-surface text-connect-blue border-b-2 border-connect-blue"
                  : "text-ink-muted hover:text-ink hover:bg-surface/60"
              }`}
              aria-pressed={isActive}
              aria-label={meta.label}
            >
              <span className="text-base leading-none">{meta.icon}</span>
              <span className="hidden sm:inline">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sticker grid ── */}
      <div
        className="grid grid-cols-5 gap-1 p-3 max-h-48 overflow-y-auto overscroll-contain"
        role="list"
        aria-label={`${CATEGORY_LABELS[activeCategory]?.label} stickers`}
      >
        {filteredStickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => {
              onSelect(sticker);
              onClose();
            }}
            title={sticker.label}
            aria-label={sticker.label}
            role="listitem"
            className="flex items-center justify-center text-3xl leading-none rounded-xl p-1.5 hover:bg-surface active:scale-90 transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-connect-blue/40 select-none"
          >
            {sticker.emoji}
          </button>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-2 border-t border-border-subtle">
        <p className="text-[10px] text-ink-muted text-center">
          Tap a sticker to send instantly
        </p>
      </div>
    </div>
  );
};

export default StickerPicker;
