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
      }
      setRoom(data);
      if (data?.user) {
        setUser(data.user);
        try {
          localStorage.setItem('watchtogether_user', JSON.stringify(data.user));
        } catch (e) {
          console.warn('Storage save failed:', e);
        }
      }
    });

    newSocket.on('sync_state', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || data.currentVideoId || prev.videoId,
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
      setRoom(prev => prev ? { 
        ...prev, 
        hostId: data.hostId || prev.hostId, 
        participants: data.participants 
      } : null);
      addToast(data.message || `${data.username} left the room`, 'info');
    });

    newSocket.on('play', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        isPlaying: true,
        currentTime: data.currentTime,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('pause', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        isPlaying: false,
        currentTime: data.currentTime,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('seek', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        videoId: data.videoId || prev.videoId,
        currentTime: data.currentTime,
        isPlaying: data.isPlaying !== undefined ? data.isPlaying : prev.isPlaying,
        lastUpdated: data.lastUpdated
      } : null);
    });

    newSocket.on('change_video', (data) => {
      const newVideoId = data.videoId || data.currentVideoId;
      setRoom(prev => prev ? {
        ...prev,
        videoId: newVideoId,
        isPlaying: true,
        currentTime: 0,
        lastUpdated: data.lastUpdated
      } : null);
      addToast(`Video changed to synchronized stream`, 'info');
    });

    newSocket.on('role_assigned', (data) => {
      setRoom(prev => prev ? { ...prev, participants: data.participants } : null);
      setUser(prev => prev && prev.userId === data.userId ? { ...prev, role: data.role } : prev);
      addToast(data.message || `${data.username} is now a ${data.role}`, 'info');
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

  // Action methods
  const joinRoomSocket = (roomCode, username, requestedUserId = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_room', {
      roomCode,
      username,
      userId: requestedUserId || user?.userId
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

  const changeVideoSocket = (videoId) => {
    if (socketRef.current) socketRef.current.emit('change_video', { videoId });
  };

  const assignRoleSocket = (targetUserId, role) => {
    if (socketRef.current) socketRef.current.emit('assign_role', { targetUserId, role });
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
      assignRoleSocket,
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
