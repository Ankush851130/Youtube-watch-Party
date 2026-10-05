import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['HOST', 'MODERATOR', 'PARTICIPANT'], 
    default: 'PARTICIPANT' 
  },
  joinedAt: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  roomName: { type: String, required: true },
  hostId: { type: String, required: true },
  currentVideoId: { type: String, default: 'jfKfPfyJRdk' }, // Lofi Girl / Default video
  isPlaying: { type: Boolean, default: false },
  currentTime: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  participants: [participantSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Room = mongoose.model('Room', roomSchema);
