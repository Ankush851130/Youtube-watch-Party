import { generateRoomCode, generateId } from '../utils/roomCodeGenerator.js';
import { Room } from '../models/Room.js';

class RoomManager {
  constructor() {
    // Map<roomId, roomObject>
    this.rooms = new Map();
    // Map<roomCode, roomId>
    this.roomCodeMap = new Map();
    // Map<socketId, { userId, roomId }>
    this.socketMap = new Map();

    // Create a pre-seeded default demo room for instant testing
    this.createDefaultDemoRoom();
  }

  createDefaultDemoRoom() {
    const demoCode = 'X7K92P';
    const roomId = 'room_demo_default';
    const hostId = 'usr_host_ankush';
    
    const demoRoom = {
      roomId,
      roomCode: demoCode,
      roomName: 'Friday Movie Night',
      hostId,
      currentVideoId: 'Lx79DuiWLu4', // Planet Earth III 4K Trailer (100% embeddable)
      isPlaying: true,
      currentTime: 15,
      lastUpdated: Date.now(),
      participants: new Map([
        [hostId, {
          userId: hostId,
          username: 'Ankush Sharma',
          role: 'HOST',
          socketId: null,
          joinedAt: new Date(Date.now() - 3600000)
        }]
      ])
    };

    this.rooms.set(roomId, demoRoom);
    this.roomCodeMap.set(demoCode, roomId);
  }

  // Create a new room
  async createRoom(roomName, hostUsername) {
    let roomCode = generateRoomCode();
    while (this.roomCodeMap.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const roomId = generateId('room');
    const hostId = generateId('user');
    const now = Date.now();

    const hostParticipant = {
      userId: hostId,
      username: hostUsername || 'Host User',
      role: 'HOST',
      socketId: null,
      joinedAt: new Date()
    };

    const roomState = {
      roomId,
      roomCode,
      roomName: roomName || 'YouTube Watch Party',
      hostId,
      currentVideoId: 'Lx79DuiWLu4', // Planet Earth III 4K Trailer (100% embeddable)
      videoId: 'Lx79DuiWLu4',
      isPlaying: false,
      currentTime: 0,
      lastUpdated: now,
      participants: new Map([[hostId, hostParticipant]])
    };

    this.rooms.set(roomId, roomState);
    this.roomCodeMap.set(roomCode, roomId);

    // Save to MongoDB if available
    try {
      await Room.create({
        roomId,
        roomCode,
        roomName: roomState.roomName,
        hostId,
        currentVideoId: roomState.currentVideoId,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: new Date(now),
        participants: [{
          userId: hostId,
          username: hostParticipant.username,
          role: 'HOST',
          joinedAt: hostParticipant.joinedAt
        }]
      });
    } catch (err) {
      console.warn('MongoDB save room notice (running in-memory mode):', err.message);
    }

    return {
      roomId,
      roomCode,
      roomName: roomState.roomName,
      hostId,
      userId: hostId,
      role: 'HOST'
    };
  }

  // Find room by ID or Code
  getRoom(roomIdOrCode) {
    if (!roomIdOrCode) return null;
    const cleanKey = roomIdOrCode.trim().toUpperCase();
    
    // Check by roomId
    if (this.rooms.has(roomIdOrCode)) {
      return this.rooms.get(roomIdOrCode);
    }
    
    // Check by roomCode
    const roomIdFromCode = this.roomCodeMap.get(cleanKey);
    if (roomIdFromCode && this.rooms.has(roomIdFromCode)) {
      return this.rooms.get(roomIdFromCode);
    }

    return null;
  }

  // Get sanitized participants array for client
  getParticipantsArray(room) {
    if (!room || !room.participants) return [];
    return Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      role: p.role,
      online: Boolean(p.socketId),
      joinedAt: p.joinedAt
    }));
  }

  // Calculate synchronized current time
  getCalculatedCurrentTime(room) {
    if (!room) return 0;
    if (!room.isPlaying) return room.currentTime;
    
    const elapsedSeconds = (Date.now() - room.lastUpdated) / 1000;
    return Math.max(0, room.currentTime + elapsedSeconds);
  }

  // Join Room
  joinRoom(roomIdOrCode, username, socketId, requestedUserId = null) {
    const room = this.getRoom(roomIdOrCode);
    if (!room) {
      return { error: 'Room not found. Please check your room code or link.' };
    }

    let participant = null;
    let isNewUser = false;

    // Check if user is returning with existing userId
    if (requestedUserId && room.participants.has(requestedUserId)) {
      participant = room.participants.get(requestedUserId);
      participant.socketId = socketId;
      participant.username = username || participant.username;
    } else {
      // Create new participant
      const isFirstUser = room.participants.size === 0;
      const userId = generateId('user');
      const role = isFirstUser ? 'HOST' : 'PARTICIPANT';

      participant = {
        userId,
        username: username || `Guest_${userId.slice(-4)}`,
        role,
        socketId,
        joinedAt: new Date()
      };

      if (isFirstUser) {
        room.hostId = userId;
      }

      room.participants.set(userId, participant);
      isNewUser = true;
    }

    // Associate socketId with userId and roomId
    this.socketMap.set(socketId, { userId: participant.userId, roomId: room.roomId });

    const computedTime = this.getCalculatedCurrentTime(room);

    return {
      success: true,
      room: {
        roomId: room.roomId,
        roomCode: room.roomCode,
        roomName: room.roomName,
        hostId: room.hostId,
        videoId: room.currentVideoId,
        isPlaying: room.isPlaying,
        currentTime: computedTime,
        lastUpdated: room.lastUpdated,
        participants: this.getParticipantsArray(room)
      },
      user: {
        userId: participant.userId,
        username: participant.username,
        role: participant.role
      },
      isNewUser
    };
  }

  // Get user details from socket
  getUserBySocket(socketId) {
    const info = this.socketMap.get(socketId);
    if (!info) return null;
    
    const room = this.rooms.get(info.roomId);
    if (!room) return null;

    const participant = room.participants.get(info.userId);
    if (!participant) return null;

    return { room, participant };
  }

  // Permission checks
  canControlPlayback(participant) {
    return participant && (participant.role === 'HOST' || participant.role === 'MODERATOR');
  }

  canManageRoles(participant) {
    return participant && participant.role === 'HOST';
  }

  canRemoveParticipant(participant) {
    return participant && participant.role === 'HOST';
  }

  // Update Playback State (play, pause, seek, change_video)
  updatePlayback(socketId, payload) {
    const userInfo = this.getUserBySocket(socketId);
    if (!userInfo) {
      return { error: 'Unauthorized: User not found in room.' };
    }

    const { room, participant } = userInfo;

    if (!this.canControlPlayback(participant)) {
      return { 
        error: 'Permission Denied: Only the Host or Moderator can control video playback.',
        action: payload.action || 'playback'
      };
    }

    const now = Date.now();
    const { action, videoId, currentTime, isPlaying } = payload;

    if (action === 'change_video' && videoId) {
      room.currentVideoId = videoId;
      room.videoId = videoId;
      room.currentTime = 0;
      room.isPlaying = isPlaying !== undefined ? isPlaying : true;
      room.lastUpdated = now;
    } else {
      if (typeof currentTime === 'number' && !isNaN(currentTime)) {
        room.currentTime = Math.max(0, currentTime);
      }
      if (typeof isPlaying === 'boolean') {
        room.isPlaying = isPlaying;
      }
      room.lastUpdated = now;
    }

    return {
      success: true,
      room,
      broadcastState: {
        videoId: room.currentVideoId || room.videoId,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        lastUpdated: room.lastUpdated,
        triggeredBy: participant.username,
        action
      }
    };
  }

  // Assign Role (HOST action only)
  assignRole(socketId, targetUserId, newRole) {
    const userInfo = this.getUserBySocket(socketId);
    if (!userInfo) {
      return { error: 'Unauthorized: User not found in room.' };
    }

    const { room, participant } = userInfo;

    if (!this.canManageRoles(participant)) {
      return { error: 'Permission Denied: Only the Host can assign participant roles.' };
    }

    if (!['MODERATOR', 'PARTICIPANT'].includes(newRole)) {
      return { error: 'Invalid role specified.' };
    }

    const target = room.participants.get(targetUserId);
    if (!target) {
      return { error: 'Target user not found in room.' };
    }

    if (target.userId === room.hostId) {
      return { error: 'Cannot change the Host role directly.' };
    }

    target.role = newRole;

    return {
      success: true,
      room,
      targetUserId,
      targetUsername: target.username,
      newRole,
      participants: this.getParticipantsArray(room)
    };
  }

  // Transfer Host (Optional Bonus)
  transferHost(socketId, targetUserId) {
    const userInfo = this.getUserBySocket(socketId);
    if (!userInfo) return { error: 'User not found in room.' };
    
    const { room, participant } = userInfo;
    if (participant.role !== 'HOST') {
      return { error: 'Only the Host can transfer leadership.' };
    }

    const target = room.participants.get(targetUserId);
    if (!target) return { error: 'Target user not found in room.' };

    participant.role = 'MODERATOR';
    target.role = 'HOST';
    room.hostId = target.userId;

    return {
      success: true,
      room,
      newHostId: target.userId,
      newHostName: target.username,
      participants: this.getParticipantsArray(room)
    };
  }

  // Remove Participant (HOST action only)
  removeParticipant(socketId, targetUserId) {
    const userInfo = this.getUserBySocket(socketId);
    if (!userInfo) {
      return { error: 'Unauthorized: User not found in room.' };
    }

    const { room, participant } = userInfo;

    if (!this.canRemoveParticipant(participant)) {
      return { error: 'Permission Denied: Only the Host can remove participants.' };
    }

    if (targetUserId === room.hostId) {
      return { error: 'Host cannot remove themselves from the room.' };
    }

    const target = room.participants.get(targetUserId);
    if (!target) {
      return { error: 'Target participant not found.' };
    }

    const targetSocketId = target.socketId;
    room.participants.delete(targetUserId);

    if (targetSocketId) {
      this.socketMap.delete(targetSocketId);
    }

    return {
      success: true,
      room,
      targetUserId,
      targetSocketId,
      targetUsername: target.username,
      participants: this.getParticipantsArray(room)
    };
  }

  // Handle Leave Room / Disconnect
  leaveRoom(socketId) {
    const info = this.socketMap.get(socketId);
    if (!info) return null;

    const { userId, roomId } = info;
    this.socketMap.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.get(userId);
    if (!participant) return null;

    participant.socketId = null;

    // Check host migration if host leaves permanently
    if (userId === room.hostId) {
      // Find another active or moderator participant to promote as Host
      const remaining = Array.from(room.participants.values()).filter(p => p.userId !== userId);
      if (remaining.length > 0) {
        const nextHost = remaining.find(p => p.role === 'MODERATOR') || remaining[0];
        nextHost.role = 'HOST';
        room.hostId = nextHost.userId;
      }
    }

    return {
      room,
      leftUserId: userId,
      leftUsername: participant.username,
      participants: this.getParticipantsArray(room)
    };
  }

  // Get active public rooms summary
  getActivePublicRooms() {
    return Array.from(this.rooms.values()).map(r => ({
      roomId: r.roomId,
      roomCode: r.roomCode,
      roomName: r.roomName,
      participantCount: r.participants.size,
      currentVideoId: r.currentVideoId,
      isPlaying: r.isPlaying
    }));
  }
}

export const roomManager = new RoomManager();
