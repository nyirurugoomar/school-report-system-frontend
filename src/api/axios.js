import axios from 'axios'
import TrackingService from '../services/TrackingService'

const api = axios.create({
  // baseURL: 'https://school-report-system-bc.onrender.com',
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor  
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add tracking data to requests (optional - you can enable this if needed)
    // Uncomment the following lines if you want to track all API calls
    /*
    try {
      const trackingData = await TrackingService.getCompleteTrackingData()
      config.headers['X-Tracking-Data'] = JSON.stringify(trackingData)
    } catch (error) {
      console.log('Failed to add tracking data to request:', error)
    }
    */
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api