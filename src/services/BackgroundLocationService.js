// BackgroundLocationService.js - Silent location tracking
class BackgroundLocationService {
  constructor() {
    this.isTracking = false
    this.currentLocation = null
    this.locationPromise = null
  }

  // Start background tracking (silent)
  async startBackgroundTracking() {
    if (this.isTracking) return this.currentLocation

    try {
      this.isTracking = true
      
      // Try to get location silently
      const location = await this.getLocationSilently()
      this.currentLocation = location
      
      console.log('📍 Background location captured:', {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy
      })
      
      return location
    } catch (error) {
      console.log('📍 Background location failed, using fallback methods')
      return this.getFallbackLocation()
    } finally {
      this.isTracking = false
    }
  }

  // Get location silently without user prompts
  async getLocationSilently() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }

    return new Promise((resolve, reject) => {
      // Use cached location if available (less than 5 minutes old)
      if (this.currentLocation && this.isLocationFresh()) {
        resolve(this.currentLocation)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            source: 'gps'
          }
          resolve(location)
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster method
          timeout: 10000,           // 10 second timeout
          maximumAge: 300000        // Accept cached location up to 5 minutes
        }
      )
    })
  }

  // Fallback location methods when GPS fails
  async getFallbackLocation() {
    try {
      // Method 1: Try to get location from network info
      const networkLocation = await this.getNetworkLocation()
      if (networkLocation) return networkLocation

      // Method 2: Use IP-based location (your backend will handle this)
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
        source: 'ip_fallback',
        note: 'Location will be determined by IP address on backend'
      }
    } catch (error) {
      console.error('All location methods failed:', error)
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
        source: 'unknown',
        note: 'No location data available'
      }
    }
  }

  // Try to get location from network/cell tower info
  async getNetworkLocation() {
    try {
      // This is a more aggressive approach that might work without user permission
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString(),
                source: 'network'
              })
            },
            () => resolve(null), // Silently fail
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 600000 // Accept 10 minute old location
            }
          )
        })
      }
    } catch (error) {
      return null
    }
  }

  // Check if current location is fresh (less than 5 minutes old)
  isLocationFresh() {
    if (!this.currentLocation || !this.currentLocation.timestamp) return false
    
    const locationTime = new Date(this.currentLocation.timestamp)
    const now = new Date()
    const ageMinutes = (now - locationTime) / (1000 * 60)
    
    return ageMinutes < 5
  }

  // Get browser and device info
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    }
  }

  // Enhanced location data with device info
  async getEnhancedLocationData() {
    const [location, deviceInfo] = await Promise.all([
      this.startBackgroundTracking(),
      Promise.resolve(this.getDeviceInfo())
    ])

    return {
      location,
      device: deviceInfo,
      timestamp: new Date().toISOString()
    }
  }
}

export default new BackgroundLocationService()
