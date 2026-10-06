import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || '';
const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('watchtogether_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth APIs
export async function registerApi(username, email, password) {
  const response = await api.post('/api/auth/register', { username, email, password });
  return response.data;
}

export async function loginApi(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function getMeApi() {
  const response = await api.get('/api/auth/me');
  return response.data;
}

// Room APIs
export async function createRoomApi(roomName, username, isPrivate = false, password = '', hostUserId = null) {
  const response = await api.post('/api/rooms', { roomName, username, isPrivate, password, hostUserId });
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
