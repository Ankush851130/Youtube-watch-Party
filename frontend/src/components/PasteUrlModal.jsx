import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { extractYouTubeId } from '../utils/youtubeUtils';

export default function PasteUrlModal({ isOpen, onClose }) {
  const { changeVideoSocket, addToast } = useSocket();
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const videoId = extractYouTubeId(urlInput);

    if (!videoId) {
      setErrorMsg('Enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or YouTube Music link)');
      return;
    }

    setErrorMsg('');
    
    let videoTitle = `YouTube Video (${videoId})`;
    let channelTitle = 'YouTube Stream';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.title) videoTitle = data.title;
        if (data.author_name) channelTitle = data.author_name;
      }
    } catch (err) {
      // Fallback to auto player title sync if oEmbed fails
    }

    changeVideoSocket(videoId, videoTitle, channelTitle);
    addToast(`Video updated to "${videoTitle}"`, 'success');
    setUrlInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-white backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">link</span>
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">Use YouTube URL</h3>
              <p className="text-xs text-[#AAAAAA]">Paste any YouTube video or livestream to watch in sync</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>YouTube Video Link</span>
              <span className="text-[11px] text-[#22C55E] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Direct Stream Supported
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#717171] text-[18px]">smart_display</span>
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setErrorMsg(''); }}
                placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)" 
                className="w-full bg-[#121212] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-[#717171] outline-none transition-all"
              />
            </div>
            {errorMsg ? (
              <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
            ) : (
              <p className="text-[11px] text-[#717171]">Supports YouTube Watch URLs, Shorts, and Live Streams.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#FF0000]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Play Together</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
