// Utility functions for easy tracking integration
import * as trackingAPI from '../api/tracking'

// Quick tracking functions that can be used anywhere
export const trackButtonClick = (buttonId, additionalData = {}) => {
  return trackingAPI.trackButtonClick(buttonId, additionalData)
}

export const trackFormSubmission = (formId, additionalData = {}) => {
  return trackingAPI.trackFormSubmission(formId, additionalData)
}

export const trackPageView = (pageName, additionalData = {}) => {
  return trackingAPI.trackPageView(pageName, additionalData)
}

export const trackNavigation = (fromPage, toPage, additionalData = {}) => {
  return trackingAPI.trackNavigation(fromPage, toPage, additionalData)
}

export const trackLoginAttempt = (username, success = false, additionalData = {}) => {
  return trackingAPI.trackLoginAttempt(username, success, additionalData)
}

export const trackLogout = (userRole, additionalData = {}) => {
  return trackingAPI.trackLogout(userRole, additionalData)
}

export const trackDataAccess = (dataType, action, additionalData = {}) => {
  return trackingAPI.trackDataAccess(dataType, action, additionalData)
}

export const trackAdminDashboardAccess = (additionalData = {}) => {
  return trackingAPI.trackAdminDashboardAccess(additionalData)
}

export const trackStudentDataAccess = (studentId, action, additionalData = {}) => {
  return trackingAPI.trackStudentDataAccess(studentId, action, additionalData)
}

export const trackClassDataAccess = (classId, action, additionalData = {}) => {
  return trackingAPI.trackClassDataAccess(classId, action, additionalData)
}

export const trackAttendanceDataAccess = (action, additionalData = {}) => {
  return trackingAPI.trackAttendanceDataAccess(action, additionalData)
}

export const trackReportGeneration = (reportType, additionalData = {}) => {
  return trackingAPI.trackReportGeneration(reportType, additionalData)
}

// Higher-order function to wrap components with automatic tracking
export const withTracking = (WrappedComponent, trackingConfig = {}) => {
  return function TrackedComponent(props) {
    const { trackPageView } = useTracking()
    
    useEffect(() => {
      if (trackingConfig.trackPageView !== false) {
        const pageName = trackingConfig.pageName || WrappedComponent.name || 'UnknownPage'
        trackPageView(pageName, trackingConfig.additionalData)
      }
    }, [])
    
    return <WrappedComponent {...props} />
  }
}

// Auto-track button clicks with data attributes
export const setupAutoButtonTracking = () => {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-track="button"]')
    if (button) {
      const buttonId = button.getAttribute('data-button-id') || button.id || 'unknown'
      const additionalData = {}
      
      // Collect data attributes
      Array.from(button.attributes).forEach(attr => {
        if (attr.name.startsWith('data-track-')) {
          const key = attr.name.replace('data-track-', '')
          additionalData[key] = attr.value
        }
      })
      
      trackButtonClick(buttonId, additionalData)
    }
  })
}

// Auto-track form submissions with data attributes
export const setupAutoFormTracking = () => {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-track="form"]')
    if (form) {
      const formId = form.getAttribute('data-form-id') || form.id || 'unknown'
      const additionalData = {}
      
      // Collect form data
      const formData = new FormData(form)
      additionalData.fieldCount = Array.from(formData.keys()).length
      
      // Collect data attributes
      Array.from(form.attributes).forEach(attr => {
        if (attr.name.startsWith('data-track-')) {
          const key = attr.name.replace('data-track-', '')
          additionalData[key] = attr.value
        }
      })
      
      trackFormSubmission(formId, additionalData)
    }
  })
}

// Initialize auto-tracking
export const initializeAutoTracking = () => {
  setupAutoButtonTracking()
  setupAutoFormTracking()
}
