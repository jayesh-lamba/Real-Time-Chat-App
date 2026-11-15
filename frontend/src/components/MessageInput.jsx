import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import StickerPicker from "./StickerPicker";
import stickers from "../data/stickers.json";

// Quick lookup: stickerId → sticker object (for local optimistic rendering)
const STICKER_MAP = Object.fromEntries(stickers.map((s) => [s.id, s]));

const MessageInput = () => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null); // base64 payload
  const [mediaType, setMediaType] = useState(null); // "image" | "video"
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }

    // Limit files to 25MB to prevent socket/database overloading
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large. Please upload a file smaller than 25MB.");
      return;
    }

    const type = file.type.startsWith("image/") ? "image" : "video";
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setMediaType(type);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaPreview) return;
    try {
      const payload = { text: text.trim() };
      if (mediaPreview) {
        if (mediaType === "image") {
          payload.image = mediaPreview;
          payload.messageType = "image";
        } else {
          payload.video = mediaPreview;
          payload.messageType = "video";
        }
      }
      await sendMessage(payload);
      setText("");
      setMediaPreview(null);
      setMediaType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };


  // ── Send a sticker immediately on click ──
  const handleStickerSelect = async (sticker) => {
    setShowStickerPicker(false);
    try {
      await sendMessage({
        messageType: "sticker",
        stickerId: sticker.id,
      });
    } catch (error) {
      console.error("Failed to send sticker:", error);
    }
  };

  const canSend = text.trim() || mediaPreview;

  return (
    <div className="px-4 py-3 bg-card border-t border-border-subtle">
      {/* Media preview (Image or Video) */}
      {mediaPreview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            {mediaType === "image" ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-xl border border-border-subtle"
              />
            ) : (
              <video
                src={mediaPreview}
                className="w-16 h-16 object-cover rounded-xl border border-border-subtle"
                muted
              />
            )}
            <button
              onClick={removeMedia}
              type="button"
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-ink text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              aria-label="Remove media"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Composer bar */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        {/* Sticker picker — positioned relative to this wrapper */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStickerPicker((v) => !v)}
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
              showStickerPicker
                ? "text-connect-blue bg-connect-blue-light"
                : "text-ink-muted hover:text-ink"
            }`}
            aria-label="Open sticker picker"
            aria-expanded={showStickerPicker}
          >
            <Smile size={20} />
          </button>

          {showStickerPicker && (
            <StickerPicker
              onSelect={handleStickerSelect}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
        </div>

        {/* Pill input wrapper */}
        <div className="flex-1 flex items-center gap-1 bg-surface border border-border-subtle rounded-full px-3 py-1.5 transition-all focus-within:border-connect-blue focus-within:ring-2 focus-within:ring-connect-blue/20">
          {/* Media attach — inside pill, left */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex-shrink-0 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
              mediaPreview ? "text-connect-blue" : "text-ink-muted hover:text-ink"
            }`}
            aria-label="Attach media"
          >
            <Image size={17} />
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-muted outline-none min-w-0"
            aria-label="Message input"
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-connect-blue/40 ${
            canSend
              ? "bg-connect-blue text-white hover:bg-connect-blue-dark shadow-sm"
              : "bg-surface text-border-subtle cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          <Send size={16} className={canSend ? "translate-x-px" : ""} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
