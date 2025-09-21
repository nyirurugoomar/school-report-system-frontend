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
    // Validate that all required fields are present and not empty
    const validatedMarks = marksRecords.map((mark, index) => {
      // Check for required fields
      const requiredFields = ['studentId', 'subjectId', 'teacherId', 'classId', 'schoolId'];
      const missingFields = requiredFields.filter(field => !mark[field] || mark[field].trim() === '');
      
      if (missingFields.length > 0) {
        throw new Error(`Mark ${index + 1} is missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate ObjectId format (basic check - should be 24 character hex string)
      const objectIdFields = ['studentId', 'subjectId', 'teacherId', 'classId', 'schoolId'];
      const invalidObjectIds = objectIdFields.filter(field => {
        const value = mark[field];
        return !/^[0-9a-fA-F]{24}$/.test(value);
      });
      
      if (invalidObjectIds.length > 0) {
        throw new Error(`Mark ${index + 1} has invalid ObjectId format for fields: ${invalidObjectIds.join(', ')}`);
      }
      
      return mark;
    });
    
    console.log('Making bulk marks request to:', `${api.defaults.baseURL}/marks/bulk`);
    console.log('Validated marks data being sent:', validatedMarks);
    const response = await api.post('/marks/bulk', { marks: validatedMarks });
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
    
    // Call the correct endpoint: /marks (not /marks/all)
    const response = await api.get('/marks', { params: cleanFilters });
    console.log('Get marks response:', response);
    return response.data;
  } catch (error) {
    console.error('Get marks API error:', error);
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

// Add this test function to debug
export const testMarksEndpoint = async () => {
  try {
    console.log('Testing marks endpoint...');
    const response = await api.get('/marks/test');
    console.log('Test endpoint response:', response);
    return response.data;
  } catch (error) {
    console.error('Test endpoint error:', error);
    throw error;
  }
};