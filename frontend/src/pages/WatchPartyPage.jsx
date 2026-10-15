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
  const { socket, room, user, setUser, joinRoomSocket, leaveRoomSocket } = useSocket();
  const { user: authUser } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPasteUrlOpen, setIsPasteUrlOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [roleModalTarget, setRoleModalTarget] = useState(null);
  const [roleModalDefault, setRoleModalDefault] = useState('MODERATOR');

  // Mandatory auth requirement state
  const [passwordInput, setPasswordInput] = useState(user?.password || '');

  useEffect(() => {
    if (!socket) return;

    const handleParticipantRemovedSelf = () => {
      leaveRoomSocket();
      navigate('/');
    };

    socket.on('participant_removed_self', handleParticipantRemovedSelf);

    return () => {
      socket.off('participant_removed_self', handleParticipantRemovedSelf);
    };
  }, [socket, leaveRoomSocket, navigate]);

  useEffect(() => {
    if (!authUser?.username) return;

    const activeUsername = authUser.username;
    let activeUserId = authUser.userId;

    if (!activeUserId && roomCode) {
      try {
        const storedHostId = localStorage.getItem(`watchparty_host_${roomCode.toUpperCase()}`);
        if (storedHostId) activeUserId = storedHostId;
      } catch (e) {}
    }

    if (roomCode && activeUsername) {
      joinRoomSocket(roomCode, activeUsername, activeUserId, user?.password || passwordInput || null);
    }
  }, [roomCode, authUser?.username, authUser?.userId, user?.password, passwordInput]);

  const handleLeaveRoom = () => {
    leaveRoomSocket();
    navigate('/');
  };

  const handleOpenRoleModal = (targetUser, defaultRole) => {
    setRoleModalTarget(targetUser);
    setRoleModalDefault(defaultRole || 'MODERATOR');
    setIsRoleModalOpen(true);
  };

  // If user is not authenticated, show mandatory Auth card
  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 selection:bg-[#FF0000]/30">
        <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF0000] to-[#FF4D4D] mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#FF0000]/30">
            🎬
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">
              Authentication Required
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To join watch party <span className="font-mono text-[#FF8080] font-bold px-2 py-0.5 bg-[#FF0000]/10 rounded border border-[#FF0000]/20">{roomCode}</span>, you must sign in first. If you don't have an account, register first.
            </p>
          </div>

          <div className="bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF8080] text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2">
            <span>🔒</span>
            <span className="font-medium">Mandatory Sign-In Policy Enforced</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full h-12 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm shadow-lg shadow-[#FF0000]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔑 Sign In / Register to Join Party</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Back to Landing Page
            </button>
          </div>
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          notice={`Please sign in or register to join watch party ${roomCode}`}
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
      <main className="flex-1 w-full max-w-[1780px] mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
          {/* Hero Video Player Section */}
          <section className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3 sm:gap-5 min-w-0">
            <YouTubePlayer 
              videoId={currentVideoId}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenPasteUrl={() => setIsPasteUrlOpen(true)}
            />

            <div className="px-3 sm:px-0">
              <VideoInfoRow 
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenPasteUrl={() => setIsPasteUrlOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
                onLeaveRoom={handleLeaveRoom}
              />
            </div>
          </section>

          {/* Secondary Sidebar: People & Chat */}
          <div className="px-3 sm:px-0 lg:col-span-4 xl:col-span-4">
            <SidebarPanel 
              onOpenShare={() => setIsShareOpen(true)}
              onOpenRoleModal={handleOpenRoleModal}
            />
          </div>
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
