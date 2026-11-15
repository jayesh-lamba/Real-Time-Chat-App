import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import SearchPeopleModal from "../components/SearchPeopleModal";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface overflow-hidden">
      {/* Spacer matching fixed top Navbar (h-14) */}
      <div className="h-14 flex-shrink-0" />

      {/* Full-viewport chat layout — zero side bezels */}
      <div className="flex-1 w-full flex overflow-hidden bg-card">
        <div className={`${selectedUser ? "hidden sm:flex" : "flex"} flex-shrink-0 h-full`}>
          <Sidebar onOpenSearch={() => setShowSearch(true)} />
        </div>

        <div className={`flex-1 flex flex-col min-w-0 h-full ${selectedUser ? "flex" : "hidden sm:flex"}`}>
          {!selectedUser ? (
            <NoChatSelected onOpenSearch={() => setShowSearch(true)} />
          ) : (
            <ChatContainer />
          )}
        </div>
      </div>

      {showSearch && <SearchPeopleModal onClose={() => setShowSearch(false)} />}
    </div>
  );
};

export default HomePage;
