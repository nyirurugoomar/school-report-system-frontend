import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as commentAPI from '../api/comment'
import * as classAPI from '../api/class'
import LocationService from '../services/LocationService'

function Comment() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    schoolId: '',
    className: '',
    subjectName: '',
    numberOfStudents: '',
    successStory: '',
    challenge: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableClasses, setAvailableClasses] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableSchools, setAvailableSchools] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  
  // GPS Location tracking states
  const [gpsLocation, setGpsLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [locationPermission, setLocationPermission] = useState('prompt') // 'prompt', 'granted', 'denied'
  

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // GPS Location Functions
  const getGpsLocation = async () => {
    setLocationLoading(true)
    setLocationError(null)
    
    try {
      const position = await LocationService.getCurrentLocation()
      const address = await LocationService.reverseGeocode(
        position.latitude, 
        position.longitude
      )
      
      const locationData = {
        ...position,
        ...address,
        type: 'gps' // Mark as GPS location
      }
      
      setGpsLocation(locationData)
      setLocationPermission('granted')
      
      console.log('📍 GPS Location captured:', {
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.accuracy,
        address: address.address
      })
    } catch (error) {
      setLocationError(error.message)
      setLocationPermission('denied')
      console.error('GPS Location error:', error)
    } finally {
      setLocationLoading(false)
    }
  }

  const clearLocation = () => {
    setGpsLocation(null)
    setLocationError(null)
    setLocationPermission('prompt')
  }

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Load available schools for comments
      const schoolsResponse = await commentAPI.getAvailableSchools()
      const schools = schoolsResponse?.data || schoolsResponse || []
      setAvailableSchools(schools)
      
      console.log('Available schools:', schools)
    } catch (error) {
      console.error('Error loading schools:', error)
      setAvailableSchools([])
    } finally {
      setLoadingData(false)
    }
  }

  const handleSchoolChange = async (schoolId) => {
    if (schoolId) {
      try {
        setLoadingData(true)
        
        // Fetch classes for the selected school
        const classesResponse = await commentAPI.getSchoolClasses(schoolId)
        const classes = classesResponse?.data || []
        setAvailableClasses(classes)
        
        // Fetch subjects for the selected school
        const subjectsResponse = await commentAPI.getSchoolSubjects(schoolId)
        const subjects = subjectsResponse?.data || []
        setAvailableSubjects(subjects)
        
        console.log('Classes for school:', classes)
        console.log('Subjects for school:', subjects)
      } catch (error) {
        console.error('Error fetching classes/subjects for school:', error)
        setAvailableClasses([])
        setAvailableSubjects([])
      } finally {
        setLoadingData(false)
      }
    } else {
      setAvailableClasses([])
      setAvailableSubjects([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    
    setFormData(newFormData)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    console.log('Form submitted with data:', formData)

    // Validation
    if (!formData.schoolId) {
      setError('Please select a school')
      setLoading(false)
      return
    }
    if (!formData.className) {
      setError('Please select a class')
      setLoading(false)
      return
    }
    if (!formData.subjectName) {
      setError('Please select a subject')
      setLoading(false)
      return
    }
    if (!formData.numberOfStudents || formData.numberOfStudents <= 0) {
      setError('Number of students must be greater than 0')
      setLoading(false)
      return
    }

    // Check if GPS location is required and captured
    if (!gpsLocation) {
      setError('GPS location is required. Please capture your location before submitting.')
      setLoading(false)
      return
    }

    try {
      const commentData = {
        schoolId: formData.schoolId,
        className: formData.className,
        subjectName: formData.subjectName,
        numberOfStudents: parseInt(formData.numberOfStudents),
        successStory: formData.successStory.trim(),
        challenge: formData.challenge.trim(),
        date: new Date(formData.date),
        _gpsLocation: gpsLocation // GPS location data
      }

      console.log('Sending comment data:', commentData)

      const response = await commentAPI.createComment(commentData)
      console.log('Comment created successfully:', response)
      
      // Show success message immediately and stop loading
      setSuccess('✅ Comment submitted successfully! Redirecting...')
      setLoading(false) // Stop loading immediately so success message shows
      
      // Reset form data
      setFormData({
        schoolId: '',
        className: '',
        subjectName: '',
        numberOfStudents: '',
        successStory: '',
        challenge: '',
        date: new Date().toISOString().split('T')[0]
      })
      setSelectedSchool('')
      setSelectedClass('')
      setSelectedSubject('')
      setGpsLocation(null)
      setLocationError(null)
      setLocationPermission('prompt')

      // Navigate after shorter delay
      setTimeout(() => {
        navigate('/success')
      }, 1500)

    } catch (error) {
      console.error('Comment submission error:', error)
      
      let errorMessage = 'Failed to submit comment. Please try again.'
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      
      setError(errorMessage)
      setLoading(false) // Stop loading on error
    }
  }

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold text-white mb-8 text-center'>Make a daily attendance</h1>
        
        {success && (
          <div className='bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6'>
            {success}
          </div>
        )}

        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6'>
            {error}
          </div>
        )}

        {loadingData && (
          <div className='bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded-lg text-sm mb-6'>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>Loading schools, classes and subjects...</span>
            </div>
          </div>
        )}

        {/* GPS Location Section - REQUIRED */}
        <div className='mb-6'>
          <div className='bg-red-900 border border-red-700 rounded-lg p-4'>
            <h3 className="text-red-400 font-medium mb-4 flex items-center">
              <span className="text-2xl mr-2">📍</span>
              GPS Location Tracking <span className="text-red-500 text-sm ml-2">(REQUIRED)</span>
            </h3>
            
            {!gpsLocation ? (
              <div>
                <button 
                  type="button" 
                  onClick={getGpsLocation}
                  disabled={locationLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium border-2 border-red-500"
                >
                  {locationLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting GPS Location...
                    </div>
                  ) : (
                    '📍 Get My GPS Location (Required)'
                  )}
                </button>
                
                {locationError && (
                  <div className="mt-3 p-3 bg-red-800 rounded-lg border border-red-600">
                    <p className="text-red-300 text-sm">⚠️ GPS Error: {locationError}</p>
                    <p className="text-red-200 text-xs mt-1">
                      GPS location is required to submit a comment. Please try again or check your browser permissions.
                    </p>
                  </div>
                )}
                
                <div className="mt-3 p-3 bg-red-800 rounded-lg border border-red-600">
                  <p className="text-red-300 text-sm">
                    <strong>⚠️ GPS Location Required:</strong>
                  </p>
                  <p className="text-red-200 text-xs mt-1">
                    You must capture your GPS location before submitting a comment. This is required for location verification and accurate reporting.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-green-400 font-medium">✅ GPS Location captured successfully!</p>
                  <button 
                    type="button" 
                    onClick={clearLocation}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    🔄 Update Location
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">📍 Address:</p>
                    <p className="text-white font-medium">{gpsLocation.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">🏙️ City:</p>
                    <p className="text-white font-medium">{gpsLocation.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">🌍 Country:</p>
                    <p className="text-white font-medium">{gpsLocation.country}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">🎯 GPS Coordinates:</p>
                    <p className="text-white font-medium font-mono text-xs">
                      {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">📏 Accuracy:</p>
                    <p className="text-white font-medium">±{Math.round(gpsLocation.accuracy)} meters</p>
                  </div>
                  {gpsLocation.altitude && (
                    <div>
                      <p className="text-gray-400">⛰️ Altitude:</p>
                      <p className="text-white font-medium">{Math.round(gpsLocation.altitude)} meters</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className='w-full space-y-6'>
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Select School *</label>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value)
                setFormData({...formData, schoolId: e.target.value})
                handleSchoolChange(e.target.value)
                // Reset class and subject selections
                setSelectedClass('')
                setSelectedSubject('')
                setFormData(prev => ({...prev, className: '', subjectName: ''}))
              }}
              className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500"
              required
              disabled={loadingData}
            >
              <option value="">Select a school</option>
              {availableSchools.map(school => (
                <option key={school._id} value={school._id}>
                  {school.name}
                </option>
              ))}
            </select>
            {availableSchools.length === 0 && !loadingData && (
              <p className='text-yellow-400 text-sm mt-1'>
                No schools available. Please create a school first in the Attendance page.
              </p>
            )}
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Select Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setFormData({...formData, className: e.target.value})
              }}
              className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500"
              required
              disabled={!selectedSchool || loadingData}
            >
              <option value="">
                {selectedSchool ? 'Select a class' : 'Select a school first'}
              </option>
              {availableClasses.map(cls => (
                <option key={cls._id} value={cls.className}>
                  {cls.className} - {cls.subjectName}
                </option>
              ))}
            </select>
            {!selectedSchool && (
              <p className='text-yellow-400 text-sm mt-1'>
                Please select a school first to see available classes.
              </p>
            )}
            {selectedSchool && availableClasses.length === 0 && !loadingData && (
              <p className='text-yellow-400 text-sm mt-1'>
                No classes found for the selected school.
              </p>
            )}
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Select Subject *</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                setFormData({...formData, subjectName: e.target.value})
              }}
              className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500"
              required
              disabled={!selectedSchool || loadingData}
            >
              <option value="">
                {selectedSchool ? 'Select a subject' : 'Select a school first'}
              </option>
              {availableSubjects.map(subject => (
                <option key={subject.name} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
            {!selectedSchool && (
              <p className='text-yellow-400 text-sm mt-1'>
                Please select a school first to see available subjects.
              </p>
            )}
            {selectedSchool && availableSubjects.length === 0 && !loadingData && (
              <p className='text-yellow-400 text-sm mt-1'>
                No subjects found for the selected school.
              </p>
            )}
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Number of Students *</label>
            <input 
              type="number" 
              name="numberOfStudents"
              value={formData.numberOfStudents}
              onChange={handleChange}
              placeholder='Enter Number of Students'
              required
              min="1"
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Date of Class</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Success Story</label>
            <textarea 
              name="successStory"
              value={formData.successStory}
              onChange={handleChange}
              placeholder='Enter Success Story'
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 resize-none'
              rows={4}
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Any Challenge</label>
            <textarea 
              name="challenge"
              value={formData.challenge}
              onChange={handleChange}
              placeholder='Enter Challenge'
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 resize-none'
              rows={4}
            />
          </div>
          
          <div className='pt-4'>
            <button 
              type="submit"
              disabled={loading || !gpsLocation}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ${
                loading || !gpsLocation 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {loading ? 'Submitting...' : !gpsLocation ? 'GPS Location Required' : 'Submit Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Comment