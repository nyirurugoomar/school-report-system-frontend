import api from './axios'

export const signin = async (credentials) => {
  try {
    console.log('Making signin request to:', `${api.defaults.baseURL}/auth/signin`);
    console.log('Credentials being sent:', credentials);
    const response = await api.post('/auth/signin', credentials);
    console.log('Signin response:', response);
    return response.data;
  } catch (error) {
    console.error('Signin API error:', error);
    throw error;
  }
};

export const signup = async (userData) => {
  try {
    console.log('Making signup request to:', `${api.defaults.baseURL}/auth/signup`);
    console.log('User data being sent:', userData);
    const response = await api.post('/auth/signup', userData);
    console.log('Signup response:', response);
    return response.data;
  } catch (error) {
    console.error('Signup API error:', error);
    throw error;
  }
};

export const changePassword = async (changePasswordData) => {
  try {
    console.log('Making change password request to:', `${api.defaults.baseURL}/auth/change-password`);
    console.log('Change password data being sent:', { oldPassword: '***', newPassword: '***' });
    const response = await api.put('/auth/change-password', changePasswordData);
    console.log('Change password response:', response);
    return response.data;
  } catch (error) {
    console.error('Change password API error:', error);
    throw error;
  }
};

export const createAdmin = async (adminData) => {
    try {
      console.log('Making create admin request to:', `${api.defaults.baseURL}/auth/create-admin`);
      console.log('Admin data being sent:', adminData);
      console.log('Password field:', adminData.password);
      console.log('Confirm password field:', adminData.confirmPassword);
      console.log('Password type:', typeof adminData.password);
      console.log('Confirm password type:', typeof adminData.confirmPassword);
      console.log('Passwords match:', adminData.password === adminData.confirmPassword);
      
      const response = await api.post('/auth/create-admin', adminData);
      console.log('Create admin response:', response);
      return response.data;
    } catch (error) {
      console.error('Create admin API error:', error);
      throw error;
    }
  };

// Admin Dashboard APIs
export const getAdminDashboard = async () => {
  try {
    console.log('Making admin dashboard request to:', `${api.defaults.baseURL}/admin/dashboard`);
    const response = await api.get('/admin/dashboard');
    console.log('Admin dashboard response:', response);
    return response.data;
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    throw error;
  }
};

// Admin Classes APIs
export const getAllClassesAdmin = async () => {
  try {
    console.log('Making get all classes admin request to:', `${api.defaults.baseURL}/admin/classes`);
    const response = await api.get('/admin/classes');
    console.log('Get all classes admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get all classes admin API error:', error);
    throw error;
  }
};

export const getClassDetailsAdmin = async (classId) => {
  try {
    console.log('Making get class details admin request to:', `${api.defaults.baseURL}/admin/classes/${classId}`);
    const response = await api.get(`/admin/classes/${classId}`);
    console.log('Get class details admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class details admin API error:', error);
    throw error;
  }
};

export const getClassStudentsAdmin = async (classId) => {
  try {
    console.log('Making get class students admin request to:', `${api.defaults.baseURL}/admin/classes/${classId}/students`);
    const response = await api.get(`/admin/classes/${classId}/students`);
    console.log('Get class students admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class students admin API error:', error);
    throw error;
  }
};

export const getClassAttendanceAdmin = async (classId, date = null) => {
  try {
    const url = date 
      ? `/admin/classes/${classId}/attendance?date=${date}`
      : `/admin/classes/${classId}/attendance`;
    console.log('Making get class attendance admin request to:', `${api.defaults.baseURL}${url}`);
    const response = await api.get(url);
    console.log('Get class attendance admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class attendance admin API error:', error);
    throw error;
  }
};

// Admin Students APIs
export const getAllStudentsAdmin = async () => {
  try {
    console.log('Making get all students admin request to:', `${api.defaults.baseURL}/admin/students`);
    const response = await api.get('/admin/students');
    console.log('Get all students admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get all students admin API error:', error);
    throw error;
  }
};

export const getStudentDetailsAdmin = async (studentId) => {
  try {
    console.log('Making get student details admin request to:', `${api.defaults.baseURL}/admin/students/${studentId}`);
    const response = await api.get(`/admin/students/${studentId}`);
    console.log('Get student details admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get student details admin API error:', error);
    throw error;
  }
};

export const getStudentAttendanceAdmin = async (studentId) => {
  try {
    console.log('Making get student attendance admin request to:', `${api.defaults.baseURL}/admin/students/${studentId}/attendance`);
    const response = await api.get(`/admin/students/${studentId}/attendance`);
    console.log('Get student attendance admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get student attendance admin API error:', error);
    throw error;
  }
};

// Admin Attendance APIs
export const getAllAttendanceAdmin = async () => {
  try {
    console.log('Making get all attendance admin request to:', `${api.defaults.baseURL}/admin/attendance`);
    const response = await api.get('/admin/attendance');
    console.log('Get all attendance admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get all attendance admin API error:', error);
    throw error;
  }
};

export const getAttendanceStatsAdmin = async () => {
  try {
    console.log('Making get attendance stats admin request to:', `${api.defaults.baseURL}/admin/attendance/stats`);
    const response = await api.get('/admin/attendance/stats');
    console.log('Get attendance stats admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance stats admin API error:', error);
    throw error;
  }
};

export const getAttendanceByDateAdmin = async (date) => {
  try {
    console.log('Making get attendance by date admin request to:', `${api.defaults.baseURL}/admin/attendance/by-date?date=${date}`);
    const response = await api.get(`/admin/attendance/by-date?date=${date}`);
    console.log('Get attendance by date admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance by date admin API error:', error);
    throw error;
  }
};

// Admin Users APIs
export const getAllUsersAdmin = async () => {
  try {
    console.log('Making get all users admin request to:', `${api.defaults.baseURL}/admin/users`);
    const response = await api.get('/admin/users');
    console.log('Get all users admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get all users admin API error:', error);
    throw error;
  }
};

export const getUserDetailsAdmin = async (userId) => {
  try {
    console.log('Making get user details admin request to:', `${api.defaults.baseURL}/admin/users/${userId}`);
    const response = await api.get(`/admin/users/${userId}`);
    console.log('Get user details admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get user details admin API error:', error);
    throw error;
  }
};

// Admin Analytics APIs
export const getAnalyticsOverviewAdmin = async () => {
  try {
    console.log('Making get analytics overview admin request to:', `${api.defaults.baseURL}/admin/analytics/overview`);
    const response = await api.get('/admin/analytics/overview');
    console.log('Get analytics overview admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get analytics overview admin API error:', error);
    throw error;
  }
};

export const getClassPerformanceAnalyticsAdmin = async () => {
  try {
    console.log('Making get class performance analytics admin request to:', `${api.defaults.baseURL}/admin/analytics/class-performance`);
    const response = await api.get('/admin/analytics/class-performance');
    console.log('Get class performance analytics admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class performance analytics admin API error:', error);
    throw error;
  }
};

export const getAttendanceTrendsAnalyticsAdmin = async (startDate, endDate) => {
  try {
    console.log('Making get attendance trends analytics admin request to:', `${api.defaults.baseURL}/admin/analytics/attendance-trends?startDate=${startDate}&endDate=${endDate}`);
    const response = await api.get(`/admin/analytics/attendance-trends?startDate=${startDate}&endDate=${endDate}`);
    console.log('Get attendance trends analytics admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance trends analytics admin API error:', error);
    throw error;
  }
};

// Admin Reports APIs
export const getAttendanceReportAdmin = async (startDate, endDate, classId = null) => {
  try {
    const url = classId 
      ? `/admin/reports/attendance?startDate=${startDate}&endDate=${endDate}&classId=${classId}`
      : `/admin/reports/attendance?startDate=${startDate}&endDate=${endDate}`;
    console.log('Making get attendance report admin request to:', `${api.defaults.baseURL}${url}`);
    const response = await api.get(url);
    console.log('Get attendance report admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get attendance report admin API error:', error);
    throw error;
  }
};

export const getClassPerformanceReportAdmin = async () => {
  try {
    console.log('Making get class performance report admin request to:', `${api.defaults.baseURL}/admin/reports/class-performance`);
    const response = await api.get('/admin/reports/class-performance');
    console.log('Get class performance report admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class performance report admin API error:', error);
    throw error;
  }
};

export const getStudentPerformanceReportAdmin = async () => {
  try {
    console.log('Making get student performance report admin request to:', `${api.defaults.baseURL}/admin/reports/student-performance`);
    const response = await api.get('/admin/reports/student-performance');
    console.log('Get student performance report admin response:', response);
    return response.data;
  } catch (error) {
    console.error('Get student performance report admin API error:', error);
    throw error;
  }
};