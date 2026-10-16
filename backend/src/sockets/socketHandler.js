import jwt from 'jsonwebtoken';
import { roomManager } from './roomManager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'watchtogether_jwt_secret_key_2026_super_safe';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Extract auth token from handshake if provided
    const socketToken = socket.handshake.auth?.token;

    // ================= 1. JOIN ROOM =================
    socket.on('join_room', (payload, callback) => {
      const { roomId, roomCode, username, userId: rawUserId, password, token } = payload || {};
      const targetRoomKey = roomCode || roomId;

      let authUserId = rawUserId;
      let authUsername = username;

      // Extract & verify token if passed via payload or handshake
      const activeToken = token || socketToken;
      if (activeToken) {
        try {
          const decoded = jwt.verify(activeToken, JWT_SECRET);
          if (decoded && decoded.userId) {
            authUserId = decoded.userId;
            authUsername = decoded.username || username;
          }
        } catch (e) {
          console.warn('Socket JWT verification failed:', e.message);
        }
      }

      if (!targetRoomKey) {
        const errPayload = { message: 'Room Code or Room ID is required.' };
        if (typeof callback === 'function') callback({ error: errPayload.message });
        socket.emit('action_error', errPayload);
        return;
      }

      if (!authUserId) {
        const errPayload = { message: 'Authentication required. Please sign in or register first to join a watch party.' };
        if (typeof callback === 'function') callback({ error: errPayload.message });
        socket.emit('action_error', errPayload);
        return;
      }

      const result = roomManager.joinRoom(targetRoomKey, authUsername, socket.id, authUserId, password);

      if (result.error) {
        if (typeof callback === 'function') callback({ error: result.error, requiresPassword: result.requiresPassword });
        socket.emit('action_error', { message: result.error, requiresPassword: result.requiresPassword, action: 'join_room' });
        return;
      }

      const { room, user } = result;
      socket.join(room.roomId);

      const participantArray = roomManager.getParticipantsArray(room);

      // Send confirmation to client
      const joinResponse = {
        roomId: room.roomId,
        roomCode: room.roomCode,
        roomName: room.roomName,
        hostId: room.hostId,
        user,
        videoId: room.videoId || room.currentVideoId || 'GG1_DsScm6U',
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        lastUpdated: room.lastUpdated,
        participants: participantArray
      };

      if (typeof callback === 'function') callback({ success: true, data: joinResponse });
      socket.emit('room_state', joinResponse);

      // Broadcast user_joined to other members in room
      socket.to(room.roomId).emit('user_joined', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        participants: participantArray,
        message: `${user.username} joined the party`
      });

      console.log(`👤 ${user.username} (${user.role}) joined room: ${room.roomCode}`);
    });

    // ================= 2. SYNC STATE =================
    socket.on('sync_state', (payload) => {
      const userInfo = roomManager.getUserBySocket(socket.id);
      if (!userInfo) return;

      const { room } = userInfo;
      const computedTime = roomManager.getCalculatedCurrentTime(room);

      socket.emit('sync_state', {
        videoId: room.currentVideoId,
        isPlaying: room.isPlaying,
        currentTime: computedTime,
        lastUpdated: room.lastUpdated,
        participants: roomManager.getParticipantsArray(room)
      });
    });

    // ================= 3. PLAY =================
    socket.on('play', (payload) => {
      const result = roomManager.updatePlayback(socket.id, {
        action: 'play',
        isPlaying: true,
        currentTime: payload?.currentTime
      });

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'play' });
        return;
      }

      io.to(result.room.roomId).emit('play', result.broadcastState);
    });

    // ================= 4. PAUSE =================
    socket.on('pause', (payload) => {
      const result = roomManager.updatePlayback(socket.id, {
        action: 'pause',
        isPlaying: false,
        currentTime: payload?.currentTime
      });

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'pause' });
        return;
      }

      io.to(result.room.roomId).emit('pause', result.broadcastState);
    });

    // ================= 5. SEEK =================
    socket.on('seek', (payload) => {
      const result = roomManager.updatePlayback(socket.id, {
        action: 'seek',
        currentTime: payload?.currentTime,
        isPlaying: payload?.isPlaying
      });

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'seek' });
        return;
      }

      io.to(result.room.roomId).emit('seek', result.broadcastState);
    });

    // ================= 6. CHANGE VIDEO =================
    socket.on('change_video', (payload) => {
      const { videoId, videoTitle, channelTitle } = payload || {};
      if (!videoId) {
        socket.emit('action_error', { message: 'Video ID is required to change video.', action: 'change_video' });
        return;
      }

      const result = roomManager.updatePlayback(socket.id, {
        action: 'change_video',
        videoId,
        videoTitle,
        channelTitle,
        currentTime: 0,
        isPlaying: true
      });

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'change_video' });
        return;
      }

      io.to(result.room.roomId).emit('change_video', result.broadcastState);
    });

    // ================= 7. ASSIGN ROLE =================
    socket.on('assign_role', (payload) => {
      const { targetUserId, role } = payload || {};
      const result = roomManager.assignRole(socket.id, targetUserId, role);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'assign_role' });
        return;
      }

      io.to(result.room.roomId).emit('role_assigned', {
        userId: result.targetUserId,
        username: result.targetUsername,
        role: result.newRole,
        participants: result.participants,
        message: `${result.targetUsername} is now a ${result.newRole}`
      });
    });

    // ================= 7B. TRANSFER HOST =================
    socket.on('transfer_host', (payload) => {
      const { targetUserId } = payload || {};
      const result = roomManager.transferHost(socket.id, targetUserId);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'transfer_host' });
        return;
      }

      io.to(result.room.roomId).emit('host_transferred', {
        hostId: result.newHostId,
        newHostId: result.newHostId,
        newHostName: result.newHostName,
        participants: result.participants,
        message: `👑 ${result.newHostName} is now the Host of this Watch Party!`
      });
    });

    // ================= 8. REMOVE PARTICIPANT =================
    socket.on('remove_participant', (payload) => {
      const { targetUserId } = payload || {};
      const result = roomManager.removeParticipant(socket.id, targetUserId);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'remove_participant' });
        return;
      }

      // Notify the removed participant specifically
      if (result.targetSocketId) {
        io.to(result.targetSocketId).emit('participant_removed_self', {
          message: "You've been removed from this watch party by the Host."
        });
      }

      // Broadcast update to remaining participants
      io.to(result.room.roomId).emit('participant_removed', {
        userId: result.targetUserId,
        username: result.targetUsername,
        participants: result.participants,
        message: `${result.targetUsername} was removed from the room.`
      });
    });

    // ================= 9. CHAT MESSAGE =================
    socket.on('send_message', (payload) => {
      const userInfo = roomManager.getUserBySocket(socket.id);
      if (!userInfo) {
        socket.emit('action_error', { message: 'Must be in a room to send messages.', action: 'send_message' });
        return;
      }

      const { message } = payload || {};
      if (!message || !message.trim()) return;

      const { room, participant } = userInfo;
      const chatPayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
        message: message.trim().slice(0, 500),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(room.roomId).emit('receive_message', chatPayload);
    });

    // ================= 10. EMOJI REACTION =================
    socket.on('emoji_reaction', (payload) => {
      const userInfo = roomManager.getUserBySocket(socket.id);
      if (!userInfo) return;

      const { emoji } = payload || {};
      if (!emoji) return;

      const { room, participant } = userInfo;
      io.to(room.roomId).emit('emoji_reaction', {
        userId: participant.userId,
        username: participant.username,
        emoji
      });
    });

    // ================= 11. CHANGE PLAYBACK SPEED =================
    socket.on('change_speed', (payload) => {
      const { playbackSpeed } = payload || {};
      const result = roomManager.changeSpeed(socket.id, playbackSpeed);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'change_speed' });
        return;
      }

      io.to(result.room.roomId).emit('speed_changed', {
        playbackSpeed: result.playbackSpeed,
        updatedBy: result.updatedBy,
        message: `Playback speed set to ${result.playbackSpeed}x by ${result.updatedBy}`
      });
    });

    // ================= 12. AUDIO DUCKING & MIC PERMISSIONS =================
    // Participant requests to speak
    socket.on('request_mic', () => {
      const result = roomManager.requestMic(socket.id);
      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'request_mic' });
        return;
      }

      if (result.alreadyAllowed) {
        socket.emit('mic_granted_self', { message: 'You have speaking privileges.' });
        return;
      }

      io.to(result.room.roomId).emit('mic_requested', {
        userId: result.participant.userId,
        username: result.participant.username,
        participants: result.participants,
        message: `✋ ${result.participant.username} requested permission to speak.`
      });
    });

    // Cancel mic request
    socket.on('cancel_mic_request', () => {
      const result = roomManager.cancelMicRequest(socket.id);
      if (result && result.room) {
        io.to(result.room.roomId).emit('mic_request_cancelled', {
          userId: result.participant.userId,
          username: result.participant.username,
          participants: result.participants
        });
      }
    });

    // Host or Moderator grants speaking permission
    socket.on('grant_mic', (payload) => {
      const { targetUserId } = payload || {};
      const result = roomManager.grantMic(socket.id, targetUserId);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'grant_mic' });
        return;
      }

      if (result.targetSocketId) {
        io.to(result.targetSocketId).emit('mic_granted_self', {
          message: `🎙️ Your speaking request was approved by ${result.grantedBy}! You can now unmute.`
        });
      }

      io.to(result.room.roomId).emit('mic_granted', {
        targetUserId: result.targetUserId,
        targetUsername: result.targetUsername,
        grantedBy: result.grantedBy,
        participants: result.participants,
        message: `🎙️ ${result.targetUsername} is now permitted to speak.`
      });
    });

    // Host or Moderator revokes speaking permission
    socket.on('revoke_mic', (payload) => {
      const { targetUserId } = payload || {};
      const result = roomManager.revokeMic(socket.id, targetUserId);

      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'revoke_mic' });
        return;
      }

      if (result.targetSocketId) {
        io.to(result.targetSocketId).emit('mic_revoked_self', {
          message: `🔇 Speaking permission was revoked by ${result.revokedBy}.`
        });
      }

      io.to(result.room.roomId).emit('mic_revoked', {
        targetUserId: result.targetUserId,
        targetUsername: result.targetUsername,
        revokedBy: result.revokedBy,
        participants: result.participants,
        message: `🔇 ${result.targetUsername}'s microphone was muted by ${result.revokedBy}.`
      });
    });

    // Speaking state changed (triggered on mic on/off or voice activity detection)
    socket.on('speaking_state', (payload) => {
      const { isSpeaking } = payload || {};
      const result = roomManager.setSpeakingState(socket.id, isSpeaking);

      if (!result) return;
      if (result.error) {
        socket.emit('action_error', { message: result.error, action: 'speaking_state' });
        return;
      }

      // Broadcast speaking state and audio ducking signal to all room participants
      io.to(result.room.roomId).emit('user_speaking_state', {
        userId: result.userId,
        username: result.username,
        isSpeaking: result.isSpeaking,
        micAllowed: result.micAllowed,
        participants: result.participants
      });
    });

    // WebRTC Audio Signaling for Peer-to-Peer Voice
    socket.on('voice_signal', (payload) => {
      const { toUserId, signal } = payload || {};
      const userInfo = roomManager.getUserBySocket(socket.id);
      if (!userInfo) return;

      const { room, participant } = userInfo;
      const targetParticipant = room.participants.get(toUserId);

      if (targetParticipant && targetParticipant.socketId) {
        io.to(targetParticipant.socketId).emit('voice_signal', {
          fromUserId: participant.userId,
          fromUsername: participant.username,
          fromSocketId: socket.id,
          signal
        });
      }
    });

    // ================= 13. LEAVE ROOM (Explicit) =================
    socket.on('leave_room', () => {
      handleDisconnect(socket, io, true);
    });

    // ================= 12. DISCONNECT (Unexpected / Transport renewal) =================
    socket.on('disconnect', () => {
      handleDisconnect(socket, io, false);
    });
  });
}

function handleDisconnect(socket, io, isExplicit = false) {
  const result = roomManager.leaveRoom(socket.id, isExplicit);
  if (!result) return;

  socket.leave(result.room.roomId);

  // If in grace period, start timer to finalize only if they don't reconnect
  if (result.inGracePeriod) {
    const { room, participant } = result;
    participant.disconnectTimer = setTimeout(() => {
      roomManager.finalizeDisconnect(room.roomId, participant.userId, io);
    }, 45000); // 45 seconds grace period
    return;
  }

  const { room, leftUserId, leftUsername, participants } = result;

  io.to(room.roomId).emit('user_left', {
    userId: leftUserId,
    username: leftUsername,
    hostId: room.hostId,
    participants,
    message: `${leftUsername} left the room`
  });

  console.log(`🚪 User explicitly left room: ${leftUsername} from room ${room.roomCode}`);
}
