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
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [availableSchools, setAvailableSchools] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  // Load classes and extract subjects on component mount
  useEffect(() => {
    loadClassesAndSubjects()
  }, [])

  const loadClassesAndSubjects = async () => {
    try {
      setLoadingData(true)
      
      // Load classes
      const classesData = await classAPI.getClasses()
      setClasses(classesData)
      
      // Extract unique subjects from classes
      const uniqueSubjects = [...new Set(classesData.map(cls => cls.subjectName).filter(Boolean))]
      setSubjects(uniqueSubjects)
      
      // Load available schools for comments
      const schoolsResponse = await commentAPI.getAvailableSchools()
      const schools = schoolsResponse?.data || schoolsResponse || []
      setAvailableSchools(schools)
      
      console.log('Loaded classes:', classesData)
      console.log('Extracted subjects:', uniqueSubjects)
      console.log('Available schools:', schools)
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback to mock data if API fails
      const mockClasses = [
        { _id: '1', className: 'Mathematics 101', subjectName: 'Mathematics', classRoom: 'Room 101', classCredit: '3' },
        { _id: '2', className: 'Physics 201', subjectName: 'Physics', classRoom: 'Room 201', classCredit: '4' },
        { _id: '3', className: 'Chemistry 301', subjectName: 'Chemistry', classRoom: 'Room 301', classCredit: '3' },
        { _id: '4', className: 'Biology 401', subjectName: 'Biology', classRoom: 'Room 401', classCredit: '4' },
        { _id: '5', className: 'English 101', subjectName: 'English', classRoom: 'Room 501', classCredit: '3' }
      ]
      setClasses(mockClasses)
      setSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'])
      setAvailableSchools([])
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    
    // Auto-populate subject when class is selected
    if (name === 'className' && value) {
      const selectedClass = classes.find(cls => cls.className === value)
      if (selectedClass) {
        newFormData.subjectName = selectedClass.subjectName
      }
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
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading schools...' : 'Select a school'}
              </option>
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
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading classes...' : 'Select a class'}
              </option>
              {classes.map(cls => (
                <option key={cls._id} value={cls.className}>
                  {cls.className} - {cls.subjectName} ({cls.classRoom})
                </option>
              ))}
            </select>
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Select Subject *</label>
            <select 
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading subjects...' : 'Select a subject'}
              </option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
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