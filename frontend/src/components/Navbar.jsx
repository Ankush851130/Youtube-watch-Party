import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { searchYouTubeApi } from '../services/api';
import { extractYouTubeId } from '../utils/youtubeUtils';

export default function Navbar({ onOpenSearch, onOpenShare, onLeaveRoom }) {
  const { room, user, changeVideoSocket, addToast } = useSocket();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Live Inline Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchContainerRef = useRef(null);

  const roomName = room?.roomName || 'Friday Movie Night';
  const roomCode = room?.roomCode || 'X7K92P';
  const participantCount = room?.participants?.length || 1;
  const username = user?.username || 'Ankush';
  const userRole = user?.role || 'HOST';

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const directId = extractYouTubeId(searchQuery);
    if (directId) {
      setSearchResults([{
        videoId: directId,
        title: `Pasted YouTube Link (${directId})`,
        thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
        channelTitle: 'Direct YouTube URL',
        duration: 'Direct Link',
        views: 'Paste & Play'
      }]);
      setShowSearchDropdown(true);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchYouTubeApi(searchQuery);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlayVideo = (videoId, title) => {
    changeVideoSocket(videoId);
    addToast(`Syncing "${title || 'YouTube Video'}" for everyone!`, 'success');
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const directId = extractYouTubeId(searchQuery);
    if (directId) {
      handlePlayVideo(directId, `YouTube Video (${directId})`);
    } else if (searchResults.length > 0) {
      handlePlayVideo(searchResults[0].videoId, searchResults[0].title);
    }
  };

  const copyRoomCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
    }
    addToast(`Room Code ${roomCode} copied to clipboard!`, 'info');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0E0E0E]/95 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a className="flex items-center gap-2.5 group" href="/">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF0000] shadow-lg shadow-[#FF0000]/25 group-hover:scale-105 transition-transform duration-300 overflow-hidden text-white font-extrabold text-sm">
              ▶
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold tracking-tight text-base text-white flex items-center gap-1.5">
                WATCHTOGETHER
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#FF0000]/10 text-[#FF4D4D] border border-[#FF0000]/20 uppercase tracking-widest hidden sm:inline">Cinema</span>
              </span>
              <span className="text-[11px] text-[#AAAAAA] -mt-0.5 tracking-tight font-medium hidden md:inline">Sync YouTube instantly</span>
            </div>
          </a>
        </div>

        {/* Center Room Info Capsule */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
          <span className="text-sm sm:text-base font-semibold text-white max-w-[140px] sm:max-w-[260px] truncate">{roomName}</span>
          <span className="text-[#717171] hidden sm:inline">•</span>
          <span className="text-xs font-mono font-medium text-[#AAAAAA] bg-white/[0.05] px-2 py-0.5 rounded-full hidden sm:flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#AAAAAA]">group</span>
            <span>{participantCount} watching</span>
          </span>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Room Code Pill */}
          <button 
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs font-mono group cursor-pointer"
            title="Copy Room Passcode"
          >
            <span className="text-[#717171] text-[10px] uppercase font-bold tracking-wider">CODE</span>
            <span className="text-[#FF8080] font-semibold tracking-wider">{roomCode}</span>
            <span className="material-symbols-outlined text-[14px] text-[#AAAAAA] group-hover:text-[#FF8080] transition-colors">content_copy</span>
          </button>

          {/* Share Button */}
          <button 
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white font-medium text-xs shadow-md shadow-[#FF0000]/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">ios_share</span>
            <span className="hidden sm:inline">Share</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block"></div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#FF0000]/30 shadow-sm shadow-[#FF0000]/30 uppercase">
              {username.charAt(0)}
            </div>
            <div className="flex-col text-left hidden lg:flex">
              <span className="text-xs font-semibold text-slate-200 leading-tight">{username}</span>
              <span className="text-[10px] text-[#FF4D4D] font-bold uppercase tracking-wider">
                {userRole === 'HOST' ? '👑 Host' : userRole === 'MODERATOR' ? '🛡️ Mod' : '👤 Viewer'}
              </span>
            </div>
          </div>

          {/* More Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="More Options"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#181818] border border-white/10 shadow-2xl p-1.5 z-50 text-xs">
                <button 
                  onClick={() => { setIsDropdownOpen(false); onOpenShare(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#FF4D4D]">person_add</span>
                  <span>Invite Friends</span>
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button 
                  onClick={() => { setIsDropdownOpen(false); onLeaveRoom(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-red-400 hover:bg-[#DC2626]/10 rounded-lg text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Leave Room</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary YouTube Live Inline Search Bar */}
      <div className="border-t border-white/[0.08] bg-[#0E0E0E]/95 px-4 sm:px-6 lg:px-8 py-2.5 backdrop-blur-md">
        <div className="max-w-[1780px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Search Badge */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 select-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/25 text-[#FF4D4D] text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">smart_display</span>
              <span>YouTube Search</span>
            </div>
            <span className="text-[11px] text-[#717171] font-mono">Live inline search &amp; sync</span>
          </div>

          {/* Center: Live Interactive Search Input + Dropdown (Same Page) */}
          <div ref={searchContainerRef} className="w-full max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center">
              <div className="w-full flex items-center bg-[#121212] border border-white/15 rounded-full overflow-hidden focus-within:border-[#FF0000] focus-within:ring-1 focus-within:ring-[#FF0000] transition-all shadow-inner group">
                <div className="pl-4 pr-2 text-[#717171] flex items-center pointer-events-none group-focus-within:text-[#FF4D4D]">
                  <span className="material-symbols-outlined text-[20px]">
                    {isSearching ? 'progress_activity' : 'search'}
                  </span>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  placeholder="Search YouTube videos, songs, or paste any video link..." 
                  className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-white placeholder:text-[#717171] outline-none font-normal selection:bg-[#FF0000]/30 selection:text-white" 
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                    className="p-1 text-[#717171] hover:text-white mr-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
                <button 
                  type="submit" 
                  className="h-10 px-4 sm:px-5 bg-[#202020] hover:bg-[#FF0000] border-l border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer font-semibold text-xs gap-1" 
                  title="Search YouTube"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* FLOATING INLINE YOUTUBE SEARCH RESULTS DROPDOWN (On Same Page) */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl max-h-[420px] overflow-y-auto">
                <div className="p-2.5 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between text-xs text-[#AAAAAA]">
                  <span className="font-semibold flex items-center gap-1 text-white">
                    <span className="text-[#FF0000]">▶</span> YouTube Live Results
                  </span>
                  <span className="text-[11px] font-mono text-[#717171]">{searchResults.length} videos found</span>
                </div>

                <div className="p-1.5 flex flex-col gap-1">
                  {searchResults.map((item) => (
                    <div 
                      key={item.videoId}
                      onClick={() => handlePlayVideo(item.videoId, item.title)}
                      className="group flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1 py-0.5 rounded">
                            {item.duration}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs font-semibold text-white group-hover:text-[#FF8080] truncate transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">
                            {item.channelTitle} • <span className="text-slate-400 font-mono">{item.views}</span>
                          </p>
                        </div>
                      </div>

                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(item.videoId, item.title);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-semibold shadow-md flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                        <span>Play</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Instant Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto justify-start md:justify-end shrink-0 py-0.5">
            {['Arijit Singh', 'Planet Earth', 'Interstellar', 'Lofi Beats', 'Trailer'].map((chip) => (
              <button 
                key={chip}
                type="button" 
                onClick={() => setSearchQuery(chip)} 
                className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-[#FF0000]/20 border border-white/[0.08] hover:border-[#FF0000]/40 text-xs font-medium text-slate-200 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
