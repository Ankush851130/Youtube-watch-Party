import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoomApi, listRoomsApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setUser } = useSocket();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [createRoomName, setCreateRoomName] = useState('Friday Movie Night');
  const [createUsername, setCreateUsername] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await listRoomsApi();
      if (res.success && res.data) {
        setActiveRooms(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch active public rooms:', e);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createUsername.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await createRoomApi(createRoomName, createUsername.trim());
      if (res.success && res.data) {
        setUser({
          userId: res.data.userId,
          username: createUsername.trim(),
          role: 'HOST'
        });
        navigate(`/room/${res.data.roomCode}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setErrorMsg('Please enter a 6-digit Room Code or Room Link.');
      return;
    }
    if (!joinUsername.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setErrorMsg('');

    // Extract room code if full URL was pasted
    let cleanCode = joinCodeInput.trim();
    if (cleanCode.includes('/room/')) {
      cleanCode = cleanCode.split('/room/')[1].split('/')[0].split('?')[0];
    }

    setUser({
      username: joinUsername.trim(),
      role: 'PARTICIPANT'
    });

    navigate(`/room/${cleanCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF0000]/30">
      {/* Top Navbar */}
      <header className="w-full bg-[#0E0E0E]/90 border-b border-white/[0.08] backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF0000] flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#FF0000]/30 text-sm">
              ▶
            </div>
            <span className="font-display font-extrabold tracking-tight text-lg text-white">
              WATCHTOGETHER <span className="text-xs font-mono font-medium text-[#FF4D4D] px-1.5 py-0.5 rounded bg-[#FF0000]/10 border border-[#FF0000]/20">Cinema</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="#active-rooms"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              Public Rooms ({activeRooms.length})
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/25 text-[#FF4D4D] text-xs font-semibold tracking-wide mb-6 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#FF0000]"></span>
          <span>Real-Time WebSocket Synchronization</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Watch YouTube together, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0000] via-[#FF4D4D] to-[#FF8080]">
            in perfect real-time sync.
          </span>
        </h1>

        <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-2xl font-normal">
          Create a virtual theater room, invite friends with a single code, and watch YouTube videos in frame-by-frame synchronization.
        </p>

        {/* Action Card Box */}
        <div className="mt-10 w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-left">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-[#0E0E0E] rounded-xl border border-white/[0.08] mb-6">
            <button
              onClick={() => { setActiveTab('create'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'create' ? 'bg-[#FF0000] text-white shadow-md' : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Create Watch Party
            </button>
            <button
              onClick={() => { setActiveTab('join'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'join' ? 'bg-[#FF0000] text-white shadow-md' : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Party Room Name</label>
                <input 
                  type="text" 
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  placeholder="e.g., Friday Movie Night"
                  className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Name (Host)</label>
                <input 
                  type="text" 
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="e.g., Ankush"
                  className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm shadow-lg shadow-[#FF0000]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>{isSubmitting ? 'Creating Room...' : 'Create Watch Party'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Room Code or Invite Link</label>
                <input 
                  type="text" 
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="e.g., X7K92P or https://.../room/X7K92P"
                  className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-[#666] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Display Name</label>
                <input 
                  type="text" 
                  value={joinUsername}
                  onChange={(e) => setJoinUsername(e.target.value)}
                  placeholder="e.g., Rahul"
                  className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full h-12 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-sm shadow-lg shadow-[#FF0000]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Join Watch Party</span>
              </button>
            </form>
          )}
        </div>

        {/* Featured Public Rooms */}
        <div id="active-rooms" className="mt-16 w-full max-w-4xl text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              Active Public Watch Parties
            </h3>
            <span className="text-xs text-[#AAAAAA] font-mono">{activeRooms.length} rooms live</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRooms.map((r) => (
              <div 
                key={r.roomId}
                onClick={() => {
                  setJoinCodeInput(r.roomCode);
                  setActiveTab('join');
                }}
                className="p-4 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 hover:border-[#FF0000]/40 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{r.roomName}</span>
                    <span className="text-[10px] font-mono text-[#FF8080] bg-[#FF0000]/10 px-2 py-0.5 rounded border border-[#FF0000]/20 font-semibold">
                      {r.roomCode}
                    </span>
                  </div>
                  <p className="text-xs text-[#AAAAAA] flex items-center gap-2 font-mono">
                    <span>{r.participantCount} watching</span>
                    <span>•</span>
                    <span className="text-emerald-400">Live Sync</span>
                  </p>
                </div>
                <button className="px-3.5 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-xs font-semibold text-white shrink-0">
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          <div className="p-6 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF4D4D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">sync</span>
            </div>
            <h4 className="font-bold text-base text-white">WebSocket Sync</h4>
            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Every Play, Pause, Seek, and Change Video action is broadcast via WebSockets for sub-second playback alignment across all devices.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF4D4D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
            </div>
            <h4 className="font-bold text-base text-white">Role Permissions</h4>
            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Host has full room control. Assign Moderators to manage playback, while Participants enjoy view-only synchronized streaming.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF4D4D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <h4 className="font-bold text-base text-white">Instant YouTube Search</h4>
            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Search YouTube directly inside the app or paste any video link to change the stream instantly for everyone in the room.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] py-6 text-center text-xs text-[#717171]">
        WatchTogether — YouTube Watch Party System • Full Stack Real-Time Application
      </footer>
    </div>
  );
}
