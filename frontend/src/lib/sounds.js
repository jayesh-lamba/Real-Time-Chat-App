// Web Audio API custom synthesizer helper for ringtones and notifications.
// Eliminates the need for external MP3 assets and works 100% offline.

let audioCtx = null;
let ringtoneInterval = null;
let outgoingInterval = null;

// Helper to initialize or retrieve the AudioContext
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

// Check if sound is muted by the user (stored in localStorage)
export const isSoundMuted = () => {
  return localStorage.getItem("chatapp_mute_sounds") === "true";
};

// Toggle mute state for call sounds
export const setSoundMuted = (muted) => {
  localStorage.setItem("chatapp_mute_sounds", muted ? "true" : "false");
};

// Check if message notification sound is muted
export const isNotificationsMuted = () => {
  return localStorage.getItem("chatapp_mute_notifications") === "true";
};

// Toggle mute state for message notification sounds
export const setNotificationsMuted = (muted) => {
  localStorage.setItem("chatapp_mute_notifications", muted ? "true" : "false");
};

/**
 * ── Callee Ringtone ──
 * Alternating dual-frequency telephone ringing pulses.
 */
export const startRingtone = () => {

  if (isSoundMuted()) return;
  stopAllSounds();

  try {
    const ctx = getAudioContext();

    const playPulse = () => {
      const now = ctx.currentTime;
      // Synthesize a classic UK/Europe double-ring pulse
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.setValueAtTime(400, now);
      osc2.frequency.setValueAtTime(450, now);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Ring pulse 1 (0.4s)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.setValueAtTime(0.2, now + 0.4);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.45);

      // Ring pulse 2 (0.4s after 0.2s pause)
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.65);
      gainNode.gain.setValueAtTime(0.2, now + 1.05);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.1);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    };

    // Play first pulse immediately
    playPulse();

    // Loop every 2.5 seconds
    ringtoneInterval = setInterval(playPulse, 2500);

  } catch (error) {
    console.warn("Autoplay blocked or AudioContext failed:", error);
  }
};

/**
 * ── Caller Outgoing Tone ──
 * A soft periodic sonar ping.
 */
export const startOutgoingTone = () => {
  if (isSoundMuted()) return;
  stopAllSounds();

  try {
    const ctx = getAudioContext();

    const playPing = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, now);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Soft pulse with a long exponential decay (1.5s)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.start(now);
      osc.stop(now + 1.8);
    };

    playPing();

    // Loop every 3 seconds
    outgoingInterval = setInterval(playPing, 3000);

  } catch (error) {
    console.warn("Autoplay blocked or AudioContext failed:", error);
  }
};

/**
 * ── Message Notification ──
 * Short high-pitched double-beep.
 */
export const playNotificationSound = () => {
  if (isNotificationsMuted()) return;


  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Beep 1 (50ms at 600Hz)
    osc.frequency.setValueAtTime(600, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gainNode.gain.setValueAtTime(0.1, now + 0.06);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.07);

    // Beep 2 (80ms at 800Hz after 40ms pause)
    osc.frequency.setValueAtTime(800, now + 0.11);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.12);
    gainNode.gain.setValueAtTime(0.1, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.21);

    osc.start(now);
    osc.stop(now + 0.25);

  } catch (error) {
    console.warn("Notification audio blocked or context failed:", error);
  }
};

/**
 * Stops all active loops (ringtones / pings)
 */
export const stopAllSounds = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (outgoingInterval) {
    clearInterval(outgoingInterval);
    outgoingInterval = null;
  }
};
