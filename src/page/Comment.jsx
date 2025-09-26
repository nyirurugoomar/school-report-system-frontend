import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as commentAPI from '../api/comment'
import * as classAPI from '../api/class'

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

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

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

    try {
      const commentData = {
        schoolId: formData.schoolId,
        className: formData.className,
        subjectName: formData.subjectName,
        numberOfStudents: parseInt(formData.numberOfStudents),
        successStory: formData.successStory.trim(),
        challenge: formData.challenge.trim(),
        date: new Date(formData.date)
      }

      console.log('Sending comment data:', commentData)

      const response = await commentAPI.createComment(commentData)
      console.log('Comment created successfully:', response)
      
      setSuccess('Comment submitted successfully!')
      
      setFormData({
        schoolId: '',
        className: '',
        subjectName: '',
        numberOfStudents: '',
        successStory: '',
        challenge: '',
        date: new Date().toISOString().split('T')[0]
      })

      setTimeout(() => {
        navigate('/success')
      }, 2000)

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
    } finally {
      setLoading(false)
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
              disabled={loading}
              className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
            >
              {loading ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Comment