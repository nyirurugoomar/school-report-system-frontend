import api from './axios'

export const getDashboardStats = async () => {
  try {
    console.log('Making dashboard stats request to:', `${api.defaults.baseURL}/analytics/dashboard`);
    const response = await api.get('/analytics/dashboard');
    console.log('Dashboard stats response:', response);
    return response.data;
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    throw error;
  }
};

export const getClassPerformance = async () => {
  try {
    console.log('Making class performance request to:', `${api.defaults.baseURL}/analytics/class-performance`);
    const response = await api.get('/analytics/class-performance');
    console.log('Class performance response:', response);
    return response.data;
  } catch (error) {
    console.error('Class performance API error:', error);
    throw error;
  }
};

export const getAttendanceTrends = async (startDate, endDate) => {
  try {
    console.log('Making attendance trends request to:', `${api.defaults.baseURL}/analytics/attendance-trends`);
    const response = await api.get('/analytics/attendance-trends', {
      params: { startDate, endDate }
    });
    console.log('Attendance trends response:', response);
    return response.data;
  } catch (error) {
    console.error('Attendance trends API error:', error);
    throw error;
  }
};

export const getStudentPerformance = async (studentId) => {
  try {
    console.log('Making student performance request to:', `${api.defaults.baseURL}/analytics/student-performance/${studentId}`);
    const response = await api.get(`/analytics/student-performance/${studentId}`);
    console.log('Student performance response:', response);
    return response.data;
  } catch (error) {
    console.error('Student performance API error:', error);
    throw error;
  }
};