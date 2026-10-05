import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || '';
const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function createRoomApi(roomName, username, isPrivate = false, password = '') {
  const response = await api.post('/api/rooms', { roomName, username, isPrivate, password });
  return response.data;
}

export async function getRoomApi(roomCode) {
  const response = await api.get(`/api/rooms/${roomCode}`);
  return response.data;
}

export async function listRoomsApi() {
  const response = await api.get('/api/rooms');
  return response.data;
}

export async function searchYouTubeApi(query) {
  const response = await api.get('/api/youtube/search', {
    params: { q: query }
  });
  return response.data;
}

export async function getRecommendationsApi(videoId) {
  const response = await api.get('/api/youtube/recommendations', {
    params: { videoId }
  });
  return response.data;
}

