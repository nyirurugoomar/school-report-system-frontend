import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as marksAPI from '../api/marks'
import * as classAPI from '../api/class'

function Marks() {
  const navigate = useNavigate()
  
  // Data state
  const [marks, setMarks] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter state
  const [filters, setFilters] = useState({
    academicYear: '',
    academicTerm: '',
    classId: '',
    subjectName: '',
    examType: '',
    teacherName: '',
    dateFrom: '',
    dateTo: ''
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Academic years and terms
  const academicYears = ['2023-2024', '2024-2025', '2025-2026']
  const academicTerms = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM']
  const examTypes = ['BEGINNING_TERM', 'MIDTERM', 'ENDTERM']

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load marks when filters change
  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => value !== '')
    console.log('useEffect triggered - filters changed:', filters)
    console.log('Has filters:', hasFilters)
    if (hasFilters) {
      console.log('Loading marks with filters')
      loadMarks()
    } else {
      console.log('Loading all marks (no filters)')
      // If no filters, load all marks
      loadMarks()
    }
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [classesData, marksData] = await Promise.all([
        classAPI.getClasses(),
        marksAPI.getMarks()
      ])
      
      setClasses(classesData)
      setMarks(marksData)
      
      console.log('Loaded classes:', classesData)
      console.log('Loaded marks:', marksData)
      console.log('Number of marks found:', marksData?.length || 0)
      
      // Debug: Show the structure of the first mark to understand field names
      if (marksData && marksData.length > 0) {
        console.log('First mark structure:', marksData[0]);
        console.log('Available fields in first mark:', Object.keys(marksData[0]));
        console.log('Student field:', marksData[0].studentId);
        console.log('Class field:', marksData[0].classId);
        console.log('Subject field:', marksData[0].subjectId);
        console.log('Teacher field:', marksData[0].teacherId);
        
        // Debug: Show all classIds in marks
        const classIdsInMarks = marksData.map(mark => ({
          classId: mark.classId?._id || mark.classId,
          className: mark.classId?.className || 'N/A'
        }));
        console.log('All classIds in marks:', classIdsInMarks);
        
        // Debug: Show available classes for comparison
        console.log('Available classes for filtering:', classesData.map(cls => ({
          classId: cls._id,
          className: cls.className
        })));
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMarks = async () => {
    try {
      // Clean filters before sending to API
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value.toString().trim() !== '') {
          acc[key] = value.toString().trim();
        }
        return acc;
      }, {});
      
      console.log('Loading marks with filters:', filters);
      console.log('Clean filters being sent:', cleanFilters);
      
      const marksData = await marksAPI.getMarks(cleanFilters);
      console.log('Marks data received:', marksData);
      console.log('Number of marks:', marksData?.length || 0);
      
      setMarks(marksData);
    } catch (error) {
      console.error('Error loading marks:', error);
      if (error.response) {
        console.error('Backend error response:', error.response.data);
        console.error('Backend error status:', error.response.status);
      }
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    console.log(`Filter changed: ${name} = ${value}`)
    console.log(`Previous filters:`, filters)
    
    const newFilters = {
      ...filters,
      [name]: value
    }
    console.log(`New filters:`, newFilters)
    
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      academicYear: '',
      academicTerm: '',
      classId: '',
      subjectName: '',
      examType: '',
      teacherName: '',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }

  const handleDeleteMarks = async (marksId) => {
    if (window.confirm('Are you sure you want to delete these marks?')) {
      try {
        await marksAPI.deleteMarks(marksId)
        setSuccess('Marks deleted successfully!')
        loadMarks()
      } catch (error) {
        console.error('Error deleting marks:', error)
        setError('Failed to delete marks. Please try again.')
      }
    }
  }

  const handleEditMarks = (marksId) => {
    navigate(`/edit-marks/${marksId}`)
  }

  // Pagination
  const totalPages = Math.ceil(marks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMarks = marks.slice(startIndex, endIndex)

  // Get unique subjects
  const subjectsFromMarks = [...new Set(marks.map(mark => mark.subjectId?.subjectName || mark.classId?.subjectName).filter(Boolean))]
  const subjectsFromClasses = [...new Set(classes.map(cls => cls.subjectName).filter(Boolean))]
  const uniqueSubjects = [...new Set([...subjectsFromMarks, ...subjectsFromClasses])]

  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='max-w-7xl mx-auto'>
        <div className="flex justify-between items-center mb-8">
          <h1 className='text-4xl font-bold text-white'>Marks Management</h1>
          <button
            onClick={() => navigate('/create-marks')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create New Marks
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

        {/* Filter Section */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Filter Marks</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Academic Year Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Academic Year</label>
              <select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Academic Term Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Academic Term</label>
              <select
                name="academicTerm"
                value={filters.academicTerm}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Terms</option>
                {academicTerms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Class</label>
              <select
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.className}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Subject</label>
              <select
                name="subjectName"
                value={filters.subjectName}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Exam Type Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Exam Type</label>
              <select
                name="examType"
                value={filters.examType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                {examTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Teacher Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Teacher</label>
              <input
                type="text"
                name="teacherName"
                value={filters.teacherName}
                onChange={handleFilterChange}
                placeholder="Search by teacher name"
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-400"
              />
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Marks Table */}
        <div className="bg-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              Marks Records ({marks.length} total)
            </h3>
            {loading && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>

          {marks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📊</div>
              <h4 className="text-xl font-medium text-white mb-2">No Marks Found</h4>
              <p className="text-slate-400 mb-6">
                No marks records available.
              </p>
              <button
                onClick={() => navigate('/create-marks')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create First Marks
              </button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="pb-3 text-white font-medium">Student Name</th>
                      <th className="pb-3 text-white font-medium">Class</th>
                      <th className="pb-3 text-white font-medium">Subject</th>
                      <th className="pb-3 text-white font-medium">Exam Type</th>
                      <th className="pb-3 text-white font-medium">Total Marks</th>
                      <th className="pb-3 text-white font-medium">Academic Year</th>
                      <th className="pb-3 text-white font-medium">Term</th>
                      <th className="pb-3 text-white font-medium">Exam Date</th>
                      <th className="pb-3 text-white font-medium">Teacher</th>
                      <th className="pb-3 text-white font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMarks.map(mark => (
                      <tr key={mark._id} className="border-b border-slate-600 hover:bg-slate-600 transition-colors">
                        <td className="py-3 text-white">
                          {mark.studentId?.studentName || mark.studentName || mark.student?.studentName || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-300">
                          {mark.classId?.className || mark.className || mark.class?.className || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-300">
                          {mark.subjectId?.subjectName || mark.classId?.subjectName || mark.subjectName || mark.subject?.subjectName || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-300">{mark.examType.replace('_', ' ')}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{mark.totalMarks}</span>
                            <span className="text-slate-400 text-xs">marks</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300">{mark.academicYear}</td>
                        <td className="py-3 text-slate-300">{mark.academicTerm}</td>
                        <td className="py-3 text-slate-300">
                          {new Date(mark.examDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-slate-300">
                          {mark.teacherId?.username || mark.teacherName || mark.teacher?.username || mark.teacher?.teacherName || 'N/A'}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditMarks(mark._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMarks(mark._id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-slate-400 text-sm">
                    Showing {startIndex + 1} to {Math.min(endIndex, marks.length)} of {marks.length} records
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-white px-3 py-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Marks