import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as commentAPI from '../api/comment'

function Comment() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    console.log('Form submitted with data:', formData)

    // Validation
    if (!formData.className.trim()) {
      setError('Class name is required')
      setLoading(false)
      return
    }
    if (!formData.subjectName.trim()) {
      setError('Subject name is required')
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
        className: formData.className.trim(),
        subjectName: formData.subjectName.trim(),
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
        <h1 className='text-4xl font-bold text-white mb-8 text-center'>Please fill the Comment form</h1>
        
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
        
        <form onSubmit={handleSubmit} className='w-full space-y-6'>
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Class Name *</label>
            <input 
              type="text" 
              name="className"
              value={formData.className}
              onChange={handleChange}
              placeholder='Enter Class Name'
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Subject Name *</label>
            <input 
              type="text" 
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              placeholder='Enter Subject Name'
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
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