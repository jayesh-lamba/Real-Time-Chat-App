// Built & Engineered by Jayesh Lamba (https://github.com/jayesh-lamba)
// Interactive Live Workspace & Fallback Data Layer for JayeshChat

const makeAvatarSvg = (initials, bgStart, bgEnd) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="80" fill="url(#g)" />
    <circle cx="130" cy="30" r="45" fill="rgba(255,255,255,0.08)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="56" letter-spacing="1">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const makeStorySvg = (title, subtitle, author, bgStart, bgEnd, accent) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="720" height="1280" fill="url(#bg)" />
    <circle cx="600" cy="220" r="240" fill="${accent}" fill-opacity="0.14" />
    <circle cx="120" cy="1020" r="280" fill="${accent}" fill-opacity="0.1" />
    <rect x="60" y="380" width="600" height="500" rx="36" fill="rgba(15,23,42,0.72)" stroke="rgba(255,255,255,0.16)" stroke-width="2" />
    <text x="360" y="520" text-anchor="middle" fill="${accent}" font-family="system-ui, sans-serif" font-weight="800" font-size="24" letter-spacing="4">JAYESHCHAT LIVE</text>
    <text x="360" y="610" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="44">${title}</text>
    <text x="360" y="680" text-anchor="middle" fill="#cbd5e1" font-family="system-ui, sans-serif" font-weight="500" font-size="26">${subtitle}</text>
    <text x="360" y="790" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-weight="600" font-size="22">${author}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEMO_AUTH_USER = {
  _id: "jayesh-lamba-admin",
  fullName: "Jayesh Lamba",
  username: "jayesh_lamba",
  email: "jayeshanand160@gmail.com",
  profilePic: makeAvatarSvg("JL", "#6366F1", "#8B5CF6"),
  bio: "Full-Stack Developer & AI Engineer · Creator of JayeshChat",
  createdAt: "2026-01-10T09:00:00.000Z",
};

export const DEMO_USERS = [
  {
    _id: "user-aarav-01",
    fullName: "Aarav Verma",
    username: "aarav_dev",
    email: "aarav.verma@jayeshchat.dev",
    profilePic: makeAvatarSvg("AV", "#3B82F6", "#06B6D4"),
    bio: "Frontend Systems Architect · Testing JayeshChat v2.4",
    createdAt: "2026-01-12T10:30:00.000Z",
  },
  {
    _id: "user-priya-02",
    fullName: "Priya Sharma",
    username: "priya_ai",
    email: "priya.sharma@jayeshchat.dev",
    profilePic: makeAvatarSvg("PS", "#EC4899", "#8B5CF6"),
    bio: "AI & ML Engineer · Collaborating with Jayesh Lamba",
    createdAt: "2026-01-14T14:20:00.000Z",
  },
  {
    _id: "user-rohan-03",
    fullName: "Rohan Kapoor",
    username: "rohan_cloud",
    email: "rohan.kapoor@jayeshchat.dev",
    profilePic: makeAvatarSvg("RK", "#10B981", "#059669"),
    bio: "Cloud & Distributed Systems · Socket.IO + WebRTC",
    createdAt: "2026-01-18T08:15:00.000Z",
  },
  {
    _id: "user-ananya-04",
    fullName: "Ananya Nair",
    username: "ananya_ux",
    email: "ananya.nair@jayeshchat.dev",
    profilePic: makeAvatarSvg("AN", "#F59E0B", "#EA580C"),
    bio: "Product Designer · Loving the new JayeshChat dark UI ✨",
    createdAt: "2026-01-20T11:45:00.000Z",
  },
  {
    _id: "user-vikram-05",
    fullName: "Vikramaditya Rao",
    username: "vikram_sec",
    email: "vikram.rao@jayeshchat.dev",
    profilePic: makeAvatarSvg("VR", "#6366F1", "#1D4ED8"),
    bio: "Applied Cryptography & E2EE Security Auditor",
    createdAt: "2026-01-22T16:10:00.000Z",
  },
  {
    _id: "user-meera-06",
    fullName: "Meera Joshi",
    username: "meera_product",
    email: "meera.joshi@jayeshchat.dev",
    profilePic: makeAvatarSvg("MJ", "#14B8A6", "#0284C7"),
    bio: "Engineering Lead · Full-Stack & Real-Time Apps",
    createdAt: "2026-01-25T13:00:00.000Z",
  },
];

export const DEMO_ONLINE_IDS = [
  "jayesh-lamba-admin",
  "user-aarav-01",
  "user-priya-02",
  "user-rohan-03",
  "user-ananya-04",
  "user-meera-06",
];

const now = Date.now();
const minsAgo = (m) => new Date(now - m * 60 * 1000).toISOString();

export const INITIAL_DEMO_MESSAGES = {
  "user-aarav-01": [
    {
      _id: "msg-101",
      senderId: "user-aarav-01",
      receiverId: "jayesh-lamba-admin",
      text: "Hey Jayesh! Just checked out the new JayeshChat v2.4 build you pushed.",
      messageType: "text",
      createdAt: minsAgo(28),
      isRead: true,
    },
    {
      _id: "msg-102",
      senderId: "jayesh-lamba-admin",
      receiverId: "user-aarav-01",
      text: "Thanks Aarav! I redesigned the entire interface with an Obsidian Dark theme and end-to-end encryption.",
      messageType: "text",
      createdAt: minsAgo(25),
      isRead: true,
    },
    {
      _id: "msg-103",
      senderId: "user-aarav-01",
      receiverId: "jayesh-lamba-admin",
      text: "The WebSocket message delivery and X25519 key exchange feel instantaneous! 🔥",
      messageType: "text",
      createdAt: minsAgo(22),
      isRead: true,
    },
    {
      _id: "msg-104",
      senderId: "jayesh-lamba-admin",
      receiverId: "user-aarav-01",
      text: "Let's ship the live preview directly into my portfolio today 🚀",
      messageType: "text",
      createdAt: minsAgo(18),
      isRead: true,
    },
    {
      _id: "msg-105",
      senderId: "user-aarav-01",
      receiverId: "jayesh-lamba-admin",
      text: "100%! Anyone testing this live workspace can send messages, switch themes, or view stories right away.",
      messageType: "text",
      createdAt: minsAgo(5),
      isRead: true,
    },
  ],
  "user-priya-02": [
    {
      _id: "msg-201",
      senderId: "user-priya-02",
      receiverId: "jayesh-lamba-admin",
      text: "Hi Jayesh! Are we still on for the architecture sync on your AI & Real-Time projects?",
      messageType: "text",
      createdAt: minsAgo(65),
      isRead: true,
    },
    {
      _id: "msg-202",
      senderId: "jayesh-lamba-admin",
      receiverId: "user-priya-02",
      text: "Yes! I just finished connecting Peekafuture and JayeshChat to my live portfolio.",
      messageType: "text",
      createdAt: minsAgo(60),
      isRead: true,
    },
    {
      _id: "msg-203",
      senderId: "user-priya-02",
      receiverId: "jayesh-lamba-admin",
      text: "Awesome work Jayesh! Your UI polish on this messenger is next level.",
      messageType: "text",
      createdAt: minsAgo(12),
      isRead: false,
    },
  ],
  "user-rohan-03": [
    {
      _id: "msg-301",
      senderId: "jayesh-lamba-admin",
      receiverId: "user-rohan-03",
      text: "Rohan, how are the Socket.IO & WebRTC STUN metrics looking?",
      messageType: "text",
      createdAt: minsAgo(120),
      isRead: true,
    },
    {
      _id: "msg-302",
      senderId: "user-rohan-03",
      receiverId: "jayesh-lamba-admin",
      text: "Sub-20ms roundtrip latency across nodes! Solid engineering, Jayesh.",
      messageType: "text",
      createdAt: minsAgo(115),
      isRead: true,
    },
  ],
  "user-ananya-04": [
    {
      _id: "msg-401",
      senderId: "user-ananya-04",
      receiverId: "jayesh-lamba-admin",
      text: "Jayesh, the new Indigo + Obsidian color palette and glassmorphic header look so clean! 💜",
      messageType: "text",
      createdAt: minsAgo(45),
      isRead: false,
    },
  ],
  "user-vikram-05": [
    {
      _id: "msg-501",
      senderId: "user-vikram-05",
      receiverId: "jayesh-lamba-admin",
      text: "Verified your IndexedDB private key storage and XSalsa20-Poly1305 encryption pipeline. Zero leaks.",
      messageType: "text",
      createdAt: minsAgo(240),
      isRead: true,
    },
  ],
  "user-meera-06": [
    {
      _id: "msg-601",
      senderId: "user-meera-06",
      receiverId: "jayesh-lamba-admin",
      text: "Hey Jayesh, loved exploring your GitHub repositories and this real-time chat app!",
      messageType: "text",
      createdAt: minsAgo(90),
      isRead: true,
    },
  ],
};

export const DEMO_AUTO_REPLIES = [
  "That sounds awesome, Jayesh! 🚀 The real-time sync is super smooth.",
  "Got your message loud and clear! JayeshChat's UI feels so snappy.",
  "Love how clean this dark mode layout is—great work Jayesh Lamba! 🔥",
  "100% agreed! Let's push the latest build to production.",
  "Just tested the E2EE pipeline and custom themes—everything works flawlessly!",
];

export const DEMO_PENDING_REQUESTS = [
  {
    _id: "req-demo-1",
    requesterId: {
      _id: "user-kabir-07",
      fullName: "Kabir Mehta",
      username: "kabir_fullstack",
      email: "kabir.mehta@jayeshchat.dev",
      profilePic: makeAvatarSvg("KM", "#8B5CF6", "#EC4899"),
      bio: "Full-Stack Engineer · Fan of Jayesh Lamba's open-source work",
    },
    status: "pending",
    createdAt: minsAgo(35),
  },
  {
    _id: "req-demo-2",
    requesterId: {
      _id: "user-neha-08",
      fullName: "Neha Gupta",
      username: "neha_ml",
      email: "neha.gupta@jayeshchat.dev",
      profilePic: makeAvatarSvg("NG", "#06B6D4", "#3B82F6"),
      bio: "Deep Learning Researcher · Building with Jayesh",
    },
    status: "pending",
    createdAt: minsAgo(80),
  },
];

export const DEMO_SUGGESTIONS = [
  {
    _id: "user-devansh-09",
    fullName: "Devansh Kulkarni",
    username: "devansh_sys",
    profilePic: makeAvatarSvg("DK", "#F43F5E", "#FB923C"),
    relationshipStatus: "none",
    connectionId: null,
  },
  {
    _id: "user-ishita-10",
    fullName: "Ishita Bansal",
    username: "ishita_design",
    profilePic: makeAvatarSvg("IB", "#A855F7", "#6366F1"),
    relationshipStatus: "none",
    connectionId: null,
  },
  {
    _id: "user-aryan-11",
    fullName: "Aryan Malhotra",
    username: "aryan_rust",
    profilePic: makeAvatarSvg("AM", "#10B981", "#14B8A6"),
    relationshipStatus: "none",
    connectionId: null,
  },
];

export const DEMO_STORIES = [
  {
    user: DEMO_AUTH_USER,
    isOwn: true,
    hasUnviewed: true,
    stories: [
      {
        _id: "story-jayesh-1",
        mediaUrl: makeStorySvg(
          "JayeshChat v2.4",
          "Real-Time E2EE + WebRTC Messenger",
          "Built & Engineered by Jayesh Lamba",
          "#1E1B4B",
          "#0F172A",
          "#818CF8"
        ),
        mediaType: "image",
        caption: "Shipped JayeshChat v2.4 with X25519 E2EE, WebRTC Calling & Obsidian UI! 🚀 — Jayesh Lamba",
        createdAt: minsAgo(40),
        isViewed: false,
        viewCount: 18,
      },
    ],
  },
  {
    user: DEMO_USERS[0],
    isOwn: false,
    hasUnviewed: true,
    stories: [
      {
        _id: "story-aarav-1",
        mediaUrl: makeStorySvg(
          "Sub-20ms Sync",
          "Testing Jayesh Lamba's Socket Engine",
          "@aarav_dev · Frontend Architect",
          "#0F172A",
          "#1E3A8A",
          "#38BDF8"
        ),
        mediaType: "image",
        caption: "Testing Jayesh Lamba's new real-time chat architecture! Zero latency 🔥",
        createdAt: minsAgo(95),
        isViewed: false,
        viewCount: 12,
      },
    ],
  },
  {
    user: DEMO_USERS[1],
    isOwn: false,
    hasUnviewed: true,
    stories: [
      {
        _id: "story-priya-1",
        mediaUrl: makeStorySvg(
          "End-to-End Encrypted",
          "X25519 + XSalsa20-Poly1305 Security",
          "@priya_ai · AI Systems",
          "#3B0764",
          "#0F172A",
          "#F472B6"
        ),
        mediaType: "image",
        caption: "Privacy-first messaging engineered by Jayesh Lamba 🔒✨",
        createdAt: minsAgo(150),
        isViewed: false,
        viewCount: 9,
      },
    ],
  },
];

export const DEMO_CALL_HISTORY = [
  {
    _id: "call-demo-1",
    callerId: DEMO_AUTH_USER,
    receiverId: DEMO_USERS[0],
    type: "video",
    status: "answered",
    duration: 412,
    createdAt: minsAgo(55),
  },
  {
    _id: "call-demo-2",
    callerId: DEMO_USERS[1],
    receiverId: DEMO_AUTH_USER,
    type: "voice",
    status: "answered",
    duration: 195,
    createdAt: minsAgo(180),
  },
  {
    _id: "call-demo-3",
    callerId: DEMO_USERS[2],
    receiverId: DEMO_AUTH_USER,
    type: "video",
    status: "missed",
    duration: 0,
    createdAt: minsAgo(320),
  },
];
