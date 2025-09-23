import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for timetable generation
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Add auth token if available (for future authentication)
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Timetable API functions
export const timetableApi = {
  // Generate timetable
  generateTimetable: async (data) => {
    try {
      const response = await api.post('/api/v1/timetable/generate', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to generate timetable');
    }
  },

  // Get existing timetable
  getTimetable: async (institutionId) => {
    try {
      const response = await api.get(`/api/v1/timetable/${institutionId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No timetable found
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch timetable');
    }
  },

  // Validate constraints
  validateConstraints: async (data) => {
    try {
      const response = await api.post('/api/v1/timetable/validate', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to validate constraints');
    }
  },

  // Export timetable
  exportTimetable: async (institutionId, format = 'xlsx') => {
    try {
      const response = await api.post(
        `/api/v1/timetable/export/${institutionId}`,
        {},
        {
          params: { format },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to export timetable');
    }
  },
};

// Authentication API functions (for future use)
export const authApi = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  // Register user
  register: async (email, password, institutionName) => {
    try {
      const response = await api.post('/api/v1/auth/register', {
        email,
        password,
        institution_name: institutionName
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};

// Utility functions
export const apiUtils = {
  // Check API health
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('API is not accessible');
    }
  },

  // Get API status
  getStatus: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get API status');
    }
  },

  // Download file helper
  downloadFile: (blob, filename, mimeType) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
