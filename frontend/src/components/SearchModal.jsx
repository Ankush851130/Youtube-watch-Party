import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { searchYouTubeApi } from '../services/api';

export default function SearchModal({ isOpen, onClose }) {
  const { changeVideoSocket, addToast } = useSocket();
  const [searchQuery, setSearchQuery] = useState('Arijit Singh / Interstellar / Planet Earth');
  const [results, setResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleSearch(searchQuery);
    }
  }, [isOpen]);

  const handleSearch = async (query) => {
    setIsLoading(true);
    try {
      const res = await searchYouTubeApi(query || '');
      if (res.success && res.data) {
        setResults(res.data);
        if (res.data.length > 0) {
          setSelectedVideo(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      addToast('Search failed. Using fallback catalog.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handlePlayTogether = () => {
    if (!selectedVideo) return;
    changeVideoSocket(selectedVideo.videoId, selectedVideo.title, selectedVideo.channelTitle);
    addToast(`Video changed to "${selectedVideo.title}"`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-6 backdrop-blur-xl flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">Search YouTube</h3>
              <p className="text-xs text-[#AAAAAA] mt-0.5">Find any video, song, or stream to sync instantly for everyone in this room</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer" 
            title="Close search"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#717171] text-[20px] pointer-events-none">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music, videos, movies..." 
              className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 placeholder:text-[#717171] outline-none transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-[#717171] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <button 
            type="submit"
            className="h-12 px-5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#FF0000]/25 transition-all shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Search</span>
          </button>
        </form>

        {/* Selected Video Banner */}
        {selectedVideo && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#FF0000]/15 to-[#FF0000]/5 border border-[#FF0000]/30 shadow-lg shadow-[#FF0000]/10 flex flex-col gap-3.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse shadow-[0_0_8px_#ff0000]"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF8080]">Selected Video to Sync</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Sync ready
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
              <div className="relative w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/15">
                <img 
                  src={selectedVideo.thumbnail} 
                  alt={selectedVideo.title} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/90 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {selectedVideo.duration}
                </span>
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-white truncate">{selectedVideo.title}</h4>
                <p className="text-xs text-[#AAAAAA] mt-1 flex items-center gap-2 truncate">
                  <span>{selectedVideo.channelTitle}</span>
                  <span>•</span>
                  <span className="text-slate-300 font-mono">{selectedVideo.views}</span>
                </p>
                <p className="text-[11px] text-[#AAAAAA] mt-1.5">Pressing Play Together starts synchronized streaming for everyone in the theater.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 border-t border-white/[0.06]">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-[#202020] hover:bg-[#181818] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handlePlayTogether}
                className="px-6 py-2.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#FF0000]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                <span>Play Together</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {isLoading ? (
          <div className="flex flex-col gap-3 my-1">
            <div className="text-xs text-[#AAAAAA]">Searching YouTube...</div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] h-20 animate-pulse"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA] px-1">
              <span className="font-medium">YouTube Search Results</span>
              <span className="font-mono text-[11px] text-[#717171]">{results.length} matches</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {results.map((item) => (
                <div 
                  key={item.videoId}
                  onClick={() => setSelectedVideo(item)}
                  className={`group flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedVideo?.videoId === item.videoId 
                      ? 'bg-white/[0.08] border-[#FF0000]' 
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                        {item.duration}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#FF8080] truncate transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#AAAAAA] truncate mt-0.5">{item.channelTitle} • {item.views}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-white/[0.06] group-hover:bg-[#FF0000] text-xs font-semibold text-slate-200 group-hover:text-white transition-all cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
