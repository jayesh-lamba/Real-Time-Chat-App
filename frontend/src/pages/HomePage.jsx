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
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Spacer matching the height of the fixed top Navbar (h-14 / 56px) */}
      <div className="h-14 flex-shrink-0" />

      {/* Main chat window container */}
      <div className="flex-grow flex justify-center overflow-hidden">
        <div className="bg-card shadow-sm w-full h-full max-w-7xl border-x border-border-subtle">
          <div className="flex h-full overflow-hidden">
            {/* Sidebar — hidden on mobile when chat is open */}
            <div className={`${selectedUser ? "hidden sm:flex" : "flex"} flex-shrink-0`}>
              <Sidebar onOpenSearch={() => setShowSearch(true)} />
            </div>

            {/* Main content */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedUser ? "flex" : "hidden sm:flex"}`}>
              {!selectedUser ? (
                <NoChatSelected onOpenSearch={() => setShowSearch(true)} />
              ) : (
                <ChatContainer />
              )}
            </div>
          </div>
        </div>
      </div>

      {showSearch && <SearchPeopleModal onClose={() => setShowSearch(false)} />}
    </div>
  );
};


export default HomePage;
