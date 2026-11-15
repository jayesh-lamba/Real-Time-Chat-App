import Navbar from "./components/Navbar";
import CallModal from "./components/CallModal";

import HomePage from "./pages/HomePage";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full bg-connect-blue flex items-center justify-center">
            <Loader2 className="size-5 text-white animate-spin" />
          </div>
          <p className="text-xs text-ink-muted font-medium">Loading…</p>
        </div>
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />
      <CallModal />


      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#050505",
            color: "#ffffff",
            fontSize: "13px",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "12px",
            padding: "10px 16px",
          },
          success: { iconTheme: { primary: "#31A24C", secondary: "#fff" } },
          error: { iconTheme: { primary: "#FA3E3E", secondary: "#fff" } },
        }}
      />
    </div>
  );
};
export default App;
