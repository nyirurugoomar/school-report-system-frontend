import api from './axios'

export const getAttendanceReport = async (filters = {}) => {
  try {
    console.log('Making attendance report request to:', `${api.defaults.baseURL}/reports/attendance`);
    console.log('Attendance report filters:', filters);
    const response = await api.get('/reports/attendance', {
      params: filters
    });
    console.log('Attendance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Attendance report API error:', error);
    throw error;
  }
};

export const getClassPerformanceReport = async (classId) => {
  try {
    console.log('Making class performance report request to:', `${api.defaults.baseURL}/reports/class-performance/${classId}`);
    const response = await api.get(`/reports/class-performance/${classId}`);
    console.log('Class performance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Class performance report API error:', error);
    throw error;
  }
};

export const getStudentReport = async (studentId) => {
  try {
    console.log('Making student report request to:', `${api.defaults.baseURL}/reports/student/${studentId}`);
    const response = await api.get(`/reports/student/${studentId}`);
    console.log('Student report response:', response);
    return response.data;
  } catch (error) {
    console.error('Student report API error:', error);
    throw error;
  }
};

// Export functions for generating downloadable reports
export const exportAttendanceReport = async (filters = {}) => {
  try {
    console.log('Exporting attendance report with filters:', filters);
    const response = await api.get('/reports/attendance', {
      params: { ...filters, export: true },
      responseType: 'blob' // For file downloads
    });
    return response.data;
  } catch (error) {
    console.error('Export attendance report error:', error);
    throw error;
  }
};

export const exportClassReport = async (classId) => {
  try {
    console.log('Exporting class report for class:', classId);
    const response = await api.get(`/reports/class-performance/${classId}`, {
      params: { export: true },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Export class report error:', error);
    throw error;
  }
};