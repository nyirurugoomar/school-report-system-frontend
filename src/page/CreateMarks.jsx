import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as marksAPI from '../api/marks'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'

function CreateMarks() {
  const navigate = useNavigate()
  
  // Form state
  const [formData, setFormData] = useState({
    academicYear: '',
    academicTerm: '',
    classId: '',
    examType: '',
    totalMarks: '',
    examDate: new Date().toISOString().split('T')[0],
    selectedStudents: []
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  
  // Data state
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [classStudents, setClassStudents] = useState([])
  
  // Academic years and terms
  const academicYears = ['2023-2024', '2024-2025', '2025-2026']
  const academicTerms = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM']
  const examTypes = ['BEGINNING_TERM', 'MIDTERM', 'ENDTERM']

  // Load classes and students on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load students when class changes
  useEffect(() => {
    if (formData.classId) {
      loadClassStudents(formData.classId)
    } else {
      setClassStudents([])
      setFormData(prev => ({ ...prev, selectedStudents: [] }))
    }
  }, [formData.classId])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Load classes and students in parallel
      const [classesData, studentsData] = await Promise.all([
        classAPI.getClasses(),
        studentAPI.getStudents()
      ])
      
      setClasses(classesData)
      setStudents(studentsData)
      
      console.log('Loaded classes:', classesData)
      console.log('Loaded students:', studentsData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  const loadClassStudents = (classId) => {
    const studentsInClass = students.filter(student => {
      const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
      return studentClassId === classId
    })
    setClassStudents(studentsInClass)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    if (error) setError('')
  }

  const handleStudentSelection = (studentId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: isSelected 
        ? [...prev.selectedStudents, studentId]
        : prev.selectedStudents.filter(id => id !== studentId)
    }))
  }

  const handleSelectAllStudents = (isSelected) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: isSelected ? classStudents.map(student => student._id) : []
    }))
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
    if (formData.selectedStudents.length === 0) {
      setError('Please select at least one student')
      setLoading(false)
      return
    }

    try {
      // Get the selected class to extract subject information
      const selectedClass = classes.find(cls => cls._id === formData.classId)
      if (!selectedClass) {
        setError('Selected class not found')
        setLoading(false)
        return
      }

      // Validate that class has a valid ID
      if (!selectedClass._id || selectedClass._id.trim() === '') {
        setError('Selected class has invalid ID')
        setLoading(false)
        return
      }

      // Prepare marks data for bulk creation
      const marksRecords = formData.selectedStudents.map(studentId => {
        const student = classStudents.find(s => s._id === studentId)
        if (!student) {
          throw new Error(`Student with ID ${studentId} not found`)
        }

        // Validate student has valid ID
        if (!student._id || student._id.trim() === '') {
          throw new Error(`Student has invalid ID: ${studentId}`)
        }

        return {
          studentId: studentId, // This is already a string ObjectId
          subjectId: selectedClass._id, // This is already a string ObjectId
          teacherId: '68cb13d91f1a33763113f0eb', // This is already a string ObjectId
          classId: formData.classId, // This is already a string ObjectId
          examType: formData.examType,
          totalMarks: parseInt(formData.totalMarks),
          academicYear: formData.academicYear,
          academicTerm: formData.academicTerm,
          examDate: new Date(formData.examDate),
          schoolId: student?.schoolId // Validate before use - no hardcoded fallback
        }
      })

      console.log('Sending bulk marks data:', marksRecords)

      // Validate all records before sending
      const invalidRecords = marksRecords.filter(record => 
        !record.studentId || 
        !record.subjectId || 
        !record.classId || 
        !record.teacherId ||
        !record.schoolId || // Validate schoolId is present
        record.studentId.trim() === '' ||
        record.subjectId.trim() === '' ||
        record.classId.trim() === '' ||
        record.teacherId.trim() === ''
      )

      if (invalidRecords.length > 0) {
        console.error('Invalid records found:', invalidRecords)
        setError('Some records have invalid data. Please check your selections.')
        setLoading(false)
        return
      }

      const response = await marksAPI.createBulkMarks(marksRecords)
      console.log('Bulk marks created successfully:', response)
      
      setSuccess(`Marks created successfully for ${formData.selectedStudents.length} students!`)
      
      // Reset form
      setFormData({
        academicYear: '',
        academicTerm: '',
        classId: '',
        examType: '',
        totalMarks: '',
        examDate: new Date().toISOString().split('T')[0],
        selectedStudents: []
      })
      setClassStudents([])

      setTimeout(() => {
        navigate('/marks')
      }, 2000)

    } catch (error) {
      console.error('Marks creation error:', error)
      
      let errorMessage = 'Failed to create marks. Please try again.'
      
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
        <div className="flex justify-between items-center mb-8">
          <h1 className='text-4xl font-bold text-white'>Create Marks</h1>
          <button
            onClick={() => navigate('/marks')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            View All Marks
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

        {loadingData && (
          <div className='bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-3 rounded-lg text-sm mb-6'>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>Loading classes and students...</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className='w-full space-y-6'>
          {/* Step 1: Academic Year */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>1. Select Academic Year *</label>
            <select 
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading...' : 'Select Academic Year'}
              </option>
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Academic Term */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>2. Select Academic Term *</label>
            <select 
              name="academicTerm"
              value={formData.academicTerm}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading...' : 'Select Academic Term'}
              </option>
              {academicTerms.map(term => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Class Selection */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>3. Select Class *</label>
            <select 
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              required
              disabled={loadingData}
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-600 disabled:text-slate-400'
            >
              <option value=''>
                {loadingData ? 'Loading classes...' : 'Select a class'}
              </option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.className} - {cls.subjectName} ({cls.classRoom})
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Subject (Auto-populated) */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>4. Subject Name</label>
            <input 
              type="text" 
              name="subjectName"
              value={classes.find(cls => cls._id === formData.classId)?.subjectName || ''}
              readOnly
              className='w-full px-4 py-3 bg-slate-600 text-slate-300 rounded-lg border border-slate-500 cursor-not-allowed'
            />
            <p className="text-slate-400 text-xs">Auto-populated from selected class</p>
          </div>

          {/* Step 5: Exam Type */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>5. Select Exam Type *</label>
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

          {/* Step 6: Total Marks */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>6. Set Total Marks *</label>
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

          {/* Step 7: Exam Date */}
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>7. Set Exam Date *</label>
            <input 
              type="date" 
              name="examDate"
              value={formData.examDate}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            />
          </div>

          {/* Step 8: Student Selection */}
          {formData.classId && (
            <div className='space-y-4'>
              <div className="flex justify-between items-center">
                <label className='block text-white text-sm font-medium'>8. Select Students *</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllStudents(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllStudents(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classStudents.map(student => (
                    <label key={student._id} className="flex items-center space-x-3 p-3 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedStudents.includes(student._id)}
                        onChange={(e) => handleStudentSelection(student._id, e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-slate-700 border-slate-500 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-white font-medium">{student.studentName}</span>
                        <p className="text-slate-400 text-xs">ID: {student._id}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {classStudents.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p>No students found in this class</p>
                  </div>
                )}
              </div>
              
              <p className="text-slate-400 text-sm">
                Selected: {formData.selectedStudents.length} student(s)
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className='pt-6'>
            <button 
              type="submit"
              disabled={loading || loadingData || formData.selectedStudents.length === 0}
              className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
            >
              {loading ? 'Creating Marks...' : `Create Marks for ${formData.selectedStudents.length} Students`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMarks