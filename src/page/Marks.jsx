import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as marksAPI from '../api/marks'
import * as classAPI from '../api/class'
import * as studentAPI from '../api/student'
import { getUser } from '../utils/auth'

function Marks() {
  const navigate = useNavigate()
  
  // Data state
  const [marks, setMarks] = useState([])
  const [classes, setClasses] = useState([])
  const [schoolOptions, setSchoolOptions] = useState([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classStudents, setClassStudents] = useState([])
  const [classStudentsLoading, setClassStudentsLoading] = useState(false)
  const [classMarksLoading, setClassMarksLoading] = useState(false)
  const [marksEntries, setMarksEntries] = useState({})
  const [marksSaving, setMarksSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [editingMarkId, setEditingMarkId] = useState(null)
  const [editingMarkScore, setEditingMarkScore] = useState('')
  const [editingMarkRecord, setEditingMarkRecord] = useState(null)
  const [editingMarkLoading, setEditingMarkLoading] = useState(false)
  
  const getDefaultAcademicYear = () => {
    const year = new Date().getFullYear()
    return `${year}-${year + 1}`
  }
  
  const [examInfo, setExamInfo] = useState({
    academicYear: getDefaultAcademicYear(),
    academicTerm: 'THIRD_TERM',
    examType: 'ENDTERM',
    examDate: new Date().toISOString().split('T')[0],
    totalMarks: 100
  })
  
  // Filter state
  const [filters, setFilters] = useState({
    schoolId: '',
    classId: '',
    subjectId: '',
    academicYear: '',
    academicTerm: '',
    examType: '',
    dateFrom: '',
    dateTo: ''
  })
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [reviewSearchTerm, setReviewSearchTerm] = useState('')
  const [bulkScore, setBulkScore] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({})
  
  // Academic years and terms
  const academicYears = ['2023-2024', '2024-2025', '2025-2026', getDefaultAcademicYear()].filter(
    (value, index, self) => self.indexOf(value) === index
  )
  const academicTerms = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM']
  const examTypeOptions = [
    { value: 'BEGINNING_TERM', label: 'Beginning Term' },
    { value: 'MIDTERM', label: 'Mid Term' },
    { value: 'ENDTERM', label: 'Final Term' }
  ]
  const getExamTypeLabel = (value) => {
    const match = examTypeOptions.find(option => option.value === value)
    return match ? match.label : value || ''
  }

const getCombinationKey = (academicYear, term, examType) =>
  `${academicYear || 'ALL_YEAR'}__${term || 'ALL_TERM'}__${examType || 'ALL_EXAM'}`

const createEmptyEntry = () => ({
  score: '',
  savedScore: '',
  savedKey: null,
  markId: null
})

const ensureMarksEntriesStructure = (entries, students, combinationKey) => {
  const next = { ...entries }
  students.forEach(student => {
    if (!next[student._id]) {
      next[student._id] = {}
    }
    if (!next[student._id][combinationKey]) {
      next[student._id][combinationKey] = createEmptyEntry()
    }
  })
  return next
}

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load marks when filters change
  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => value !== '')
    console.log('useEffect triggered - filters changed:', filters)
    console.log('Has filters:', hasFilters)
    loadMarks()
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
      
      const schoolMap = new Map()
      classesData.forEach(cls => {
        const schoolId = cls.schoolId?._id || cls.schoolId || cls.schoolName
        if (schoolId && !schoolMap.has(schoolId)) {
          schoolMap.set(schoolId, {
            _id: schoolId,
            name: cls.schoolId?.name || cls.schoolName || 'Unnamed School'
          })
        }
      })
      setSchoolOptions([...schoolMap.values()])
      
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
      
      const requestFilters = { ...cleanFilters };
      delete requestFilters.academicTerm;
      delete requestFilters.examType;

      const marksData = await marksAPI.getMarks(requestFilters);
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

  const loadClassStudents = async (classId) => {
    if (!classId) {
      setClassStudents([])
      setMarksEntries({})
      setHasPendingChanges(false)
      return
    }

    try {
      setClassStudentsLoading(true)
      const studentsData = await studentAPI.getStudentsByClass(classId)
      setClassStudents(studentsData || [])
      const combinationKey = getCombinationKey(
        examInfo.academicYear,
        examInfo.academicTerm,
        examInfo.examType
      )
      setMarksEntries(prev => ensureMarksEntriesStructure(prev, studentsData || [], combinationKey))
      setHasPendingChanges(false)
    } catch (error) {
      console.error('Error loading class students:', error)
      setError('Failed to load students for this class')
      setClassStudents([])
    } finally {
      setClassStudentsLoading(false)
    }
  }

  const loadExistingMarksForClass = async () => {
    if (!selectedClassId || !examInfo.academicYear || !examInfo.academicTerm || !examInfo.examType) {
      setHasPendingChanges(false)
      return
    }

    try {
      setClassMarksLoading(true)
      const existing = await marksAPI.getMarksByClass(selectedClassId, {
        academicYear: examInfo.academicYear,
        academicTerm: examInfo.academicTerm,
        examType: examInfo.examType
      })
      
      const filteredExisting = (existing || []).filter(record => {
        const recordYear = record.academicYear || record.academic_year
        const recordTerm = record.academicTerm || record.academic_term
        const recordExamType = record.examType || record.exam_type
        
        return (
          (!examInfo.academicYear || recordYear === examInfo.academicYear) &&
          (!examInfo.academicTerm || recordTerm === examInfo.academicTerm) &&
          (!examInfo.examType || recordExamType === examInfo.examType)
        )
      })

      const combinationKey = getCombinationKey(
        examInfo.academicYear,
        examInfo.academicTerm,
        examInfo.examType
      )

      const map = {}
      filteredExisting.forEach(record => {
        const studentId = record.studentId?._id || record.studentId
        if (!studentId) return
        map[studentId] = {
          markId: record._id,
          score: record.totalMarks,
          savedKey: combinationKey
        }
      })
      setMarksEntries(prev => {
        const updated = ensureMarksEntriesStructure(prev, classStudents, combinationKey)
        classStudents.forEach(student => {
          const existingEntry = map[student._id]
          if (!updated[student._id]) {
            updated[student._id] = {}
          }
          updated[student._id][combinationKey] = {
            score: existingEntry ? existingEntry.score?.toString() : '',
            savedScore: existingEntry ? existingEntry.score?.toString() : '',
            savedKey: existingEntry ? combinationKey : null,
            markId: existingEntry?.markId || null
          }
        })
        return updated
      })
      setHasPendingChanges(false)
    } catch (error) {
      console.error('Error loading existing marks:', error)
      setError('Failed to load existing marks for this class')
    } finally {
      setClassMarksLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedClassId) return
    loadClassStudents(selectedClassId)
  }, [selectedClassId])

  useEffect(() => {
    if (!selectedClassId || classStudents.length === 0) return
    loadExistingMarksForClass()
  }, [selectedClassId, classStudents, examInfo.academicYear, examInfo.academicTerm, examInfo.examType])

  useEffect(() => {
    if (classStudents.length === 0) return
    const combinationKey = getCombinationKey(
      examInfo.academicYear,
      examInfo.academicTerm,
      examInfo.examType
    )
    setMarksEntries(prev => ensureMarksEntriesStructure(prev, classStudents, combinationKey))
  }, [classStudents, examInfo.academicYear, examInfo.academicTerm, examInfo.examType])

  useEffect(() => {
    setHasPendingChanges(false)
  }, [examInfo.academicYear, examInfo.academicTerm, examInfo.examType])

  const getSubjectIdFromClass = (cls) => {
    if (!cls) return ''
    if (cls.subjectId && typeof cls.subjectId === 'object' && cls.subjectId._id) return cls.subjectId._id
    if (cls.subjectId && typeof cls.subjectId === 'string') return cls.subjectId
    return ''
  }

  const getSubjectNameFromClass = (cls) => {
    if (!cls) return ''
    return cls.subjectId?.subjectName || cls.subjectName || 'Subject not set'
  }

  const getSchoolIdFromClass = (cls) => {
    if (!cls) return ''
    if (cls.schoolId && typeof cls.schoolId === 'object') return cls.schoolId._id || cls.schoolId.id || ''
    return cls.schoolId || ''
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    console.log(`Filter changed: ${name} = ${value}`)
    console.log(`Previous filters:`, filters)
    
    const newFilters = {
      ...filters,
      [name]: value
    }
    if (name === 'schoolId') {
      newFilters.classId = ''
      newFilters.subjectId = ''
    }
    if (name === 'classId') {
      newFilters.subjectId = ''
    }
    console.log(`New filters:`, newFilters)
    
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      schoolId: '',
      classId: '',
      subjectId: '',
      academicYear: '',
      academicTerm: '',
      examType: '',
      dateFrom: '',
      dateTo: ''
    })
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

  const handleLoadMarkForEditing = (mark) => {
    const classId = mark.classId?._id || mark.classId
    if (!classId) {
      setError('Cannot determine class for this record')
      return
    }

    const classInfo = classes.find(cls => cls._id === classId)
    const schoolId =
      mark.classId?.schoolId?._id ||
      mark.schoolId ||
      classInfo?.schoolId?._id ||
      classInfo?.schoolId

    if (schoolId) {
      setSelectedSchool(schoolId)
    }
    setSelectedClassId(classId)

    setExamInfo(prev => ({
      ...prev,
      examType: mark.examType || prev.examType,
      academicYear: mark.academicYear || prev.academicYear,
      academicTerm: mark.academicTerm || prev.academicTerm,
      examDate: mark.examDate ? new Date(mark.examDate).toISOString().split('T')[0] : prev.examDate,
      totalMarks: mark.totalMarks || prev.totalMarks
    }))

    setSuccess('Loaded record into the entry form. Scroll up to review or update marks.')
  }

  const startInlineMarkEdit = (mark) => {
    setEditingMarkId(mark._id)
    setEditingMarkRecord(mark)
    setEditingMarkScore((mark.totalMarks ?? '').toString())
    setError('')
    setSuccess('')
  }

  const cancelInlineMarkEdit = () => {
    setEditingMarkId(null)
    setEditingMarkRecord(null)
    setEditingMarkScore('')
    setEditingMarkLoading(false)
  }

  const handleInlineMarkSave = async () => {
    if (!editingMarkId) return
    const parsedScore = Number(editingMarkScore)
    if (Number.isNaN(parsedScore)) {
      setError('Please enter a valid numeric score.')
      return
    }

    try {
      setEditingMarkLoading(true)
      await marksAPI.updateMarks(editingMarkId, { totalMarks: parsedScore })

      setMarks(prev =>
        prev.map(mark =>
          mark._id === editingMarkId ? { ...mark, totalMarks: parsedScore } : mark
        )
      )

      const editedStudentId = editingMarkRecord?.studentId?._id || editingMarkRecord?.studentId
      const editedClassId = editingMarkRecord?.classId?._id || editingMarkRecord?.classId
      const sameContext =
        editedStudentId &&
        editedClassId === selectedClassId &&
        editingMarkRecord?.academicYear === examInfo.academicYear &&
        editingMarkRecord?.academicTerm === examInfo.academicTerm &&
        editingMarkRecord?.examType === examInfo.examType

      if (sameContext) {
        const combinationKey = getCombinationKey(
          editingMarkRecord?.academicYear,
          editingMarkRecord?.academicTerm,
          editingMarkRecord?.examType
        )
        setMarksEntries(prev => {
          const next = { ...prev }
          const studentEntries = next[editedStudentId] ? { ...next[editedStudentId] } : {}
          studentEntries[combinationKey] = {
            ...(studentEntries[combinationKey] || createEmptyEntry()),
            score: parsedScore.toString(),
            savedScore: parsedScore.toString(),
            savedKey: combinationKey,
            markId: editingMarkId
          }
          next[editedStudentId] = studentEntries
          return next
        })
        setHasPendingChanges(false)
      }

      setSuccess('Mark updated successfully.')
      cancelInlineMarkEdit()
    } catch (err) {
      console.error('Inline update error:', err)
      setError(err.response?.data?.message || 'Failed to update mark.')
    } finally {
      setEditingMarkLoading(false)
    }
  }

  const handleExamInfoChange = (name, value) => {
    setExamInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleExportMarksToCSV = () => {
    if (!marksForDisplay || marksForDisplay.length === 0) {
      setError('No marks available to export with the current filters.')
      return
    }

    const headers = [
      'Student',
      'Class',
      'Subject',
      'Exam Type',
      'Score',
      'Academic Year',
      'Academic Term',
      'Exam Date',
      'School',
      'Teacher'
    ]

    const rows = marksForDisplay.map(mark => [
      mark.studentId?.studentName || mark.studentName || '',
      mark.classId?.className || mark.className || '',
      mark.subjectId?.subjectName || mark.classId?.subjectName || mark.subjectName || '',
      getExamTypeLabel(mark.examType || ''),
      mark.totalMarks ?? '',
      mark.academicYear || '',
      mark.academicTerm || '',
      mark.examDate ? new Date(mark.examDate).toLocaleDateString() : '',
      mark.schoolId?.name || '',
      mark.teacherId?.username || mark.teacherName || ''
    ])

    const escape = (value) => {
      const stringValue = `${value ?? ''}`
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(escape).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `marks-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleScoreChange = (studentId, value) => {
    const combinationKey = getCombinationKey(
      examInfo.academicYear,
      examInfo.academicTerm,
      examInfo.examType
    )
    if (value === '' || Number.isNaN(Number(value))) {
      setMarksEntries(prev => {
        const next = { ...prev }
        const studentEntries = next[studentId] ? { ...next[studentId] } : {}
        const entry = studentEntries[combinationKey]
          ? { ...studentEntries[combinationKey], score: '' }
          : { ...createEmptyEntry(), score: '' }
        studentEntries[combinationKey] = entry
        next[studentId] = studentEntries
        return next
      })
      setHasPendingChanges(true)
      return
    }

    const numericValue = Math.max(0, Math.min(Number(value), Number(examInfo.totalMarks) || 100))

    setMarksEntries(prev => {
      const next = { ...prev }
      const studentEntries = next[studentId] ? { ...next[studentId] } : {}
      const entry = studentEntries[combinationKey]
        ? { ...studentEntries[combinationKey], score: numericValue }
        : { ...createEmptyEntry(), score: numericValue }
      studentEntries[combinationKey] = entry
      next[studentId] = studentEntries
      return next
    })
    setHasPendingChanges(true)
  }

  const applyBulkScore = (mode = 'empty') => {
    const combinationKey = getCombinationKey(
      examInfo.academicYear,
      examInfo.academicTerm,
      examInfo.examType
    )
    if (bulkScore === '' || Number.isNaN(Number(bulkScore))) {
      setError('Enter a valid score before applying the bulk action.')
      return
    }

    const numericValue = Math.max(0, Math.min(Number(bulkScore), Number(examInfo.totalMarks) || 100))
    setMarksEntries(prev => {
      const next = { ...prev }
      classStudents.forEach(student => {
        const studentEntries = next[student._id] ? { ...next[student._id] } : {}
        const currentEntry = studentEntries[combinationKey] || createEmptyEntry()
        if (mode === 'all' || currentEntry.score === '' || currentEntry.score === null) {
          studentEntries[combinationKey] = {
            ...currentEntry,
            score: numericValue
          }
          next[student._id] = studentEntries
        }
      })
      return next
    })
    setHasPendingChanges(true)
  }

  const prepareCommonPayload = () => {
    const selectedClass = classes.find(cls => cls._id === selectedClassId)
    if (!selectedClass) {
      setError('Selected class not found')
      return null
    }

    const schoolId = selectedClass.schoolId?._id || selectedClass.schoolId
    const subjectId = selectedClass.subjectId?._id || selectedClass._id
    const user = getUser()
    const teacherId = user?._id || user?.id || user?.userId || '68cb13d91f1a33763113f0eb'

    return {
      subjectId,
      teacherId,
      classId: selectedClassId,
      examType: examInfo.examType,
      academicYear: examInfo.academicYear,
      academicTerm: examInfo.academicTerm,
      examDate: new Date(examInfo.examDate),
      schoolId: schoolId || '68c547e28a9c12a9210a256f'
    }
  }

  const handleSaveClassMarks = async () => {
    if (!selectedClassId) {
      setError('Please select a class')
      return
    }
    if (!examInfo.academicYear || !examInfo.academicTerm || !examInfo.examType) {
      setError('Select academic year, term and exam type before saving')
      return
    }
    if (!hasPendingChanges) {
      setError('There are no new or updated marks to save.')
      return
    }

    const commonPayload = prepareCommonPayload()
    if (!commonPayload) return

    const createPayloads = []
    const updatePayloads = []
    const activeCombinationKey = getCombinationKey(
      examInfo.academicYear,
      examInfo.academicTerm,
      examInfo.examType
    )

    classStudents.forEach(student => {
      const entry = getEntryForStudent(student._id)
      if (!entry || entry.score === '' || Number.isNaN(Number(entry.score))) {
        return
      }

      const numericScore = Number(entry.score)
      const base = {
        ...commonPayload,
        studentId: student._id,
        totalMarks: numericScore
      }

      if (entry.markId && entry.savedKey === activeCombinationKey) {
        const previousScore = entry.savedScore
        if (previousScore !== '' && Number(previousScore) === numericScore) {
          return
        }
        updatePayloads.push({ markId: entry.markId, payload: base })
      } else {
        createPayloads.push(base)
      }
    })

    if (createPayloads.length === 0 && updatePayloads.length === 0) {
      setError('Please enter marks for at least one student')
      return
    }

    try {
      setMarksSaving(true)
      setError('')
      setSuccess('')

      let createdRecords = []
      if (createPayloads.length > 0) {
        const createdResponse = await marksAPI.createBulkMarks(createPayloads)
        if (Array.isArray(createdResponse)) {
          createdRecords = createdResponse
        }
      }

      let updatedRecords = []
      if (updatePayloads.length > 0) {
        const updateResponses = await Promise.all(
          updatePayloads.map(item =>
            marksAPI.updateMarks(item.markId, item.payload)
          )
        )
        if (Array.isArray(updateResponses)) {
          updatedRecords = updateResponses
        }
      }

      if (createdRecords.length > 0 || updatedRecords.length > 0) {
        setMarksEntries(prev => {
          const next = { ...prev }
          const applyRecord = (record) => {
            const studentId = record?.studentId?._id || record?.studentId
            if (!studentId) return
            const term = record.academicTerm || record.academic_term || examInfo.academicTerm
            const academicYear = record.academicYear || record.academic_year || examInfo.academicYear
            const examType = record.examType || record.exam_type || examInfo.examType
            const combinationKey = getCombinationKey(academicYear, term, examType)
            const studentEntries = next[studentId] ? { ...next[studentId] } : {}
            const entry = studentEntries[combinationKey] || createEmptyEntry()
            const scoreValue = record.totalMarks ?? entry.savedScore ?? entry.score ?? ''
            studentEntries[combinationKey] = {
              ...entry,
              score: scoreValue?.toString(),
              savedScore: scoreValue?.toString(),
              savedKey: combinationKey,
              markId: record._id || entry.markId
            }
            next[studentId] = studentEntries
          }
          createdRecords.forEach(applyRecord)
          updatedRecords.forEach(applyRecord)
          return next
        })
      }

      setSuccess('Marks saved successfully for this class!')
      setHasPendingChanges(false)
      setFilters(prev => ({
        ...prev,
        schoolId: prev.schoolId || selectedSchool || commonPayload.schoolId || '',
        classId: prev.classId || selectedClassId,
        subjectId: prev.subjectId || commonPayload.subjectId || '',
        academicYear: prev.academicYear || examInfo.academicYear
      }))
      await loadMarks()
      await loadExistingMarksForClass()
    } catch (error) {
      console.error('Error saving class marks:', error)
      let errorMessage = 'Failed to save marks. Please try again.'
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      setError(errorMessage)
    } finally {
      setMarksSaving(false)
    }
  }

  const filteredClasses = classes.filter(cls => {
    if (!selectedSchool) return true
    const schoolId = cls.schoolId?._id || cls.schoolId
    return schoolId === selectedSchool
  })

  const selectedClass = classes.find(cls => cls._id === selectedClassId)

  const reviewClassOptions = classes.filter(cls => {
    if (!filters.schoolId) return true
    const schoolId = cls.schoolId?._id || cls.schoolId
    return schoolId === filters.schoolId
  })

  const subjectOptions = useMemo(() => {
    const map = new Map()
    classes.forEach(cls => {
      const subjectId = getSubjectIdFromClass(cls)
      if (!subjectId) return
      const existing = map.get(subjectId) || {
        id: subjectId,
        name: getSubjectNameFromClass(cls),
        classIds: new Set(),
        schoolIds: new Set()
      }
      existing.classIds.add(cls._id)
      const schoolId = getSchoolIdFromClass(cls)
      if (schoolId) existing.schoolIds.add(schoolId)
      map.set(subjectId, existing)
    })
    return Array.from(map.values()).map(option => ({
      ...option,
      classIds: Array.from(option.classIds),
      schoolIds: Array.from(option.schoolIds)
    }))
  }, [classes])

  const filteredSubjectOptions = useMemo(() => {
    return subjectOptions.filter(option => {
      if (filters.schoolId && option.schoolIds.length > 0 && !option.schoolIds.includes(filters.schoolId)) {
        return false
      }
      if (filters.classId && option.classIds.length > 0 && !option.classIds.includes(filters.classId)) {
        return false
      }
      return true
    })
  }, [subjectOptions, filters.schoolId, filters.classId])

  const selectedSubjectName = selectedClass ? getSubjectNameFromClass(selectedClass) : ''
  const activeCombinationKey = useMemo(
    () => getCombinationKey(examInfo.academicYear, examInfo.academicTerm, examInfo.examType),
    [examInfo.academicYear, examInfo.academicTerm, examInfo.examType]
  )

  const getEntryForStudent = (studentId) => {
    if (!marksEntries[studentId]) return createEmptyEntry()
    return marksEntries[studentId][activeCombinationKey] || createEmptyEntry()
  }

  const totalStudentsWithScores = classStudents.filter(student => {
    const entry = getEntryForStudent(student._id)
    return entry.savedScore !== '' && !Number.isNaN(Number(entry.savedScore))
  }).length

  const pendingStudents = classStudents.filter(student => {
    const entry = getEntryForStudent(student._id)
    return entry.score !== entry.savedScore
  }).length

  const studentSearchValue = studentSearchTerm.trim().toLowerCase()
  const filteredClassStudents = studentSearchValue
    ? classStudents.filter(student => {
        const name = (student.studentName || '').toLowerCase()
        const id = (student._id || '').toLowerCase()
        return name.includes(studentSearchValue) || id.includes(studentSearchValue)
      })
    : classStudents

  const reviewSearchValue = reviewSearchTerm.trim().toLowerCase()
  const marksForDisplay = reviewSearchValue
    ? marks.filter(mark => {
        const haystack = [
          mark.studentId?.studentName,
          mark.classId?.className,
          mark.subjectId?.subjectName,
          mark.academicYear,
          mark.academicTerm,
          mark.schoolId?.name,
          getExamTypeLabel(mark.examType)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(reviewSearchValue)
      })
    : marks

  const lookupSchoolName = (id) => {
    if (!id) return 'Any school'
    return schoolOptions.find(option => option._id === id)?.name || id
  }

  const lookupClassName = (id) => {
    if (!id) return 'Any class'
    return classes.find(cls => cls._id === id)?.className || id
  }

  const lookupSubjectName = (id) => {
    if (!id) return 'Any subject'
    return subjectOptions.find(option => option.id === id)?.name || id
  }

  // Group marks by Academic Term and Exam Type
  const groupMarksByTermAndExam = (marksArray) => {
    const grouped = {}
    marksArray.forEach(mark => {
      const term = mark.academicTerm || 'UNKNOWN_TERM'
      const examType = mark.examType || 'UNKNOWN_EXAM'
      const key = `${term}_${examType}`
      
      if (!grouped[key]) {
        grouped[key] = {
          term,
          examType,
          marks: []
        }
      }
      grouped[key].marks.push(mark)
    })
    
    // Sort groups: by term order, then by exam type order
    const termOrder = { 'FIRST_TERM': 1, 'SECOND_TERM': 2, 'THIRD_TERM': 3 }
    const examOrder = { 'BEGINNING_TERM': 1, 'MIDTERM': 2, 'ENDTERM': 3 }
    
    return Object.values(grouped).sort((a, b) => {
      const termDiff = (termOrder[a.term] || 999) - (termOrder[b.term] || 999)
      if (termDiff !== 0) return termDiff
      return (examOrder[a.examType] || 999) - (examOrder[b.examType] || 999)
    })
  }

const getTermLabel = (term) => {
  const labels = {
    'FIRST_TERM': 'First Term',
    'SECOND_TERM': 'Second Term',
    'THIRD_TERM': 'Third Term'
  }
  if (!term) return 'Unspecified Term'
  return labels[term] || term.replace('_', ' ')
}

const groupedMarks = groupMarksByTermAndExam(marksForDisplay)

const termExamOptions = useMemo(() => {
  const seen = new Set()
  const combos = []
  marks.forEach(mark => {
    const term = mark.academicTerm || ''
    const examType = mark.examType || ''
    const key = `${term || 'ALL'}__${examType || 'ALL'}`
    if (!seen.has(key)) {
      combos.push({
        key,
        term,
        examType,
        label:
          term || examType
            ? `${getTermLabel(term)} • ${getExamTypeLabel(examType)}`
            : 'Unspecified term/exam'
      })
      seen.add(key)
    }
  })
  return combos
}, [marks])

const filterLabelMap = {
    schoolId: 'School',
    classId: 'Class',
    subjectId: 'Subject',
    academicYear: 'Academic Year',
    academicTerm: 'Term',
    examType: 'Exam Type',
    dateFrom: 'From',
    dateTo: 'To'
  }

  const formatFilterValue = (key, value) => {
    if (!value) return ''
    if (key === 'schoolId') return lookupSchoolName(value)
    if (key === 'classId') return lookupClassName(value)
    if (key === 'subjectId') return lookupSubjectName(value)
    if (key === 'academicTerm') return getTermLabel(value)
    if (key === 'examType') return getExamTypeLabel(value)
    if (key === 'dateFrom' || key === 'dateTo') {
      try {
        return new Date(value).toLocaleDateString()
      } catch (err) {
        return value
      }
    }
    return value
  }

  const activeFilters = Object.entries(filters).filter(([, value]) => value && value.toString().trim() !== '')
  const activeFilterCount = activeFilters.length

  const handleRemoveFilterChip = (key) => {
    setFilters(prev => ({
      ...prev,
      [key]: ''
    }))
  }

  const toggleGroupExpansion = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true)
    }))
  }

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

        {/* Class Marks Entry */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Class Marks Entry</h2>
              <p className="text-slate-300 text-sm mt-1">
                Choose a school and class, then record final-term marks for every student. The aggregate defaults to 100%.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadExistingMarksForClass}
                disabled={!selectedClassId || classMarksLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {classMarksLoading ? 'Refreshing...' : 'Refresh Class Marks'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">School</label>
              <select
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value)
                  setSelectedClassId('')
                  setClassStudents([])
                  setMarksEntries({})
                }}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select School</option>
                {schoolOptions.map(school => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!selectedSchool && filteredClasses.length === 0}
              >
                <option value="">Select Class</option>
                {filteredClasses.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className} • {cls.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={selectedClassId ? selectedSubjectName || 'Subject not set' : 'Select a class to view subject'}
                disabled
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none"
              />
              <p className="text-slate-400 text-xs mt-1">
                Subject follows the class setup. Update the class if you need a different subject.
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Exam Type</label>
              <select
                value={examInfo.examType}
                onChange={(e) => handleExamInfoChange('examType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Exam Type</option>
                {examTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Academic Year</label>
              <select
                value={examInfo.academicYear}
                onChange={(e) => handleExamInfoChange('academicYear', e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Year</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Academic Term</label>
              <select
                value={examInfo.academicTerm}
                onChange={(e) => handleExamInfoChange('academicTerm', e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Term</option>
                {academicTerms.map(term => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Exam Date</label>
              <input
                type="date"
                value={examInfo.examDate}
                onChange={(e) => handleExamInfoChange('examDate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Total Marks</label>
              <input
                type="number"
                min="1"
                max="100"
                value={examInfo.totalMarks}
                onChange={(e) => handleExamInfoChange('totalMarks', Number(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-slate-400 text-xs mt-1">Aggregate is 100% by default</p>
            </div>
          </div>

        <div className='bg-slate-600 rounded-lg p-4 mb-4 space-y-3'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='text-slate-300 text-sm'>
              {selectedClassId
                ? `${filteredClassStudents.length}/${classStudents.length} students visible · ${totalStudentsWithScores}/${classStudents.length} saved`
                : 'Select a class to load the student list'}
            </div>
            {selectedClassId && (
              <div className='text-slate-300 text-sm'>
                <span className='text-white font-semibold'>{pendingStudents}</span> pending save
              </div>
            )}
          </div>

          {selectedClassId && classStudents.length > 0 && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-slate-300 text-xs font-semibold tracking-wide uppercase mb-2'>
                  Search Students
                </label>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder='Type a name or ID…'
                    className='flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                  {studentSearchTerm && (
                    <button
                      onClick={() => setStudentSearchTerm('')}
                      className='px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm'
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className='block text-slate-300 text-xs font-semibold tracking-wide uppercase mb-2'>
                  Quick Fill Score
                </label>
                <div className='flex flex-col sm:flex-row gap-2'>
                  <input
                    type='number'
                    min='0'
                    max={examInfo.totalMarks}
                    value={bulkScore}
                    onChange={(e) => setBulkScore(e.target.value)}
                    placeholder='e.g., 75'
                    className='px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:flex-1'
                  />
                  <div className='flex gap-2'>
                    <button
                      onClick={() => applyBulkScore('empty')}
                      className='px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold'
                    >
                      Fill Empty
                    </button>
                    <button
                      onClick={() => applyBulkScore('all')}
                      className='px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold'
                    >
                      Fill All
                    </button>
                  </div>
                </div>
                <p className='text-xs text-slate-400 mt-1'>
                  Values stay within 0 – {examInfo.totalMarks}. "Fill Empty" keeps existing marks intact.
                </p>
              </div>
            </div>
          )}
          </div>

          {classStudentsLoading ? (
            <div className="bg-slate-600 rounded-lg p-6 text-center text-slate-300">
              Loading students...
            </div>
          ) : !selectedClassId ? (
            <div className="bg-slate-600 rounded-lg p-6 text-center text-slate-300">
              Please select a school and class to begin entering marks.
            </div>
          ) : classStudents.length === 0 ? (
            <div className="bg-slate-600 rounded-lg p-6 text-center text-slate-300">
              No students found for this class. Add students first.
            </div>
          ) : !examInfo.academicYear || !examInfo.academicTerm || !examInfo.examType ? (
            <div className="bg-slate-600 rounded-lg p-6 text-center text-slate-300">
              Select academic year, term and exam type to start entering marks.
            </div>
          ) : filteredClassStudents.length === 0 ? (
            <div className="bg-slate-600 rounded-lg p-6 text-center text-slate-300">
              No students match the current search.
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-600 rounded-lg">
              <table className="min-w-full divide-y divide-slate-500">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Marks (0 - {examInfo.totalMarks})</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-600 divide-y divide-slate-500">
                  {filteredClassStudents.map((student, index) => {
                    const entry = getEntryForStudent(student._id)
                    const saved = Boolean(entry.markId)
                    return (
                      <tr
                        key={student._id}
                        className={`hover:bg-slate-500 transition-colors ${!saved ? 'bg-slate-700/60' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{student.studentName}</div>
                          <div className="text-xs text-slate-400">{student._id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={examInfo.totalMarks}
                            value={entry.score}
                            onChange={(e) => handleScoreChange(student._id, e.target.value)}
                            className="w-32 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {entry.savedScore && entry.savedScore !== entry.score && (
                            <p className="text-xs text-slate-400 mt-1">
                              Saved: {entry.savedScore}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            saved ? 'bg-green-600 text-white' : 'bg-slate-500 text-white'
                          }`}>
                            {saved ? (entry.score !== entry.savedScore ? 'Pending Save' : 'Saved') : 'Not saved'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="flex justify-end space-x-3 mt-6 p-4 border-t border-slate-500">
                <button
                  onClick={() => {
                    const combinationKey = getCombinationKey(
                      examInfo.academicYear,
                      examInfo.academicTerm,
                      examInfo.examType
                    )
                    setMarksEntries(prev => {
                      const next = { ...prev }
                      Object.keys(next).forEach(studentId => {
                        const studentEntries = next[studentId]
                        if (studentEntries && studentEntries[combinationKey]) {
                          next[studentId] = {
                            ...studentEntries,
                            [combinationKey]: {
                              ...studentEntries[combinationKey],
                              score: ''
                            }
                          }
                        }
                      })
                      return next
                    })
                    setSuccess('')
                    setHasPendingChanges(true)
                  }}
                  className="px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Clear Marks
                </button>
                <button
                  onClick={handleSaveClassMarks}
                  disabled={marksSaving || !hasPendingChanges}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {marksSaving ? 'Saving...' : 'Save Class Marks'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className='bg-slate-700 rounded-lg p-6 mb-8'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
            <div>
              <h3 className='text-lg font-semibold text-white'>Review Filters</h3>
              <p className='text-slate-300 text-sm'>
                Combine school, academic year, term, and date filters to focus on a specific assessment window.
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-slate-300 text-sm'>
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} applied
              </span>
              <button
                onClick={clearFilters}
                className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors'
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div>
              <label className='block text-white text-sm font-medium mb-2'>School</label>
              <select
                name='schoolId'
                value={filters.schoolId}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All schools</option>
                {schoolOptions.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-white text-sm font-medium mb-2'>Class</label>
              <select
                name='classId'
                value={filters.classId}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All classes</option>
                {reviewClassOptions.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-white text-sm font-medium mb-2'>Subject</label>
              <select
                name='subjectId'
                value={filters.subjectId}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All subjects</option>
                {filteredSubjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-white text-sm font-medium mb-2'>Academic Year</label>
              <select
                name='academicYear'
                value={filters.academicYear}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-white text-sm font-medium mb-2'>Academic Term</label>
              <select
                name='academicTerm'
                value={filters.academicTerm}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All terms</option>
                {academicTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-white text-sm font-medium mb-2'>Exam Type</label>
              <select
                name='examType'
                value={filters.examType}
                onChange={handleFilterChange}
                className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              >
                <option value=''>All exam types</option>
                {examTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid grid-cols-2 gap-3'>
            <div>
                <label className='block text-white text-sm font-medium mb-2'>Date from</label>
              <input
                  type='date'
                  name='dateFrom'
                value={filters.dateFrom}
                onChange={handleFilterChange}
                  className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div>
                <label className='block text-white text-sm font-medium mb-2'>Date to</label>
              <input
                  type='date'
                  name='dateTo'
                value={filters.dateTo}
                onChange={handleFilterChange}
                  className='w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
              />
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {activeFilters.map(([key, value]) => (
                <span
                  key={`${key}-${value}`}
                  className='inline-flex items-center bg-slate-600 text-white text-xs px-3 py-1 rounded-full gap-2'
                >
                  <span>
                    {filterLabelMap[key]}: {formatFilterValue(key, value)}
                  </span>
            <button
                    onClick={() => handleRemoveFilterChip(key)}
                    className='text-slate-300 hover:text-white'
            >
                    ×
            </button>
                </span>
              ))}
          </div>
          )}
        </div>

        {termExamOptions.length > 0 && (
          <div className='bg-slate-700 rounded-lg p-6 mb-8'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <h4 className='text-white text-sm font-semibold'>Term & Exam Quick Filter</h4>
                <p className='text-slate-400 text-xs'>
                  Jump straight to a specific term/exam or show all recorded results.
                </p>
              </div>
              <div className='flex flex-wrap gap-2 mt-2'>
                <button
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      academicTerm: '',
                      examType: ''
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    !filters.academicTerm && !filters.examType
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                  }`}
                >
                  All terms & exams
                </button>
                {termExamOptions.map(option => {
                  const isActive =
                    filters.academicTerm === option.term && filters.examType === option.examType
                  return (
                    <button
                      key={option.key}
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          academicTerm: option.term,
                          examType: option.examType
                        }))
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Marks Table */}
        <div className='bg-slate-700 rounded-lg p-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4'>
            <div>
              <h3 className='text-lg font-semibold text-white'>
                Marks Records ({marksForDisplay.length} shown)
            </h3>
              <p className='text-slate-400 text-sm'>
                Matches the current filters. Use the quick search to focus on specific students, classes, or subjects.
              </p>
              </div>
            <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
              <div className='flex flex-1 gap-2'>
                <input
                  type='text'
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  placeholder='Search by student, class, subject…'
                  className='flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500'
                />
                {reviewSearchTerm && (
                  <button
                    onClick={() => setReviewSearchTerm('')}
                    className='px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm'
                  >
                    Clear
                  </button>
            )}
          </div>
              <button
                onClick={handleExportMarksToCSV}
                className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors'
              >
                Download CSV
              </button>
            </div>
          </div>
          {loading && (
            <div className='flex items-center space-x-2 text-blue-400 text-sm mb-4'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400'></div>
              <span>Loading…</span>
            </div>
          )}

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
          ) : groupedMarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📊</div>
              <h4 className="text-xl font-medium text-white mb-2">No Marks Found</h4>
              <p className="text-slate-400 mb-6">
                No marks records match the current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedMarks.map((group, groupIndex) => {
                const groupKey = `${group.term}_${group.examType}`
                const numericScores = group.marks
                  .map((mark) => Number(mark.totalMarks))
                  .filter((score) => !Number.isNaN(score))
                const averageScore = numericScores.length
                  ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length)
                  : 0
                const highestScore = numericScores.length ? Math.max(...numericScores) : 0
                const lowestScore = numericScores.length ? Math.min(...numericScores) : 0
                const isExpanded = expandedGroups[groupKey] ?? true

                return (
                  <div key={`${groupKey}_${groupIndex}`} className="bg-slate-600 rounded-lg p-6">
                    {/* Group Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 pb-4 border-b border-slate-500">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">
                          {getTermLabel(group.term)} • {getExamTypeLabel(group.examType)}
                        </h4>
                        <p className="text-slate-300 text-sm">
                          {group.marks.length} {group.marks.length === 1 ? 'record' : 'records'} · Academic Year:{' '}
                          {group.marks[0]?.academicYear || 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {getTermLabel(group.term)}
                        </span>
                        <span className="inline-flex items-center bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {getExamTypeLabel(group.examType)}
                        </span>
                        <span className="inline-flex items-center bg-slate-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Avg {averageScore}%
                        </span>
                        <span className="inline-flex items-center bg-slate-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          High {highestScore}%
                        </span>
                        <span className="inline-flex items-center bg-slate-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Low {lowestScore}%
                        </span>
                        <button
                          onClick={() => toggleGroupExpansion(groupKey)}
                          className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          {isExpanded ? 'Hide Table' : 'Show Table'}
                        </button>
                      </div>
                    </div>

                    {/* Table for this group */}
                    {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                            <tr className="border-b border-slate-500">
                              <th className="pb-3 text-white font-medium">#</th>
                      <th className="pb-3 text-white font-medium">Student Name</th>
                      <th className="pb-3 text-white font-medium">Class</th>
                      <th className="pb-3 text-white font-medium">Subject</th>
                      <th className="pb-3 text-white font-medium">Total Marks</th>
                      <th className="pb-3 text-white font-medium">Exam Date</th>
                              <th className="pb-3 text-white font-medium">School</th>
                      <th className="pb-3 text-white font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                            {group.marks.map((mark, index) => {
                              const isEditing = editingMarkId === mark._id
                              return (
                                <tr key={mark._id} className="border-b border-slate-500 hover:bg-slate-500 transition-colors">
                                  <td className="py-3 text-slate-300">{index + 1}</td>
                                  <td className="py-3 text-white font-medium">
                          {mark.studentId?.studentName || mark.studentName || mark.student?.studentName || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-300">
                          {mark.classId?.className || mark.className || mark.class?.className || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-300">
                          {mark.subjectId?.subjectName || mark.classId?.subjectName || mark.subjectName || mark.subject?.subjectName || 'N/A'}
                        </td>
                        <td className="py-3">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editingMarkScore}
                                        onChange={(e) => setEditingMarkScore(e.target.value)}
                                        className="w-24 px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                      />
                                    ) : (
                          <div className="flex items-center space-x-2">
                                        <span className="text-white font-medium text-lg">{mark.totalMarks ?? '—'}</span>
                                        <span className="text-slate-400 text-xs">/ 100</span>
                          </div>
                                    )}
                        </td>
                        <td className="py-3 text-slate-300">
                          {new Date(mark.examDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-slate-300">
                                    {mark.schoolId?.name || mark.schoolName || 'N/A'}
                        </td>
                        <td className="py-3">
                                    {isEditing ? (
                                      <div className="flex flex-wrap gap-2">
                            <button
                                          onClick={handleInlineMarkSave}
                                          disabled={editingMarkLoading}
                                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                          {editingMarkLoading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                          onClick={cancelInlineMarkEdit}
                                          disabled={editingMarkLoading}
                                          className="bg-slate-500 hover:bg-slate-600 disabled:bg-slate-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          onClick={() => startInlineMarkEdit(mark)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                          Quick Edit
                                        </button>
                                        <button
                                          onClick={() => handleLoadMarkForEditing(mark)}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                          Load in Form
                            </button>
                            <button
                              onClick={() => handleDeleteMarks(mark._id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                                    )}
                        </td>
                      </tr>
                              )
                            })}
                  </tbody>
                </table>
              </div>
                    )}
                  </div>
                )
              })}
                </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Marks