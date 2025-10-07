import api from './axios'
import TrackingService from '../services/TrackingService'

// Send tracking data to backend
export const sendTrackingData = async (trackingData) => {
  try {
    console.log('Sending tracking data to backend:', trackingData)
    const response = await api.post('/tracking', trackingData)
    console.log('Tracking data sent successfully:', response)
    return response.data
  } catch (error) {
    console.error('Failed to send tracking data:', error)
    throw error
  }
}

// Track user action with complete data
export const trackUserAction = async (action, buttonId = null, additionalData = {}) => {
  try {
    // Get event data
    const eventData = TrackingService.trackEvent(action, buttonId, additionalData)
    
    // Get complete tracking data
    const completeTrackingData = await TrackingService.getCompleteTrackingData(eventData)
    
    // Send to backend
    return await sendTrackingData(completeTrackingData)
  } catch (error) {
    console.error('Failed to track user action:', error)
    // Don't throw error to prevent breaking user experience
    return null
  }
}

// Track button click
export const trackButtonClick = async (buttonId, additionalData = {}) => {
  return await trackUserAction('button_click', buttonId, additionalData)
}

// Track form submission
export const trackFormSubmission = async (formId, additionalData = {}) => {
  return await trackUserAction('form_submission', formId, additionalData)
}

// Track page view
export const trackPageView = async (pageName, additionalData = {}) => {
  return await trackUserAction('page_view', pageName, additionalData)
}

// Track navigation
export const trackNavigation = async (fromPage, toPage, additionalData = {}) => {
  return await trackUserAction('navigation', null, {
    fromPage,
    toPage,
    ...additionalData
  })
}

// Track login attempt
export const trackLoginAttempt = async (username, success = false, additionalData = {}) => {
  try {
    const eventData = TrackingService.trackLoginAttempt(username, success, additionalData)
    const completeTrackingData = await TrackingService.getCompleteTrackingData(eventData)
    return await sendTrackingData(completeTrackingData)
  } catch (error) {
    console.error('Failed to track login attempt:', error)
    return null
  }
}

// Track logout
export const trackLogout = async (userRole, additionalData = {}) => {
  try {
    const eventData = TrackingService.trackLogout(userRole, additionalData)
    const completeTrackingData = await TrackingService.getCompleteTrackingData(eventData)
    return await sendTrackingData(completeTrackingData)
  } catch (error) {
    console.error('Failed to track logout:', error)
    return null
  }
}

// Track data access
export const trackDataAccess = async (dataType, action, additionalData = {}) => {
  try {
    const eventData = TrackingService.trackDataAccess(dataType, action, additionalData)
    const completeTrackingData = await TrackingService.getCompleteTrackingData(eventData)
    return await sendTrackingData(completeTrackingData)
  } catch (error) {
    console.error('Failed to track data access:', error)
    return null
  }
}

// Initialize tracking for a session
export const initializeTracking = async () => {
  try {
    const trackingData = await TrackingService.initialize()
    return await sendTrackingData(trackingData)
  } catch (error) {
    console.error('Failed to initialize tracking:', error)
    return null
  }
}

// Track admin dashboard access
export const trackAdminDashboardAccess = async (additionalData = {}) => {
  return await trackDataAccess('admin_dashboard', 'view', additionalData)
}

// Track student data access
export const trackStudentDataAccess = async (studentId, action, additionalData = {}) => {
  return await trackDataAccess('student_data', action, {
    studentId,
    ...additionalData
  })
}

// Track class data access
export const trackClassDataAccess = async (classId, action, additionalData = {}) => {
  return await trackDataAccess('class_data', action, {
    classId,
    ...additionalData
  })
}

// Track attendance data access
export const trackAttendanceDataAccess = async (action, additionalData = {}) => {
  return await trackDataAccess('attendance_data', action, additionalData)
}

// Track report generation
export const trackReportGeneration = async (reportType, additionalData = {}) => {
  return await trackDataAccess('reports', 'generate', {
    reportType,
    ...additionalData
  })
}
