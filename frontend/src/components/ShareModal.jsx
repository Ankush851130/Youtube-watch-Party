import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function ShareModal({ isOpen, onClose }) {
  const { room, addToast } = useSocket();

  if (!isOpen) return null;

  const roomName = room?.roomName || 'Friday Movie Night';
  const roomCode = room?.roomCode || 'X7K92P';
  const shareUrl = `${window.location.origin}/room/${roomCode}`;

  const copyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    addToast('Invite link copied to clipboard!', 'info');
  };

  const copyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
    }
    addToast(`Room Passcode ${roomCode} copied!`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">Share {roomName}</h3>
              <p className="text-xs text-[#AAAAAA]">Friends can join with link or 6-digit code</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAAAAA] hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Invite URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Invite URL</label>
          <div className="flex items-center gap-2 bg-[#0E0E0E] border border-white/10 rounded-xl p-1.5">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-transparent px-2 text-xs font-mono text-[#FF8080] outline-none select-all"
            />
            <button 
              onClick={copyUrl} 
              className="px-3 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-medium cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#717171] font-mono">Room Passcode</span>
            <p className="text-lg font-mono font-bold text-white tracking-widest">{roomCode}</p>
          </div>
          <button 
            onClick={copyCode} 
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy Code</span>
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
