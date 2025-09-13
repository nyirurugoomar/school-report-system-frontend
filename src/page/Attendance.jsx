import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  
  // New student form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    classId: ''
  })

  // New class form state
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    room: '',
    credits: ''
  })

  // Classes data - now using state to allow adding new classes
  const [classes, setClasses] = useState([
    { id: 1, name: 'Mathematics 101', subject: 'Mathematics', room: 'Room 101', credits: 3, students: 25 },
    { id: 2, name: 'Physics 201', subject: 'Physics', room: 'Room 201', credits: 4, students: 30 },
    { id: 3, name: 'Chemistry 301', subject: 'Chemistry', room: 'Room 301', credits: 3, students: 20 },
    { id: 4, name: 'Biology 401', subject: 'Biology', room: 'Room 401', credits: 4, students: 28 }
  ])

  // Students data with class association
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', studentId: 'ST001', email: 'john@email.com', phone: '123-456-7890', classId: 1 },
    { id: 2, name: 'Jane Smith', studentId: 'ST002', email: 'jane@email.com', phone: '123-456-7891', classId: 1 },
    { id: 3, name: 'Mike Johnson', studentId: 'ST003', email: 'mike@email.com', phone: '123-456-7892', classId: 2 },
    { id: 4, name: 'Sarah Wilson', studentId: 'ST004', email: 'sarah@email.com', phone: '123-456-7893', classId: 2 },
    { id: 5, name: 'David Brown', studentId: 'ST005', email: 'david@email.com', phone: '123-456-7894', classId: 3 },
    { id: 6, name: 'Emily Davis', studentId: 'ST006', email: 'emily@email.com', phone: '123-456-7895', classId: 3 },
    { id: 7, name: 'Chris Miller', studentId: 'ST007', email: 'chris@email.com', phone: '123-456-7896', classId: 4 },
    { id: 8, name: 'Lisa Garcia', studentId: 'ST008', email: 'lisa@email.com', phone: '123-456-7897', classId: 4 }
  ])

  const handleCreateClass = () => {
    if (newClass.name.trim() && newClass.subject.trim()) {
      const classData = {
        id: Date.now(),
        name: newClass.name,
        subject: newClass.subject,
        room: newClass.room,
        credits: newClass.credits,
        students: 0
      }
      setClasses([...classes, classData])
      setNewClass({ name: '', subject: '', room: '', credits: '' })
      setShowCreateClassModal(false)
    }
  }

  const handleAddStudent = () => {
    if (newStudent.name.trim() && newStudent.studentId.trim() && newStudent.classId) {
      const student = {
        id: Date.now(),
        name: newStudent.name,
        studentId: newStudent.studentId,
        email: newStudent.email,
        phone: newStudent.phone,
        classId: parseInt(newStudent.classId)
      }
      setStudents([...students, student])
      
      // Update class student count
      setClasses(classes.map(cls => 
        cls.id === parseInt(newStudent.classId) 
          ? { ...cls, students: cls.students + 1 }
          : cls
      ))
      
      setNewStudent({ name: '', studentId: '', email: '', phone: '', classId: '' })
      setShowAddStudentModal(false)
    }
  }

  const handleCreateAttendance = () => {
    if (newAttendanceName.trim()) {
      // Get students for the selected class
      const classStudents = students.filter(student => {
        const classData = classes.find(cls => cls.name === selectedClass)
        return classData && student.classId === classData.id
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

  const toggleStudentAttendance = (studentId) => {
    if (selectedAttendance) {
      const updatedRecord = {
        ...selectedAttendance,
        students: selectedAttendance.students.map(student =>
          student.id === studentId 
            ? { ...student, present: !student.present }
            : student
        )
      }
      setSelectedAttendance(updatedRecord)
      setAttendanceRecords(attendanceRecords.map(record =>
        record.id === selectedAttendance.id ? updatedRecord : record
      ))
    }
  }

  const saveAttendance = () => {
    navigate('/success')
  }

  const selectedClassData = classes.find(cls => cls.name === selectedClass)
  const studentsInSelectedClass = selectedClassData ? 
    students.filter(student => student.classId === selectedClassData.id) : []

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-4xl font-bold text-white mb-8 text-center'>Attendance Management</h1>
        
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
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.name)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedClass === cls.name
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-slate-600 bg-slate-600 text-gray-300 hover:border-slate-500'
                  }`}
                >
                  <div className='text-left'>
                    <h3 className='font-semibold'>{cls.name}</h3>
                    <p className='text-sm opacity-75'>{cls.subject}</p>
                    <p className='text-xs opacity-60'>{cls.room} | {cls.credits} credits</p>
                    <p className='text-sm opacity-75 mt-1'>{cls.students} students</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student List Preview */}
        {selectedClass && (
          <div className='mb-6'>
            <div className='bg-slate-700 rounded-lg p-6'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                Students in {selectedClass} ({studentsInSelectedClass.length} students)
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {studentsInSelectedClass.slice(0, 6).map(student => (
                  <div key={student.id} className='bg-slate-600 rounded-lg p-3'>
                    <h3 className='font-semibold text-white'>{student.name}</h3>
                    <p className='text-gray-300 text-sm'>{student.studentId}</p>
                    <p className='text-gray-400 text-xs'>{student.email}</p>
                  </div>
                ))}
                {studentsInSelectedClass.length > 6 && (
                  <div className='bg-slate-600 rounded-lg p-3 flex items-center justify-center'>
                    <span className='text-gray-300 text-sm'>+{studentsInSelectedClass.length - 6} more students</span>
                  </div>
                )}
                {studentsInSelectedClass.length === 0 && (
                  <div className='bg-slate-600 rounded-lg p-3 flex items-center justify-center col-span-full'>
                    <span className='text-gray-300 text-sm'>No students in this class yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Attendance Button */}
        {selectedClass && studentsInSelectedClass.length > 0 && (
          <div className='mb-6 text-center'>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200'
            >
              Create New Attendance
            </button>
          </div>
        )}

        {/* Attendance Records */}
        {attendanceRecords.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-semibold text-white mb-4'>Attendance Records</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {attendanceRecords.map(record => (
                <div
                  key={record.id}
                  onClick={() => setSelectedAttendance(record)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAttendance?.id === record.id
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <h3 className='font-semibold text-white'>{record.name}</h3>
                  <p className='text-gray-300 text-sm'>{record.class}</p>
                  <p className='text-gray-400 text-xs'>{record.date}</p>
                  <div className='mt-2'>
                    <span className='text-green-400 text-sm'>
                      Present: {record.students.filter(s => s.present).length}/{record.students.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Attendance List */}
        {selectedAttendance && (
          <div className='bg-slate-700 rounded-lg p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold text-white'>
                Mark Attendance - {selectedAttendance.name}
              </h2>
              <button
                onClick={saveAttendance}
                className='bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Save Attendance
              </button>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {selectedAttendance.students.map(student => (
                <div
                  key={student.id}
                  onClick={() => toggleStudentAttendance(student.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    student.present
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-slate-600 bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='font-semibold text-white'>{student.name}</h3>
                      <p className='text-gray-300 text-sm'>{student.studentId}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      student.present
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-400'
                    }`}>
                      {student.present && (
                        <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4'>
            <h2 className='text-xl font-semibold text-white mb-4'>Create New Class</h2>
            
            <div className='space-y-4'>
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Class Name</label>
                <input
                  type='text'
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder='e.g., Advanced Mathematics'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Subject</label>
                <input
                  type='text'
                  value={newClass.subject}
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  placeholder='e.g., Mathematics'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Room</label>
                <input
                  type='text'
                  value={newClass.room}
                  onChange={(e) => setNewClass({...newClass, room: e.target.value})}
                  placeholder='e.g., Room 501'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Credits</label>
                <input
                  type='number'
                  value={newClass.credits}
                  onChange={(e) => setNewClass({...newClass, credits: e.target.value})}
                  placeholder='3'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
            </div>
            
            <div className='flex space-x-4 mt-6'>
              <button
                onClick={() => {
                  setShowCreateClassModal(false)
                  setNewClass({ name: '', subject: '', room: '', credits: '' })
                }}
                className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={!newClass.name.trim() || !newClass.subject.trim()}
                className='flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Create Class
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
                <label className='block text-white text-sm font-medium mb-2'>Student Name</label>
                <input
                  type='text'
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  placeholder='Enter student full name'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Student ID</label>
                <input
                  type='text'
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                  placeholder='e.g., ST009'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Select Class</label>
                <select
                  value={newStudent.classId}
                  onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Email</label>
                <input
                  type='email'
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder='student@email.com'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
              
              <div>
                <label className='block text-white text-sm font-medium mb-2'>Phone Number</label>
                <input
                  type='tel'
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                  placeholder='123-456-7890'
                  className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'
                />
              </div>
            </div>
            
            <div className='flex space-x-4 mt-6'>
              <button
                onClick={() => {
                  setShowAddStudentModal(false)
                  setNewStudent({ name: '', studentId: '', email: '', phone: '', classId: '' })
                }}
                className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!newStudent.name.trim() || !newStudent.studentId.trim() || !newStudent.classId}
                className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Attendance Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-slate-700 rounded-lg p-6 w-full max-w-md mx-4'>
            <h2 className='text-xl font-semibold text-white mb-4'>Create New Attendance</h2>
            <div className='mb-4'>
              <label className='block text-white text-sm font-medium mb-2'>Attendance Name</label>
              <input
                type='text'
                value={newAttendanceName}
                onChange={(e) => setNewAttendanceName(e.target.value)}
                placeholder='e.g., Morning Session, Lab Class'
                className='w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
              />
            </div>
            <div className='mb-4'>
              <label className='block text-white text-sm font-medium mb-2'>Selected Class</label>
              <div className='px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500'>
                {selectedClass || 'No class selected'}
              </div>
            </div>
            <div className='mb-4'>
              <label className='block text-white text-sm font-medium mb-2'>Students in Class</label>
              <div className='px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500'>
                {studentsInSelectedClass.length} students
              </div>
            </div>
            <div className='flex space-x-4'>
              <button
                onClick={() => setShowCreateModal(false)}
                className='flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAttendance}
                disabled={!newAttendanceName.trim()}
                className='flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance