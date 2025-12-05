import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user ID header for match API endpoints
    const userId = localStorage.getItem('userId');
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const rideApi = {
  createRide: (data) => apiClient.post('/api/rides', data),

  getRides: (filters = {}) => {
    const params = {};
    if (filters.destination) params.destination = filters.destination;
    if (filters.date) params.date = filters.date;
    if (filters.time) params.time = filters.time;

    return apiClient.get('/api/rides', { params });
  },

  getRideById: (id) => apiClient.get(`/api/rides/${id}`),
};

export const matchApi = {
  // Find potential matches for a ride (available rides to join)
  findPotentialMatches: (rideId) => apiClient.get(`/api/matches/potential/${rideId}`),

  // Join an existing ride (auto-match, no approval needed)
  joinRide: (myRideId, targetRideId) =>
    apiClient.post('/api/matches/join', { myRideId, targetRideId }),

  // Cancel/leave a match
  cancelMatch: (matchId) => apiClient.delete(`/api/matches/${matchId}`),

  // Get current active match
  getCurrentMatch: () => apiClient.get('/api/matches/current'),

  // Get all matches for current user (history)
  getUserMatches: () => apiClient.get('/api/matches'),

  // Get user's rides with their potential matches (dashboard view)
  getMyRidesWithMatches: () => apiClient.get('/api/matches/my-rides'),

  // Request a match (user sends a request to join a ride)
  requestMatch: async (myRideId, targetRideId) => {
    return apiClient.post('/api/matches/request', {
      myRideId,
      targetRideId,
    });
  },
};

export default apiClient;
