import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'
import * as commentAPI from '../api/comment'
import * as attendanceAPI from '../api/attendance'
import * as analyticsAPI from '../api/analytics'
import * as reportsAPI from '../api/reports'
import { 
  createAdmin,
  getAdminDashboard,
  getAllClassesAdmin,
  getClassDetailsAdmin,
  getClassStudentsAdmin,
  getClassAttendanceAdmin,
  getAllStudentsAdmin,
  getStudentDetailsAdmin,
  getStudentAttendanceAdmin,
  getAllAttendanceAdmin,
  getAttendanceStatsAdmin,
  getAttendanceByDateAdmin,
  getAllUsersAdmin,
  getUserDetailsAdmin,
  getAnalyticsOverviewAdmin,
  getClassPerformanceAnalyticsAdmin,
  getAttendanceTrendsAnalyticsAdmin,
  getAttendanceReportAdmin,
  getClassPerformanceReportAdmin,
  getStudentPerformanceReportAdmin
} from '../api/auth'

function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [comments, setComments] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [users, setUsers] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [classPerformance, setClassPerformance] = useState([])
  const [attendanceTrends, setAttendanceTrends] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schoolReport, setSchoolReport] = useState(null)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  
  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  
  // Create modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  
  // Form states
  const [newClass, setNewClass] = useState({
    className: '',
    subjectName: '',
    classRoom: '',
    classCredit: ''
  })
  
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    classId: '',
    schoolId: ''
  })

  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Load all admin data in parallel using admin-specific APIs
      const [
        classesData,
        studentsData,
        commentsData,
        attendanceData,
        dashboardData,
        classPerfData,
        attendanceStatsData,
        usersData
      ] = await Promise.all([
        getAllClassesAdmin(),
        getAllStudentsAdmin(),
        commentAPI.getAllCommentsForAdmin(), // Use the new admin API
        getAllAttendanceAdmin(),
        getAdminDashboard(),
        getClassPerformanceAnalyticsAdmin(),
        getAttendanceStatsAdmin(),
        getAllUsersAdmin()
      ])

      setClasses(classesData || [])
      setStudents(studentsData || [])
      setComments(commentsData?.data || commentsData || []) // Handle the new response structure
      setAttendanceRecords(attendanceData || [])
      setUsers(usersData || [])
      setDashboardStats(dashboardData)
      setClassPerformance(classPerfData || [])
      
      // Store additional admin data
      console.log('Admin dashboard loaded successfully:', {
        classes: classesData?.length || 0,
        students: studentsData?.length || 0,
        attendance: attendanceData?.length || 0,
        users: usersData?.length || 0,
        comments: commentsData?.data?.length || commentsData?.length || 0,
        stats: attendanceStatsData
      })
      
    } catch (err) {
      console.error('Error loading admin dashboard data:', err)
      setError('Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceTrends = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return
    
    try {
      let trends = []
      
      if (selectedClass) {
        // Load attendance trends for specific class
        console.log('Loading attendance trends for class:', selectedClass)
        const classAttendance = await getClassAttendanceAdmin(selectedClass)
        trends = classAttendance || []
        console.log('Class attendance data:', trends)
      } else {
        // Load general attendance trends
        console.log('Loading general attendance trends')
        trends = await getAttendanceTrendsAnalyticsAdmin(
          dateRange.startDate,
          dateRange.endDate
        )
        console.log('General trends data:', trends)
      }
      
      setAttendanceTrends(trends || [])
    } catch (err) {
      console.error('Error loading attendance trends:', err)
      setError('Failed to load attendance trends')
    }
  }

  const handleCreateClass = async () => {
    if (!newClass.className.trim() || !newClass.subjectName.trim() || !newClass.classRoom.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const createdClass = await classAPI.createClass(newClass)
      setClasses([...classes, createdClass])
      setNewClass({ className: '', subjectName: '', classRoom: '', classCredit: '' })
      setShowCreateClassModal(false)
      setError('')
    } catch (err) {
      console.error('Error creating class:', err)
      setError('Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async () => {
    if (!newStudent.studentName.trim() || !newStudent.classId) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const createdStudent = await studentAPI.createStudent(newStudent)
      setStudents([...students, createdStudent])
      setNewStudent({ studentName: '', classId: '', schoolId: '' })
      setShowCreateStudentModal(false)
      setError('')
    } catch (err) {
      console.error('Error creating student:', err)
      setError('Failed to create student')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    // Validation
    if (!newAdmin.username.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {



      setError('Passwords do not match')
      return
    }

    if (newAdmin.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAdmin.email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const adminData = {
        username: newAdmin.username.trim(),
        email: newAdmin.email.trim(),
        password: newAdmin.password,
        confirmPassword: newAdmin.confirmPassword
      }

      const response = await createAdmin(adminData)
      console.log('Admin created successfully:', response)
      
      // Reset form
      setNewAdmin({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      setShowCreateAdminModal(false)
      
      // Show success message (you can add a success state if needed)
      alert('Admin user created successfully!')
      
    } catch (err) {
      console.error('Error creating admin:', err)
      setError(err.response?.data?.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  const openCommentModal = (comment) => {
    setSelectedComment(comment)
    setShowCommentModal(true)
  }

  const openAttendanceModal = (attendance) => {
    setSelectedAttendance(attendance)
    setShowAttendanceModal(true)
  }

  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Unknown Teacher'
    if (typeof teacherId === 'object') {
      return teacherId.username || teacherId.email || teacherId._id || 'Unknown Teacher'
    }
    return teacherId
  }

  const getTeacherId = (teacherId) => {
    if (!teacherId) return 'Not specified'
    if (typeof teacherId === 'object') {
      return teacherId._id || teacherId
    }
    return teacherId
  }

  // Helper function to safely get class name from classId
  const getClassNameFromId = (classId) => {
    if (!classId) return 'No Class'
    if (typeof classId === 'object') {
      return classId.className || classId.name || classId._id || 'Unknown Class'
    }
    // If it's a string ID, find the class name from classes array
    const foundClass = classes.find(cls => cls._id === classId)
    return foundClass ? foundClass.className : classId
  }

  // Helper function to safely get school ID
  const getSchoolId = (schoolId) => {
    if (!schoolId) return null
    if (typeof schoolId === 'object') {
      return schoolId._id || schoolId.name || schoolId.id || 'Unknown School'
    }
    return schoolId
  }

  // Helper function to safely get class name
  const getClassName = (cls) => {
    if (!cls) return 'Unknown Class'
    if (typeof cls.className === 'object') {
      return cls.className.name || cls.className._id || 'Unknown Class'
    }
    return cls.className || 'Unknown Class'
  }

  // Helper function to safely get subject name
  const getSubjectName = (cls) => {
    if (!cls) return 'Unknown Subject'
    if (typeof cls.subjectName === 'object') {
      return cls.subjectName.name || cls.subjectName._id || 'Unknown Subject'
    }
    return cls.subjectName || 'Unknown Subject'
  }

  // Helper function to safely get student name
  const getStudentName = (studentId) => {
    if (!studentId) return 'Unknown Student'
    if (typeof studentId === 'object') {
      return studentId.studentName || studentId.name || studentId._id || 'Unknown Student'
    }
    // If it's a string ID, find the student name from students array
    const foundStudent = students.find(student => student._id === studentId)
    return foundStudent ? (foundStudent.studentName || foundStudent.name || studentId) : studentId
  }

  const filteredComments = comments.filter(comment => {
    if (selectedClass && comment.className !== selectedClass) return false
    return true
  })

  const filteredAttendance = attendanceRecords.filter(record => {
    if (selectedClass && record.classId !== selectedClass) return false
    if (dateRange.startDate && record.date < dateRange.startDate) return false
    if (dateRange.endDate && record.date > dateRange.endDate) return false
    return true
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'comments', name: 'Comments', icon: '💬' },
    { id: 'attendance', name: 'Attendance', icon: '📋' },
    { id: 'reports', name: 'Reports', icon: '📊' },
    { id: 'admin-management', name: 'Admin Management', icon: '👑' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage and review school reports</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">🏫</span>
                <span className="hidden sm:inline">Add Class</span>
                <span className="sm:hidden">Class</span>
              </button>
              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">👥</span>
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Student</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-800 rounded-lg p-1 mb-4 sm:mb-8">
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 rounded-md transition-colors text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden xs:inline sm:inline">{tab.name}</span>
                <span className="xs:hidden sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">👥</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">Students</p>
                    <p className="text-white text-lg sm:text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">🏫</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">Classes</p>
                    <p className="text-white text-lg sm:text-2xl font-bold">{classes.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-yellow-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">💬</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">Comments</p>
                    <p className="text-white text-lg sm:text-2xl font-bold">{comments.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">📋</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">Attendance</p>
                    <p className="text-white text-lg sm:text-2xl font-bold">{attendanceRecords.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">🏫</span>
                    <h4 className="font-medium text-xs sm:text-sm">Create Class</h4>
                    <p className="text-xs text-green-200 mt-1 hidden sm:block">Add new class</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">👥</span>
                    <h4 className="font-medium text-xs sm:text-sm">Add Student</h4>
                    <p className="text-xs text-blue-200 mt-1 hidden sm:block">Register student</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('comments')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">💬</span>
                    <h4 className="font-medium text-xs sm:text-sm">View Comments</h4>
                    <p className="text-xs text-yellow-200 mt-1 hidden sm:block">Review feedback</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">📋</span>
                    <h4 className="font-medium text-xs sm:text-sm">Check Attendance</h4>
                    <p className="text-xs text-purple-200 mt-1 hidden sm:block">View records</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Comments */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Recent Comments</h3>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {filteredComments.slice(0, 5).map(comment => (
                  <div key={comment._id} className="bg-slate-600 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-slate-500 transition-colors" onClick={() => openCommentModal(comment)}>
                    <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm sm:text-base">{comment.className} - {comment.subjectName}</h4>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1 line-clamp-2">{comment.successStory || comment.challenge || 'No content'}</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className="text-blue-400 text-xs">Click to view full details</span>
                          {comment.teacherId && (
                            <span className="text-gray-400 text-xs">Teacher: {getTeacherName(comment.teacherId)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs sm:text-sm">{new Date(comment.createdAt || comment.date).toLocaleDateString()}</p>
                        <p className="text-slate-400 text-xs">{comment.numberOfStudents} students</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
            {/* Classes Overview */}
<div className="bg-slate-700 rounded-lg p-4 sm:p-6">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
    <h3 className="text-base sm:text-lg font-semibold text-white">Classes Overview</h3>
    <button
      onClick={() => setShowCreateClassModal(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
    >
      + Add Class
    </button>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
    {classes.slice(0, 6).map(cls => (
      <div 
        key={cls._id} 
        className="bg-slate-600 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-slate-500 transition-colors"
        onClick={() => {
          setSelectedClassForStudents(cls)
          setShowStudentsModal(true)
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm sm:text-base">{getClassName(cls)}</h4>
            <p className="text-slate-300 text-xs sm:text-sm">{getSubjectName(cls)}</p>
            <p className="text-slate-400 text-xs">Room: {cls.classRoom || 'N/A'}</p>
            <p className="text-blue-400 text-xs mt-1 sm:mt-2">Click to view students →</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">ID: {cls._id}</p>
            <p className="text-slate-400 text-xs">
              {students.filter(student => {
                const studentClassId = typeof student.classId === 'object' ? student.classId._id : student.classId
                return studentClassId === cls._id
              }).length} students
            </p>
          </div>
        </div>
      </div>
    ))}
    {classes.length === 0 && (
      <div className="col-span-full text-center text-slate-400 py-8">
        <p>No classes found. Create your first class!</p>
      </div>
    )}
  </div>
</div>

            {/* Students Overview */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Students Overview</h3>
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
                >
                  + Add Student
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {students.slice(0, 6).map(student => {
                  const schoolId = getSchoolId(student.schoolId)
                  return (
                    <div key={student._id} className="bg-slate-600 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm sm:text-base">{getStudentName(student)}</h4>
                          <p className="text-slate-300 text-xs sm:text-sm">Class: {getClassNameFromId(student.classId)}</p>
                          {schoolId && (
                            <p className="text-slate-400 text-xs">School ID: {schoolId}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-xs">ID: {student._id}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {students.length === 0 && (
                  <div className="col-span-full text-center text-slate-400 py-8">
                    <p>No students found. Add your first student!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Filter by Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={getClassName(cls)}>
                        {getClassName(cls)} - {getSubjectName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                All Comments ({filteredComments.length}) 
                <span className="text-sm text-slate-400 ml-2">- Admin View</span>
              </h3>
              <div className="space-y-4">
                {filteredComments.map(comment => (
                  <div key={comment._id} className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors" onClick={() => openCommentModal(comment)}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-medium">{comment.className} - {comment.subjectName}</h4>
                            {comment.schoolId && (
                              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                School: {comment.schoolId.name || comment.schoolId}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm mt-1 line-clamp-2">{comment.successStory || comment.challenge || 'No content'}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-blue-400 text-xs">Click to view full details</span>
                            {comment.teacherId && (
                              <span className="text-gray-400 text-xs">
                                Teacher: {comment.teacherId.username || comment.teacherId.email || getTeacherName(comment.teacherId)}
                              </span>
                            )}
                            <span className="text-green-400 text-xs">{comment.numberOfStudents} students</span>
                          </div>
                        </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">{new Date(comment.createdAt || comment.date).toLocaleDateString()}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(comment.createdAt || comment.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredComments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-6xl mb-4">💬</div>
                    <h4 className="text-xl font-medium text-white mb-2">No Comments Found</h4>
                    <p className="text-slate-400">No comments match your current filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Filter by Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {getClassName(cls)} - {getSubjectName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={loadAttendanceTrends}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {selectedClass ? `Load Trends for ${getClassNameFromId(selectedClass)}` : 'Load All Trends'}
              </button>
            </div>

            {/* Attendance Records */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attendance Records ({filteredAttendance.length})</h3>
              <div className="space-y-4">
                {filteredAttendance.map(record => (
                  <div key={record._id} className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors" onClick={() => openAttendanceModal(record)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">{getStudentName(record.studentId)}</h4>
                        <p className="text-slate-300 text-sm">Class: {getClassNameFromId(record.classId)}</p>
                        {record.remarks && (
                          <p className="text-slate-400 text-xs mt-1">{record.remarks}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-600 text-white' :
                          record.status === 'absent' ? 'bg-red-600 text-white' :
                          record.status === 'late' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {record.status}
                        </span>
                        <p className="text-slate-400 text-sm mt-1">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Trends Display */}
            {attendanceTrends.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  📈 Attendance Trends {selectedClass ? `for ${getClassNameFromId(selectedClass)}` : '(All Classes)'}
                </h3>
                <div className="space-y-4">
                  {attendanceTrends.map((trend, index) => (
                    <div key={trend._id || index} className="bg-slate-600 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">
                            {trend.date ? new Date(trend.date).toLocaleDateString() : `Trend ${index + 1}`}
                          </h4>
                          {trend.className && (
                            <p className="text-slate-300 text-sm">Class: {trend.className}</p>
                          )}
                          {trend.studentName && (
                            <p className="text-slate-300 text-sm">Student: {trend.studentName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            trend.status === 'present' ? 'bg-green-600 text-white' :
                            trend.status === 'absent' ? 'bg-red-600 text-white' :
                            trend.status === 'late' ? 'bg-yellow-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {trend.status || 'Unknown'}
                          </span>
                          {trend.attendanceRate && (
                            <p className="text-slate-400 text-sm mt-1">
                              Rate: {trend.attendanceRate}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Generation Section */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Generate Reports</h3>
              <p className="text-slate-300 mb-6">Generate comprehensive reports for your school data. All reports include detailed analytics and can be downloaded as PDF.</p>

              {/* School Report Display */}
              {schoolReport && (
                <div className="bg-slate-600 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">🏫 School Management Report</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{schoolReport.totalSchools}</div>
                      <div className="text-slate-300 text-sm">Total Schools</div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{schoolReport.totalClasses}</div>
                      <div className="text-slate-300 text-sm">Total Classes</div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{schoolReport.totalStudents}</div>
                      <div className="text-slate-300 text-sm">Total Students</div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{schoolReport.attendanceSummary.attendanceRate}%</div>
                      <div className="text-slate-300 text-sm">Attendance Rate</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">📋 Attendance Summary</h5>
                      <div className="text-slate-300 text-sm">
                        <div>Present: {schoolReport.attendanceSummary.present}</div>
                        <div>Absent: {schoolReport.attendanceSummary.absent}</div>
                        <div>Late: {schoolReport.attendanceSummary.late}</div>
                        <div>Rate: {schoolReport.attendanceSummary.attendanceRate}%</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">🎓 Academic Performance</h5>
                      <div className="text-slate-300 text-sm">
                        <div>Average: {schoolReport.marksSummary.average}%</div>
                        <div>Highest: {schoolReport.marksSummary.highest}%</div>
                        <div>Lowest: {schoolReport.marksSummary.lowest}%</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">📊 System Info</h5>
                      <div className="text-slate-300 text-sm">
                        <div>System: {schoolReport.generatedBy}</div>
                        <div>Generated: {new Date(schoolReport.generatedAt).toLocaleDateString()}</div>
                        <div>Schools: {schoolReport.totalSchools}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual School Details */}
                  {schoolReport.schools && schoolReport.schools.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-white font-semibold mb-4">🏫 Individual School Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {schoolReport.schools.map((school, index) => (
                          <div key={school.schoolId || index} className="bg-slate-500 rounded-lg p-4">
                            <h6 className="text-white font-semibold mb-3">{school.schoolName}</h6>
                            <div className="grid grid-cols-2 gap-2 text-slate-300 text-sm">
                              <div>Classes: {school.statistics.totalClasses}</div>
                              <div>Students: {school.statistics.totalStudents}</div>
                              <div>Subjects: {school.statistics.totalSubjects}</div>
                              <div>Records: {school.statistics.totalAttendanceRecords}</div>
                              <div>Marks: {school.statistics.totalMarks}</div>
                              <div>Rate: {school.statistics.attendanceSummary.attendanceRate}%</div>
                              <div>Present: {school.statistics.attendanceSummary.present}</div>
                              <div>Absent: {school.statistics.attendanceSummary.absent}</div>
                              <div>Late: {school.statistics.attendanceSummary.late}</div>
                              <div>Avg Score: {school.statistics.marksSummary.average}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* School Report */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')

                      // Get school report from the new endpoint
                      const report = await reportsAPI.getSchoolReport()

                      console.log('School report generated:', report)
                      
                      // Handle the new data structure with multiple schools
                      const schools = report?.schools || [];
                      const summary = report?.summary || {};
                      
                      // Add fallback values to prevent undefined errors
                      const safeReport = {
                        school: 'School Management System',
                        totalClasses: summary?.totalClasses || 0,
                        totalStudents: summary?.totalStudents || 0,
                        totalSchools: report?.totalSchools || 0,
                        attendanceSummary: {
                          present: summary?.attendanceSummary?.present || 0,
                          absent: summary?.attendanceSummary?.absent || 0,
                          late: summary?.attendanceSummary?.late || 0,
                          attendanceRate: summary?.attendanceSummary?.attendanceRate || 0
                        },
                        marksSummary: {
                          average: summary?.marksSummary?.average || 0,
                          highest: summary?.marksSummary?.highest || 0,
                          lowest: summary?.marksSummary?.lowest || 0
                        },
                        schools: schools,
                        generatedAt: report?.generatedAt || new Date().toISOString(),
                        generatedBy: report?.generatedBy || 'School Management System'
                      }
                      
                      setSchoolReport(safeReport)
                    } catch (error) {
                      console.error('Error generating school report:', error)
                      setError('Failed to generate school report: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🏫</span>
                    <h4 className="font-medium">School Report</h4>
                    <p className="text-sm text-blue-200 mt-1">Complete school overview</p>
                  </div>
                </button>
                
                {/* Marks Report */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      
                      const schoolId = '68c547e28a9c12a9210a256f' // Replace with actual school ID
                      const report = await reportsAPI.getMarksReport(schoolId)
                      
                      console.log('Marks report generated:', report)
                      alert(`Marks Report Generated!\n\nSchool ID: ${report.schoolId}\nMarks Summary: ${JSON.stringify(report.marksSummary)}`)
                    } catch (error) {
                      console.error('Error generating marks report:', error)
                      setError('Failed to generate marks report: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📊</span>
                    <h4 className="font-medium">Marks Report</h4>
                    <p className="text-sm text-green-200 mt-1">Academic performance analysis</p>
                  </div>
                </button>
                
                {/* Attendance Report */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      
                      const schoolId = '68c547e28a9c12a9210a256f' // Replace with actual school ID
                      const report = await reportsAPI.getAttendanceReportNew(schoolId)
                      
                      console.log('Attendance report generated:', report)
                      alert(`Attendance Report Generated!\n\nSchool ID: ${report.schoolId}\nAttendance Summary: ${JSON.stringify(report.attendanceSummary)}`)
                    } catch (error) {
                      console.error('Error generating attendance report:', error)
                      setError('Failed to generate attendance report: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📋</span>
                    <h4 className="font-medium">Attendance Report</h4>
                    <p className="text-sm text-purple-200 mt-1">Attendance analytics</p>
                  </div>
                </button>
              </div>
            </div>


            {/* PDF Download Section */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📄 Download PDF Reports</h3>
              <p className="text-slate-300 mb-4">Download comprehensive reports as PDF files for offline viewing and sharing.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* School Report PDF */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      
                      await reportsAPI.downloadSchoolReportPDF()
                      
                      // PDF will open automatically for printing/saving
                    } catch (error) {
                      console.error('Error downloading school report PDF:', error)
                      setError('Failed to generate school report PDF: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📄</span>
                    <h4 className="font-medium">School PDF</h4>
                    <p className="text-sm text-red-200 mt-1">Complete overview</p>
                  </div>
                </button>
                
                {/* Marks Report PDF */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      
                      const schoolId = '68c547e28a9c12a9210a256f'
                      await reportsAPI.downloadMarksReportPDF(schoolId)
                      
                      // PDF will open automatically for printing/saving
                    } catch (error) {
                      console.error('Error downloading marks report PDF:', error)
                      setError('Failed to generate marks report PDF: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📄</span>
                    <h4 className="font-medium">Marks PDF</h4>
                    <p className="text-sm text-green-200 mt-1">Academic performance</p>
                  </div>
                </button>
                
                {/* Attendance Report PDF */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true)
                      setError('')
                      
                      const schoolId = '68c547e28a9c12a9210a256f'
                      await reportsAPI.downloadAttendanceReportPDF(schoolId)
                      
                      // PDF will open automatically for printing/saving
                    } catch (error) {
                      console.error('Error downloading attendance report PDF:', error)
                      setError('Failed to generate attendance report PDF: ' + (error.response?.data?.message || error.message))
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📄</span>
                    <h4 className="font-medium">Attendance PDF</h4>
                    <p className="text-sm text-purple-200 mt-1">Attendance analytics</p>
                  </div>
                </button>
                
                {/* Class Reports PDF */}
                <div className="bg-slate-600 rounded-lg p-4">
                  <div className="text-center text-slate-400">
                    <span className="text-2xl mb-2 block">📄</span>
                    <h4 className="font-medium">Class PDFs</h4>
                    <p className="text-sm text-slate-500 mt-1">Available per class</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Class PDF Downloads */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Download Class PDF Reports</h3>
              <p className="text-slate-300 mb-4">Download individual class performance reports as PDF files.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(cls => (
                  <button
                    key={cls._id}
                    onClick={async () => {
                      try {
                        setLoading(true)
                        setError('')
                        
                        await reportsAPI.downloadClassReportPDF(cls._id)
                        
                        // PDF will open automatically for printing/saving
                      } catch (error) {
                        console.error('Error downloading class report PDF:', error)
                        setError('Failed to generate class report PDF: ' + (error.response?.data?.message || error.message))
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{getClassName(cls)}</h4>
                        <p className="text-slate-300 text-sm">{getSubjectName(cls)}</p>
                        <p className="text-blue-400 text-xs mt-1">Click to download PDF</p>
                      </div>
                      <span className="text-2xl">📄</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Report History/Status */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Report Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{classes.length}</div>
                  <div className="text-slate-400 text-sm">Classes Available</div>
                </div>
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{students.length}</div>
                  <div className="text-slate-400 text-sm">Students Tracked</div>
                </div>
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{attendanceRecords.length}</div>
                  <div className="text-slate-400 text-sm">Attendance Records</div>
                </div>
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{comments.length}</div>
                  <div className="text-slate-400 text-sm">Comments</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin-management' && (
          <div className="space-y-6">
            {/* System Overview */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📊 System Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{classes.length}</div>
                  <div className="text-slate-400 text-sm">Total Classes</div>
                </div>
                <div className="bg-green-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{students.length}</div>
                  <div className="text-green-200 text-sm">Total Students</div>
                </div>
                <div className="bg-blue-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{users.length}</div>
                  <div className="text-blue-200 text-sm">Total Users</div>
                </div>
                <div className="bg-purple-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{attendanceRecords.length}</div>
                  <div className="text-purple-200 text-sm">Attendance Records</div>
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">👥 User Management</h3>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Create Admin</span>
                </button>
              </div>
              
              {/* Users List */}
              <div className="bg-slate-600 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-3">System Users ({users.length})</h4>
                {users.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.map((user, index) => (
                      <div key={user._id || index} className="bg-slate-500 rounded p-3 flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">{user.username || user.email}</div>
                          <div className="text-slate-300 text-sm">{user.email}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'admin' 
                              ? 'bg-red-600 text-red-100' 
                              : 'bg-slate-500 text-slate-300'
                          }`}>
                            {user.role || 'user'}
                          </span>
                          <button className="text-slate-400 hover:text-white text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-4">No users found</div>
                )}
              </div>
              
              <div className="bg-slate-600 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">👑 Admin User Creation</h4>
                <p className="text-slate-300 text-sm mb-4">
                  Create new admin users who will have full access to the system. 
                  Admin users can manage classes, students, attendance, and create other admin accounts.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-500 rounded p-3">
                    <h5 className="text-white font-medium mb-2">🔐 Admin Privileges</h5>
                    <ul className="text-slate-300 space-y-1">
                      <li>• Full system access</li>
                      <li>• Create/edit classes</li>
                      <li>• Manage students</li>
                      <li>• View all attendance</li>
                      <li>• Generate reports</li>
                      <li>• Create other admins</li>
                      <li>• Access admin APIs</li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-500 rounded p-3">
                    <h5 className="text-white font-medium mb-2">⚠️ Security Notes</h5>
                    <ul className="text-slate-300 space-y-1">
                      <li>• Use strong passwords</li>
                      <li>• Verify email addresses</li>
                      <li>• Only create trusted users</li>
                      <li>• Monitor admin activity</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Create New Class</h3>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Class Name *</label>
                <input
                  type="text"
                  value={newClass.className}
                  onChange={(e) => setNewClass({...newClass, className: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Grade 10A"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Subject Name *</label>
                <input
                  type="text"
                  value={newClass.subjectName}
                  onChange={(e) => setNewClass({...newClass, subjectName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Class Room *</label>
                <input
                  type="text"
                  value={newClass.classRoom}
                  onChange={(e) => setNewClass({...newClass, classRoom: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Room 101"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Class Credit</label>
                <input
                  type="text"
                  value={newClass.classCredit}
                  onChange={(e) => setNewClass({...newClass, classCredit: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Student</h3>
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Student Name *</label>
                <input
                  type="text"
                  value={newStudent.studentName}
                  onChange={(e) => setNewStudent({...newStudent, studentName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Select Class *</label>
                <select
                  value={newStudent.classId}
                  onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {getClassName(cls)} - {getSubjectName(cls)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">School ID</label>
                <input
                  type="text"
                  value={newStudent.schoolId}
                  onChange={(e) => setNewStudent({...newStudent, schoolId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional school ID"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStudent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create Admin User</h3>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Username *</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., admin_user"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., admin@school.com"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter password"
                />
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Detail Modal */}
      {showCommentModal && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Comment Details</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Class Name:</p>
                  <p className="text-white font-medium">{selectedComment.className}</p>
                </div>
                <div>
                  <p className="text-gray-400">Subject:</p>
                  <p className="text-white font-medium">{selectedComment.subjectName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Number of Students:</p>
                  <p className="text-white font-medium">{selectedComment.numberOfStudents}</p>
                </div>
                <div>
                  <p className="text-gray-400">Date:</p>
                  <p className="text-white font-medium">{new Date(selectedComment.createdAt || selectedComment.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* School Information */}
              {selectedComment.schoolId && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">🏫 School Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">School Name:</p>
                      <p className="text-white font-medium">{selectedComment.schoolId.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">School ID:</p>
                      <p className="text-white font-medium">{selectedComment.schoolId._id || selectedComment.schoolId}</p>
                    </div>
                    {selectedComment.schoolId.createdBy && (
                      <div>
                        <p className="text-gray-400 text-sm">Created By:</p>
                        <p className="text-white font-medium">{selectedComment.schoolId.createdBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedComment.successStory && (
                <div>
                  <p className="text-gray-400 mb-2">Success Story:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">{selectedComment.successStory}</p>
                </div>
              )}
              
              {selectedComment.challenge && (
                <div>
                  <p className="text-gray-400 mb-2">Challenge:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">{selectedComment.challenge}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Created by:</p>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-white font-medium">
                      {selectedComment.teacherId?.username || selectedComment.teacherId?.email || getTeacherName(selectedComment.teacherId)}
                    </p>
                    <p className="text-gray-400 text-sm">Email: {selectedComment.teacherId?.email || 'N/A'}</p>
                    <p className="text-gray-400 text-sm">Role: {selectedComment.teacherId?.role || 'N/A'}</p>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Created: {new Date(selectedComment.createdAt || selectedComment.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div>
                    <p className="text-gray-400">Teacher ID:</p>
                    <p className="text-white font-mono text-sm">{getTeacherId(selectedComment.teacherId)}</p>
                  </div>
                </div>
              </div>
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
                    setShowCreateStudentModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <span className="mr-2">+</span>
                  Add Student to Class
                </button>
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
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => {
                              // You can add functionality to view student details
                              console.log('View student details:', student)
                            }}
                            className="flex-1 bg-slate-500 hover:bg-slate-400 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              // You can add functionality to edit student
                              console.log('Edit student:', student)
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            Edit
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
                      setShowCreateStudentModal(true)
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
                    {comments.filter(comment => comment.className === getClassName(selectedClassForStudents)).length}
                  </div>
                  <div className="text-slate-400 text-sm">Comments</div>
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
                onClick={() => {
                  setShowStudentsModal(false)
                  setShowCreateStudentModal(true)
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add New Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showAttendanceModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Attendance Details</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Student ID:</p>
                <p className="text-white font-medium">{selectedAttendance.studentId}</p>
              </div>
              <div>
                <p className="text-gray-400">Class ID:</p>
                <p className="text-white font-medium">{selectedAttendance.classId}</p>
              </div>
              <div>
                <p className="text-gray-400">Status:</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAttendance.status === 'present' ? 'bg-green-600 text-white' :
                  selectedAttendance.status === 'absent' ? 'bg-red-600 text-white' :
                  selectedAttendance.status === 'late' ? 'bg-yellow-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {selectedAttendance.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400">Date:</p>
                <p className="text-white font-medium">{new Date(selectedAttendance.date).toLocaleDateString()}</p>
              </div>
              {selectedAttendance.remarks && (
                <div>
                  <p className="text-gray-400">Remarks:</p>
                  <p className="text-white bg-slate-700 p-3 rounded-lg">{selectedAttendance.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin