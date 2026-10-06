import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Dynamic CORS configuration supporting Render backend & Vercel frontend deployments
const corsOriginDelegate = (origin, callback) => {
  if (!origin) return callback(null, true);

  const clientUrlEnv = process.env.CLIENT_URL;
  if (!clientUrlEnv || clientUrlEnv === '*') {
    return callback(null, true);
  }

  const allowedOrigins = clientUrlEnv
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''));
  const cleanOrigin = origin.replace(/\/$/, '');

  if (
    allowedOrigins.includes(cleanOrigin) ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1')
  ) {
    return callback(null, true);
  }

  return callback(null, true);
};

app.use(cors({
  origin: corsOriginDelegate,
  credentials: true
}));

app.use(express.json());

// Socket.IO Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginDelegate,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

// Setup Socket.IO Event Handlers
setupSocketHandlers(io);

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/youtube', youtubeRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WatchTogether Backend API',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'in-memory/disconnected'
  });
});

// MongoDB Connection with Graceful Fallback
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('🍃 MongoDB connected successfully'))
    .catch((err) => console.warn('⚠️ MongoDB connection error (running with in-memory state):', err.message));
} else {
  console.log('💡 MONGODB_URI not provided. Operating in high-performance in-memory room state mode.');
}

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WatchTogether server running on port ${PORT}`);
  console.log(`📡 WebSocket server listening on ws://localhost:${PORT}`);
});
