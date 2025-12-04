import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'
import * as attendanceAPI from '../api/attendance'
import * as schoolAPI from '../api/school'
import { getUserRole } from '../utils/auth'


function Attendance() {
  const navigate = useNavigate()
  const userRole = getUserRole() || 'teacher'
  const [selectedClass, setSelectedClass] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [newAttendanceName, setNewAttendanceName] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [studentAttendance, setStudentAttendance] = useState({})
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('')
  
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
    classCredit: '',
    schoolId: ''
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
  const [showInlineStudentForm, setShowInlineStudentForm] = useState(false)
  const [inlineStudentData, setInlineStudentData] = useState({ studentName: '', schoolId: '' })
  const [inlineStudentLoading, setInlineStudentLoading] = useState(false)
  
  // School management states
  const [mySchool, setMySchool] = useState(null)
  const [schoolStats, setSchoolStats] = useState(null)
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false)
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false)
  const [schoolLoading, setSchoolLoading] = useState(false)
  
  // Available schools for class creation
  const [availableSchools, setAvailableSchools] = useState([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  
  // New school form state
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principal: '',
    establishedYear: '',
    description: ''
  })
  
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

  // Helper function to safely get ID from object or string
  const getSafeId = (item, idField = '_id') => {
    if (!item) return null
    if (typeof item === 'string') return item
    if (typeof item === 'object' && item[idField]) return item[idField]
    return null
  }

  // Helper function to safely get school ID
  const getSafeSchoolId = (item) => {
    if (!item) return null
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      return item._id || item.id || item.name || null
    }
    return null
  }

  // Helper function to safely get class ID
  const getSafeClassId = (item) => {
    if (!item) return null
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      return item._id || item.id || item.className || null
    }
    return null
  }

  const extractSubjectName = (cls) => {
    if (!cls || !cls.subjectName) return ''
    if (typeof cls.subjectName === 'object') {
      return cls.subjectName.name || cls.subjectName._id || ''
    }
    return cls.subjectName
  }

  // Load classes and students on component mount
  useEffect(() => {
    loadClasses()
    loadStudents()
    loadMySchool()
  }, [])

  // Recalculate stats when data changes
  useEffect(() => {
    if (schoolStats !== null) {
      const newStats = calculateSchoolStats()
      setSchoolStats(newStats)
    }
  }, [classes, students, attendanceRecords])

  // Calculate school statistics from current data
  const calculateSchoolStats = () => {
    const totalClasses = classes.length
    const totalStudents = students.length
    const totalAttendanceRecords = attendanceRecords.length
    
    // Calculate attendance rate from current records
    const presentRecords = attendanceRecords.filter(record => record.status === 'present').length
    const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0
    
    return {
      totalClasses,
      totalStudents,
      totalAttendanceRecords,
      attendanceRate
    }
  }

  // Load school data
  const loadMySchool = async () => {
    try {
      setSchoolLoading(true)
      
      // Get available schools (this works for both teachers and admins)
      const availableSchoolsResponse = await classAPI.getAvailableSchools()
      console.log('Available schools response:', availableSchoolsResponse)
      
      // Extract the data array from the response - FIX THIS LINE
      const schools = availableSchoolsResponse?.data?.data || availableSchoolsResponse?.data || []
      console.log('Available schools array:', schools)
      
      // Set available schools for the new interface
      setAvailableSchools(schools)
      
      if (schools && schools.length > 0) {
        // Use the first available school as "my school" (primary)
        const primarySchool = schools[0]
        console.log('Using primary school:', primarySchool)
        setMySchool(primarySchool)
        
        // Calculate school statistics from current data (no API call needed)
        const calculatedStats = calculateSchoolStats()
        console.log('Calculated school stats:', calculatedStats)
        setSchoolStats(calculatedStats)
      } else {
        // No schools available
        setMySchool(null)
        setSchoolStats(null)
      }
    } catch (error) {
      console.error('Error loading school:', error)
      // School doesn't exist yet, user needs to create it
      setMySchool(null)
      setSchoolStats(null)
    } finally {
      setSchoolLoading(false)
    }
  }

  // Create school function
  const createSchool = async (schoolData) => {
    try {
      setSchoolLoading(true)
      
      // Use the new teacher school creation endpoint
      const response = await classAPI.createTeacherSchool(schoolData)
      console.log('Teacher school created:', response)
      
      // Reload school data to get the updated list
      await loadMySchool()
      
      setShowCreateSchoolModal(false)
      setSuccess('School created successfully!')
      
      // Reset form
      setNewSchool({
        name: '',
        address: '',
        phone: '',
        email: '',
        principal: '',
        establishedYear: '',
        description: ''
      })
    } catch (error) {
      console.error('Error creating school:', error)
      setError('Failed to create school: ' + (error.response?.data?.message || error.message))
    } finally {
      setSchoolLoading(false)
    }
  }

  // Set primary school function
  const setPrimarySchool = async (school) => {
    try {
      setMySchool(school)
      setSuccess(`${school.name} set as primary school!`)
    } catch (error) {
      console.error('Error setting primary school:', error)
      setError('Failed to set primary school')
    }
  }

  // Update school function
  const updateSchool = async (schoolData) => {
    try {
      setSchoolLoading(true)
      
      // Ensure we have the school ID
      if (!schoolData._id) {
        throw new Error('School ID is missing. Cannot update school.')
      }
      
      console.log('Updating school with data:', {
        _id: schoolData._id,
        name: schoolData.name,
        address: schoolData.address
      })
      
      const response = await schoolAPI.updateMySchool(schoolData)
      console.log('School updated successfully:', response)
      
      // Reload school data to get the updated information
      await loadMySchool()
      
      setShowEditSchoolModal(false)
      setSuccess('School updated successfully!')
    } catch (error) {
      console.error('Error updating school:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update school'
      setError(errorMessage)
    } finally {
      setSchoolLoading(false)
    }
  }

  // Load available schools for class creation
  const loadAvailableSchools = async () => {
    try {
      setLoadingSchools(true)
      const schoolsResponse = await classAPI.getAvailableSchools()
      console.log('Available schools response for class creation:', schoolsResponse)
      
      // Extract the schools array from the response
      const schools = schoolsResponse?.data || []
      console.log('Available schools array for class creation:', schools)
      setAvailableSchools(schools)
    } catch (error) {
      console.error('Error loading available schools:', error)
      setError('Failed to load available schools: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoadingSchools(false)
    }
  }

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
      setError('Failed to load students. Please try again.')
      setStudents([]) // Don't use mock data in production
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
    if (!newClass.schoolId) {
      setError('Please select a school')
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
        classCredit: newClass.classCredit.trim() || undefined, // Optional field
        schoolId: newClass.schoolId // Add schoolId
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
      setNewClass({ className: '', subjectName: '', classRoom: '', classCredit: '', schoolId: '' })
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

  const handleInlineAddStudent = async () => {
    if (!selectedClassForStudents) {
      setError('Please select a class first')
      return
    }
    if (!inlineStudentData.studentName.trim()) {
      setError('Student name is required')
      return
    }

    const classId = selectedClassForStudents._id || getSafeClassId(selectedClassForStudents)
    if (!classId) {
      setError('Invalid class selection')
      return
    }

    setInlineStudentLoading(true)
    setError('')

    try {
      const studentPayload = {
        studentName: inlineStudentData.studentName.trim(),
        classId,
        schoolId: inlineStudentData.schoolId.trim() || undefined
      }

      const response = await studentAPI.createStudent(studentPayload)

      const createdStudent = {
        _id: response._id || Date.now().toString(),
        studentName: response.studentName,
        classId: response.classId || classId,
        schoolId: response.schoolId || inlineStudentData.schoolId
      }

      setStudents(prev => [...prev, createdStudent])

      setClasses(prev => prev.map(cls =>
        (cls._id === classId)
          ? { ...cls, students: (cls.students || 0) + 1 }
          : cls
      ))

      setInlineStudentData({ studentName: '', schoolId: '' })
      setShowInlineStudentForm(false)
      setSuccess('Student added to class successfully!')
    } catch (error) {
      console.error('Inline student creation error:', error)
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
      setInlineStudentLoading(false)
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

      // Validate schoolId before saving
      const studentSchoolId = getSafeSchoolId(student.schoolId)
      if (!studentSchoolId) {
        setError(`School ID is missing for student ${getStudentName(student)}. Cannot save attendance.`)
        return
      }

      // Prepare attendance data for bulk API
      const attendanceData = {
        studentId: studentId,
        classId: targetClassId,
        schoolId: studentSchoolId,
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
      if (!selectedClassData) {
        setError('Class not found.')
        return
      }
      
      const classStudents = students.filter(student => {
        const studentClassId = getSafeClassId(student.classId)
        return studentClassId === selectedClassData._id
      })
      
      // Ensure all students have a status (default to 'absent' if not set)
      const attendanceMap = { ...studentAttendance }
      classStudents.forEach(student => {
        if (!attendanceMap[student._id] || !attendanceMap[student._id].status) {
          attendanceMap[student._id] = {
            status: 'absent',
            remarks: ''
          }
        }
      })
      setStudentAttendance(attendanceMap)
      
      // Prepare bulk attendance data
      const attendanceRecords = classStudents.map(student => {
        const attendance = attendanceMap[student._id] || { status: 'absent', remarks: '' }
        // Try multiple sources for schoolId, but don't use hardcoded fallback
        const studentSchoolId = getSafeSchoolId(student.schoolId) || 
                               getSafeSchoolId(selectedClassData.schoolId) || 
                               availableSchools[0]?._id
        
        if (!studentSchoolId) {
          console.error(`Missing schoolId for student ${getStudentName(student)}`)
        }
        
        return {
        studentId: student._id,
        classId: selectedClassData._id,
          schoolId: studentSchoolId,
        date: attendanceDate,
          status: attendance.status || 'absent',
          remarks: attendance.remarks || ''
        }
      })

      // Validate all records have schoolId before saving
      const invalidRecords = attendanceRecords.filter(record => !record.schoolId)
      if (invalidRecords.length > 0) {
        setError(`Cannot save attendance: ${invalidRecords.length} student(s) are missing school ID. Please ensure all students have an associated school.`)
        return
      }

      console.log('Saving bulk attendance data:', attendanceRecords)

      const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
      console.log('Bulk attendance saved successfully:', response)
      
      // Reload attendance records to get updated data
      await loadAttendanceRecords(selectedClassData._id)
      
      // Reload attendance records and summary to update the counts
      await loadAllAttendanceRecords()
      await loadAttendanceSummaryForAllClasses(attendanceDate)
      
      setSuccess('Attendance saved successfully!')
      
      // Don't navigate away, just show success message
      setTimeout(() => {
        setSuccess('')
      }, 3000)

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

  const getSubjectName = (cls) => extractSubjectName(cls) || 'Unknown Subject'

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

  const schoolOptionsForFilters = availableSchools.length > 0
    ? availableSchools
    : Array.from(
        new Map(
          classes
            .map(cls => {
              const schoolId = getSafeSchoolId(cls?.schoolId)
              if (!schoolId) return null
              const label = cls.school?.name || cls.schoolName || schoolId
              return [schoolId, { _id: schoolId, name: label }]
            })
            .filter(Boolean)
        ).values()
      )

  const subjectOptionsForFilters = Array.from(
    new Set(
      classes
        .filter(cls => !selectedSchoolFilter || getSafeSchoolId(cls?.schoolId) === selectedSchoolFilter)
        .map(extractSubjectName)
        .filter(Boolean)
    )
  )

  const filteredClasses = classes.filter(cls => {
    const matchesSchool = !selectedSchoolFilter || getSafeSchoolId(cls?.schoolId) === selectedSchoolFilter
    const matchesSubject = !selectedSubjectFilter || extractSubjectName(cls) === selectedSubjectFilter
    return matchesSchool && matchesSubject
  })

  useEffect(() => {
    if (!selectedClass) return
    const stillMatches = classes.some(cls => {
      if (cls.className !== selectedClass) return false
      const matchesSchool = !selectedSchoolFilter || getSafeSchoolId(cls?.schoolId) === selectedSchoolFilter
      const matchesSubject = !selectedSubjectFilter || extractSubjectName(cls) === selectedSubjectFilter
      return matchesSchool && matchesSubject
    })
    if (!stillMatches) {
      setSelectedClass('')
      setStudentAttendance({})
    }
  }, [selectedSchoolFilter, selectedSubjectFilter, classes])

  useEffect(() => {
    if (!selectedClass) return
    const classData = classes.find(cls => cls.className === selectedClass)
    if (classData) {
      loadAttendanceRecords(classData._id)
    }
  }, [selectedClass, attendanceDate, classes])

  useEffect(() => {
    if (!showStudentsModal) {
      setShowInlineStudentForm(false)
      setInlineStudentData({ studentName: '', schoolId: '' })
      setInlineStudentLoading(false)
    }
  }, [showStudentsModal])

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
        // Validate schoolId before saving
        const studentSchoolId = getSafeSchoolId(student.schoolId)
        if (!studentSchoolId) {
          setError(`School ID is missing for student ${getStudentName(student)}. Cannot save attendance.`)
          setLoading(false)
          return
        }

        const attendanceData = {
          studentId: student._id,
          classId: selectedClassData._id,
          schoolId: studentSchoolId,
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
      const studentClassId = getSafeClassId(student?.classId)
      console.log('Filtering students:', {
        selectedClass,
        selectedClassData: selectedClassData?._id,
        studentClassId,
        studentName: student.studentName,
        matches: studentClassId === selectedClassData._id
      })
      return studentClassId === selectedClassData._id
    }) : []

  const studentsInModalClass = selectedClassForStudents
    ? students.filter(student => getSafeClassId(student?.classId) === selectedClassForStudents._id)
    : []

  // Note: Attendance summary is now loaded via API in loadAttendanceSummaryForAllClasses
  // No need for manual calculation since we're using the backend API

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        
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
        
        {/* School Management Section */}
        {schoolLoading ? (
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-white">Loading school information...</span>
            </div>
          </div>
        ) : availableSchools && availableSchools.length > 0 ? (
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">🏫 My Schools ({availableSchools.length})</h2>
                <p className="text-slate-300">Manage your schools and create classes</p>
              </div>
            <button
                onClick={() => setShowCreateSchoolModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <span className="mr-2">+</span>
                Create New School
            </button>
            </div>
            
            {/* Schools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSchools.map((school, index) => {
                const isPrimarySchool = index === 0
                const schoolClasses = classes.filter(cls => {
                  const schoolId = getSafeSchoolId(cls?.schoolId)
                  return schoolId === school._id
                })
                const schoolStudents = students.filter(student => {
                  const studentSchoolId = getSafeSchoolId(student?.schoolId)
                  return studentSchoolId === school._id
                })
                
                return (
                  <div 
                    key={school._id} 
                    className={`bg-slate-600 rounded-lg p-6 hover:bg-slate-500 transition-colors ${
                      isPrimarySchool ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {/* School Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-white">{school.name}</h3>
                          {isPrimarySchool && (
                            <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Primary
                            </span>
                          )}
                        </div>
                        {school.principal && (
                          <p className="text-slate-300 text-sm">Principal: {school.principal}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setMySchool(school)
                              setShowEditSchoolModal(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                        <button
                          onClick={() => setPrimarySchool(school)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Set Primary
                        </button>
                      </div>
                    </div>
                    
                    {/* School Details */}
                    <div className="space-y-3 mb-4">
                      {school.address && (
                        <div className="flex items-start">
                          <span className="text-slate-400 text-sm w-16">Address:</span>
                          <span className="text-white text-sm flex-1">{school.address}</span>
                        </div>
                      )}
                      {school.phone && (
                        <div className="flex items-start">
                          <span className="text-slate-400 text-sm w-16">Phone:</span>
                          <span className="text-white text-sm flex-1">{school.phone}</span>
                        </div>
                      )}
                      {school.email && (
                        <div className="flex items-start">
                          <span className="text-slate-400 text-sm w-16">Email:</span>
                          <span className="text-white text-sm flex-1">{school.email}</span>
                        </div>
                      )}
                      {school.establishedYear && (
                        <div className="flex items-start">
                          <span className="text-slate-400 text-sm w-16">Established:</span>
                          <span className="text-white text-sm flex-1">{school.establishedYear}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* School Statistics */}
                    <div className="bg-slate-700 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-white mb-3">📊 Statistics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">{schoolClasses.length}</div>
                          <div className="text-slate-300 text-xs">Classes</div>
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowCreateClassModal(true)
                          loadAvailableSchools()
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        + Add Class
                      </button>
                      
          </div>
        </div>
                )
              })}
            </div>
            
            
          </div>
        ) : (
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🏫</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Schools Found</h2>
              <p className="text-slate-300 mb-6">You need to create your first school before managing classes and students.</p>
              <button
                onClick={() => setShowCreateSchoolModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create My First School
              </button>
            </div>
          </div>
        )}
        
       

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
                            setLoading(true)
                            setError('')
                            setSuccess('')
                            
                            // First load current attendance data for this class and date
                            await loadAttendanceRecords(cls._id)
                            
                            // Then get all students for this class
                            const classStudents = students.filter(student => {
                              const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                              return studentClassId === cls._id
                            })
                            
                            // Ensure all students have a status (default to 'absent' if not set)
                            const attendanceMap = { ...studentAttendance }
                            classStudents.forEach(student => {
                              if (!attendanceMap[student._id] || !attendanceMap[student._id].status) {
                                attendanceMap[student._id] = {
                                  status: 'absent',
                                  remarks: ''
                                }
                              }
                            })
                            setStudentAttendance(attendanceMap)
                            
                            // Prepare bulk attendance data
                            const attendanceRecords = classStudents.map(student => {
                              const attendance = attendanceMap[student._id] || { status: 'absent', remarks: '' }
                              // Try multiple sources for schoolId, but don't use hardcoded fallback
                              const studentSchoolId = getSafeSchoolId(student.schoolId) || 
                                                     getSafeSchoolId(cls.schoolId) || 
                                                     availableSchools[0]?._id
                              
                              if (!studentSchoolId) {
                                console.error(`Missing schoolId for student ${getStudentName(student)}`)
                              }
                              return {
                              studentId: student._id,
                              classId: cls._id,
                                schoolId: studentSchoolId,
                              date: attendanceDate,
                                status: attendance.status || 'absent',
                                remarks: attendance.remarks || ''
                              }
                            })

                            console.log('Saving bulk attendance data:', attendanceRecords)
                            const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
                            console.log('Bulk attendance saved successfully:', response)
                            
                            // Reload attendance records to get updated data
                            await loadAttendanceRecords(cls._id)
                            
                            // Load updated summary
                            await loadAttendanceSummary(cls._id, attendanceDate)
                            
                            setSuccess(`Attendance for ${className} on ${new Date(attendanceDate).toLocaleDateString()} saved successfully! Summary updated.`)
                            
                            // Don't navigate away, just show success message
                            setTimeout(() => {
                              setSuccess('')
                            }, 3000)
                          } catch (error) {
                            console.error('Error saving attendance:', error)
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
                <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-white mb-4'>📋 Per-Class Breakdown</h3>
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
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {attendanceSummary.classBreakdown.map(classData => (
                      <div key={classData.classId} className='bg-slate-600 rounded-lg p-4'>
                        <h4 className='text-white font-semibold mb-2'>{classData.className} for this Date <span className='text-black font-bold bg-amber-300 text-sm rounded-full px-2 py-1'>{attendanceDate}</span></h4>
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

        {/* Create School Modal */}
        {showCreateSchoolModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
              <h2 className='text-xl font-semibold text-white mb-4'>Create New School</h2>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>School Code *</label>
                  <input
                    type='text'
                    required
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                    placeholder='ex.. LYCEE DE KIGALI 110912'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>District *</label>
                  <input
                    type='text'
                    required
                    value={newSchool.address}
                    onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                    placeholder='ex.. KIGALI'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
  
      
              </div>
              
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={() => setShowCreateSchoolModal(false)}
                  className='px-4 py-2 text-slate-300 hover:text-white transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSchool(newSchool)}
                  disabled={schoolLoading || !newSchool.name.trim()}
                  className='px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white rounded-lg transition-colors'
                >
                  {schoolLoading ? 'Creating...' : 'Create School'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit School Modal */}
        {showEditSchoolModal && mySchool && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto'>
              <h2 className='text-xl font-semibold text-white mb-4'>Edit School</h2>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>School Name *</label>
                  <input
                    type='text'
                    value={mySchool.name}
                    onChange={(e) => setMySchool({...mySchool, name: e.target.value})}
                    placeholder='e.g., ABC High School'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Address</label>
                  <input
                    type='text'
                    value={mySchool.address || ''}
                    onChange={(e) => setMySchool({...mySchool, address: e.target.value})}
                    placeholder='e.g., 123 Main Street, City'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
              </div>
              
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={() => setShowEditSchoolModal(false)}
                  className='px-4 py-2 text-slate-300 hover:text-white transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!mySchool._id) {
                      setError('School ID is missing. Please refresh and try again.')
                      return
                    }
                    updateSchool({
                      _id: mySchool._id,
                      name: mySchool.name.trim(),
                      address: (mySchool.address || '').trim()
                    })
                  }}
                  disabled={schoolLoading || !mySchool.name.trim() || !mySchool._id}
                  className='px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white rounded-lg transition-colors'
                >
                  {schoolLoading ? 'Updating...' : 'Update School'}
                </button>
              </div>
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
                    required
                    value={newClass.className}
                    onChange={(e) => setNewClass({...newClass, className: e.target.value})}
                    placeholder='ex.. P5A'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
  <label className='block text-white text-sm font-medium mb-2'>School *</label>
  <select
    value={newClass.schoolId}
    onChange={(e) => setNewClass({...newClass, schoolId: e.target.value})}
    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
    disabled={loadingSchools}
  >
    <option value=''>
      {loadingSchools ? 'Loading schools...' : 'Select a school'}
    </option>
    {availableSchools.length > 0 ? (
      availableSchools.map(school => (
        <option key={school._id} value={school._id}>
          {school.name}
        </option>
      ))
    ) : (
      <option value='' disabled>No schools available - Create a school first</option>
    )}
  </select>
  {availableSchools.length === 0 && !loadingSchools && (
    <p className='text-yellow-400 text-sm mt-1'>
      You need to create a school first before creating classes.
    </p>
  )}
</div>
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Subject Name *</label>
                  <input
                    type='text'
                    required
                    value={newClass.subjectName}
                    onChange={(e) => setNewClass({...newClass, subjectName: e.target.value})}
                    placeholder='ex.. Mathematics'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                <div>
                  <label className='block text-white text-sm font-medium mb-2'>Class Room *</label>
                  <input
                    type='text'
                    required
                    value={newClass.classRoom}
                    onChange={(e) => setNewClass({...newClass, classRoom: e.target.value})}
                    placeholder='ex.. Room 501'
                    className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                  />
                </div>
                
                
              </div>
              
              <div className='flex space-x-4 mt-6'>
                <button
                  onClick={() => {
                    setShowCreateClassModal(false)
                    setNewClass({ className: '', subjectName: '', classRoom: '', classCredit: '', schoolId: '' })
                    setError('')
                  }}
                  className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={loading || loadingSchools || !newClass.className.trim() || !newClass.subjectName.trim() || !newClass.classRoom.trim() || !newClass.schoolId}
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">
                    Students ({studentsInModalClass.length})
                  </h4>
                  <button
                    onClick={() => setShowInlineStudentForm(prev => !prev)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      showInlineStudentForm
                        ? 'bg-slate-500 hover:bg-slate-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {showInlineStudentForm ? 'Close Form' : '+ Add Student to Class'}
                  </button>
                </div>

                {showInlineStudentForm && (
                  <div className="bg-slate-600 rounded-lg p-4 mb-4">
                    <h5 className="text-md font-medium text-white mb-3">Quick Add Student</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-slate-300 text-sm">Student Name *</label>
                        <input
                          type="text"
                          value={inlineStudentData.studentName}
                          onChange={(e) => setInlineStudentData(prev => ({ ...prev, studentName: e.target.value }))}
                          placeholder="Enter full name"
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-slate-300 text-sm">School ID (Optional)</label>
                        <input
                          type="text"
                          value={inlineStudentData.schoolId}
                          onChange={(e) => setInlineStudentData(prev => ({ ...prev, schoolId: e.target.value }))}
                          placeholder="e.g., 68cb..."
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleInlineAddStudent}
                          disabled={inlineStudentLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        >
                          {inlineStudentLoading ? 'Adding...' : 'Add Student'}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Student will be added directly to {getClassName(selectedClassForStudents)}.
                    </p>
                  </div>
                )}

                {/* Quick Attendance Actions */}
                <div className="bg-slate-600 rounded-lg p-4 mb-6">
                  <h5 className="text-md font-medium text-white mb-3">Quick Attendance Actions</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        studentsInModalClass.forEach(student => {
                          toggleStudentAttendance(student._id, 'present', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✓ Mark All Present
                    </button>
                    <button
                      onClick={() => {
                        studentsInModalClass.forEach(student => {
                          toggleStudentAttendance(student._id, 'absent', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ✗ Mark All Absent
                    </button>
                    <button
                      onClick={() => {
                        studentsInModalClass.forEach(student => {
                          toggleStudentAttendance(student._id, 'late', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      ⏰ Mark All Late
                    </button>
                    <button
                      onClick={() => {
                        studentsInModalClass.forEach(student => {
                          toggleStudentAttendance(student._id, 'excused', selectedClassForStudents._id)
                        })
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      📝 Mark All Excused
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto bg-slate-600 rounded-lg">
                  {studentsInModalClass.length === 0 ? (
                    <div className="p-8 text-center text-slate-300">
                      No students found in this class. Add students to start tracking attendance.
                            </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-500">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Student</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Present</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Absent</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Excused</th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-600 divide-y divide-slate-500">
                        {studentsInModalClass.map((student, index) => {
                          const status = studentAttendance[student._id]?.status || 'absent'
                          const isUpdating = updatingStudents.has(student._id)
                          return (
                            <tr key={student._id} className="hover:bg-slate-500 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-white">{getStudentName(student)}</div>
                                <div className="text-xs text-slate-400">ID: {student._id}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`modal-attendance-${student._id}`}
                                  checked={status === 'present'}
                                  onChange={() => toggleStudentAttendance(student._id, 'present', selectedClassForStudents._id)}
                                  disabled={isUpdating}
                                  className="h-4 w-4 text-green-500 focus:ring-green-400 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`modal-attendance-${student._id}`}
                                  checked={status === 'absent'}
                                  onChange={() => toggleStudentAttendance(student._id, 'absent', selectedClassForStudents._id)}
                                  disabled={isUpdating}
                                  className="h-4 w-4 text-red-500 focus:ring-red-400 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`modal-attendance-${student._id}`}
                                  checked={status === 'excused'}
                                  onChange={() => toggleStudentAttendance(student._id, 'excused', selectedClassForStudents._id)}
                                  disabled={isUpdating}
                                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 cursor-pointer"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
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
                      setLoading(true)
                      setError('')
                      setSuccess('')
                      
                      // First load current attendance data for this class and date
                      await loadAttendanceRecords(selectedClassForStudents._id)
                      
                      // Then save the attendance
                      const selectedClassData = classes.find(cls => cls._id === selectedClassForStudents._id)
                      if (selectedClassData) {
                        const classStudents = students.filter(student => {
                          const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                          return studentClassId === selectedClassForStudents._id
                        })
                        
                        // Ensure all students have a status (default to 'absent' if not set)
                        const attendanceMap = { ...studentAttendance }
                        classStudents.forEach(student => {
                          if (!attendanceMap[student._id] || !attendanceMap[student._id].status) {
                            attendanceMap[student._id] = {
                              status: 'absent',
                              remarks: ''
                            }
                          }
                        })
                        setStudentAttendance(attendanceMap)
                        
                        // Prepare bulk attendance data
                        const attendanceRecords = classStudents.map(student => {
                          const attendance = attendanceMap[student._id] || { status: 'absent', remarks: '' }
                          // Try multiple sources for schoolId, but don't use hardcoded fallback
                          const studentSchoolId = getSafeSchoolId(student.schoolId) || 
                                                 getSafeSchoolId(selectedClassData.schoolId) || 
                                                 availableSchools[0]?._id
                          
                          if (!studentSchoolId) {
                            console.error(`Missing schoolId for student ${getStudentName(student)}`)
                          }
                          
                          return {
                          studentId: student._id,
                          classId: selectedClassData._id,
                            schoolId: studentSchoolId,
                          date: attendanceDate,
                            status: attendance.status || 'absent',
                            remarks: attendance.remarks || ''
                          }
                        })

                        console.log('Saving bulk attendance data:', attendanceRecords)
                        const response = await attendanceAPI.createBulkAttendance(attendanceRecords)
                        console.log('Bulk attendance saved successfully:', response)
                        
                        // Reload attendance records to get updated data
                        await loadAttendanceRecords(selectedClassForStudents._id)
                        
                        // Load updated summary
                        await loadAttendanceSummary(selectedClassForStudents._id, attendanceDate)
                        
                        setSuccess(`Attendance for ${className} saved successfully! Summary updated.`)
                        
                        // Close modal after a short delay
                        setTimeout(() => {
                          setShowStudentsModal(false)
                          setSuccess('')
                        }, 1500)
                      } else {
                        setError('Class data not found.')
                      }
                    } catch (error) {
                      console.error('Error saving attendance:', error)
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

  const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' }
  ]

  const handleClassFilterChange = (className) => {
    setSelectedClass(className)
    if (className) {
      const classData = classes.find(cls => cls.className === className)
      if (classData) {
        loadAttendanceRecords(classData._id)
      }
    } else {
      setStudentAttendance({})
    }
  }

  const handleCheckboxToggle = (studentId, isChecked) => {
    const nextStatus = isChecked ? 'present' : 'absent'
    toggleStudentAttendance(studentId, nextStatus)
  }

  const handleStatusSelect = (studentId, nextStatus) => {
    if (!nextStatus) return
    toggleStudentAttendance(studentId, nextStatus)
}

export default Attendance