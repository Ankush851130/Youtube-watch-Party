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

  const socketRef = useRef(null);

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

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionState('Connected');
      console.log('⚡ Socket connected:', newSocket.id);
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
      setConnectionState('Connected');
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', requestSync);
    };
  }, [room?.roomCode]);

  // Action methods
  const joinRoomSocket = (roomCode, username, requestedUserId = null, password = null) => {
    if (!socketRef.current) return;
    const cleanCode = (roomCode || '').trim().toUpperCase();

    let targetUserId = requestedUserId || user?.userId;
    if (!targetUserId && cleanCode) {
      try {
        targetUserId = localStorage.getItem(`watchparty_host_${cleanCode}`);
      } catch (e) {}
    }

    socketRef.current.emit('join_room', {
      roomCode: cleanCode,
      username,
      userId: targetUserId,
      requestedUserId: targetUserId,
      password
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

  const leaveRoomSocket = () => {
    if (socketRef.current) socketRef.current.emit('leave_room');
    setRoom(null);
  };

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
