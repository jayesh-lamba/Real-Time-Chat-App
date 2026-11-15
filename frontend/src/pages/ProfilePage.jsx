import { useRef, useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, AtSign, Calendar, Shield, Trash2, Loader2, Edit3, Check, X, FileText } from "lucide-react";
import ImageCropModal from "../components/ImageCropModal";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [cropSrc, setCropSrc] = useState(null);       // raw picked file → shows crop modal
  const [previewImg, setPreviewImg] = useState(null); // optimistic preview after crop
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef(null);

  // Detail editing states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "Full-Stack Developer & AI Engineer · JayeshChat by Jayesh Lamba");
  const [isSaving, setIsSaving] = useState(false);

  // Sync inputs with user data when store updates or toggle edit
  useEffect(() => {
    if (authUser) {
      setFullName(authUser.fullName || "");
      setBio(authUser.bio || "Full-Stack Developer & AI Engineer · JayeshChat by Jayesh Lamba");
    }
  }, [authUser, isEditing]);

  // ── Step 1: user picks a file → open crop modal ──
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  };

  // ── Step 2: user confirms crop → upload ──
  const handleCropConfirm = async (base64) => {
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPreviewImg(base64);
    try {
      await updateProfile({ profilePic: base64 });
    } catch {
      setPreviewImg(null);
    }
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  // ── Remove photo ──
  const handleRemovePhoto = async () => {
    if (!authUser.profilePic && !previewImg) return;
    if (!confirm("Remove your profile photo?")) return;
    setIsRemoving(true);
    try {
      await updateProfile({ profilePic: null });
      setPreviewImg(null);
      toast.success("Profile photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Save bio & fullName details ──
  const handleSaveDetails = async () => {
    if (!fullName.trim()) {
      toast.error("Full Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), bio: bio.trim() });
      setIsEditing(false);
    } catch (error) {
      // Error handled inside store toast
    } finally {
      setIsSaving(false);
    }
  };

  const currentPhoto = previewImg || authUser.profilePic || "";
  const hasPhoto = Boolean(currentPhoto);

  return (
    <>
      {/* Crop modal — z-[60] */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div className="min-h-screen bg-surface pt-16">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="card-meta overflow-hidden">
            {/* Blue header strip */}
            <div className="h-24 bg-gradient-to-r from-connect-blue to-connect-blue-dark" />

            {/* ── Avatar area ── */}
            <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="relative w-fit">
                  <img
                    src={currentPhoto || "./avatar.png"}
                    alt="Profile"
                    className="size-24 rounded-full object-cover border-4 border-card shadow-md"
                  />

                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0.5 right-0.5 size-8 rounded-full bg-connect-blue flex items-center justify-center cursor-pointer shadow-sm hover:bg-connect-blue-dark transition-colors focus-within:ring-2 focus-within:ring-connect-blue/40 ${
                      isUpdatingProfile || isRemoving ? "opacity-60 pointer-events-none" : ""
                    }`}
                    aria-label="Change profile photo"
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="avatar-upload"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFilePick}
                      disabled={isUpdatingProfile || isRemoving}
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-ink leading-tight">{authUser?.fullName}</h1>
                  {authUser?.username && (
                    <p className="text-sm font-semibold text-connect-blue mt-0.5">@{authUser.username}</p>
                  )}
                  <p className="text-xs text-ink-muted mt-2 max-w-xs break-words italic bg-surface/55 px-3 py-1.5 rounded-xl border border-border-subtle/50">
                    "{authUser?.bio || "Full-Stack Developer & AI Engineer · JayeshChat by Jayesh Lamba"}"
                  </p>
                </div>
              </div>

              {/* Edit Mode Toggle Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-connect-blue/10 hover:bg-connect-blue/15 text-connect-blue transition-colors focus:outline-none focus:ring-2 focus:ring-connect-blue/30 self-start sm:self-end"
                >
                  <Edit3 size={13} />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Remove profile pic helper */}
            {hasPhoto && !isUpdatingProfile && !isRemoving && !isEditing && (
              <div className="px-6 pb-4">
                <button
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-650 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded-lg px-2.5 py-1 bg-red-500/5 hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                  Remove profile image
                </button>
              </div>
            )}

            {/* ── Info & Editing section ── */}
            <div className="border-t border-border-subtle px-6 py-5">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Edit Profile Details</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="p-1 rounded-full hover:bg-surface text-ink-muted hover:text-ink transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSaving}
                        className="p-1 rounded-full bg-connect-blue text-white hover:bg-connect-blue-dark transition-colors shadow-sm disabled:opacity-50"
                        title="Save Changes"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Full Name field */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-fullname" className="text-[11px] font-bold text-ink-muted uppercase">Full Name</label>
                      <input
                        type="text"
                        id="edit-fullname"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name..."
                        className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20 transition-all"
                      />
                    </div>

                    {/* Bio field */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="edit-bio" className="text-[11px] font-bold text-ink-muted uppercase">Status Bio</label>
                      <textarea
                        id="edit-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Say something about yourself..."
                        rows={3}
                        className="w-full bg-surface border border-border-subtle rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-connect-blue focus:ring-2 focus:ring-connect-blue/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Account Info</h2>

                  <div className="space-y-3">
                    <InfoRow icon={<User size={16} className="text-ink-muted" />} label="Full Name" value={authUser?.fullName} />

                    {authUser?.username && (
                      <InfoRow
                        icon={<AtSign size={16} className="text-connect-blue" />}
                        label="Username"
                        value={`@${authUser.username}`}
                        valueClass="text-connect-blue"
                        bgClass="bg-surface"
                      />
                    )}

                    <InfoRow icon={<FileText size={16} className="text-ink-muted" />} label="Bio Description" value={authUser?.bio || "Full-Stack Developer & AI Engineer · JayeshChat by Jayesh Lamba"} />
                    <InfoRow icon={<Mail size={16} className="text-ink-muted" />} label="Email Address" value={authUser?.email} />
                    <InfoRow icon={<Calendar size={16} className="text-ink-muted" />} label="Member Since" value={authUser?.createdAt?.split("T")[0]} />

                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Shield size={16} className="text-online-green" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-muted">Account Status</p>
                        <p className="text-sm font-semibold text-online-green">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Small helper for repetitive info rows ──
const InfoRow = ({ icon, label, value, valueClass = "text-ink", bgClass = "bg-surface" }) => (
  <div className="flex items-center gap-3">
    <div className={`size-9 rounded-full ${bgClass} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`text-sm font-semibold truncate ${valueClass}`}>{value}</p>
    </div>
  </div>
);

export default ProfilePage;
