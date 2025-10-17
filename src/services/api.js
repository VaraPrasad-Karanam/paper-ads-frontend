import axios from 'axios';

// Prefer the REACT_APP_API_URL env variable for all deployments!
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://admanager-2.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }

    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
);

// Categories API
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};

// Ads API
export const getAds = async (params = {}) => {
  const response = await api.get('/ads', { params });
  return response.data;
};

export const uploadAd = async (formData, onUploadProgress) => {
  const response = await api.post('/ads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
    timeout: 60000,
  });
  return response.data;
};

export const uploadMultipleAds = async (formData, onUploadProgress) => {
  const response = await api.post('/ads/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
    timeout: 120000,
  });
  return response.data;
};

export const deleteAd = async (adId) => {
  const response = await api.delete(`/ads/${adId}`);
  return response.data;
};

export const updateAd = async (adId, adData) => {
  const response = await api.put(`/ads/${adId}`, adData);
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
