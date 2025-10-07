# User Tracking System

This document describes the comprehensive user tracking system implemented in the frontend to match your new backend data structure.

## Overview

The tracking system collects comprehensive user data including:
- **Event Data**: User actions, button clicks, form submissions, page views
- **Location Data**: GPS coordinates, address information, location source
- **Device Data**: User agent, timezone, language, referer
- **Session Data**: Session ID, start time

## Backend Data Structure

The system sends data to your backend in this exact format:

```javascript
{
  event: {
    type: 'user_action',
    data: { action: 'button_click', buttonId: 'submit' },
    timestamp: Date
  },
  location: {
    coordinates: { latitude, longitude, accuracy },
    address: {
      streetNumber: '123',
      street: 'Main Street',
      village: 'Downtown',
      district: 'Central',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001'
    },
    fullAddress: '123 Main Street, Downtown, Central, New York, NY, USA',
    source: 'ip' | 'gps',
    timestamp: Date
  },
  device: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    timezone: 'America/New_York',
    referer: 'https://example.com',
    language: 'en-US',
    timestamp: Date
  },
  session: {
    id: 'session123',
    startTime: Date
  }
}
```

## Files Created

### 1. `/src/services/TrackingService.js`
Core tracking service that handles:
- Session management
- Location data collection (GPS + IP fallback)
- Device information gathering
- Event tracking
- Data formatting to match backend structure

### 2. `/src/api/tracking.js`
API service for backend communication:
- Sends tracking data to `/tracking` endpoint
- Provides convenience functions for common tracking scenarios
- Handles errors gracefully without breaking user experience

### 3. `/src/hooks/useTracking.js`
React hook for easy component integration:
- Automatic page view tracking
- Session initialization
- Returns tracking functions for manual use

### 4. `/src/utils/tracking.js`
Utility functions for easy tracking:
- Quick tracking functions
- Higher-order component wrapper
- Auto-tracking setup for buttons and forms

## Integration Examples

### 1. Using the Hook (Recommended)

```javascript
import { useTracking } from '../hooks/useTracking'

function MyComponent() {
  const { trackButtonClick, trackFormSubmission } = useTracking()
  
  const handleSubmit = async () => {
    await trackFormSubmission('contact_form', { fieldCount: 5 })
    // ... rest of form logic
  }
  
  const handleButtonClick = async () => {
    await trackButtonClick('save_button', { action: 'save' })
    // ... rest of button logic
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleButtonClick}>Save</button>
    </form>
  )
}
```

### 2. Using Utility Functions

```javascript
import { trackButtonClick, trackFormSubmission } from '../utils/tracking'

// Track button click
await trackButtonClick('submit_button', { formType: 'contact' })

// Track form submission
await trackFormSubmission('contact_form', { fieldCount: 5 })
```

### 3. Auto-Tracking with Data Attributes

```html
<!-- Button with auto-tracking -->
<button 
  data-track="button" 
  data-button-id="submit" 
  data-track-action="save"
  data-track-form-type="contact"
>
  Submit
</button>

<!-- Form with auto-tracking -->
<form 
  data-track="form" 
  data-form-id="contact-form"
  data-track-form-type="contact"
>
  <!-- form fields -->
</form>
```

### 4. Higher-Order Component

```javascript
import { withTracking } from '../utils/tracking'

const TrackedComponent = withTracking(MyComponent, {
  pageName: 'MyPage',
  additionalData: { section: 'dashboard' }
})
```

## Components Updated

### 1. App.jsx
- Added `useTracking()` hook for global tracking initialization

### 2. SignIn.jsx
- Tracks form submissions
- Tracks login attempts (success/failure)
- Includes username and user role in tracking data

### 3. Admin.jsx
- Tracks admin dashboard access
- Ready for additional admin-specific tracking

### 4. Navbar.jsx
- Tracks logout events
- Includes user role in logout tracking

### 5. axios.js
- Updated to include tracking service import
- Optional request interceptor for API call tracking (commented out)

## Tracking Functions Available

### Basic Tracking
- `trackButtonClick(buttonId, additionalData)`
- `trackFormSubmission(formId, additionalData)`
- `trackPageView(pageName, additionalData)`
- `trackNavigation(fromPage, toPage, additionalData)`

### Authentication Tracking
- `trackLoginAttempt(username, success, additionalData)`
- `trackLogout(userRole, additionalData)`

### Data Access Tracking
- `trackDataAccess(dataType, action, additionalData)`
- `trackAdminDashboardAccess(additionalData)`
- `trackStudentDataAccess(studentId, action, additionalData)`
- `trackClassDataAccess(classId, action, additionalData)`
- `trackAttendanceDataAccess(action, additionalData)`
- `trackReportGeneration(reportType, additionalData)`

## Backend Endpoint

The system sends tracking data to:
```
POST /tracking
```

Make sure your backend has this endpoint configured to receive the tracking data structure shown above.

## Error Handling

- Tracking failures don't break user experience
- Errors are logged to console for debugging
- Fallback data is provided when location/device services fail
- Network failures are handled gracefully

## Privacy & Performance

- Location data is collected with user consent (browser prompts)
- IP-based location fallback when GPS is unavailable
- Session data is stored locally and sent to backend
- Tracking is non-blocking and doesn't affect app performance
- Failed tracking requests don't interrupt user flow

## Customization

You can easily extend the tracking system by:

1. Adding new event types in `TrackingService.js`
2. Creating new API functions in `tracking.js`
3. Adding new utility functions in `utils/tracking.js`
4. Implementing component-specific tracking logic

## Testing

To test the tracking system:

1. Open browser developer tools
2. Check console for tracking logs
3. Monitor network requests to `/tracking` endpoint
4. Verify data structure matches backend expectations

## Future Enhancements

Potential improvements:
- Real-time tracking dashboard
- User behavior analytics
- Performance monitoring
- Error tracking integration
- A/B testing support
