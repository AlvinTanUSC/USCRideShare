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

export default apiClient;
