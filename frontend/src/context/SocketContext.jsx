import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('Connecting'); // 'Connected' | 'Connecting' | 'Reconnecting' | 'Disconnected'
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('watchtogether_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [activeSpeakers, setActiveSpeakers] = useState([]); // [{ userId, username }]
  const [micRequests, setMicRequests] = useState([]); // [{ userId, username }]

  const socketRef = useRef(null);
  const activeRoomParamsRef = useRef(null);

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin);
    const SOCKET_URL = rawSocketUrl ? rawSocketUrl.replace(/\/$/, '') : window.location.origin;

    const token = localStorage.getItem('watchtogether_token');
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const attemptRejoin = () => {
      setConnectionState('Connected');
      if (activeRoomParamsRef.current && activeRoomParamsRef.current.roomCode) {
        console.log('🔄 Auto-rejoining room on socket connect:', activeRoomParamsRef.current.roomCode);
        const currentToken = localStorage.getItem('watchtogether_token');
        newSocket.emit('join_room', {
          ...activeRoomParamsRef.current,
          token: currentToken
        });
      }
    };

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected:', newSocket.id);
      attemptRejoin();
    });

    newSocket.on('disconnect', (reason) => {
      setConnectionState('Disconnected');
      console.log('🔌 Socket disconnected:', reason);
      addToast('Connection lost. Reconnecting...', 'warning');
    });

    newSocket.on('reconnecting', () => {
      setConnectionState('Reconnecting');
    });

    newSocket.on('reconnect', () => {
      console.log('🔄 Socket reconnected:', newSocket.id);
      attemptRejoin();
      addToast('Connection restored', 'success');
    });

    // Room events
    newSocket.on('room_state', (data) => {
      if (data) {
        data.videoId = data.videoId || data.currentVideoId;
        data.videoTitle = data.videoTitle || data.currentVideoTitle;
        data.channelTitle = data.channelTitle || data.currentChannelTitle;
      }
      setRoom(data);
      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem('watchtogether_user', JSON.stringify(data.user));
          if (data.user.role === 'HOST' && data.roomCode) {
            localStorage.setItem(`watchparty_host_${data.roomCode.toUpperCase()}`, data.user.userId);
          }
        } catch (e) {
          console.warn('Storage save failed:', e);
        }
      }
    });

    newSocket.on('sync_state', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || data.currentVideoId || prev.videoId,
        videoTitle: data.videoTitle || data.currentVideoTitle || prev.videoTitle,
        channelTitle: data.channelTitle || data.currentChannelTitle || prev.channelTitle,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        lastUpdated: data.lastUpdated,
        participants: data.participants
      } : null);
    });

    newSocket.on('user_joined', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      addToast(data.message || `${data.username} joined the party`, 'info');
    });

    newSocket.on('user_left', (data) => {
      const username = data.username || 'A participant';
      setRoom(prev => {
        if (!prev) return null;
        const updatedParticipants = data.participants
          ? data.participants
          : (prev.participants || []).filter(p => p.userId !== data.userId);
        return { 
          ...prev, 
          hostId: data.hostId || prev.hostId, 
          participants: updatedParticipants 
        };
      });
      addToast(`👋 ${username} has left the room`, 'warning');
    });

    newSocket.on('play', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        videoTitle: data.videoTitle || prev.videoTitle,
        channelTitle: data.channelTitle || prev.channelTitle,
        isPlaying: true,
        currentTime: data.currentTime,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('pause', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        videoTitle: data.videoTitle || prev.videoTitle,
        channelTitle: data.channelTitle || prev.channelTitle,
        isPlaying: false,
        currentTime: data.currentTime,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('seek', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        videoTitle: data.videoTitle || prev.videoTitle,
        channelTitle: data.channelTitle || prev.channelTitle,
        currentTime: data.currentTime,
        isPlaying: data.isPlaying !== undefined ? data.isPlaying : prev.isPlaying,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('change_video', (data) => {
      const newVideoId = data.videoId || data.currentVideoId;
      const newVideoTitle = data.videoTitle || data.currentVideoTitle;
      const newChannelTitle = data.channelTitle || data.currentChannelTitle;
      setRoom(prev => prev ? {
        ...prev,
        videoId: newVideoId,
        videoTitle: newVideoTitle || prev.videoTitle,
        channelTitle: newChannelTitle || prev.channelTitle,
        isPlaying: true,
        currentTime: 0,
        lastUpdated: data.lastUpdated
      } : null);
      addToast(`Video changed to "${newVideoTitle || 'synchronized stream'}"`, 'info');
    });

    newSocket.on('speed_changed', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        playbackSpeed: data.playbackSpeed
      } : null);
      addToast(data.message || `Playback speed changed to ${data.playbackSpeed}x`, 'info');
    });

    newSocket.on('role_assigned', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setUser(prev => prev && prev.userId === data.userId ? { ...prev, role: data.role } : prev);
      addToast(data.message || `${data.username} is now a ${data.role}`, 'info');
    });

    newSocket.on('host_transferred', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        hostId: data.hostId || data.newHostId,
        participants: data.participants
      } : null);
      setUser(prev => {
        if (!prev) return null;
        if (prev.userId === data.newHostId) {
          return { ...prev, role: 'HOST' };
        } else if (prev.role === 'HOST') {
          return { ...prev, role: 'MODERATOR' };
        }
        return prev;
      });
      addToast(data.message || `👑 ${data.newHostName || 'A participant'} is now the Host!`, 'success');
    });

    newSocket.on('participant_removed', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      addToast(data.message || `${data.username} was removed`, 'warning');
    });

    newSocket.on('participant_removed_self', (data) => {
      setRoom(null);
      addToast(data.message || "You've been removed from this watch party.", 'error');
    });

    newSocket.on('action_error', (data) => {
      addToast(data.message || 'Action rejected by server', 'error');
    });

    newSocket.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    newSocket.on('emoji_reaction', (data) => {
      const emojiId = `emoji_${Date.now()}_${Math.random()}`;
      setFloatingEmojis(prev => [...prev.slice(-6), { id: emojiId, ...data }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
      }, 2600);
    });

    // ================= AUDIO DUCKING & MIC EVENTS =================
    newSocket.on('mic_requested', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setMicRequests(prev => {
        if (prev.some(r => r.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
      addToast(data.message || `✋ ${data.username} requested permission to speak`, 'info');
    });

    newSocket.on('mic_request_cancelled', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setMicRequests(prev => prev.filter(r => r.userId !== data.userId));
    });

    newSocket.on('mic_granted', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setMicRequests(prev => prev.filter(r => r.userId !== data.targetUserId));
      addToast(data.message || `🎙️ ${data.targetUsername} granted mic access`, 'info');
    });

    newSocket.on('mic_granted_self', (data) => {
      addToast(data.message || '🎙️ You can now speak! Click unmute or hold Spacebar.', 'success');
    });

    newSocket.on('mic_revoked', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setActiveSpeakers(prev => prev.filter(s => s.userId !== data.targetUserId));
      addToast(data.message || `🔇 ${data.targetUsername}'s mic access was revoked`, 'warning');
    });

    newSocket.on('mic_revoked_self', (data) => {
      setActiveSpeakers(prev => prev.filter(s => s.userId === user?.userId));
      addToast(data.message || '🔇 Your microphone permission was revoked.', 'error');
    });

    // Speaking state changed (Audio Ducking trigger)
    newSocket.on('user_speaking_state', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setActiveSpeakers(prev => {
        if (data.isSpeaking) {
          if (prev.some(s => s.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        } else {
          return prev.filter(s => s.userId !== data.userId);
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Periodic heartbeat & tab focus sync to keep playback frame-perfect
  useEffect(() => {
    if (!room?.roomCode) return;

    const requestSync = () => {
      if (socketRef.current) {
        socketRef.current.emit('sync_state');
      }
    };

    const interval = setInterval(requestSync, 3000);
    window.addEventListener('focus', requestSync);
    document.addEventListener('visibilitychange', requestSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', requestSync);
      document.removeEventListener('visibilitychange', requestSync);
    };
  }, [room?.roomCode]);

  // Action methods
  const joinRoomSocket = (roomCode, username, requestedUserId = null, password = null) => {
    if (!socketRef.current) return;
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const token = localStorage.getItem('watchtogether_token');

    let targetUserId = requestedUserId || user?.userId;
    if (!targetUserId && cleanCode) {
      try {
        targetUserId = localStorage.getItem(`watchparty_host_${cleanCode}`);
      } catch (e) {}
    }

    // Save active room parameters for automatic transparent rejoining on reconnect
    activeRoomParamsRef.current = {
      roomCode: cleanCode,
      username,
      userId: targetUserId,
      password
    };

    socketRef.current.emit('join_room', {
      roomCode: cleanCode,
      username,
      userId: targetUserId,
      requestedUserId: targetUserId,
      password,
      token
    });
  };

  const playSocket = (currentTime) => {
    if (socketRef.current) socketRef.current.emit('play', { currentTime });
  };

  const pauseSocket = (currentTime) => {
    if (socketRef.current) socketRef.current.emit('pause', { currentTime });
  };

  const seekSocket = (currentTime, isPlaying) => {
    if (socketRef.current) socketRef.current.emit('seek', { currentTime, isPlaying });
  };

  const changeVideoSocket = (videoId, videoTitle, channelTitle) => {
    if (socketRef.current) socketRef.current.emit('change_video', { videoId, videoTitle, channelTitle });
  };

  const changeSpeedSocket = (playbackSpeed) => {
    if (socketRef.current) socketRef.current.emit('change_speed', { playbackSpeed });
  };

  const assignRoleSocket = (targetUserId, role) => {
    if (socketRef.current) socketRef.current.emit('assign_role', { targetUserId, role });
  };

  const transferHostSocket = (targetUserId) => {
    if (socketRef.current) socketRef.current.emit('transfer_host', { targetUserId });
  };

  const removeParticipantSocket = (targetUserId) => {
    if (socketRef.current) socketRef.current.emit('remove_participant', { targetUserId });
  };

  const sendMessageSocket = (message) => {
    if (socketRef.current) socketRef.current.emit('send_message', { message });
  };

  const sendEmojiSocket = (emoji) => {
    if (socketRef.current) socketRef.current.emit('emoji_reaction', { emoji });
  };

  // Mic Permission & Speaking State Sockets
  const requestMicSocket = () => {
    if (socketRef.current) socketRef.current.emit('request_mic');
  };

  const cancelMicRequestSocket = () => {
    if (socketRef.current) socketRef.current.emit('cancel_mic_request');
  };

  const grantMicSocket = (targetUserId) => {
    if (socketRef.current) socketRef.current.emit('grant_mic', { targetUserId });
  };

  const revokeMicSocket = (targetUserId) => {
    if (socketRef.current) socketRef.current.emit('revoke_mic', { targetUserId });
  };

  const setSpeakingStateSocket = (isSpeaking) => {
    if (socketRef.current) socketRef.current.emit('speaking_state', { isSpeaking });
  };

  const sendVoiceSignalSocket = (toUserId, signal) => {
    if (socketRef.current) socketRef.current.emit('voice_signal', { toUserId, signal });
  };

  const leaveRoomSocket = () => {
    activeRoomParamsRef.current = null;
    if (socketRef.current) socketRef.current.emit('leave_room');
    setRoom(null);
  };

  const isAudioDucked = activeSpeakers.length > 0;

  return (
    <SocketContext.Provider value={{
      socket,
      connectionState,
      room,
      user,
      setUser,
      toasts,
      addToast,
      removeToast,
      messages,
      floatingEmojis,
      activeSpeakers,
      micRequests,
      isAudioDucked,
      requestMicSocket,
      cancelMicRequestSocket,
      grantMicSocket,
      revokeMicSocket,
      setSpeakingStateSocket,
      sendVoiceSignalSocket,
      joinRoomSocket,
      playSocket,
      pauseSocket,
      seekSocket,
      changeVideoSocket,
      changeSpeedSocket,
      assignRoleSocket,
      transferHostSocket,
      removeParticipantSocket,
      sendMessageSocket,
      sendEmojiSocket,
      leaveRoomSocket
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
