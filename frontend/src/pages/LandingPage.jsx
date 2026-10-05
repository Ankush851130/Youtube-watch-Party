import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoomApi, listRoomsApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setUser } = useSocket();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [createRoomName, setCreateRoomName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  
  const [activeRooms, setActiveRooms] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [partyLightsOn, setPartyLightsOn] = useState(true);

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

    if (isPrivate && !roomPassword.trim()) {
      setErrorMsg('Please set a password for your private room.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await createRoomApi(
        createRoomName.trim() || 'Watch Party', 
        createUsername.trim(),
        isPrivate,
        roomPassword.trim()
      );
      if (res.success && res.data) {
        try {
          if (res.data.roomCode && res.data.userId) {
            localStorage.setItem(`watchparty_host_${res.data.roomCode.toUpperCase()}`, res.data.userId);
          }
        } catch (e) {}

        setUser({
          userId: res.data.userId,
          username: createUsername.trim(),
          role: 'HOST',
          password: roomPassword.trim()
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
      role: 'PARTICIPANT',
      password: joinPassword.trim() || null
    });

    navigate(`/room/${cleanCode.toUpperCase()}`);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FF0000]/30 overflow-hidden">
      {/* Dynamic Animated Party Lights & Ambient Spotlight Layer */}
      {partyLightsOn && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Party Orb 1: Neon Crimson Red */}
          <div className="absolute -top-10 left-1/4 w-[500px] h-[500px] bg-[#FF0000]/25 rounded-full blur-[110px] animate-party-orb-1"></div>

          {/* Party Orb 2: Disco Violet/Purple */}
          <div className="absolute top-32 right-1/4 w-[550px] h-[550px] bg-[#9333EA]/25 rounded-full blur-[120px] animate-party-orb-2"></div>

          {/* Party Orb 3: Electric Cyan/Blue */}
          <div className="absolute bottom-20 left-1/3 w-[450px] h-[450px] bg-[#06B6D4]/20 rounded-full blur-[95px] animate-party-orb-3"></div>

          {/* Party Orb 4: Hot Neon Pink */}
          <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-[#EC4899]/20 rounded-full blur-[90px] animate-party-orb-1"></div>

          {/* Party Orb 5: Party Amber/Gold */}
          <div className="absolute bottom-10 right-1/3 w-[350px] h-[350px] bg-[#F59E0B]/15 rounded-full blur-[85px] animate-party-orb-2"></div>

          {/* Party Laser Spotlight Beams */}
          <div className="absolute -top-32 left-1/3 w-[320px] h-[700px] bg-gradient-to-b from-[#FF0000]/25 via-[#9333EA]/15 to-transparent blur-3xl animate-laser-beam"></div>
          <div className="absolute -top-32 right-1/3 w-[320px] h-[700px] bg-gradient-to-b from-[#06B6D4]/20 via-[#EC4899]/15 to-transparent blur-3xl animate-laser-beam" style={{ animationDelay: '-3.5s' }}></div>

          {/* Floating Party Sparkles */}
          <div className="absolute top-1/4 left-16 text-2xl opacity-60 animate-party-sparkle">✨</div>
          <div className="absolute top-1/3 right-20 text-3xl opacity-70 animate-party-sparkle" style={{ animationDelay: '1.5s' }}>🍿</div>
          <div className="absolute bottom-1/3 left-24 text-2xl opacity-60 animate-party-sparkle" style={{ animationDelay: '3s' }}>🎵</div>
          <div className="absolute top-1/2 left-10 text-2xl opacity-50 animate-party-sparkle" style={{ animationDelay: '0.8s' }}>🎉</div>
          <div className="absolute bottom-1/4 right-28 text-3xl opacity-65 animate-party-sparkle" style={{ animationDelay: '2.2s' }}>🎬</div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="relative z-10 w-full bg-[#0E0E0E]/90 border-b border-white/[0.08] backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF0000] flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#FF0000]/30 text-sm">
              ▶
            </div>
            <span className="font-display font-extrabold tracking-tight text-lg text-white flex items-center gap-2">
              WATCHTOGETHER <span className="text-xs font-mono font-medium text-[#FF4D4D] px-1.5 py-0.5 rounded bg-[#FF0000]/10 border border-[#FF0000]/20">Party Cinema</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Party Ambient Lights Toggle Button */}
            <button
              onClick={() => setPartyLightsOn(!partyLightsOn)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                partyLightsOn 
                  ? 'bg-gradient-to-r from-[#FF0000]/20 via-[#9333EA]/20 to-[#06B6D4]/20 border-[#FF0000]/40 text-white shadow-md shadow-[#FF0000]/20' 
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Party Ambient Spotlights"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-300 animate-pulse">auto_awesome</span>
              <span>Party Lights {partyLightsOn ? 'ON' : 'OFF'}</span>
            </button>

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
      <main className="relative z-10 flex-1 max-w-[1400px] mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">

        {/* Hero Party Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF0000]/20 via-[#9333EA]/20 to-[#06B6D4]/20 border border-[#FF0000]/30 text-white text-xs font-semibold tracking-wide mb-6 shadow-xl backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000] animate-ping"></span>
          <span>🎉 Live YouTube Watch Party Theater</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Watch YouTube together, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0000] via-[#EC4899] to-[#9333EA] drop-shadow-[0_0_35px_rgba(255,0,0,0.4)]">
            in perfect real-time sync.
          </span>
        </h1>

        <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-2xl font-normal drop-shadow">
          Create a virtual theater party, invite friends with a single passcode, and watch YouTube videos in frame-by-frame synchronization.
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

              {/* Room Privacy Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Room Access Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#181818] rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => { setIsPrivate(false); setRoomPassword(''); }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isPrivate ? 'bg-[#FF0000]/20 text-[#FF4D4D] border border-[#FF0000]/40' : 'text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    <span>🌐 Public Room</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPrivate ? 'bg-[#FF0000]/20 text-[#FF4D4D] border border-[#FF0000]/40' : 'text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    <span>🔒 Private (Password)</span>
                  </button>
                </div>
              </div>

              {/* Password Input for Private Room */}
              {isPrivate && (
                <div className="animate-fadeIn space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Room Password</span>
                    <span className="text-[11px] text-[#FF8080] font-mono">Protected</span>
                  </label>
                  <input 
                    type="password" 
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Enter password for this room"
                    className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#666] outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-[#AAAAAA]">Private rooms will not appear on the public rooms list.</p>
                </div>
              )}

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

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password <span className="text-[11px] font-normal text-[#AAAAAA]">(Only if joining a private room)</span></label>
                <input 
                  type="password" 
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Room Password (optional)"
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
        <div id="active-rooms" className="mt-16 w-full max-w-5xl text-left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#22C55E] shadow-[0_0_12px_#22c55e] animate-pulse"></div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Active Public Watch Parties
              </h3>
            </div>
            <span className="text-xs text-[#AAAAAA] font-mono bg-white/[0.05] border border-white/10 px-3 py-1 rounded-full">
              {activeRooms.length} {activeRooms.length === 1 ? 'Party' : 'Parties'} Live
            </span>
          </div>

          {activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeRooms.map((r) => {
                const bannerBg = r.currentVideoId 
                  ? `https://img.youtube.com/vi/${r.currentVideoId}/hqdefault.jpg`
                  : '/default-poster.jpg';

                return (
                  <div 
                    key={r.roomId}
                    onClick={() => {
                      setJoinCodeInput(r.roomCode);
                      setActiveTab('join');
                    }}
                    className="relative bg-[#121212]/90 hover:bg-[#161616] border border-white/10 hover:border-[#FF0000]/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_35px_rgba(255,0,0,0.35)] transition-all duration-300 group cursor-pointer hover:-translate-y-1.5 flex flex-col select-none"
                  >
                    {/* Animated Party Header Banner */}
                    <div className="relative h-36 w-full overflow-hidden bg-black">
                      <img 
                        src={bannerBg} 
                        alt={r.roomName}
                        className="w-full h-full object-cover object-center opacity-75 group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => { e.target.src = '/default-poster.jpg'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-black/40"></div>

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                        <span className="flex items-center gap-1.5 bg-[#FF0000] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-[#FF0000]/40 border border-white/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          <span>Live Party</span>
                        </span>

                        <span className="font-mono text-xs font-bold text-amber-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/40 shadow-md">
                          🔑 {r.roomCode}
                        </span>
                      </div>

                      {/* Party Soundwave Equalizer Animation */}
                      <div className="absolute bottom-3 left-4 flex items-end gap-1 z-10 opacity-85">
                        <span className="w-1 h-3 bg-[#FF0000] rounded-full animate-bounce"></span>
                        <span className="w-1 h-5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        <span className="w-1 h-6 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.45s' }}></span>
                      </div>
                    </div>

                    {/* Party Card Content */}
                    <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-white group-hover:text-[#FF4D4D] transition-colors truncate">
                          {r.roomName}
                        </h4>
                        <p className="text-xs text-slate-300 truncate flex items-center gap-1.5">
                          <span>{r.currentVideoTitle ? `🎵 ${r.currentVideoTitle}` : '🍿 Party Lobby • Ready to Watch'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                          <span className="font-semibold text-white">{r.participantCount || 1} watching</span>
                          <span className="text-[#666]">•</span>
                          <span className="text-[#4ade80]">Real-time Sync</span>
                        </div>

                        <button 
                          className="px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] group-hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] text-xs font-extrabold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md group-hover:scale-105"
                        >
                          <span>Join Party</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#121212]/80 border border-dashed border-white/15 my-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FF0000]/15 border border-[#FF0000]/30 text-[#FF0000] flex items-center justify-center text-2xl animate-pulse">
                🎉
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-extrabold text-white">No Public Parties Live</h4>
                <p className="text-xs text-[#AAAAAA]">Create your public watch party above to be featured here live!</p>
              </div>
            </div>
          )}
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
