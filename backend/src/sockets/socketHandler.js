import { roomManager } from './roomManager.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ================= 1. JOIN ROOM =================
    socket.on('join_room', (payload, callback) => {
      const { roomId, roomCode, username, userId } = payload || {};
      const targetRoomKey = roomCode || roomId;

      if (!targetRoomKey) {
        const errPayload = { message: 'Room Code or Room ID is required.' };
        if (typeof callback === 'function') callback({ error: errPayload.message });
        socket.emit('action_error', errPayload);
        return;
      }

      const result = roomManager.joinRoom(targetRoomKey, username, socket.id, userId);

      if (result.error) {
        if (typeof callback === 'function') callback({ error: result.error });
        socket.emit('action_error', { message: result.error, action: 'join_room' });
        return;
      }

      const { room, user } = result;
      socket.join(room.roomId);

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
        participants: room.participants
      };

      if (typeof callback === 'function') callback({ success: true, data: joinResponse });
      socket.emit('room_state', joinResponse);

      // Broadcast user_joined to other members in room
      socket.to(room.roomId).emit('user_joined', {
        userId: user.userId,
        username: user.username,
        role: user.role,
        participants: room.participants,
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

    // ================= 11. LEAVE ROOM =================
    socket.on('leave_room', () => {
      handleDisconnect(socket, io);
    });

    // ================= 12. DISCONNECT =================
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });
  });
}

function handleDisconnect(socket, io) {
  const result = roomManager.leaveRoom(socket.id);
  if (!result) return;

  const { room, leftUserId, leftUsername, participants } = result;
  
  socket.leave(room.roomId);

  io.to(room.roomId).emit('user_left', {
    userId: leftUserId,
    username: leftUsername,
    hostId: room.hostId,
    participants,
    message: `${leftUsername} left the room`
  });

  console.log(`🚪 User left room: ${leftUsername} from room ${room.roomCode}`);
}
