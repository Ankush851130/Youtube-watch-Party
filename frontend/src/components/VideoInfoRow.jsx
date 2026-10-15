import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function VideoInfoRow({ 
  onOpenSearch, 
  onOpenPasteUrl, 
  onOpenShare, 
  onOpenChat,
  unreadCount = 0,
  onLeaveRoom 
}) {
  const { room, user, sendEmojiSocket, addToast } = useSocket();

  const userRole = user?.role || 'PARTICIPANT';
  const canControl = userRole === 'HOST' || userRole === 'MODERATOR';
  const participantCount = room?.participants?.length || 1;

  const copyRoomLink = () => {
    const roomCode = room?.roomCode || 'X7K92P';
    const link = `${window.location.origin}/room/${roomCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    addToast('Invite link copied to clipboard!', 'info');
  };

  const handleEmojiClick = (emoji) => {
    sendEmojiSocket(emoji);
  };

  const currentVideoTitle = room?.videoTitle || room?.currentVideoTitle || 'Planet Earth III — Mountain Dynasties';
  const currentChannelTitle = room?.channelTitle || room?.currentChannelTitle || 'YouTube Music';
  const roomName = room?.roomName || 'Watch Party';

  return (
    <div className="flex flex-col gap-3 sm:gap-4 pt-1">
      {/* Title & Subtitle + Sync Indicator */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2.5 sm:gap-3 pb-1 border-b border-white/[0.08]">
        <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-[#FF8080] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse"></span>
            <span>Now Playing</span>
            <span className="text-[#717171]">•</span>
            <span className="text-slate-400 font-normal normal-case">Room: {roomName}</span>
          </div>
          <h1 className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white truncate" title={currentVideoTitle}>
            {currentVideoTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#AAAAAA] font-normal flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[#FF8080] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-[#FF8080]">artist</span>
              <span>{currentChannelTitle}</span>
            </span>
            <span className="text-[#717171]">•</span>
            <span className="text-slate-200 font-medium">{participantCount} friend{participantCount > 1 ? 's' : ''}</span>
            <span className="text-[#717171] hidden xs:inline">•</span>
            <span className="text-slate-300 hidden xs:inline">Synchronized Stream</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[11px] sm:text-xs font-semibold tracking-wide shadow-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span>Synced</span>
          </div>
        </div>
      </div>

      {/* Clean Action Bar & Live Emoji Triggers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left Action Cluster */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
          {canControl ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
              <button 
                onClick={onOpenSearch}
                className="h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#FF0000]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Search YouTube"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">search</span>
                <span>Search</span>
              </button>

              <button 
                onClick={onOpenPasteUrl}
                className="h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-white/10 text-slate-100 hover:text-white font-medium text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Paste YouTube URL"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#FF4D4D]">link</span>
                <span>Paste Link</span>
              </button>
            </div>
          ) : (
            <div className="h-9 sm:h-11 flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-mono text-[#AAAAAA]">
              <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-amber-400">lock</span>
              <span>Playback locked to Host/Mod</span>
            </div>
          )}

          <button 
            onClick={copyRoomLink}
            className="h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-white/10 text-slate-100 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
            title="Copy Invite Link"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#AAAAAA]">content_copy</span>
            <span className="hidden xs:inline">Link</span>
          </button>

          <button 
            onClick={onOpenShare}
            className="h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-white/10 text-slate-100 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
            title="Share Room"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#FF4D4D]">ios_share</span>
            <span>Share</span>
          </button>

          {onOpenChat && (
            <button 
              onClick={onOpenChat}
              className={`h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-xl border transition-all cursor-pointer ${
                unreadCount > 0 
                  ? 'bg-[#FF0000]/15 border-[#FF0000]/40 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] animate-pulse' 
                  : 'bg-[#181818] hover:bg-[#202020] border-white/10 text-slate-100 hover:text-white'
              }`}
              title="Open Chat"
            >
              <div className="relative inline-flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#FF4D4D]">chat_bubble</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF0000] text-white text-[9px] font-mono font-extrabold flex items-center justify-center shadow-md shadow-[#FF0000]/60 ring-1 ring-black leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium text-xs sm:text-sm">Chat</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF0000] text-white text-[10px] font-mono font-bold shadow-sm leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button 
            onClick={onLeaveRoom}
            className="h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 rounded-xl text-[#AAAAAA] hover:text-[#DC2626] hover:bg-[#DC2626]/10 font-medium text-xs sm:text-sm transition-all cursor-pointer ml-auto sm:ml-0"
            title="Leave Room"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">logout</span>
            <span>Leave</span>
          </button>
        </div>

        {/* Quick Emoji Reactions Bar */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-[#717171] px-1.5 font-mono hidden sm:inline">React:</span>
          {['❤️', '😂', '👍', '😮', '🔥'].map((emoji) => (
            <button 
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="emoji-btn hover:scale-125 active:scale-95 transition-transform p-1 sm:p-1.5 text-sm sm:text-base md:text-lg rounded-lg hover:bg-white/10 cursor-pointer"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
