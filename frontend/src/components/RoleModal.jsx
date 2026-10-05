import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function RoleModal({ isOpen, onClose, targetUser, defaultRole = 'MODERATOR' }) {
  const { assignRoleSocket, transferHostSocket, addToast } = useSocket();
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSave = () => {
    if (selectedRole === 'HOST') {
      transferHostSocket(targetUser.userId);
    } else {
      assignRoleSocket(targetUser.userId, selectedRole);
      addToast(`Role updated for ${targetUser.username}`, 'info');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">Manage Permissions</h3>
              <p className="text-xs text-[#AAAAAA]">Change role for <span className="text-[#FF8080] font-semibold">{targetUser.username}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAAAAA] hover:text-white p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Radio Options */}
        <div className="flex flex-col gap-2.5">
          <label 
            onClick={() => setSelectedRole('HOST')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedRole === 'HOST' 
                ? 'bg-[#FF0000]/10 border-amber-400' 
                : 'bg-white/[0.03] border-white/[0.08]'
            }`}
          >
            <input 
              type="radio" 
              name="selectedRoleOption" 
              value="HOST"
              checked={selectedRole === 'HOST'}
              onChange={() => setSelectedRole('HOST')}
              className="mt-1 accent-amber-400"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>👑</span> Make Host (Full Authority)
              </span>
              <span className="text-[11px] text-slate-300 mt-0.5">Transfer full room ownership to this participant. You will become a Moderator.</span>
            </div>
          </label>

          <label 
            onClick={() => setSelectedRole('MODERATOR')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedRole === 'MODERATOR' 
                ? 'bg-white/[0.06] border-[#FF0000]' 
                : 'bg-white/[0.03] border-white/[0.08]'
            }`}
          >
            <input 
              type="radio" 
              name="selectedRoleOption" 
              value="MODERATOR"
              checked={selectedRole === 'MODERATOR'}
              onChange={() => setSelectedRole('MODERATOR')}
              className="mt-1 accent-[#FF0000]"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>🛡️</span> Moderator
              </span>
              <span className="text-[11px] text-[#AAAAAA] mt-0.5">Can pause, play, seek, and change video. Cannot remove participants.</span>
            </div>
          </label>

          <label 
            onClick={() => setSelectedRole('PARTICIPANT')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedRole === 'PARTICIPANT' 
                ? 'bg-white/[0.06] border-[#FF0000]' 
                : 'bg-white/[0.03] border-white/[0.08]'
            }`}
          >
            <input 
              type="radio" 
              name="selectedRoleOption" 
              value="PARTICIPANT"
              checked={selectedRole === 'PARTICIPANT'}
              onChange={() => setSelectedRole('PARTICIPANT')}
              className="mt-1 accent-[#FF0000]"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>👤</span> Participant
              </span>
              <span className="text-[11px] text-[#AAAAAA] mt-0.5">View-only synchronization. Viewers can send chat and emoji reactions.</span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-5 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-semibold shadow-md shadow-[#FF0000]/30 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
