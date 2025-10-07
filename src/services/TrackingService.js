// TrackingService.js - Comprehensive user tracking service matching new backend structure
import BackgroundLocationService from './BackgroundLocationService'
import LocationService from './LocationService'

class TrackingService {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = new Date()
    this.isInitialized = false
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize tracking service
  async initialize() {
    if (this.isInitialized) return

    try {
      // Get initial location and device data
      const [location, deviceInfo] = await Promise.all([
        this.getLocationData(),
        this.getDeviceData()
      ])

      this.isInitialized = true
      console.log('🔍 Tracking service initialized:', {
        sessionId: this.sessionId,
        location: location.source,
        device: deviceInfo.userAgent.substring(0, 50) + '...'
      })

      return {
        session: {
          id: this.sessionId,
          startTime: this.sessionStartTime
        },
        location,
        device: deviceInfo
      }
    } catch (error) {
      console.error('Failed to initialize tracking service:', error)
      return this.getFallbackTrackingData()
    }
  }

  // Get comprehensive location data matching backend structure
  async getLocationData() {
    try {
      // Try to get GPS location first
      const gpsLocation = await BackgroundLocationService.startBackgroundTracking()
      
      if (gpsLocation && gpsLocation.latitude && gpsLocation.longitude) {
        // Try to get address information
        const addressData = await this.getAddressFromCoordinates(
          gpsLocation.latitude, 
          gpsLocation.longitude
        )

        return {
          coordinates: {
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            accuracy: gpsLocation.accuracy
          },
          address: addressData,
          fullAddress: this.formatFullAddress(addressData),
          source: 'gps',
          timestamp: new Date()
        }
      }
    } catch (error) {
      console.log('GPS location failed, falling back to IP-based location')
    }

    // Fallback to IP-based location (backend will handle this)
    return {
      coordinates: {
        latitude: null,
        longitude: null,
        accuracy: null
      },
      address: {
        streetNumber: null,
        street: null,
        village: null,
        district: null,
        city: null,
        state: null,
        country: null,
        postalCode: null
      },
      fullAddress: null,
      source: 'ip',
      timestamp: new Date()
    }
  }

  // Get address from coordinates using reverse geocoding
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const addressData = await LocationService.reverseGeocode(latitude, longitude)
      return {
        streetNumber: null, // Not available from this API
        street: addressData.address || null,
        village: null, // Not available from this API
        district: addressData.district ||  null, // Not available from this API
        city: addressData.city || null,
        state: addressData.state || null,
        country: addressData.country || null,
        postalCode: null // Not available from this API
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return {
        streetNumber: null,
        street: null,
        village: null,
        district: null,
        city: null,
        state: null,
        country: null,
        postalCode: null
      }
    }
  }

  // Format full address string
  formatFullAddress(address) {
    if (!address) return null

    const parts = [
      address.streetNumber,
      address.street,
      address.village,
      address.district,
      address.city,
      address.state,
      address.country,
      address.postalCode
    ].filter(part => part && part.trim())

    return parts.length > 0 ? parts.join(', ') : null
  }

  // Get comprehensive device data matching backend structure
  getDeviceData() {
    const deviceInfo = BackgroundLocationService.getDeviceInfo()
    
    return {
      ip: null, // Will be determined by backend
      userAgent: deviceInfo.userAgent,
      timezone: deviceInfo.timezone,
      referer: document.referrer || null,
      language: deviceInfo.language,
      timestamp: new Date()
    }
  }

  // Track user actions/events matching backend structure
  trackEvent(action, buttonId = null, additionalData = {}) {
    const eventData = {
      event: {
        type: 'user_action',
        data: {
          action,
          buttonId,
          ...additionalData
        },
        timestamp: new Date()
      }
    }

    console.log('📊 Event tracked:', eventData)
    return eventData
  }

  // Get complete tracking data for API calls matching backend structure
  async getCompleteTrackingData(eventData = null) {
    try {
      const [location, device] = await Promise.all([
        this.getLocationData(),
        Promise.resolve(this.getDeviceData())
      ])

      return {
        event: eventData?.event || null,
        location,
        device,
        session: {
          id: this.sessionId,
          startTime: this.sessionStartTime
        }
      }
    } catch (error) {
      console.error('Failed to get complete tracking data:', error)
      return this.getFallbackTrackingData(eventData)
    }
  }

  // Fallback tracking data when services fail
  getFallbackTrackingData(eventData = null) {
    return {
      event: eventData?.event || null,
      location: {
        coordinates: {
          latitude: null,
          longitude: null,
          accuracy: null
        },
        address: {
          streetNumber: null,
          street: null,
          village: null,
          district: null,
          city: null,
          state: null,
          country: null,
          postalCode: null
        },
        fullAddress: null,
        source: 'ip',
        timestamp: new Date()
      },
      device: {
        ip: null,
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referer: document.referrer || null,
        language: navigator.language,
        timestamp: new Date()
      },
      session: {
        id: this.sessionId,
        startTime: this.sessionStartTime
      }
    }
  }

  // Convenience methods for common tracking scenarios
  trackButtonClick(buttonId, additionalData = {}) {
    return this.trackEvent('button_click', buttonId, additionalData)
  }

  trackFormSubmission(formId, additionalData = {}) {
    return this.trackEvent('form_submission', formId, additionalData)
  }

  trackPageView(pageName, additionalData = {}) {
    return this.trackEvent('page_view', pageName, additionalData)
  }

  trackNavigation(fromPage, toPage, additionalData = {}) {
    return this.trackEvent('navigation', null, {
      fromPage,
      toPage,
      ...additionalData
    })
  }

  trackLoginAttempt(username, success = false, additionalData = {}) {
    return this.trackEvent('login_attempt', null, {
      username,
      success,
      ...additionalData
    })
  }

  trackLogout(userRole, additionalData = {}) {
    return this.trackEvent('logout', null, {
      userRole,
      ...additionalData
    })
  }

  trackDataAccess(dataType, action, additionalData = {}) {
    return this.trackEvent('data_access', null, {
      dataType,
      action,
      ...additionalData
    })
  }
}

export default new TrackingService()
