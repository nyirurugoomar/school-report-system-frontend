import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'
import * as attendanceAPI from '../api/attendance'

function Attendance() {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [newAttendanceName, setNewAttendanceName] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [studentAttendance, setStudentAttendance] = useState({})
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  
  // New student form state - updated to match CreateStudentDto
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    classId: '',
    schoolId: '' // Optional field
  })

  // New class form state - updated to match CreateClassDto
  const [newClass, setNewClass] = useState({
    className: '',
    subjectName: '',
    classRoom: '',
    classCredit: ''
  })

  // Classes data - now using state to allow adding new classes
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Students data with class association
  const [students, setStudents] = useState([])

  // Load classes and students on component mount
  useEffect(() => {
    loadClasses()
    loadStudents()
  }, [])

  // Load attendance records when class or date changes
  useEffect(() => {
    if (selectedClass && attendanceDate) {
      loadAttendanceRecords()
    }
  }, [selectedClass, attendanceDate])

  const loadClasses = async () => {
    try {
      const response = await classAPI.getClasses()
      setClasses(response)
    } catch (error) {
      console.error('Error loading classes:', error)
      // Fallback to mock data if API fails
      setClasses([
        { _id: '1', className: 'Mathematics 101', subjectName: 'Mathematics', classRoom: 'Room 101', classCredit: '3', students: 25 },
        { _id: '2', className: 'Physics 201', subjectName: 'Physics', classRoom: 'Room 201', classCredit: '4', students: 30 },
        { _id: '3', className: 'Chemistry 301', subjectName: 'Chemistry', classRoom: 'Room 301', classCredit: '3', students: 20 },
        { _id: '4', className: 'Biology 401', subjectName: 'Biology', classRoom: 'Room 401', classCredit: '4', students: 28 }
      ])
    }
  }

  const loadStudents = async () => {
    try {
      const response = await studentAPI.getStudents()
      setStudents(response)
    } catch (error) {
      console.error('Error loading students:', error)
      // Fallback to mock data if API fails
      setStudents([
        { _id: '1', studentName: 'John Doe', classId: '1', schoolId: 'school1' },
        { _id: '2', studentName: 'Jane Smith', classId: '1', schoolId: 'school1' },
        { _id: '3', studentName: 'Mike Johnson', classId: '2', schoolId: 'school1' },
        { _id: '4', studentName: 'Sarah Wilson', classId: '2', schoolId: 'school1' },
        { _id: '5', studentName: 'David Brown', classId: '3', schoolId: 'school1' },
        { _id: '6', studentName: 'Emily Davis', classId: '3', schoolId: 'school1' },
        { _id: '7', studentName: 'Chris Miller', classId: '4', schoolId: 'school1' },
        { _id: '8', studentName: 'Lisa Garcia', classId: '4', schoolId: 'school1' }
      ])
    }
  }

  const loadAttendanceRecords = async () => {
    if (!selectedClass) return

    try {
      const selectedClassData = classes.find(cls => cls.className === selectedClass)
      if (!selectedClassData) return

      const response = await attendanceAPI.getAttendanceByClass(selectedClassData._id, attendanceDate)
      setAttendanceRecords(response)
      
      // Create a map of student attendance for easy lookup
      const attendanceMap = {}
      response.forEach(record => {
        attendanceMap[record.studentId] = {
          status: record.status,
          remarks: record.remarks,
          _id: record._id
        }
      })
      setStudentAttendance(attendanceMap)
      
    } catch (error) {
      console.error('Error loading attendance records:', error)
      setAttendanceRecords([])
      setStudentAttendance({})
    }
  }

  const handleCreateClass = async () => {
    // Validation according to DTO
    if (!newClass.className.trim()) {
      setError('Class name is required')
      return
    }
    if (!newClass.subjectName.trim()) {
      setError('Subject name is required')
      return
    }
    if (!newClass.classRoom.trim()) {
      setError('Class room is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Prepare data according to CreateClassDto
      const classData = {
        className: newClass.className.trim(),
        subjectName: newClass.subjectName.trim(),
        classRoom: newClass.classRoom.trim(),
        classCredit: newClass.classCredit.trim() || undefined // Optional field
      }

      console.log('Sending class data:', classData)

      const response = await classAPI.createClass(classData)
      console.log('Class created successfully:', response)
      
      // Add the new class to the local state
      const newClassData = {
        _id: response._id || Date.now().toString(),
        className: response.className,
        subjectName: response.subjectName,
        classRoom: response.classRoom,
        classCredit: response.classCredit,
        students: 0
      }
      
      setClasses([...classes, newClassData])
      setNewClass({ className: '', subjectName: '', classRoom: '', classCredit: '' })
      setShowCreateClassModal(false)
      
    } catch (error) {
      console.error('Class creation error:', error)
      
      let errorMessage = 'Failed to create class. Please try again.'
      
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

  const handleAddStudent = async () => {
    // Validation according to CreateStudentDto
    if (!newStudent.studentName.trim()) {
      setError('Student name is required')
      return
    }
    if (!newStudent.classId) {
      setError('Class selection is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Prepare data according to CreateStudentDto
      const studentData = {
        studentName: newStudent.studentName.trim(),
        classId: newStudent.classId,
        schoolId: newStudent.schoolId.trim() || undefined // Optional field
      }

      console.log('Sending student data:', studentData)

      const response = await studentAPI.createStudent(studentData)
      console.log('Student created successfully:', response)
      
      // Add the new student to the local state
      const newStudentData = {
        _id: response._id || Date.now().toString(),
        studentName: response.studentName,
        classId: response.classId,
        schoolId: response.schoolId
      }
      
      setStudents([...students, newStudentData])
      
      // Update class student count
      setClasses(classes.map(cls => 
        cls._id === newStudent.classId 
          ? { ...cls, students: (cls.students || 0) + 1 }
          : cls
      ))
      
      setNewStudent({ studentName: '', classId: '', schoolId: '' })
      setShowAddStudentModal(false)
      
    } catch (error) {
      console.error('Student creation error:', error)
      
      let errorMessage = 'Failed to create student. Please try again.'
      
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

  const handleCreateAttendance = () => {
    if (newAttendanceName.trim()) {
      // Get students for the selected class
      const classStudents = students.filter(student => {
        const classData = classes.find(cls => cls.className === selectedClass)
        return classData && student.classId === classData._id
      })
      
      const newRecord = {
        id: Date.now(),
        name: newAttendanceName,
        class: selectedClass,
        date: new Date().toLocaleDateString(),
        students: classStudents.map(student => ({
          ...student,
          present: false
        }))
      }
      setAttendanceRecords([...attendanceRecords, newRecord])
      setNewAttendanceName('')
      setShowCreateModal(false)
      setSelectedAttendance(newRecord)
    }
  }

  const toggleStudentAttendance = async (studentId, status) => {
    if (!selectedClass) return

    setLoading(true)
    setError('')

    try {
      const selectedClassData = classes.find(cls => cls.className === selectedClass)
      const student = students.find(s => s._id === studentId)
      
      if (!selectedClassData || !student) {
        setError('Invalid class or student data')
        return
      }

      // Prepare attendance data according to CreateAttendanceDto
      const attendanceData = {
        studentId: studentId,
        classId: selectedClassData._id,
        schoolId: student.schoolId || 'default-school-id', // You might want to get this from user context
        date: attendanceDate,
        status: status,
        remarks: status === 'late' ? 'Late arrival' : status === 'excused' ? 'Excused absence' : ''
      }

      // Check if attendance record already exists for this student/date
      const existingRecord = attendanceRecords.find(record => 
        record.studentId === studentId && record.date === attendanceDate
      )

      let response
      if (existingRecord) {
        // Update existing record
        response = await attendanceAPI.updateAttendance(existingRecord._id, attendanceData)
      } else {
        // Create new record
        response = await attendanceAPI.createAttendance(attendanceData)
      }

      console.log('Attendance updated successfully:', response)

      // Update local state
      const updatedAttendanceMap = {
        ...studentAttendance,
        [studentId]: {
          status: status,
          remarks: attendanceData.remarks,
          _id: response._id
        }
      }
      setStudentAttendance(updatedAttendanceMap)

      // Update attendance records
      const updatedRecords = attendanceRecords.filter(record => 
        !(record.studentId === studentId && record.date === attendanceDate)
      )
      updatedRecords.push(response)
      setAttendanceRecords(updatedRecords)

    } catch (error) {
      console.error('Attendance update error:', error)
      
      let errorMessage = 'Failed to update attendance. Please try again.'
      
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

  const saveAttendance = async () => {
    if (!selectedClass) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const selectedClassData = classes.find(cls => cls.className === selectedClass)
      const classStudents = students.filter(student => student.classId === selectedClassData._id)
      
      // Prepare bulk attendance data
      const attendanceRecords = classStudents.map(student => ({
        studentId: student._id,
        classId: selectedClassData._id,
        schoolId: student.schoolId || 'default-school-id',
        date: attendanceDate,
        status: studentAttendance[student._id]?.status || 'absent',
        remarks: studentAttendance[student._id]?.remarks || ''
      }))

      console.log('Saving bulk attendance data:', attendanceRecords)

      const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
      console.log('Bulk attendance saved successfully:', response)
      
      setSuccess('Attendance saved successfully!')
      
      // Reload attendance records
      await loadAttendanceRecords()
      
      // Navigate to success page after a short delay
      setTimeout(() => {
        navigate('/success')
      }, 2000)

    } catch (error) {
      console.error('Save attendance error:', error)
      
      let errorMessage = 'Failed to save attendance. Please try again.'
      
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

  const selectedClassData = classes.find(cls => cls.className === selectedClass)
  const studentsInSelectedClass = selectedClassData ? 
    students.filter(student => student.classId === selectedClassData._id) : []

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-4xl font-bold text-white mb-8 text-center'>Attendance Management</h1>
        
        {/* Success Message */}
        {success && (
          <div className='bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6'>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6'>
            {error}
          </div>
        )}
        
        {/* Class Selection */}
        <div className='mb-8'>
          <div className='bg-slate-700 rounded-lg p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-white'>Select Class</h2>
              <div className='flex space-x-3'>
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className='bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  + Create Class
                </button>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  + Add Student
                </button>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {classes.map(cls => (
                <button
                  key={cls._id}
                  onClick={() => setSelectedClass(cls.className)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedClass === cls.className
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-slate-600 bg-slate-600 text-gray-300 hover:border-slate-500'
                  }`}
                >
                  <div className='text-left'>
                    <h3 className='font-semibold'>{cls.className}</h3>
                    <p className='text-sm opacity-75'>{cls.subjectName}</p>
                    <p className='text-xs opacity-60'>{cls.classRoom} | {cls.classCredit} credits</p>
                    <p className='text-sm opacity-75 mt-1'>{cls.students || 0} students</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Selection and Class Info */}
        {selectedClass && (
          <div className='mb-6'>
            <div className='bg-slate-700 rounded-lg p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold text-white'>
                  Attendance for {selectedClass} ({studentsInSelectedClass.length} students)
                </h2>
                <div className='flex items-center space-x-4'>
                  <label className='text-white text-sm font-medium'>Date:</label>
                  <input
                    type='date'
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className='px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Attendance List */}
        {selectedClass && studentsInSelectedClass.length > 0 && (
          <div className='bg-slate-700 rounded-lg p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold text-white'>
                Mark Attendance - {selectedClass}
              </h2>
              <button
                onClick={saveAttendance}
                disabled={loading}
                className='bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {studentsInSelectedClass.map(student => {
                const attendance = studentAttendance[student._id]
                const status = attendance?.status || 'absent'
                
                return (
                  <div
                    key={student._id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      status === 'present'
                        ? 'border-green-500 bg-green-500/20'
                        : status === 'late'
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : status === 'excused'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-red-500 bg-red-500/20'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div>
                        <h3 className='font-semibold text-white'>{student.studentName}</h3>
                        <p className='text-gray-300 text-sm'>ID: {student._id}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        status === 'present'
                          ? 'bg-green-500 text-white'
                          : status === 'late'
                          ? 'bg-yellow-500 text-white'
                          : status === 'excused'
                          ? 'bg-blue-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'present')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'late')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'late'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'excused')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'excused'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        Excused
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'absent')}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                    
                    {attendance?.remarks && (
                      <div className='mt-2'>
                        <p className='text-gray-300 text-xs'>Remarks: {attendance.remarks}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rest of the modals remain the same... */}
        {/* Create Class Modal */}
        {showCreateClassModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4'>
              <h2 className='text-xl font-semibold text-white mb-4'>Create New Class</h2>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Class Name *</label>
                  <input
                    type='text'
                    value={newClass.className}
                    onChange={(e) => setNewClass({...newClass, className: e.target.value})}
                    placeholder='e.g., Advanced Mathematics'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Subject Name *</label>
                  <input
                    type='text'
                    value={newClass.subjectName}
                    onChange={(e) => setNewClass({...newClass, subjectName: e.target.value})}
                    placeholder='e.g., Mathematics'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Class Room *</label>
                  <input
                    type='text'
                    value={newClass.classRoom}
                    onChange={(e) => setNewClass({...newClass, classRoom: e.target.value})}
                    placeholder='e.g., Room 501'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Class Credit</label>
                  <input
                    type='text'
                    value={newClass.classCredit}
                    onChange={(e) => setNewClass({...newClass, classCredit: e.target.value})}
                    placeholder='3'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
              </div>
              
              <div className='flex space-x-4 mt-6'>
                <button
                  onClick={() => {
                    setShowCreateClassModal(false)
                    setNewClass({ className: '', subjectName: '', classRoom: '', classCredit: '' })
                    setError('')
                  }}
                  className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={loading || !newClass.className.trim() || !newClass.subjectName.trim() || !newClass.classRoom.trim()}
                  className='flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4'>
              <h2 className='text-xl font-semibold text-white mb-4'>Add New Student</h2>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Student Name *</label>
                  <input
                    type='text'
                    value={newStudent.studentName}
                    onChange={(e) => setNewStudent({...newStudent, studentName: e.target.value})}
                    placeholder='Enter student full name'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Select Class *</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value=''>Select a class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.className} - {cls.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-white text-sm font-medium mb-2'>School ID (Optional)</label>
                  <input
                    type='text'
                    value={newStudent.schoolId}
                    onChange={(e) => setNewStudent({...newStudent, schoolId: e.target.value})}
                    placeholder='Enter school ID'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
              </div>
              
              <div className='flex space-x-4 mt-6'>
                <button
                  onClick={() => {
                    setShowAddStudentModal(false)
                    setNewStudent({ studentName: '', classId: '', schoolId: '' })
                    setError('')
                  }}
                  className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={loading || !newStudent.studentName.trim() || !newStudent.classId}
                  className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance