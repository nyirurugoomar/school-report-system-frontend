import api from './axios'

export const createAttendance = async (attendanceData) => {
  try {
    console.log('Making create attendance request to:', `${api.defaults.baseURL}/attendance`);
    console.log('Attendance data being sent:', attendanceData);
    const response = await api.post('/attendance', attendanceData);
    console.log('Create attendance response:', response);
    return response.data;
  } catch (error) {
    console.error('Create attendance API error:', error);
    throw error;
  }
};

export const createBulkAttendance = async (attendanceRecords) => {
  try {
    console.log('Making bulk attendance request to:', `${api.defaults.baseURL}/attendance/bulk`);
    console.log('Bulk attendance data being sent:', attendanceRecords);
    const response = await api.post('/attendance/bulk', { records: attendanceRecords });
    console.log('Bulk attendance response:', response);
    return response.data;
  } catch (error) {
    console.error('Bulk attendance API error:', error);
    throw error;
  }
};

export const getAttendanceRecords = async (filters = {}) => {
  try {
    // Filter out empty strings and null values to prevent MongoDB ObjectId casting errors
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    console.log('Making get attendance records request to:', `${api.defaults.baseURL}/attendance`);
    console.log('Original filters:', filters);
    console.log('Clean filters:', cleanFilters);
    const response = await api.get('/attendance', { params: cleanFilters });
    console.log('Get attendance records response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance records API error:', error);
    throw error;
  }
};

export const getAttendanceByClass = async (classId, date = null) => {
    try {
      const url = date 
        ? `/attendance/class/${classId}?date=${date}`
        : `/attendance/class/${classId}`;
      
      console.log('Making get attendance by class request to:', `${api.defaults.baseURL}${url}`);
      const response = await api.get(url);
      console.log('Get attendance by class response:', response);
      return response.data;
    } catch (error) {
      console.error('Get attendance by class API error:', error);
      throw error;
    }
  };

export const getAttendanceByStudent = async (studentId) => {
  try {
    console.log('Making get attendance by student request to:', `${api.defaults.baseURL}/attendance/student/${studentId}`);
    const response = await api.get(`/attendance/student/${studentId}`);
    console.log('Get attendance by student response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance by student API error:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (classId, date = null) => {
  try {
    const url = date 
      ? `/attendance/class/${classId}/summary?date=${date}`
      : `/attendance/class/${classId}/summary`;
    
    console.log('Making get attendance summary request to:', `${api.defaults.baseURL}${url}`);
    const response = await api.get(url);
    console.log('Get attendance summary response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance summary API error:', error);
    throw error;
  }
};

export const updateAttendance = async (attendanceId, attendanceData) => {
  try {
    console.log('Making update attendance request to:', `${api.defaults.baseURL}/attendance/${attendanceId}`);
    console.log('Update attendance data:', attendanceData);
    const response = await api.put(`/attendance/${attendanceId}`, attendanceData);
    console.log('Update attendance response:', response);
    return response.data;
  } catch (error) {
    console.error('Update attendance API error:', error);
    throw error;
  }
};

export const deleteAttendance = async (attendanceId) => {
  try {
    console.log('Making delete attendance request to:', `${api.defaults.baseURL}/attendance/${attendanceId}`);
    const response = await api.delete(`/attendance/${attendanceId}`);
    console.log('Delete attendance response:', response);
    return response.data;
  } catch (error) {
    console.error('Delete attendance API error:', error);
    throw error;
  }
};