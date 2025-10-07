import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import * as trackingAPI from '../api/tracking'

export const useTracking = () => {
  const location = useLocation()

  // Initialize tracking on mount
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        await trackingAPI.initializeTracking()
      } catch (error) {
        console.error('Failed to initialize tracking:', error)
      }
    }

    initializeTracking()
  }, [])

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const pageName = location.pathname
        await trackingAPI.trackPageView(pageName, {
          searchParams: location.search,
          hash: location.hash
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [location])

  // Return tracking functions for manual use
  return {
    trackButtonClick: trackingAPI.trackButtonClick,
    trackFormSubmission: trackingAPI.trackFormSubmission,
    trackNavigation: trackingAPI.trackNavigation,
    trackUserAction: trackingAPI.trackUserAction,
    trackLoginAttempt: trackingAPI.trackLoginAttempt,
    trackLogout: trackingAPI.trackLogout,
    trackDataAccess: trackingAPI.trackDataAccess,
    trackAdminDashboardAccess: trackingAPI.trackAdminDashboardAccess,
    trackStudentDataAccess: trackingAPI.trackStudentDataAccess,
    trackClassDataAccess: trackingAPI.trackClassDataAccess,
    trackAttendanceDataAccess: trackingAPI.trackAttendanceDataAccess,
    trackReportGeneration: trackingAPI.trackReportGeneration
  }
}
