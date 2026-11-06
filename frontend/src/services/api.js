import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudbeats_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      // localStorage.removeItem('cloudbeats_token');
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Song Endpoints
export const songAPI = {
  getSongs: (params) => api.get('/songs', { params }),
  getSongById: (id) => api.get(`/songs/${id}`),
  getStreamUrl: (id) => api.get(`/songs/${id}/stream`),
  getCoverUrl: (id) => api.get(`/songs/${id}/cover`),
  updateSong: (id, data) => api.put(`/songs/${id}`, data),
  deleteSong: (id) => api.delete(`/songs/${id}`),
};

// Admin S3 Upload Endpoints
export const uploadAPI = {
  getPresignedUrl: (data) => api.post('/admin/uploads/presigned-url', data),
  completeUpload: (data) => api.post('/admin/uploads/complete', data),
  testS3: () => api.get('/admin/uploads/test-s3'),
  uploadServerRelay: (formData, onProgress, signal) =>
    api.post('/admin/uploads/server-relay', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent?.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
      signal,
    }),
};

// Playlist Endpoints
export const playlistAPI = {
  getPlaylists: () => api.get('/playlists'),
  getPlaylistById: (id) => api.get(`/playlists/${id}`),
  createPlaylist: (data) => api.post('/playlists', data),
  addSong: (playlistId, songId) => api.post(`/playlists/${playlistId}/songs`, { songId }),
  removeSong: (playlistId, songId) => api.delete(`/playlists/${playlistId}/songs/${songId}`),
};

// Health
export const getHealth = () => api.get('/health');

export default api;

