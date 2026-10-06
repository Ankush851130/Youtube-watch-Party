import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import YouTubePlayer from '../components/YouTubePlayer';
import VideoInfoRow from '../components/VideoInfoRow';
import SidebarPanel from '../components/SidebarPanel';
import SearchModal from '../components/SearchModal';
import PasteUrlModal from '../components/PasteUrlModal';
import ShareModal from '../components/ShareModal';
import RoleModal from '../components/RoleModal';
import AuthModal from '../components/AuthModal';
import ToastContainer from '../components/ToastContainer';

export default function WatchPartyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { room, user, setUser, joinRoomSocket, leaveRoomSocket } = useSocket();
  const { user: authUser } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPasteUrlOpen, setIsPasteUrlOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [roleModalTarget, setRoleModalTarget] = useState(null);
  const [roleModalDefault, setRoleModalDefault] = useState('MODERATOR');

  // Username & password prompt state if joining directly via link without pre-saved user
  const [usernameInput, setUsernameInput] = useState(authUser?.username || user?.username || '');
  const [passwordInput, setPasswordInput] = useState(user?.password || '');
  const [isPromptingUsername, setIsPromptingUsername] = useState(!user?.username && !authUser?.username);

  useEffect(() => {
    const activeUsername = authUser?.username || user?.username;
    let activeUserId = authUser?.userId || user?.userId;

    if (!activeUserId && roomCode) {
      try {
        const storedHostId = localStorage.getItem(`watchparty_host_${roomCode.toUpperCase()}`);
        if (storedHostId) activeUserId = storedHostId;
      } catch (e) {}
    }

    if (roomCode && activeUsername) {
      joinRoomSocket(roomCode, activeUsername, activeUserId, user?.password || null);
      setIsPromptingUsername(false);
    } else if (!activeUsername) {
      setIsPromptingUsername(true);
    }
  }, [roomCode, authUser?.username, user?.username, user?.password]);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    const trimmed = usernameInput.trim();
    const newUser = { username: trimmed, role: 'PARTICIPANT', password: passwordInput.trim() || null };
    setUser(newUser);
    setIsPromptingUsername(false);

    joinRoomSocket(roomCode, trimmed, null, passwordInput.trim() || null);
  };

  const handleLeaveRoom = () => {
    leaveRoomSocket();
    navigate('/');
  };

  const handleOpenRoleModal = (targetUser, defaultRole) => {
    setRoleModalTarget(targetUser);
    setRoleModalDefault(defaultRole || 'MODERATOR');
    setIsRoleModalOpen(true);
  };

  if (isPromptingUsername) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="space-y-1 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FF0000] mx-auto flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg shadow-[#FF0000]/30">
              ▶
            </div>
            <h2 className="font-display text-xl font-bold text-white">Join Watch Party</h2>
            <p className="text-xs text-[#AAAAAA]">Enter your name to join room <span className="font-mono text-[#FF8080] font-bold">{roomCode}</span></p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Name</label>
              <input 
                type="text" 
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g., Aman"
                className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Room Password <span className="text-[11px] font-normal text-[#AAAAAA]">(Only if room is private)</span></label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password (if private)"
                className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full h-11 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm shadow-lg shadow-[#FF0000]/30 transition-all cursor-pointer"
            >
              Enter Room
            </button>
          </form>

          <div className="pt-2 text-center border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs text-[#FF8080] hover:underline font-semibold cursor-pointer"
            >
              🔐 Have an account? Sign In / Register first
            </button>
          </div>
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  const currentVideoId = room?.videoId !== undefined ? room.videoId : (room?.currentVideoId !== undefined ? room.currentVideoId : null);
  const isPlaying = room?.isPlaying ?? false;
  const currentTime = room?.currentTime || 0;

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen flex flex-col selection:bg-[#FF0000]/30 antialiased">
      {/* Navbar */}
      <Navbar 
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Digital Theater Stage */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hero Video Player Section */}
          <section className="lg:col-span-8 xl:col-span-8 flex flex-col gap-5 min-w-0">
            <YouTubePlayer 
              videoId={currentVideoId}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenPasteUrl={() => setIsPasteUrlOpen(true)}
            />

            <VideoInfoRow 
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenPasteUrl={() => setIsPasteUrlOpen(true)}
              onOpenShare={() => setIsShareOpen(true)}
              onLeaveRoom={handleLeaveRoom}
            />
          </section>

          {/* Secondary Sidebar: People & Chat */}
          <SidebarPanel 
            onOpenShare={() => setIsShareOpen(true)}
            onOpenRoleModal={handleOpenRoleModal}
          />
        </div>
      </main>

      {/* Modals & Overlays */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <PasteUrlModal 
        isOpen={isPasteUrlOpen} 
        onClose={() => setIsPasteUrlOpen(false)} 
      />

      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
      />

      <RoleModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        targetUser={roleModalTarget}
        defaultRole={roleModalDefault}
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
