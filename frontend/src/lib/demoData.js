// JayeshChat — Data & Workspace Configuration
// Author: Jayesh Lamba (https://github.com/jayesh-lamba)

const makeMinimalAvatar = (initials, bg) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="80" fill="${bg}" />
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#F1F5F9" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="600" font-size="52" letter-spacing="0.5">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEMO_AUTH_USER = {
  _id: "jayesh-lamba-admin",
  fullName: "Jayesh Lamba",
  username: "jayesh_lamba",
  email: "jayeshanand160@gmail.com",
  profilePic: makeMinimalAvatar("JL", "#2563EB"),
  bio: "Full-Stack Developer · Built by Jayesh Lamba",
  createdAt: "2026-01-10T09:00:00.000Z",
};

export const DEMO_USERS = [
  {
    _id: "user-aarav-01",
    fullName: "Aarav Verma",
    username: "aarav_verma",
    email: "aarav.verma@example.com",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Software Engineer",
    createdAt: "2026-01-12T10:30:00.000Z",
  },
  {
    _id: "user-priya-02",
    fullName: "Priya Sharma",
    username: "priya_sharma",
    email: "priya.sharma@example.com",
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Backend Developer",
    createdAt: "2026-01-14T14:20:00.000Z",
  },
  {
    _id: "user-rohan-03",
    fullName: "Rohan Kapoor",
    username: "rohan_kapoor",
    email: "rohan.kapoor@example.com",
    profilePic: "https://randomuser.me/api/portraits/men/46.jpg",
    bio: "Systems Engineer",
    createdAt: "2026-01-18T08:15:00.000Z",
  },
  {
    _id: "user-ananya-04",
    fullName: "Ananya Nair",
    username: "ananya_nair",
    email: "ananya.nair@example.com",
    profilePic: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Product Designer",
    createdAt: "2026-01-20T11:45:00.000Z",
  },
  {
    _id: "user-vikram-05",
    fullName: "Vikramaditya Rao",
    username: "vikram_rao",
    email: "vikram.rao@example.com",
    profilePic: "https://randomuser.me/api/portraits/men/22.jpg",
    bio: "Security Engineer",
    createdAt: "2026-01-22T16:10:00.000Z",
  },
  {
    _id: "user-meera-06",
    fullName: "Meera Joshi",
    username: "meera_joshi",
    email: "meera.joshi@example.com",
    profilePic: "https://randomuser.me/api/portraits/women/26.jpg",
    bio: "Full-Stack Developer",
    createdAt: "2026-01-25T13:00:00.000Z",
  },
];

// Do not show online/offline status
export const DEMO_ONLINE_IDS = [];

// All chats start completely empty
export const INITIAL_DEMO_MESSAGES = {};

export const DEMO_PENDING_REQUESTS = [];

export const DEMO_SUGGESTIONS = [
  {
    _id: "user-kabir-07",
    fullName: "Kabir Mehta",
    username: "kabir_mehta",
    profilePic: "https://randomuser.me/api/portraits/men/64.jpg",
    relationshipStatus: "none",
    connectionId: null,
  },
  {
    _id: "user-neha-08",
    fullName: "Neha Gupta",
    username: "neha_gupta",
    profilePic: "https://randomuser.me/api/portraits/women/65.jpg",
    relationshipStatus: "none",
    connectionId: null,
  },
  {
    _id: "user-devansh-09",
    fullName: "Devansh Kulkarni",
    username: "devansh_k",
    profilePic: "https://randomuser.me/api/portraits/men/75.jpg",
    relationshipStatus: "none",
    connectionId: null,
  },
];

export const DEMO_STORIES = [];

export const DEMO_CALL_HISTORY = [];
