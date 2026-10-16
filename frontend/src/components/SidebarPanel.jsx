import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getRecommendationsApi } from '../services/api';

export default function SidebarPanel({ 
  onOpenShare, 
  onOpenRoleModal,
  activeTab: controlledActiveTab,
  onTabChange,
  unreadCount: controlledUnreadCount
}) {
  const { room, user, assignRoleSocket, transferHostSocket, removeParticipantSocket, messages, sendMessageSocket, changeVideoSocket, grantMicSocket, revokeMicSocket, addToast } = useSocket();
  const [internalActiveTab, setInternalActiveTab] = useState('recommendations'); // 'recommendations' | 'people' | 'chat'
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);
  const [chatInputText, setChatInputText] = useState('');
  const [openUserDropdown, setOpenUserDropdown] = useState(null);

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  const currentUserId = user?.userId;
  const prevMessagesLengthRef = useRef(messages?.length || 0);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'chat') {
      setInternalUnreadCount(0);
    }
  }, [activeTab]);

  useEffect(() => {
    const prevLen = prevMessagesLengthRef.current;
    const currentLen = messages?.length || 0;
    prevMessagesLengthRef.current = currentLen;

    if (currentLen > prevLen) {
      if (activeTabRef.current !== 'chat') {
        const newMsgs = messages.slice(prevLen);
        const unreadFromOthers = newMsgs.filter(m => m.userId !== currentUserId).length;
        if (unreadFromOthers > 0) {
          setInternalUnreadCount(prev => prev + unreadFromOthers);
        }
      }
    }
  }, [messages, currentUserId]);

  const unreadCount = controlledUnreadCount !== undefined ? controlledUnreadCount : internalUnreadCount;

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'chat') {
      setInternalUnreadCount(0);
    }
  };

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const chatScrollRef = useRef(null);

  const rawParticipants = room?.participants || [];
  const participants = Array.from(
    new Map((Array.isArray(rawParticipants) ? rawParticipants : []).map(p => [p.userId || p.username, p])).values()
  );
  const isHost = user?.role === 'HOST';
  const isModerator = user?.role === 'MODERATOR';
  const canManageMic = isHost || isModerator;
  const pendingMicRequests = participants.filter(p => p.micRequested);
  const currentVideoId = room?.videoId || room?.currentVideoId || 'jfKfPfyJRdk';

  // Fetch YouTube Recommendations
  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      setIsLoadingRecs(true);
      try {
        const res = await getRecommendationsApi(currentVideoId);
        if (isMounted && res.success && res.data) {
          setRecommendations(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        if (isMounted) setIsLoadingRecs(false);
      }
    };

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [currentVideoId]);

  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    sendMessageSocket(chatInputText);
    setChatInputText('');
  };

  const handlePlayRecommendation = (videoId, title, channelTitle) => {
    changeVideoSocket(videoId, title, channelTitle);
    addToast(`Video changed to "${title}"`, 'success');
  };

  const handleRoleAction = (targetUser, newRole) => {
    setOpenUserDropdown(null);
    onOpenRoleModal(targetUser, newRole);
  };

  const handleTransferHostAction = (targetUser) => {
    setOpenUserDropdown(null);
    if (window.confirm(`👑 Are you sure you want to transfer Host leadership to ${targetUser.username}? You will become a Moderator.`)) {
      transferHostSocket(targetUser.userId);
    }
  };

  const handleRemoveAction = (targetUser) => {
    setOpenUserDropdown(null);
    if (window.confirm(`Are you sure you want to remove ${targetUser.username} from this watch party?`)) {
      removeParticipantSocket(targetUser.userId);
    }
  };

  return (
    <aside className="w-full flex flex-col bg-[#121212] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden min-h-[440px] sm:min-h-[540px] max-h-[620px] lg:max-h-[820px]">
      {/* 3 Tabs Header: Up Next / People / Chat */}
      <div className="flex items-center p-1 sm:p-1.5 bg-[#0E0E0E]/90 border-b border-white/[0.08]">
        <button 
          onClick={() => handleTabChange('recommendations')}
          className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeTab === 'recommendations' 
              ? 'bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 shadow-sm font-semibold' 
              : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">play_circle</span>
          <span>Up Next</span>
        </button>

        <button 
          onClick={() => handleTabChange('people')}
          className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            activeTab === 'people' 
              ? 'bg-white/[0.08] text-white shadow-sm font-semibold' 
              : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">group</span>
          <span>People ({participants.length})</span>
        </button>

        <button 
          id="sidebar-chat-tab-btn"
          onClick={() => handleTabChange('chat')}
          className={`relative flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'chat' 
              ? 'bg-white/[0.08] text-white shadow-sm font-semibold' 
              : 'text-[#AAAAAA] hover:text-white'
          }`}
        >
          <div className="relative inline-flex items-center justify-center">
            <span className={`material-symbols-outlined text-[15px] sm:text-[16px] transition-colors ${
              unreadCount > 0 && activeTab !== 'chat' ? 'text-[#FF4D4D]' : ''
            }`}>
              chat_bubble
            </span>
            {unreadCount > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF0000] text-white text-[9px] font-mono font-extrabold flex items-center justify-center shadow-md shadow-[#FF0000]/70 ring-2 ring-[#0E0E0E] animate-pulse leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span>Chat</span>
          {unreadCount > 0 && activeTab !== 'chat' && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#FF0000]/20 text-[#FF4D4D] text-[10px] font-mono font-bold border border-[#FF0000]/30 hidden xs:inline-flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: RECOMMENDATIONS / UP NEXT */}
      {activeTab === 'recommendations' && (
        <div className="flex-1 flex flex-col p-3.5 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse"></span>
              <span className="text-xs font-bold text-white tracking-tight">YouTube Recommendations</span>
            </div>
            <span className="text-[10px] font-mono text-[#AAAAAA] bg-white/[0.05] px-2 py-0.5 rounded-full">
              Actual Up Next
            </span>
          </div>

          {isLoadingRecs ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recommendations.map((item) => (
                <div 
                  key={item.videoId}
                  onClick={() => handlePlayRecommendation(item.videoId, item.title, item.channelTitle)}
                  className="group flex items-start gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1 py-0.5 rounded font-semibold">
                      {item.duration}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-0.5">
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-[#FF8080] line-clamp-2 leading-tight transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#AAAAAA] truncate mt-1">{item.channelTitle}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.05]">
                      <span className="text-[10px] font-mono text-slate-400">{item.views}</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayRecommendation(item.videoId, item.title, item.channelTitle);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-semibold flex items-center gap-1 shadow transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: PEOPLE */}
      {activeTab === 'people' && (
        <div className="flex-1 flex flex-col p-4 justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header status row */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                <span className="font-semibold text-slate-200">
                  People • {participants.length} watching
                </span>
              </div>
              <span className="text-[#717171] font-mono text-[11px]">Room Limit: 50</span>
            </div>

            {/* Speaking Permission Requests Banner (For Host / Moderator) */}
            {canManageMic && pendingMicRequests.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5 animate-fade-in shadow-lg shadow-black/40">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span>✋</span> Speaking Permission Requests ({pendingMicRequests.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {pendingMicRequests.map((req) => (
                    <div key={req.userId} className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-white/5">
                      <span className="text-white font-medium truncate max-w-[140px]">{req.username}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => grantMicSocket(req.userId)}
                          className="px-2.5 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-[11px] shadow-sm cursor-pointer transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => revokeMicSocket(req.userId)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#AAAAAA] hover:text-white font-medium text-[11px] cursor-pointer transition-all"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users List */}
            {participants.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {participants.map((p) => {
                  const isYou = p.userId === currentUserId;
                  const roleLabel = p.role === 'HOST' ? '👑 Host' : p.role === 'MODERATOR' ? '🛡️ Moderator' : '👤 Participant';

                  return (
                    <div 
                      key={p.userId} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        p.isSpeaking
                          ? 'bg-[#22C55E]/10 border-[#22C55E]/40 shadow-lg shadow-[#22C55E]/10'
                          : isYou 
                            ? 'bg-white/[0.03] hover:bg-[#181818] border-white/[0.06]' 
                            : 'bg-white/[0.02] hover:bg-[#181818] border-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`relative w-11 h-11 rounded-full ${p.isSpeaking ? 'ring-2 ring-[#22C55E] animate-pulse bg-[#202020]' : p.role === 'HOST' ? 'bg-[#FF0000] ring-2 ring-[#FF0000]/40' : 'bg-[#202020] ring-2 ring-white/10'} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                          {p.username.charAt(0).toUpperCase()}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 ${p.online ? 'bg-[#22C55E]' : 'bg-gray-500'} rounded-full ring-2 ring-[#121212]`}></span>
                          {p.isSpeaking && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] text-black flex items-center justify-center text-[10px] shadow-md font-bold">
                              🎙️
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">{p.username}</span>
                            {isYou && <span className="text-xs text-[#AAAAAA]">(You)</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-xs font-medium ${p.role === 'HOST' ? 'text-[#FF4D4D]' : 'text-slate-300'}`}>
                              {roleLabel}
                            </span>
                            {p.isSpeaking && (
                              <span className="text-[10px] font-mono font-bold bg-[#22C55E]/20 text-[#22C55E] px-1.5 py-0.5 rounded border border-[#22C55E]/30 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
                                Speaking
                              </span>
                            )}
                            {!p.isSpeaking && p.micRequested && (
                              <span className="text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                ✋ Asked to speak
                              </span>
                            )}
                            {!p.isSpeaking && p.micAllowed && p.role === 'PARTICIPANT' && (
                              <span className="text-[10px] font-mono font-semibold bg-[#22C55E]/10 text-[#22C55E] px-1.5 py-0.5 rounded border border-[#22C55E]/20">
                                🎙️ Mic Allowed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Mic Action Buttons & Host Dropdown */}
                      <div className="flex items-center gap-1.5">
                        {canManageMic && !isYou && p.micRequested && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => grantMicSocket(p.userId)}
                              className="px-2 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold text-[11px] shadow-sm cursor-pointer transition-all"
                              title="Approve Speaking Request"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => revokeMicSocket(p.userId)}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#AAAAAA] hover:text-white cursor-pointer transition-all text-xs"
                              title="Deny Request"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {canManageMic && !isYou && p.micAllowed && p.role === 'PARTICIPANT' && !p.micRequested && (
                          <button
                            onClick={() => revokeMicSocket(p.userId)}
                            className="px-2 py-1 rounded-lg bg-[#DC2626]/15 hover:bg-[#DC2626]/25 border border-[#DC2626]/30 text-[#FF8080] font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Mute / Revoke Speaking Permission"
                          >
                            <span className="material-symbols-outlined text-[14px]">mic_off</span>
                            <span>Mute</span>
                          </button>
                        )}

                        {/* Dropdown for Host */}
                        {isHost && !isYou && (
                          <div className="relative">
                            <button 
                              onClick={() => setOpenUserDropdown(openUserDropdown === p.userId ? null : p.userId)}
                              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title={`Manage ${p.username}`}
                            >
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>

                            {openUserDropdown === p.userId && (
                              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#202020] border border-white/10 shadow-2xl p-1 z-30 text-xs">
                                {p.role === 'PARTICIPANT' && (
                                  p.micAllowed ? (
                                    <button
                                      onClick={() => {
                                        revokeMicSocket(p.userId);
                                        setOpenUserDropdown(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[#FF8080] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>🔇 Revoke Mic</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        grantMicSocket(p.userId);
                                        setOpenUserDropdown(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[#22C55E] hover:bg-[#22C55E]/10 rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>🎙️ Allow to Speak</span>
                                    </button>
                                  )
                                )}

                                <button 
                                  onClick={() => handleTransferHostAction(p)}
                                  className="w-full text-left px-3 py-2 text-amber-400 font-semibold hover:bg-amber-400/10 rounded-lg cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>👑 Make Host</span>
                                </button>
                                {p.role === 'MODERATOR' ? (
                                  <button 
                                    onClick={() => handleRoleAction(p, 'PARTICIPANT')}
                                    className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer"
                                  >
                                    Demote to Participant
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleRoleAction(p, 'MODERATOR')}
                                    className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-lg cursor-pointer"
                                  >
                                    Make Moderator
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRemoveAction(p)}
                                  className="w-full text-left px-3 py-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer"
                                >
                                  Remove from Room
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center flex flex-col items-center justify-center gap-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 my-4">
                <div className="w-12 h-12 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF4D4D] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">group_off</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">You're the only one here</h4>
                  <p className="text-xs text-[#AAAAAA] max-w-[220px]">Invite your friends with the room code to start watching synchronized videos.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA: Invite Friends */}
          <div className="pt-4 mt-auto">
            <button 
              onClick={onOpenShare}
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-100 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#FF4D4D] group-hover:scale-110 transition-transform">person_add</span>
              <span>Invite Friends</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CHAT */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col p-3 sm:p-4 justify-between h-[420px] sm:h-[520px]">
          {/* Messages Scroll Area */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 sm:space-y-3.5 pr-1 sm:pr-1.5 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#717171]">
                <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">forum</span>
                <p className="text-xs">No chat messages yet.</p>
                <p className="text-[11px] text-[#555]">Say hello to the watch party!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isYou = msg.userId === currentUserId;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2.5 ${isYou ? 'flex-row-reverse self-end max-w-[85%]' : 'max-w-[85%]'}`}
                  >
                    <div className={`w-7 h-7 rounded-full ${isYou ? 'bg-[#FF0000]' : 'bg-[#202020]'} text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm border border-white/10 uppercase`}>
                      {msg.username.charAt(0)}
                    </div>
                    <div className={`flex flex-col ${isYou ? 'items-end' : ''} min-w-0`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${isYou ? 'text-[#FF8080]' : 'text-slate-300'}`}>
                          {msg.username} {isYou ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-[#717171] font-mono">{msg.timestamp}</span>
                      </div>
                      <div className={`${isYou ? 'bg-[#FF0000] text-white rounded-2xl rounded-tr-sm' : 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-2xl rounded-tl-sm'} px-3 py-1.5 text-xs mt-1 shadow-sm break-words`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/[0.08] flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Send a message..." 
                className="w-full bg-[#181818] border border-white/[0.08] focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-[#717171] outline-none transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="w-8 h-8 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-[#FF0000]/25 cursor-pointer" 
              title="Send message"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
