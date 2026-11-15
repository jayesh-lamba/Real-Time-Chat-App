import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedImg } from "../lib/cropImage";

/**
 * ImageCropModal
 * Shows a square/circular crop UI over a full-screen overlay.
 * Calls onConfirm(base64String) when the user clicks Confirm.
 * Calls onCancel() when they close or click outside.
 *
 * Props:
 *   imageSrc  {string}   – ObjectURL or data URL of the file the user picked
 *   onConfirm {Function} – called with the cropped base64 JPEG string
 *   onCancel  {Function}
 */
const ImageCropModal = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels, 400);
      onConfirm(cropped);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile photo"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink/80 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-2 py-1"
          aria-label="Cancel crop"
        >
          <X size={16} />
          Cancel
        </button>

        <span className="text-sm font-bold text-white">Crop Photo</span>

        <button
          onClick={handleConfirm}
          disabled={isCropping}
          className="flex items-center gap-1.5 text-sm font-bold text-connect-blue hover:text-blue-300 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-connect-blue/40 rounded-lg px-2 py-1"
          aria-label="Confirm crop"
        >
          <Check size={16} />
          {isCropping ? "Saving…" : "Use Photo"}
        </button>
      </div>

      {/* ── Crop canvas area ── */}
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "transparent" },
            cropAreaStyle: {
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
            },
          }}
        />
      </div>

      {/* ── Zoom slider ── */}
      <div className="flex items-center gap-3 px-6 py-4 bg-ink/80 border-t border-white/10 flex-shrink-0">
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
          className="text-white/70 hover:text-white transition-colors focus:outline-none"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-connect-blue h-1.5 rounded-full cursor-pointer"
          aria-label="Zoom level"
        />

        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          className="text-white/70 hover:text-white transition-colors focus:outline-none"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

        {/* Zoom % label */}
        <span className="text-xs text-white/40 w-10 text-right tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Touch hint — shown only on small screens */}
      <p className="sm:hidden text-center text-[11px] text-white/30 pb-3">
        Pinch or use slider to zoom · Drag to reposition
      </p>
    </div>
  );
};

export default ImageCropModal;
