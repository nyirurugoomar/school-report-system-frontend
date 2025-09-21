import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as marksAPI from '../api/marks'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'

function EditMarks() {
  const navigate = useNavigate()
  const { marksId } = useParams()
  
  // Form state
  const [formData, setFormData] = useState({
    academicYear: '',
    academicTerm: '',
    classId: '',
    subjectId: '',
    examType: '',
    totalMarks: '',
    examDate: '',
    studentId: '',
    teacherId: '',
    schoolId: ''
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data state
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [currentMark, setCurrentMark] = useState(null)
  
  // Academic years and terms
  const academicYears = ['2023-2024', '2024-2025', '2025-2026']
  const academicTerms = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM']
  const examTypes = ['BEGINNING_TERM', 'MIDTERM', 'ENDTERM']

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [marksId])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Load mark details, classes, and students in parallel
      const [markData, classesData, studentsData] = await Promise.all([
        marksAPI.getMarkById(marksId),
        classAPI.getClasses(),
        studentAPI.getStudents()
      ])
      
      if (!markData) {
        setError('Mark record not found')
        return
      }
      
      setCurrentMark(markData)
      setClasses(classesData)
      setStudents(studentsData)
      
      // Populate form with existing data
      setFormData({
        academicYear: markData.academicYear || '',
        academicTerm: markData.academicTerm || '',
        classId: markData.classId?._id || '',
        subjectId: markData.subjectId?._id || '',
        examType: markData.examType || '',
        totalMarks: markData.totalMarks || '',
        examDate: markData.examDate ? new Date(markData.examDate).toISOString().split('T')[0] : '',
        studentId: markData.studentId?._id || '',
        teacherId: markData.teacherId?._id || '',
        schoolId: markData.schoolId?._id || ''
      })
      
      console.log('Loaded mark data:', markData)
      console.log('Loaded classes:', classesData)
      console.log('Loaded students:', studentsData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load mark data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

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
    if (!formData.academicYear) {
      setError('Please select an academic year')
      setLoading(false)
      return
    }
    if (!formData.academicTerm) {
      setError('Please select an academic term')
      setLoading(false)
      return
    }
    if (!formData.classId) {
      setError('Please select a class')
      setLoading(false)
      return
    }
    if (!formData.examType) {
      setError('Please select an exam type')
      setLoading(false)
      return
    }
    if (!formData.totalMarks || formData.totalMarks <= 0) {
      setError('Total marks must be greater than 0')
      setLoading(false)
      return
    }
    if (!formData.studentId) {
      setError('Please select a student')
      setLoading(false)
      return
    }

    try {
      // Prepare update data
      const updateData = {
        studentId: formData.studentId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        classId: formData.classId,
        examType: formData.examType,
        totalMarks: parseInt(formData.totalMarks),
        academicYear: formData.academicYear,
        academicTerm: formData.academicTerm,
        examDate: new Date(formData.examDate),
        schoolId: formData.schoolId
      }

      console.log('Updating mark with data:', updateData)

      const response = await marksAPI.updateMarks(marksId, updateData)
      console.log('Mark updated successfully:', response)
      
      setSuccess('Mark updated successfully!')
      
      setTimeout(() => {
        navigate('/marks')
      }, 2000)

    } catch (error) {
      console.error('Mark update error:', error)
      
      let errorMessage = 'Failed to update mark. Please try again.'
      
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

  if (loadingData) {
    return (
      <div className='min-h-screen bg-slate-800 px-4 py-8 flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading mark data...</p>
        </div>
      </div>
    )
  }

  if (!currentMark) {
    return (
      <div className='min-h-screen bg-slate-800 px-4 py-8 flex items-center justify-center'>
        <div className="text-center">
          <div className="text-slate-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Mark Not Found</h2>
          <p className="text-slate-400 mb-6">The mark record you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/marks')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Marks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className="flex justify-between items-center mb-8">
          <h1 className='text-4xl font-bold text-white'>Edit Mark</h1>
          <button
            onClick={() => navigate('/marks')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Marks
          </button>
        </div>
        
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
          {/* Academic Year */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Academic Year *</label>
            <select 
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            >
              <option value=''>Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Term */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Academic Term *</label>
            <select 
              name="academicTerm"
              value={formData.academicTerm}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            >
              <option value=''>Select Academic Term</option>
              {academicTerms.map(term => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Class *</label>
            <select 
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            >
              <option value=''>Select a class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.className} - {cls.subjectName} ({cls.classRoom})
                </option>
              ))}
            </select>
          </div>

          {/* Student Selection */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Student *</label>
            <select 
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            >
              <option value=''>Select a student</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.studentName}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Exam Type *</label>
            <select 
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            >
              <option value=''>Select Exam Type</option>
              {examTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Total Marks */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Total Marks *</label>
            <input 
              type="number" 
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleChange}
              placeholder='Enter total marks (e.g., 100)'
              required
              min="1"
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>

          {/* Exam Date */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Exam Date *</label>
            <input 
              type="date" 
              name="examDate"
              value={formData.examDate}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            />
          </div>
          
          {/* Submit Button */}
          <div className='pt-6'>
            <button 
              type="submit"
              disabled={loading}
              className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
            >
              {loading ? 'Updating Mark...' : 'Update Mark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMarks