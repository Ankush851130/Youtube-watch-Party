# 🎬 WATCHTOGETHER — YouTube Watch Party System

> **Watch YouTube together, in perfect real-time sync.**

WatchTogether is a production-ready, full-stack YouTube Watch Party system built with **JavaScript**, **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**.

Multiple users can join the same watch room, load YouTube videos, chat, send floating emoji reactions, and enjoy frame-by-frame synchronized playback driven by a room-based WebSocket state engine with server-side role permissions.

---

## 🌟 Key Features

- **📺 Real-Time Synchronized Playback**: Play, Pause, Seek, and Change Video events are synchronized across all room participants instantly.
- **🛡️ Role-Based Access Control (RBAC)**:
  - **👑 Host**: Room creator with full control (Playback, Video Queue, Role Assignment, Participant Removal).
  - **🛡️ Moderator**: Assigned by Host to manage Playback, Seeking, and Changing Videos.
  - **👤 Participant**: Viewers with view-only playback synchronization, live chat, and emoji reactions.
- **🔒 Backend Permission Validation**: Socket.IO server validates every event. Unauthorized actions emitted by clients are rejected on the backend.
- **🔍 YouTube Search & URL Parsing**: Search YouTube videos directly via backend API or paste any `youtube.com/watch?v=`, `youtu.be/`, or `shorts/` link.
- **⏱️ Late Joiner Synchronization**: New joiners automatically receive calculated playback state adjusted for elapsed time.
- **💬 Real-Time Chat & Emoji Reactions**: Integrated live chat tab and interactive floating emoji reaction overlay (`❤️ 😂 👍 😮 🔥`).
- **📋 Share Room & Passcode**: 1-click room link copying and 6-digit passcode share modal.
- **🎨 Approved Cinematic UI**: Dark theater background (`#0A0A0A`), YouTube red accents (`#FF0000`), Sora/Plus Jakarta Sans typography, and smooth glassmorphism modals.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript (JSX), Tailwind CSS v4, Socket.IO Client, Axios, React Router v6 |
| **Backend** | Node.js, Express.js, Socket.IO (WebSockets), Mongoose |
| **Database** | MongoDB (Persistent room schemas with high-performance in-memory fallback) |
| **Video Engine** | YouTube IFrame Player API (`window.YT`) |

---

## 🏗️ System Architecture

```
User A (Host)                     Server                       User B (Participant)
   │                                │                                │
   │ ─── 1. Play / Seek Event ────> │                                │
   │                                │ ─── 2. Permission Check ─────> │ (Validate Role)
   │                                │                                │
   │                                │ ─── 3. Update Room State ────> │
   │                                │                                │
   │ <── 4. Broadcast Play Sync ─── │ ─── 4. Broadcast Play Sync ──> │
   │                                │                                │
   ▼                                ▼                                ▼
YouTube Player                  Room State                   YouTube Player
(Plays at 00:15)             (isPlaying: true)               (Plays at 00:15)
```

---

## 📡 Socket.IO Event Documentation

| Event Name | Direction | Payload | Min Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomCode, username, userId }` | Everyone | Connects client to room and returns full room state |
| `sync_state` | Client 🔄 Server | `{ videoId, isPlaying, currentTime }` | Everyone | Requests/delivers current synchronized playback position |
| `play` | Client ➔ Server ➔ All | `{ currentTime }` | **Moderator / Host** | Plays video for all room participants |
| `pause` | Client ➔ Server ➔ All | `{ currentTime }` | **Moderator / Host** | Pauses video for all room participants |
| `seek` | Client ➔ Server ➔ All | `{ currentTime, isPlaying }` | **Moderator / Host** | Seeks video to exact timestamp for all participants |
| `change_video` | Client ➔ Server ➔ All | `{ videoId }` | **Moderator / Host** | Loads a new YouTube video for all participants |
| `assign_role` | Client ➔ Server ➔ All | `{ targetUserId, role }` | **Host Only** | Promotes a participant to Moderator or demotes to Participant |
| `remove_participant`| Client ➔ Server ➔ All | `{ targetUserId }` | **Host Only** | Kicks participant from room and disconnects socket |
| `send_message` | Client ➔ Server ➔ All | `{ message }` | Everyone | Broadcasts live chat message to room |
| `emoji_reaction` | Client ➔ Server ➔ All | `{ emoji }` | Everyone | Triggers floating emoji animation on viewers' screens |
| `action_error` | Server ➔ Client | `{ message, action }` | Server System | Returned to client when an unauthorized socket action is rejected |

---

## 📁 Project Folder Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/       # Room & YouTube search endpoints
│   │   ├── models/            # Mongoose Room Schema
│   │   ├── routes/            # REST API routes
│   │   ├── services/          # YouTube search service (API + Fallback)
│   │   ├── sockets/           # RoomManager state store & Socket.IO handlers
│   │   ├── utils/             # Room code generator
│   │   └── server.js          # Express + Socket.IO entrypoint
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, YouTubePlayer, VideoInfoRow, SidebarPanel, Modals
│   │   ├── context/           # SocketContext real-time state provider
│   │   ├── pages/             # LandingPage & WatchPartyPage
│   │   ├── services/          # Axios API endpoints
│   │   ├── App.jsx            # React Router setup
│   │   ├── main.jsx           # React DOM root
│   │   └── index.css          # Tailwind theme tokens & custom animations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/watchtogether
YOUTUBE_API_KEY=your_optional_youtube_data_api_v3_key
```

Create `.env` inside `frontend/`:

```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

---

## 🚀 How to Run Locally

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend server will start on `http://localhost:5001`*

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
*Frontend app will start on `http://localhost:5173`*

---

## 🧪 Testing Verification

You can run the multi-client Socket.IO permission verification test script:

```bash
cd backend
node test_socket_permissions.js
```

---

## 🌐 Deployment Instructions

### Frontend (Vercel)
1. Push project to GitHub.
2. Import `frontend` root directory to Vercel.
3. Set environment variables:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com`
   - `VITE_SOCKET_URL` = `https://your-backend-app.onrender.com`
4. Deploy!

### Backend (Render / Railway)
1. Import `backend` root directory to Render/Railway Web Service.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set environment variables (`CLIENT_URL`, `MONGODB_URI`, `PORT`).
5. Deploy!
