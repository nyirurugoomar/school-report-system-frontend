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

  // Students modal states
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null)
  
  // Attendance improvement states
  const [attendanceSummary, setAttendanceSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0
  })
  const [autoSave, setAutoSave] = useState(false)
  const [updatingStudents, setUpdatingStudents] = useState(new Set())
  const [pendingRequests, setPendingRequests] = useState(new Map())

  // Load classes and students on component mount
  useEffect(() => {
    loadClasses()
    loadStudents()
  }, [])

  // Load attendance records and summary when classes, date, or selectedClass changes
  useEffect(() => {
    if (classes.length > 0 && attendanceDate) {
      console.log('=== DATE CHANGED ===')
      console.log('Selected date:', attendanceDate)
      console.log('Available classes:', classes.length)
      
      // Load attendance records for the selected date
      loadAllAttendanceRecords()
      
      // Load attendance summary using the API
      loadAttendanceSummaryForAllClasses(attendanceDate)
    }
  }, [classes, attendanceDate])


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
        { _id: '1', studentName: 'John Doe', classId: '1', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '2', studentName: 'Jane Smith', classId: '1', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '3', studentName: 'Mike Johnson', classId: '2', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '4', studentName: 'Sarah Wilson', classId: '2', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '5', studentName: 'David Brown', classId: '3', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '6', studentName: 'Emily Davis', classId: '3', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '7', studentName: 'Chris Miller', classId: '4', schoolId: '68c547e28a9c12a9210a256f' },
        { _id: '8', studentName: 'Lisa Garcia', classId: '4', schoolId: '68c547e28a9c12a9210a256f' }
      ])
    }
  }

  const loadAttendanceRecords = async (classId = null) => {
    const targetClassId = classId || (selectedClass ? classes.find(cls => cls.className === selectedClass)?._id : null)
    if (!targetClassId) return

    try {
      // Pass the attendanceDate to filter by specific date
      const response = await attendanceAPI.getAttendanceByClass(targetClassId, attendanceDate)
      
      // Always update records when loading for a specific class
      if (classId) {
        // Loading for a specific class (from Take Attendance button)
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
      } else if (selectedClass) {
        // Loading for the currently selected class
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
      }
      
      return response
      
    } catch (error) {
      console.error('Error loading attendance records:', error)
      if (classId || selectedClass) {
      setAttendanceRecords([])
      setStudentAttendance({})
      }
      return []
    }
  }

  // Load attendance records for all classes to show counts in Classes Overview
  const loadAllAttendanceRecords = async () => {
    try {
      console.log('Loading all attendance records for date:', attendanceDate)
      const allRecords = []
      
      // Load attendance for each class
      for (const cls of classes) {
        try {
          console.log(`=== LOADING CLASS ${cls.className} ===`)
          console.log(`Class ID: ${cls._id}`)
          console.log(`Date: ${attendanceDate}`)
          
          const response = await attendanceAPI.getAttendanceByClass(cls._id, attendanceDate)
          console.log(`Got ${response.length} records for class ${cls.className}`)
          console.log('Response data:', response)
          
          if (response.length > 0) {
            console.log('First record structure:', response[0])
            console.log('Record statuses:', response.map(r => r.status))
          }
          
          allRecords.push(...response)
        } catch (error) {
          console.error(`Error loading attendance for class ${cls._id}:`, error)
        }
      }
      
      console.log('Total attendance records loaded:', allRecords.length, allRecords)
      setAttendanceRecords(allRecords)
      
    } catch (error) {
      console.error('Error loading all attendance records:', error)
    }
  }

  // Load attendance summary for a specific class and date using the API
  const loadAttendanceSummary = async (classId, date) => {
    try {
      console.log('Loading attendance summary for class:', classId, 'date:', date)
      const summary = await attendanceAPI.getAttendanceSummary(classId, date);
      console.log('Raw summary from backend:', summary)
      
      // Map backend response to frontend format
      const mappedSummary = {
        total: summary.totalStudents || summary.total || 0,
        present: summary.present || 0,
        absent: summary.absent || 0,
        late: summary.late || 0,
        excused: summary.excused || 0,
        attendanceRate: summary.attendanceRate || 0
      }
      
      console.log('Mapped summary:', mappedSummary)
      setAttendanceSummary(mappedSummary);
      return mappedSummary;
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      return null;
    }
  };

  // Load attendance summary for all classes using the API
  const loadAttendanceSummaryForAllClasses = async (date) => {
    try {
      console.log('Loading attendance summary for all classes on date:', date)
      
      // Create a summary that shows data per class for the selected date
      const summary = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0,
        classBreakdown: [] // This will hold data per class
      };

      // Load summary for each class using the API
      const classSummaries = [];
      for (const cls of classes) {
        try {
          console.log(`Loading summary for class ${cls.className} (${cls._id})`)
          const classSummary = await loadAttendanceSummary(cls._id, date);
          
          if (classSummary) {
            // Add class info to the summary
            const classData = {
              classId: cls._id,
              className: cls.className,
              total: classSummary.total,
              present: classSummary.present,
              absent: classSummary.absent,
              late: classSummary.late,
              excused: classSummary.excused,
              attendanceRate: classSummary.attendanceRate
            };
            
            classSummaries.push(classData);
            
            // Add to overall totals
            summary.total += classSummary.total;
            summary.present += classSummary.present;
            summary.absent += classSummary.absent;
            summary.late += classSummary.late;
            summary.excused += classSummary.excused;
            
            console.log(`Added class summary for ${cls.className}:`, classData)
          }
        } catch (error) {
          console.error(`Error loading summary for class ${cls._id}:`, error)
        }
      }

      // Set class breakdown
      summary.classBreakdown = classSummaries;

      // Calculate overall attendance rate
      if (summary.total > 0) {
        summary.attendanceRate = Math.round((summary.present / summary.total) * 100);
      }

      console.log('API-based attendance summary with class breakdown:', summary)
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading API-based attendance summary:', error);
    }
  };

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

  const toggleStudentAttendance = async (studentId, status, classId = null) => {
    // STRICT DUPLICATE PREVENTION - Multiple layers of protection
    const requestKey = `${studentId}-${status}-${attendanceDate}`
    
    // 1. Check if student is already being updated
    if (updatingStudents.has(studentId)) {
      return
    }
    
    // 2. Check if same request is already pending
    if (pendingRequests.has(requestKey)) {
      return
    }
    
    // 3. Check if we're already in the middle of updating this student
    const currentStatus = studentAttendance[studentId]?.status
    if (currentStatus === status) {
      return
    }

    // Add student to updating set and request to pending map
    setUpdatingStudents(prev => new Set(prev).add(studentId))
    setPendingRequests(prev => new Map(prev).set(requestKey, true))
    setError('')

    try {
      // Determine which class to use
      let targetClassId = classId
      let selectedClassData = null
      
      if (classId) {
        selectedClassData = classes.find(cls => cls._id === classId)
      } else if (selectedClass) {
        selectedClassData = classes.find(cls => cls.className === selectedClass)
        targetClassId = selectedClassData?._id
      } else {
        setError('No class selected for attendance')
        return
      }

      const student = students.find(s => s._id === studentId)
      
      if (!selectedClassData || !student) {
        setError('Invalid class or student data')
        return
      }

      // Update local state immediately for better UX
      const updatedAttendanceMap = {
        ...studentAttendance,
        [studentId]: {
          status: status,
          remarks: status === 'late' ? 'Late arrival' : status === 'excused' ? 'Excused absence' : '',
          _id: studentAttendance[studentId]?._id || 'temp'
        }
      }
      setStudentAttendance(updatedAttendanceMap)

      // Prepare attendance data for bulk API
      const attendanceData = {
        studentId: studentId,
        classId: targetClassId,
        schoolId: student.schoolId || '68c547e28a9c12a9210a256f',
        date: attendanceDate,
        status: status,
        remarks: status === 'late' ? 'Late arrival' : status === 'excused' ? 'Excused absence' : ''
      }

      // Use bulk API to prevent duplicates (backend handles cleanup)
      const response = await attendanceAPI.createBulkAttendance([attendanceData])

      // Update the attendance record with the actual response
      if (response && response.length > 0) {
        const updatedAttendanceMapWithId = {
          ...studentAttendance,
          [studentId]: {
            status: status,
            remarks: attendanceData.remarks,
            _id: response[0]._id
          }
        }
        setStudentAttendance(updatedAttendanceMapWithId)

        // Update attendance records
        const updatedRecords = attendanceRecords.filter(record => 
          !(record.studentId === studentId && record.date === attendanceDate)
        )
        updatedRecords.push(response[0])
        setAttendanceRecords(updatedRecords)
      }

      setSuccess(`Student attendance updated to ${status}!`)
      
      // Refresh the attendance summary using the API
      await loadAttendanceSummaryForAllClasses(attendanceDate)

    } catch (error) {
      console.error('Attendance update error:', error)
      
      // Revert local state on error
      const revertedAttendanceMap = {
        ...studentAttendance,
        [studentId]: studentAttendance[studentId] || { status: 'absent', remarks: '', _id: null }
      }
      setStudentAttendance(revertedAttendanceMap)
      
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
      // Clean up: Remove student from updating set and request from pending map
      setUpdatingStudents(prev => {
        const newSet = new Set(prev)
        newSet.delete(studentId)
        return newSet
      })
      setPendingRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(requestKey)
        return newMap
      })
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
        schoolId: student.schoolId || '68c547e28a9c12a9210a256f', // Use a real MongoDB ObjectId format
        date: attendanceDate,
        status: studentAttendance[student._id]?.status || 'absent',
        remarks: studentAttendance[student._id]?.remarks || ''
      }))

      console.log('Saving bulk attendance data:', attendanceRecords)

      const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
      console.log('Bulk attendance saved successfully:', response)
      
      setSuccess('Attendance saved successfully!')
      
      // Reload attendance records and summary to update the counts
      await loadAllAttendanceRecords()
      await loadAttendanceSummaryForAllClasses(attendanceDate)
      
      // Navigate to success page immediately
        navigate('/success')

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

  // Helper functions for students modal
  const getClassName = (cls) => {
    if (!cls) return 'Unknown Class'
    if (typeof cls.className === 'object') {
      return cls.className.name || cls.className._id || 'Unknown Class'
    }
    return cls.className || 'Unknown Class'
  }

  const getSubjectName = (cls) => {
    if (!cls) return 'Unknown Subject'
    if (typeof cls.subjectName === 'object') {
      return cls.subjectName.name || cls.subjectName._id || 'Unknown Subject'
    }
    return cls.subjectName || 'Unknown Subject'
  }

  const getStudentName = (student) => {
    if (!student) return 'Unknown Student'
    if (typeof student.studentName === 'object') {
      return student.studentName.name || student.studentName._id || 'Unknown Student'
    }
    return student.studentName || 'Unknown Student'
  }

  const getClassNameFromId = (classId) => {
    if (!classId) return 'No Class'
    if (typeof classId === 'object') {
      return classId.className || classId.name || classId._id || 'Unknown Class'
    }
    // If it's a string ID, find the class name from classes array
    const foundClass = classes.find(cls => cls._id === classId)
    return foundClass ? foundClass.className : classId
  }

  const getSchoolId = (schoolId) => {
    if (!schoolId) return null
    if (typeof schoolId === 'object') {
      return schoolId._id || schoolId.name || schoolId.id || 'Unknown School'
    }
    return schoolId
  }

  // Calculate attendance summary based on selected date
  const calculateAttendanceSummary = () => {
    if (!attendanceDate) return
    
    const summary = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0
    }

    console.log('Calculating summary for date:', attendanceDate)
    console.log('Available attendance records:', attendanceRecords)

    // Calculate based on attendance records for the selected date ONLY
    attendanceRecords.forEach(record => {
      // Fix date comparison - handle both ISO datetime and date string formats
      const recordDate = new Date(record.date).toISOString().split('T')[0]
      const selectedDate = new Date(attendanceDate).toISOString().split('T')[0]
      const dateMatch = recordDate === selectedDate
      
      console.log('Checking record:', {
        recordDate: record.date,
        recordDateNormalized: recordDate,
        selectedDate: attendanceDate,
        selectedDateNormalized: selectedDate,
        matches: dateMatch,
        status: record.status
      })
      
      if (dateMatch) {
        summary.total++
        summary[record.status]++
      }
    })

    // Calculate attendance rate
    if (summary.total > 0) {
      summary.attendanceRate = Math.round((summary.present / summary.total) * 100);
    }

    setAttendanceSummary(summary)
    console.log('Calculated attendance summary for date:', attendanceDate, summary)
  }

  // Bulk attendance actions
  const markAllStudents = async (status) => {
    if (!selectedClass) return

    setLoading(true)
    setError('')

    try {
      const selectedClassData = classes.find(cls => cls.className === selectedClass)
      if (!selectedClassData) return

      const promises = studentsInSelectedClass.map(async (student) => {
        const attendanceData = {
          studentId: student._id,
          classId: selectedClassData._id,
          schoolId: student.schoolId || '68c547e28a9c12a9210a256f', // Use a real MongoDB ObjectId format
          date: attendanceDate,
          status: status,
          remarks: status === 'late' ? 'Late arrival' : status === 'excused' ? 'Excused absence' : ''
        }

        const existingRecord = attendanceRecords.find(record => 
          record.studentId === student._id && record.date === attendanceDate
        )

        if (existingRecord) {
          return await attendanceAPI.updateAttendance(existingRecord._id, attendanceData)
        } else {
          return await attendanceAPI.createAttendance(attendanceData)
        }
      })

      const responses = await Promise.all(promises)
      
      // Update local state
      const updatedAttendanceMap = {}
      studentsInSelectedClass.forEach(student => {
        updatedAttendanceMap[student._id] = {
          status: status,
          remarks: status === 'late' ? 'Late arrival' : status === 'excused' ? 'Excused absence' : '',
          _id: responses.find(r => r.studentId === student._id)?._id
        }
      })
      setStudentAttendance(updatedAttendanceMap)

      // Update attendance records
      const updatedRecords = attendanceRecords.filter(record => 
        !(studentsInSelectedClass.some(student => 
          student._id === record.studentId && record.date === attendanceDate
        ))
      )
      updatedRecords.push(...responses)
      setAttendanceRecords(updatedRecords)

      setSuccess(`All students marked as ${status}!`)
      
      // Refresh the attendance summary using the API
      await loadAttendanceSummaryForAllClasses(attendanceDate)

    } catch (error) {
      console.error('Bulk attendance error:', error)
      setError('Failed to update attendance for all students')
    } finally {
      setLoading(false)
    }
  }

  const selectedClassData = classes.find(cls => cls.className === selectedClass)
  const studentsInSelectedClass = selectedClassData ? 
    students.filter(student => {
      const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
      console.log('Filtering students:', {
        selectedClass,
        selectedClassData: selectedClassData?._id,
        studentClassId,
        studentName: student.studentName,
        matches: studentClassId === selectedClassData._id
      })
      return studentClassId === selectedClassData._id
    }) : []

  // Note: Attendance summary is now loaded via API in loadAttendanceSummaryForAllClasses
  // No need for manual calculation since we're using the backend API

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
        
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Classes Overview</h3>
            <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                >
                + Add Class
                </button>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  + Add Student
                </button>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.slice(0, 6).map(cls => {
              const classStudents = students.filter(student => {
                const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                return studentClassId === cls._id
              })
              const studentCount = classStudents.length
              
              return (
                <div 
                  key={cls._id}
                  className="bg-slate-600 rounded-lg p-4 hover:bg-slate-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{getClassName(cls)}</h4>
                      <p className="text-slate-300 text-sm">{getSubjectName(cls)}</p>
                      <p className="text-slate-400 text-xs">Room: {cls.classRoom || 'N/A'}</p>
                  </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">ID: {cls._id}</p>
                      <p className="text-slate-400 text-xs">{studentCount} students</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClassForStudents(cls)
                        setShowStudentsModal(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      👥 View Students
                </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (studentCount > 0) {
                          const className = getClassName(cls)
                          
                          // Save attendance directly and show summary
                          try {
                            // First load current attendance data
                            await loadAttendanceRecords(cls._id)
                            
                            // Then save the attendance
                            const classStudents = students.filter(student => {
                              const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                              return studentClassId === cls._id
                            })
                            
                            // Prepare bulk attendance data
                            const attendanceRecords = classStudents.map(student => ({
                              studentId: student._id,
                              classId: cls._id,
                              schoolId: student.schoolId || '68c547e28a9c12a9210a256f',
                              date: attendanceDate,
                              status: studentAttendance[student._id]?.status || 'absent',
                              remarks: studentAttendance[student._id]?.remarks || ''
                            }))

                            console.log('Saving bulk attendance data:', attendanceRecords)
                            const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
                            console.log('Bulk attendance saved successfully:', response)
                            
                            // Load updated summary
                            await loadAttendanceSummary(cls._id, attendanceDate)
                            
                            setSuccess(`Attendance for ${className} saved successfully! Summary updated.`)
                            
                            // Navigate to success page
                            navigate('/success')
                          } catch (error) {
                            console.error('Error saving attendance:', error)
                            setError('Failed to save attendance. Please try again.')
                          }
                        } else {
                          setError('No students in this class. Add students first.')
                        }
                      }}
                      disabled={studentCount === 0}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        studentCount > 0 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      💾 Save Attendance
                    </button>
            </div>
                  
                  {/* Quick Stats */}
                  {studentCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-500">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Today's Attendance:</span>
                        <span className="text-green-400">
                          {(() => {
                            const presentCount = attendanceRecords.filter(record => {
                              const recordClassId = typeof record.classId === 'object' ? record.classId._id : record.classId
                              return recordClassId === cls._id && record.date === attendanceDate && record.status === 'present'
                            }).length
                            return `${presentCount}/${studentCount}`
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {classes.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-8">
                <p>No classes found. Create your first class!</p>
              </div>
            )}
          </div>
        </div>

        {/* Date-Specific Attendance Summary */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">📊 Attendance for Specific Date</h3>
              <p className="text-slate-400 text-sm mt-1">
                Select a date to view attendance details for that specific day
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className='text-white text-sm font-medium'>Select Date:</label>
                  <input
                    type='date'
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                className='px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>
              </div>
          
          {/* Selected Date Display */}
          <div className="bg-slate-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-lg font-semibold">
                  📅 {new Date(attendanceDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <p className="text-slate-400 text-sm">
                  Attendance records for this specific date
                </p>
            </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    const totalStudents = classes.reduce((total, cls) => {
                      const classStudents = students.filter(student => {
                        const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                        return studentClassId === cls._id
                      })
                      return total + classStudents.length
                    }, 0)
                    const presentStudents = attendanceRecords.filter(record => 
                      record.date === attendanceDate && record.status === 'present'
                    ).length
                    return totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
                  })()}%
                </div>
                <div className="text-slate-400 text-sm">Overall Attendance</div>
              </div>
            </div>
          </div>
          
          {/* Per-Class Attendance for Selected Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              const classStudents = students.filter(student => {
                const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                return studentClassId === cls._id
              })
              const studentCount = classStudents.length
              
              // Get attendance records for THIS SPECIFIC DATE
              const dateAttendanceRecords = attendanceRecords.filter(record => {
                const recordClassId = typeof record.classId === 'object' ? record.classId._id : record.classId
                return recordClassId === cls._id && record.date === attendanceDate
              })
              
              // Count students by status for THIS DATE
              const presentCount = dateAttendanceRecords.filter(record => record.status === 'present').length
              const absentCount = dateAttendanceRecords.filter(record => record.status === 'absent').length
              const lateCount = dateAttendanceRecords.filter(record => record.status === 'late').length
              const excusedCount = dateAttendanceRecords.filter(record => record.status === 'excused').length
              
              // Calculate attendance percentage for THIS DATE
              const attendancePercentage = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0
              
              // Check if attendance was taken for this date
              const attendanceTaken = dateAttendanceRecords.length > 0
              
              return (
                <div 
                  key={cls._id} 
                  className={`rounded-lg p-4 transition-colors ${
                    attendanceTaken 
                      ? 'bg-slate-600 hover:bg-slate-500' 
                      : 'bg-slate-800 border-2 border-dashed border-slate-600'
                  }`}
                >
                  {/* Class Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg">{getClassName(cls)}</h4>
                      <p className="text-slate-300 text-sm">{getSubjectName(cls)}</p>
                      <p className="text-slate-400 text-xs">Room: {cls.classRoom || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      {attendanceTaken ? (
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          attendancePercentage >= 80 ? 'bg-green-600 text-white' :
                          attendancePercentage >= 60 ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {attendancePercentage}%
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-sm font-bold bg-gray-600 text-gray-300">
                          No Data
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Date-Specific Attendance Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Students:</span>
                      <span className="text-white font-medium">{studentCount}</span>
                    </div>
                    
                    {attendanceTaken ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-green-400 text-sm">✓ Present:</span>
                          <span className="text-green-400 font-medium">{presentCount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-red-400 text-sm">✗ Absent:</span>
                          <span className="text-red-400 font-medium">{absentCount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400 text-sm">⏰ Late:</span>
                          <span className="text-yellow-400 font-medium">{lateCount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-blue-400 text-sm">📝 Excused:</span>
                          <span className="text-blue-400 font-medium">{excusedCount}</span>
                        </div>
                        
                        {/* Specific Date Summary */}
                        <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                          <div className="text-center">
                            <p className="text-white font-medium text-sm">
                              On {new Date(attendanceDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}:
                            </p>
                            <p className="text-green-400 font-bold text-lg">
                              {presentCount}/{studentCount} Present
                            </p>
                            <p className="text-red-400 text-sm">
                              {absentCount}/{studentCount} Absent
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                        <div className="text-center">
                          <p className="text-slate-400 text-sm">
                            No attendance recorded for
                          </p>
                          <p className="text-slate-300 font-medium">
                            {new Date(attendanceDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar (only if attendance taken) */}
                  {attendanceTaken && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Attendance Rate</span>
                        <span>{presentCount}/{studentCount}</span>
                      </div>
                      <div className="w-full bg-slate-500 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            attendancePercentage >= 80 ? 'bg-green-500' :
                            attendancePercentage >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${attendancePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClassForStudents(cls)
                        setShowStudentsModal(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      👥 View Students
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (studentCount > 0) {
                          const className = getClassName(cls)
                          
                          // Save attendance directly and show summary
                          try {
                            // First load current attendance data
                            await loadAttendanceRecords(cls._id)
                            
                            // Then save the attendance
                            const classStudents = students.filter(student => {
                              const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                              return studentClassId === cls._id
                            })
                            
                            // Prepare bulk attendance data
                            const attendanceRecords = classStudents.map(student => ({
                              studentId: student._id,
                              classId: cls._id,
                              schoolId: student.schoolId || '68c547e28a9c12a9210a256f',
                              date: attendanceDate,
                              status: studentAttendance[student._id]?.status || 'absent',
                              remarks: studentAttendance[student._id]?.remarks || ''
                            }))

                            console.log('Saving bulk attendance data:', attendanceRecords)
                            const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
                            console.log('Bulk attendance saved successfully:', response)
                            
                            // Load updated summary
                            await loadAttendanceSummary(cls._id, attendanceDate)
                            
                            setSuccess(`Attendance for ${className} on ${new Date(attendanceDate).toLocaleDateString()} saved successfully! Summary updated.`)
                            
                            // Navigate to success page
                            navigate('/success')
                          } catch (error) {
                            console.error('Error saving attendance:', error)
                            setError('Failed to save attendance. Please try again.')
                          }
                        } else {
                          setError('No students in this class. Add students first.')
                        }
                      }}
                      disabled={studentCount === 0}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        studentCount > 0 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      💾 Save Attendance
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Overall Summary for Selected Date */}
          <div className="mt-6 pt-6 border-t border-slate-500">
            <h4 className="text-lg font-semibold text-white mb-4">
              📈 Summary for {new Date(attendanceDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-600 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {classes.reduce((total, cls) => {
                    const classStudents = students.filter(student => {
                      const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                      return studentClassId === cls._id
                    })
                    return total + classStudents.length
                  }, 0)}
                </div>
                <div className="text-slate-400 text-sm">Total Students</div>
              </div>
              
              <div className="bg-green-600 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {attendanceRecords.filter(record => 
                    record.date === attendanceDate && record.status === 'present'
                  ).length}
                </div>
                <div className="text-green-200 text-sm">Present on {new Date(attendanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              
              <div className="bg-red-600 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {attendanceRecords.filter(record => 
                    record.date === attendanceDate && record.status === 'absent'
                  ).length}
                </div>
                <div className="text-red-200 text-sm">Absent on {new Date(attendanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              
              <div className="bg-blue-600 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    const totalStudents = classes.reduce((total, cls) => {
                      const classStudents = students.filter(student => {
                        const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                        return studentClassId === cls._id
                      })
                      return total + classStudents.length
                    }, 0)
                    const presentStudents = attendanceRecords.filter(record => 
                      record.date === attendanceDate && record.status === 'present'
                    ).length
                    return totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
                  })()}%
                </div>
                <div className="text-blue-200 text-sm">Attendance Rate</div>
              </div>
            </div>
          </div>
        </div>
        


        {/* Attendance Summary */}
        {attendanceDate && (
          <div className='bg-slate-700 rounded-lg p-6 mb-6'>
            <div className="flex justify-between items-center mb-4">
              <h2 className='text-xl font-semibold text-white'>
              📊 Summary for {new Date(attendanceDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadAttendanceSummaryForAllClasses(attendanceDate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
              <div className='bg-slate-600 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-white'>{attendanceSummary.total}</div>
                <div className='text-slate-400 text-sm'>Total Students</div>
              </div>
              <div className='bg-green-600 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-white'>{attendanceSummary.present}</div>
                <div className='text-green-200 text-sm'>Present</div>
              </div>
              <div className='bg-red-600 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-white'>{attendanceSummary.absent}</div>
                <div className='text-red-200 text-sm'>Absent</div>
              </div>
              <div className='bg-yellow-600 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-white'>{attendanceSummary.late}</div>
                <div className='text-yellow-200 text-sm'>Late</div>
              </div>
              <div className='bg-blue-600 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-white'>{attendanceSummary.excused}</div>
                <div className='text-blue-200 text-sm'>Excused</div>
              </div>
            </div>
            
            {/* Attendance Rate */}
            <div className='bg-slate-600 rounded-lg p-4 text-center'>
              <div className='text-3xl font-bold text-white'>{attendanceSummary.attendanceRate}%</div>
              <div className='text-slate-400 text-sm'>Attendance Rate</div>
            </div>
            
            {/* Per-Class Breakdown */}
            {attendanceSummary.classBreakdown && attendanceSummary.classBreakdown.length > 0 && (
              <div className='mt-6'>
                <h3 className='text-lg font-semibold text-white mb-4'>📋 Per-Class Breakdown</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {attendanceSummary.classBreakdown.map(classData => (
                    <div key={classData.classId} className='bg-slate-600 rounded-lg p-4'>
                      <h4 className='text-white font-semibold mb-2'>{classData.className}</h4>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-slate-300'>Total:</span>
                          <span className='text-white font-semibold'>{classData.total}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-green-300'>Present:</span>
                          <span className='text-green-300 font-semibold'>{classData.present}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-red-300'>Absent:</span>
                          <span className='text-red-300 font-semibold'>{classData.absent}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-yellow-300'>Late:</span>
                          <span className='text-yellow-300 font-semibold'>{classData.late}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-blue-300'>Excused:</span>
                          <span className='text-blue-300 font-semibold'>{classData.excused}</span>
                        </div>
                        <div className='flex justify-between border-t border-slate-500 pt-2'>
                          <span className='text-slate-300'>Rate:</span>
                          <span className='text-white font-bold'>
                            {classData.total > 0 ? Math.round((classData.present / classData.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student Attendance List */}
        {selectedClass && studentsInSelectedClass.length > 0 && (
          <div className='bg-slate-700 rounded-lg p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold text-white'>
                Mark Attendance - {selectedClass}
              </h2>
              <div className='flex space-x-3'>
              <button
                onClick={saveAttendance}
                disabled={loading}
                className='bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              </div>
            </div>
            
            {/* Bulk Actions */}
            <div className='bg-slate-600 rounded-lg p-4 mb-6'>
              <h3 className='text-lg font-medium text-white mb-3'>Quick Actions</h3>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => markAllStudents('present')}
                  disabled={loading}
                  className='bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAllStudents('absent')}
                  disabled={loading}
                  className='bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  Mark All Absent
                </button>
                <button
                  onClick={() => markAllStudents('late')}
                  disabled={loading}
                  className='bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  Mark All Late
                </button>
                <button
                  onClick={() => markAllStudents('excused')}
                  disabled={loading}
                  className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                  Mark All Excused
                </button>
              </div>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {studentsInSelectedClass.map(student => {
                const attendance = studentAttendance[student._id]
                const status = attendance?.status || 'absent'
                
                return (
                  <div
                    key={student._id}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      status === 'present'
                        ? 'border-green-500 bg-green-500/20 shadow-green-500/20'
                        : status === 'late'
                        ? 'border-yellow-500 bg-yellow-500/20 shadow-yellow-500/20'
                        : status === 'excused'
                        ? 'border-blue-500 bg-blue-500/20 shadow-blue-500/20'
                        : 'border-red-500 bg-red-500/20 shadow-red-500/20'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-white text-lg'>{student.studentName}</h3>
                        <p className='text-gray-300 text-sm'>ID: {student._id}</p>
                        {student.schoolId && (
                          <p className='text-gray-400 text-xs'>School: {student.schoolId}</p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
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
                    
                    {/* Status Icon */}
                    <div className='flex justify-center mb-3'>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status === 'present'
                          ? 'bg-green-500'
                          : status === 'late'
                          ? 'bg-yellow-500'
                          : status === 'excused'
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}>
                        <span className='text-white text-lg'>
                          {status === 'present' ? '✓' : 
                           status === 'late' ? '⏰' : 
                           status === 'excused' ? '📝' : '✗'}
                        </span>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'present')}
                        disabled={updatingStudents.has(student._id)}
                        className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'present'
                            ? 'bg-green-600 text-white shadow-lg'
                            : updatingStudents.has(student._id)
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {updatingStudents.has(student._id) ? '⏳' : '✓'} Present
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'late')}
                        disabled={updatingStudents.has(student._id)}
                        className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'late'
                            ? 'bg-yellow-600 text-white shadow-lg'
                            : updatingStudents.has(student._id)
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {updatingStudents.has(student._id) ? '⏳' : '⏰'} Late
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'excused')}
                        disabled={updatingStudents.has(student._id)}
                        className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'excused'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : updatingStudents.has(student._id)
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {updatingStudents.has(student._id) ? '⏳' : '📝'} Excused
                      </button>
                      <button
                        onClick={() => toggleStudentAttendance(student._id, 'absent')}
                        disabled={updatingStudents.has(student._id)}
                        className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                          status === 'absent'
                            ? 'bg-red-600 text-white shadow-lg'
                            : updatingStudents.has(student._id)
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {updatingStudents.has(student._id) ? '⏳' : '✗'} Absent
                      </button>
                    </div>
                    
                    {attendance?.remarks && (
                      <div className='mt-3 p-2 bg-slate-600 rounded'>
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

        {/* Students Modal */}
        {showStudentsModal && selectedClassForStudents && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Students in Class</h3>
                  <p className="text-slate-400 mt-1">
                    {getClassName(selectedClassForStudents)} - {getSubjectName(selectedClassForStudents)}
                  </p>
                </div>
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Class Information */}
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Class Name</p>
                    <p className="text-white font-medium">{getClassName(selectedClassForStudents)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Subject</p>
                    <p className="text-white font-medium">{getSubjectName(selectedClassForStudents)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Room</p>
                    <p className="text-white font-medium">{selectedClassForStudents.classRoom || 'N/A'}</p>
                  </div>
                </div>
                {selectedClassForStudents.classCredit && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-sm">Credits</p>
                    <p className="text-white font-medium">{selectedClassForStudents.classCredit}</p>
                  </div>
                )}
              </div>

              {/* Students List */}
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">
                    Students ({students.filter(student => {
                      const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                      return studentClassId === selectedClassForStudents._id
                    }).length})
                  </h4>
                  <button
                    onClick={() => {
                      setShowStudentsModal(false)
                      setShowAddStudentModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <span className="mr-2">+</span>
                    Add Student to Class
                  </button>
                </div>

                {/* Quick Attendance Actions */}
                <div className="bg-slate-600 rounded-lg p-4 mb-6">
                  <h5 className="text-md font-medium text-white mb-3">Quick Attendance Actions</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        classStudents.forEach(student => {
                          toggleStudentAttendance(student._id, 'present', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✓ Mark All Present
                    </button>
                    <button
                      onClick={() => {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        classStudents.forEach(student => {
                          toggleStudentAttendance(student._id, 'absent', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✗ Mark All Absent
                    </button>
                    <button
                      onClick={() => {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        classStudents.forEach(student => {
                          toggleStudentAttendance(student._id, 'late', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ⏰ Mark All Late
                    </button>
                    <button
                      onClick={() => {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        classStudents.forEach(student => {
                          toggleStudentAttendance(student._id, 'excused', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      📝 Mark All Excused
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students
                    .filter(student => {
                      const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                      return studentClassId === selectedClassForStudents._id
                    })
                    .map(student => {
                      const schoolId = getSchoolId(student.schoolId)
                      return (
                        <div key={student._id} className="bg-slate-600 rounded-lg p-4 hover:bg-slate-500 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="text-white font-medium text-lg">{getStudentName(student)}</h5>
                              <p className="text-slate-300 text-sm">Student ID: {student._id}</p>
                              {schoolId && (
                                <p className="text-slate-400 text-xs mt-1">School ID: {schoolId}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                                Active
                              </span>
                            </div>
                          </div>
                          
                          {/* Student Details */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-sm">Class:</span>
                              <span className="text-white text-sm">{getClassNameFromId(student.classId)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-sm">Enrolled:</span>
                              <span className="text-white text-sm">
                                {new Date(student.createdAt || student.date || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Attendance Status */}
                          <div className="mt-3 mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-slate-400 text-sm">Today's Attendance:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                studentAttendance[student._id]?.status === 'present' ? 'bg-green-600 text-white' :
                                studentAttendance[student._id]?.status === 'late' ? 'bg-yellow-600 text-white' :
                                studentAttendance[student._id]?.status === 'excused' ? 'bg-blue-600 text-white' :
                                'bg-red-600 text-white'
                              }`}>
                                {(studentAttendance[student._id]?.status || 'absent').toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Attendance Buttons */}
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                onClick={() => toggleStudentAttendance(student._id, 'present', selectedClassForStudents._id)}
                                disabled={updatingStudents.has(student._id)}
                                className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                                  studentAttendance[student._id]?.status === 'present'
                                    ? 'bg-green-600 text-white'
                                    : updatingStudents.has(student._id)
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                              >
                                {updatingStudents.has(student._id) ? '⏳' : '✓'} Present
                              </button>
                              <button
                                onClick={() => toggleStudentAttendance(student._id, 'late', selectedClassForStudents._id)}
                                disabled={updatingStudents.has(student._id)}
                                className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                                  studentAttendance[student._id]?.status === 'late'
                                    ? 'bg-yellow-600 text-white'
                                    : updatingStudents.has(student._id)
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                              >
                                {updatingStudents.has(student._id) ? '⏳' : '⏰'} Late
                              </button>
                              <button
                                onClick={() => toggleStudentAttendance(student._id, 'excused', selectedClassForStudents._id)}
                                disabled={updatingStudents.has(student._id)}
                                className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                                  studentAttendance[student._id]?.status === 'excused'
                                    ? 'bg-blue-600 text-white'
                                    : updatingStudents.has(student._id)
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                {updatingStudents.has(student._id) ? '⏳' : '📝'} Excused
                              </button>
                              <button
                                onClick={() => toggleStudentAttendance(student._id, 'absent', selectedClassForStudents._id)}
                                disabled={updatingStudents.has(student._id)}
                                className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
                                  studentAttendance[student._id]?.status === 'absent'
                                    ? 'bg-red-600 text-white'
                                    : updatingStudents.has(student._id)
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                              >
                                {updatingStudents.has(student._id) ? '⏳' : '✗'} Absent
                              </button>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => {
                                // Set this class as selected for attendance
                                setSelectedClass(getClassName(selectedClassForStudents))
                                setShowStudentsModal(false)
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                              📋 Full Attendance
                            </button>
                            <button
                              onClick={() => {
                                // You can add functionality to edit student
                                console.log('Edit student:', student)
                              }}
                              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
                
                {/* No Students Message */}
                {students.filter(student => {
                  const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                  return studentClassId === selectedClassForStudents._id
                }).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-6xl mb-4">👥</div>
                    <h4 className="text-xl font-medium text-white mb-2">No Students Found</h4>
                    <p className="text-slate-400 mb-6">This class doesn't have any students yet.</p>
                    <button
                      onClick={() => {
                        setShowStudentsModal(false)
                        setShowAddStudentModal(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Add First Student
                    </button>
                  </div>
                )}
              </div>
              
              {/* Class Statistics */}
              <div className="bg-slate-700 rounded-lg p-6 mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Class Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-600 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {students.filter(student => {
                        const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                        return studentClassId === selectedClassForStudents._id
                      }).length}
                    </div>
                    <div className="text-slate-400 text-sm">Total Students</div>
                  </div>
                  
                  <div className="bg-slate-600 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {attendanceRecords.filter(record => {
                        const recordClassId = typeof record.classId === 'object' ? record.classId._id : record.classId
                        return recordClassId === selectedClassForStudents._id
                      }).length}
                    </div>
                    <div className="text-slate-400 text-sm">Attendance Records</div>
                  </div>
                  
                  <div className="bg-slate-600 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {attendanceRecords.filter(record => {
                        const recordClassId = typeof record.classId === 'object' ? record.classId._id : record.classId
                        return recordClassId === selectedClassForStudents._id && record.status === 'present'
                      }).length}
                    </div>
                    <div className="text-slate-400 text-sm">Present Days</div>
                  </div>
                  
                  <div className="bg-slate-600 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {attendanceRecords.filter(record => {
                        const recordClassId = typeof record.classId === 'object' ? record.classId._id : record.classId
                        return recordClassId === selectedClassForStudents._id && record.status === 'absent'
                      }).length}
                    </div>
                    <div className="text-slate-400 text-sm">Absent Days</div>
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-600">
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const className = getClassName(selectedClassForStudents)
                    console.log('Save Attendance for This Class clicked:', {
                      selectedClassForStudents,
                      className,
                      classId: selectedClassForStudents._id
                    })
                    
                    // Save attendance directly and show summary
                    try {
                      // First load current attendance data
                      await loadAttendanceRecords(selectedClassForStudents._id)
                      
                      // Then save the attendance
                      const selectedClassData = classes.find(cls => cls._id === selectedClassForStudents._id)
                      if (selectedClassData) {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        
                        // Prepare bulk attendance data
                        const attendanceRecords = classStudents.map(student => ({
                          studentId: student._id,
                          classId: selectedClassData._id,
                          schoolId: student.schoolId || '68c547e28a9c12a9210a256f',
                          date: attendanceDate,
                          status: studentAttendance[student._id]?.status || 'absent',
                          remarks: studentAttendance[student._id]?.remarks || ''
                        }))

                        console.log('Saving bulk attendance data:', attendanceRecords)
                        const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
                        console.log('Bulk attendance saved successfully:', response)
                        
                        // Load updated summary
                        await loadAttendanceSummary(selectedClassForStudents._id, attendanceDate)
                        
                        setSuccess(`Attendance for ${className} saved successfully! Summary updated.`)
                        
                        // Navigate to success page
                        navigate('/success')
                      }
                    } catch (error) {
                      console.error('Error saving attendance:', error)
                      setError('Failed to save attendance. Please try again.')
                    }
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Save Attendance
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