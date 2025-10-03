import api from './axios'

export const createMarks = async (marksData) => {
  try {
    console.log('Making create marks request to:', `${api.defaults.baseURL}/marks`);
    console.log('Marks data being sent:', marksData);
    const response = await api.post('/marks', marksData);
    console.log('Create marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Create marks API error:', error);
    throw error;
  }
};

export const createBulkMarks = async (marksRecords) => {
  try {
    console.log('Making bulk marks request to:', `${api.defaults.baseURL}/marks/bulk`);
    console.log('Bulk marks data being sent:', marksRecords);
    
    // Send array directly or as records property based on backend expectation
    const response = await api.post('/marks/bulk', marksRecords);
    console.log('Bulk marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Bulk marks API error:', error);
    throw error;
  }
};

export const getMarks = async (filters = {}) => {
  try {
    console.log('Making get marks request to:', `${api.defaults.baseURL}/marks`);
    console.log('Filters being sent:', filters);
    
    // Clean filters before sending to API
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined && value.toString().trim() !== '') {
        acc[key] = value.toString().trim();
      }
      return acc;
    }, {});
    
    console.log('Clean filters being sent:', cleanFilters);
    
    const response = await api.get('/marks', { params: cleanFilters });
    console.log('Get marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks API error:', error);
    throw error;
  }
};

// Get marks with enhanced filtering (matches backend findAllWithDetails)
export const getMarksWithFilters = async (filters = {}) => {
  try {
    console.log('Making get marks with filters request to:', `${api.defaults.baseURL}/marks`);
    console.log('Enhanced filters being sent:', filters);
    
    // Clean and format filters for backend
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined && value.toString().trim() !== '') {
        // Format date filters properly
        if (key === 'dateFrom' || key === 'dateTo') {
          acc[key] = new Date(value).toISOString();
        } else {
          acc[key] = value.toString().trim();
        }
      }
      return acc;
    }, {});
    
    console.log('Clean enhanced filters being sent:', cleanFilters);
    
    const response = await api.get('/marks', { params: cleanFilters });
    console.log('Get marks with filters response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks with filters API error:', error);
    throw error;
  }
};

// Get teacher's own marks
export const getMyMarks = async () => {
  try {
    console.log('Making get my marks request to:', `${api.defaults.baseURL}/marks/teacher/my-marks`);
    const response = await api.get('/marks/teacher/my-marks');
    console.log('Get my marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Get my marks API error:', error);
    throw error;
  }
};

// Get marks by class and subject
export const getMarksByClassAndSubject = async (classId, subjectId) => {
  try {
    console.log('Making get marks by class and subject request to:', `${api.defaults.baseURL}/marks/class/${classId}/subject/${subjectId}`);
    const response = await api.get(`/marks/class/${classId}/subject/${subjectId}`);
    console.log('Get marks by class and subject response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by class and subject API error:', error);
    throw error;
  }
};

export const getMarkById = async (marksId) => {
  try {
    console.log('Making get mark by ID request to:', `${api.defaults.baseURL}/marks/${marksId}`);
    const response = await api.get(`/marks/${marksId}`);
    console.log('Get mark by ID response:', response);
    return response.data;
  } catch (error) {
    console.error('Get mark by ID API error:', error);
    throw error;
  }
};

// Get mark details with populated data
export const getMarkDetails = async (marksId) => {
  try {
    console.log('Making get mark details request to:', `${api.defaults.baseURL}/marks/${marksId}/details`);
    const response = await api.get(`/marks/${marksId}/details`);
    console.log('Get mark details response:', response);
    return response.data;
  } catch (error) {
    console.error('Get mark details API error:', error);
    throw error;
  }
};

export const getMarksByClass = async (classId, filters = {}) => {
  try {
    // Filter out empty strings and null values to prevent MongoDB ObjectId casting errors
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const url = `/marks/class/${classId}`;
    console.log('Making get marks by class request to:', `${api.defaults.baseURL}${url}`);
    console.log('Original filters:', filters);
    console.log('Clean filters:', cleanFilters);
    const response = await api.get(url, { params: cleanFilters });
    console.log('Get marks by class response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by class API error:', error);
    throw error;
  }
};

export const getMarksByStudent = async (studentId) => {
  try {
    console.log('Making get marks by student request to:', `${api.defaults.baseURL}/marks/student/${studentId}`);
    const response = await api.get(`/marks/student/${studentId}`);
    console.log('Get marks by student response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by student API error:', error);
    throw error;
  }
};

export const updateMarks = async (marksId, marksData) => {
  try {
    console.log('Making update marks request to:', `${api.defaults.baseURL}/marks/${marksId}`);
    console.log('Update marks data:', marksData);
    const response = await api.put(`/marks/${marksId}`, marksData);
    console.log('Update marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Update marks API error:', error);
    throw error;
  }
};

export const deleteMarks = async (marksId) => {
  try {
    console.log('Making delete marks request to:', `${api.defaults.baseURL}/marks/${marksId}`);
    const response = await api.delete(`/marks/${marksId}`);
    console.log('Delete marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Delete marks API error:', error);
    throw error;
  }
};

export const getMarksSummary = async (classId, examType = null, academicYear = null, academicTerm = null) => {
  try {
    let url = `/marks/class/${classId}/summary`;
    const params = {};
    
    // Only add parameters if they are not empty strings or null
    if (examType && examType !== '') params.examType = examType;
    if (academicYear && academicYear !== '') params.academicYear = academicYear;
    if (academicTerm && academicTerm !== '') params.academicTerm = academicTerm;
    
    console.log('Making get marks summary request to:', `${api.defaults.baseURL}${url}`);
    console.log('Summary params:', params);
    const response = await api.get(url, { params });
    console.log('Get marks summary response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks summary API error:', error);
    throw error;
  }
};

// Enhanced marks analytics and reporting
export const getMarksAnalytics = async (filters = {}) => {
  try {
    console.log('Making get marks analytics request to:', `${api.defaults.baseURL}/marks`);
    console.log('Analytics filters being sent:', filters);
    
    const response = await api.get('/marks', { params: filters });
    console.log('Get marks analytics response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks analytics API error:', error);
    throw error;
  }
};

// Get marks by date range
export const getMarksByDateRange = async (dateFrom, dateTo, additionalFilters = {}) => {
  try {
    console.log('Making get marks by date range request to:', `${api.defaults.baseURL}/marks`);
    
    const filters = {
      dateFrom,
      dateTo,
      ...additionalFilters
    };
    
    console.log('Date range filters being sent:', filters);
    const response = await api.get('/marks', { params: filters });
    console.log('Get marks by date range response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by date range API error:', error);
    throw error;
  }
};

// Get marks by academic year and term
export const getMarksByAcademicPeriod = async (academicYear, academicTerm, additionalFilters = {}) => {
  try {
    console.log('Making get marks by academic period request to:', `${api.defaults.baseURL}/marks`);
    
    const filters = {
      academicYear,
      academicTerm,
      ...additionalFilters
    };
    
    console.log('Academic period filters being sent:', filters);
    const response = await api.get('/marks', { params: filters });
    console.log('Get marks by academic period response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by academic period API error:', error);
    throw error;
  }
};

// Get marks by exam type
export const getMarksByExamType = async (examType, additionalFilters = {}) => {
  try {
    console.log('Making get marks by exam type request to:', `${api.defaults.baseURL}/marks`);
    
    const filters = {
      examType,
      ...additionalFilters
    };
    
    console.log('Exam type filters being sent:', filters);
    const response = await api.get('/marks', { params: filters });
    console.log('Get marks by exam type response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks by exam type API error:', error);
    throw error;
  }
};