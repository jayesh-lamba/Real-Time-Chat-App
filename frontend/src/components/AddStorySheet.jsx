import { useRef, useState } from "react";
import { useStoryStore } from "../store/useStoryStore";
import { X, ImagePlus, Video, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

/**
 * AddStorySheet
 * Bottom-sheet style dialog for creating a new story.
 * Accepts image or video, optional caption, previews before posting.
 * Props: onClose {Function}
 */
const AddStorySheet = ({ onClose }) => {
  const { createStory, isUploading } = useStoryStore();
  const [preview, setPreview] = useState(null);   // { dataUrl, mediaType }
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef(null);

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please pick an image or video");
      return;
    }
    // Rough size guard — 50 MB limit (base64 will be ~1.33x)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview({ dataUrl: reader.result, mediaType: isVideo ? "video" : "image" });
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!preview) return;
    await createStory({
      media: preview.dataUrl,
      mediaType: preview.mediaType,
      caption: caption.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex flex-col items-center justify-end sm:justify-center bg-ink/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Add story"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="font-bold text-base text-ink">New Story</h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview area */}
          {preview ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-64 flex items-center justify-center">
              {preview.mediaType === "video" ? (
                <video
                  src={preview.dataUrl}
                  className="max-h-full max-w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={preview.dataUrl}
                  alt="Story preview"
                  className="max-h-full max-w-full object-contain"
                />
              )}
              {/* Replace button */}
              <button
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 size-7 rounded-full bg-ink/70 flex items-center justify-center text-white hover:bg-ink transition-colors"
                aria-label="Remove media"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            /* Pick media */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-64 rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center gap-3 text-ink-muted hover:border-connect-blue hover:text-connect-blue transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40"
              aria-label="Pick photo or video"
            >
              <div className="flex gap-4">
                <ImagePlus size={28} />
                <Video size={28} />
              </div>
              <p className="text-sm font-medium">Tap to pick a photo or video</p>
              <p className="text-xs text-ink-muted">Images or videos up to 50 MB · Videos up to 30 s</p>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilePick}
          />

          {/* Caption */}
          <div className="relative">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 200))}
              placeholder="Add a caption… (optional)"
              className="input-pill py-2 pr-10 text-sm w-full"
              aria-label="Story caption"
              maxLength={200}
            />
            {caption && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">
                {caption.length}/200
              </span>
            )}
          </div>

          {/* Post button */}
          <button
            onClick={handlePost}
            disabled={!preview || isUploading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
              preview && !isUploading
                ? "bg-connect-blue text-white hover:bg-connect-blue-dark shadow-sm"
                : "bg-surface text-ink-muted cursor-not-allowed"
            }`}
            aria-label="Post story"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Send size={16} />
                Share Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStorySheet;
