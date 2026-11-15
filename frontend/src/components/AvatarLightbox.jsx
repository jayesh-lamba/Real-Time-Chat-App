import { useEffect } from "react";
import { X, Download } from "lucide-react";

/**
 * AvatarLightbox
 * Full-screen overlay that shows an avatar at large size.
 * Click outside the image or press Escape to close.
 *
 * Props:
 *   src      {string}   – image URL
 *   name     {string}   – user's display name (used for alt + header)
 *   onClose  {Function}
 */
const AvatarLightbox = ({ src, name, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const effectiveSrc = src || "/avatar.png";

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-ink/90 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}'s profile photo`}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink/60 border-b border-white/10 flex-shrink-0">
        <span className="text-sm font-bold text-white truncate max-w-[60%]">{name}</span>
        <div className="flex items-center gap-2">
          {/* Download button */}
          <a
            href={effectiveSrc}
            download={`${name}-photo`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Download photo"
          >
            <Download size={16} />
          </a>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Image area (click backdrop to close) ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 cursor-zoom-out"
        onClick={onClose}
      >
        <img
          src={effectiveSrc}
          alt={`${name}'s profile photo`}
          onClick={(e) => e.stopPropagation()} // clicking photo itself doesn't close
          className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl cursor-default animate-fade-in-up"
          style={{ maxWidth: "min(480px, 90vw)", maxHeight: "70vh" }}
        />
      </div>

      {/* ── Footer hint ── */}
      <p className="text-center text-[11px] text-white/25 py-3 flex-shrink-0">
        Click outside or press <kbd className="bg-white/10 px-1 rounded">Esc</kbd> to close
      </p>
    </div>
  );
};

export default AvatarLightbox;
