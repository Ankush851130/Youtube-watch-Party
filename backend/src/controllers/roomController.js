import { roomManager } from '../sockets/roomManager.js';

export async function createRoomController(req, res) {
  try {
    const { roomName, username } = req.body || {};
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'Username is required to create a watch party.' });
    }

    const roomData = await roomManager.createRoom(
      roomName ? roomName.trim() : 'YouTube Watch Party',
      username.trim()
    );

    return res.status(201).json({
      success: true,
      data: roomData
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ success: false, error: 'Failed to create watch party room.' });
  }
}

export async function getRoomController(req, res) {
  try {
    const { roomCode } = req.params;
    const room = roomManager.getRoom(roomCode);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    const computedTime = roomManager.getCalculatedCurrentTime(room);

    return res.json({
      success: true,
      data: {
        roomId: room.roomId,
        roomCode: room.roomCode,
        roomName: room.roomName,
        hostId: room.hostId,
        videoId: room.currentVideoId,
        isPlaying: room.isPlaying,
        currentTime: computedTime,
        lastUpdated: room.lastUpdated,
        participants: roomManager.getParticipantsArray(room)
      }
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return res.status(500).json({ success: false, error: 'Server error retrieving room.' });
  }
}

export async function listRoomsController(req, res) {
  try {
    const rooms = roomManager.getActivePublicRooms();
    return res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    console.error('Error listing rooms:', error);
    return res.status(500).json({ success: false, error: 'Failed to list active rooms.' });
  }
}
