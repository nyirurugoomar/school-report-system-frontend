import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'
import * as commentAPI from '../api/comment'
import * as attendanceAPI from '../api/attendance'
import * as analyticsAPI from '../api/analytics'
import * as reportsAPI from '../api/reports'

function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [comments, setComments] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [classPerformance, setClassPerformance] = useState([])
  const [attendanceTrends, setAttendanceTrends] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Load all data in parallel
      const [
        classesData,
        studentsData,
        commentsData,
        attendanceData,
        dashboardData,
        classPerfData
      ] = await Promise.all([
        classAPI.getClasses(),
        studentAPI.getStudents(),
        commentAPI.getComments(),
        attendanceAPI.getAttendanceRecords(),
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getClassPerformance()
      ])

      setClasses(classesData || [])
      setStudents(studentsData || [])
      setComments(commentsData || [])
      setAttendanceRecords(attendanceData || [])
      setDashboardStats(dashboardData)
      setClassPerformance(classPerfData || [])
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceTrends = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return
    
    try {
      const trends = await analyticsAPI.getAttendanceTrends(
        dateRange.startDate,
        dateRange.endDate
      )
      setAttendanceTrends(trends || [])
    } catch (err) {
      console.error('Error loading attendance trends:', err)
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

  // Helper function to safely get student name
  const getStudentName = (student) => {
    if (!student) return 'Unknown Student'
    if (typeof student.studentName === 'object') {
      return student.studentName.name || student.studentName._id || 'Unknown Student'
    }
    return student.studentName || 'Unknown Student'
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
    { id: 'attendance', name: 'Attendance', icon: '��' },
    { id: 'reports', name: 'Reports', icon: '📊' }
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 mt-1">Manage and review school reports</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <span className="mr-2">🏫</span>
                Add Class
              </button>
              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <span className="mr-2">👥</span>
                Add Student
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-800 rounded-lg p-1 mb-8">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-slate-400 text-sm">Total Students</p>
                    <p className="text-white text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-xl">🏫</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-slate-400 text-sm">Total Classes</p>
                    <p className="text-white text-2xl font-bold">{classes.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-slate-400 text-sm">Total Comments</p>
                    <p className="text-white text-2xl font-bold">{comments.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-slate-400 text-sm">Attendance Records</p>
                    <p className="text-white text-2xl font-bold">{attendanceRecords.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🏫</span>
                    <h4 className="font-medium">Create Class</h4>
                    <p className="text-sm text-green-200 mt-1">Add new class</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">👥</span>
                    <h4 className="font-medium">Add Student</h4>
                    <p className="text-sm text-blue-200 mt-1">Register student</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('comments')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">💬</span>
                    <h4 className="font-medium">View Comments</h4>
                    <p className="text-sm text-yellow-200 mt-1">Review feedback</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">��</span>
                    <h4 className="font-medium">Check Attendance</h4>
                    <p className="text-sm text-purple-200 mt-1">View records</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Comments */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Comments</h3>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                {filteredComments.slice(0, 5).map(comment => (
                  <div key={comment._id} className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors" onClick={() => openCommentModal(comment)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{comment.className} - {comment.subjectName}</h4>
                        <p className="text-slate-300 text-sm mt-1">{comment.successStory || comment.challenge || 'No content'}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-blue-400 text-xs">Click to view full details</span>
                          {comment.teacherId && (
                            <span className="text-gray-400 text-xs">Teacher: {getTeacherName(comment.teacherId)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">{new Date(comment.createdAt || comment.date).toLocaleDateString()}</p>
                        <p className="text-slate-400 text-xs">{comment.numberOfStudents} students</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
            {/* Classes Overview */}
<div className="bg-slate-700 rounded-lg p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-white">Classes Overview</h3>
    <button
      onClick={() => setShowCreateClassModal(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
    >
      + Add Class
    </button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {classes.slice(0, 6).map(cls => (
      <div 
        key={cls._id} 
        className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors"
        onClick={() => {
          setSelectedClassForStudents(cls)
          setShowStudentsModal(true)
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-white font-medium">{getClassName(cls)}</h4>
            <p className="text-slate-300 text-sm">{getSubjectName(cls)}</p>
            <p className="text-slate-400 text-xs">Room: {cls.classRoom || 'N/A'}</p>
            <p className="text-blue-400 text-xs mt-2">Click to view students →</p>
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
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Students Overview</h3>
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  + Add Student
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.slice(0, 6).map(student => {
                  const schoolId = getSchoolId(student.schoolId)
                  return (
                    <div key={student._id} className="bg-slate-600 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-medium">{getStudentName(student)}</h4>
                          <p className="text-slate-300 text-sm">Class: {getClassNameFromId(student.classId)}</p>
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
              <h3 className="text-lg font-semibold text-white mb-4">All Comments ({filteredComments.length})</h3>
              <div className="space-y-4">
                {filteredComments.map(comment => (
                  <div key={comment._id} className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors" onClick={() => openCommentModal(comment)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{comment.className} - {comment.subjectName}</h4>
                        <p className="text-slate-300 text-sm mt-1">{comment.successStory || comment.challenge || 'No content'}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-blue-400 text-xs">Click to view full details</span>
                          {comment.teacherId && (
                            <span className="text-gray-400 text-xs">Teacher: {getTeacherName(comment.teacherId)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">{new Date(comment.createdAt || comment.date).toLocaleDateString()}</p>
                        <p className="text-slate-400 text-xs">{comment.numberOfStudents} students</p>
                      </div>
                    </div>
                  </div>
                ))}
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
                Load Trends
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
                        <h4 className="text-white font-medium">{record.studentId}</h4>
                        <p className="text-slate-300 text-sm">Class: {record.classId}</p>
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
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Generate Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => {/* Generate attendance report */}}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📋</span>
                    <h4 className="font-medium">Attendance Report</h4>
                    <p className="text-sm text-blue-200 mt-1">Generate attendance summary</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {/* Generate class report */}}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">��</span>
                    <h4 className="font-medium">Class Report</h4>
                    <p className="text-sm text-green-200 mt-1">Generate class performance</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {/* Generate student report */}}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">👤</span>
                    <h4 className="font-medium">Student Report</h4>
                    <p className="text-sm text-purple-200 mt-1">Generate student performance</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create New Class</h3>
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
                  <p className="text-white font-medium">{getTeacherName(selectedComment.teacherId)}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Created: {new Date(selectedComment.createdAt || selectedComment.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div>
                    <p className="text-gray-400">Teacher ID:</p>
                    <p className="text-white font-mono">{getTeacherId(selectedComment.teacherId)}</p>
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