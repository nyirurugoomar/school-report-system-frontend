import api from './axios'

export const createStudent = async (studentData) => {
  try {
    console.log('Making create student request to:', `${api.defaults.baseURL}/students`);
    console.log('Student data being sent:', studentData);
    const response = await api.post('/students', studentData);
    console.log('Create student response:', response);
    return response.data;
  } catch (error) {
    console.error('Create student API error:', error);
    throw error;
  }
};

export const getStudents = async () => {
  try {
    console.log('Making get students request to:', `${api.defaults.baseURL}/students`);
    const response = await api.get('/students');
    console.log('Get students response:', response);
    return response.data;
  } catch (error) {
    console.error('Get students API error:', error);
    throw error;
  }
};

export const getStudentsByClass = async (classId) => {
  try {
    console.log('Making get students by class request to:', `${api.defaults.baseURL}/students/class/${classId}`);
    const response = await api.get(`/students/class/${classId}`);
    console.log('Get students by class response:', response);
    return response.data;
  } catch (error) {
    console.error('Get students by class API error:', error);
    throw error;
  }
};

export const getStudentById = async (id) => {
  try {
    console.log('Making get student request to:', `${api.defaults.baseURL}/students/${id}`);
    const response = await api.get(`/students/${id}`);
    console.log('Get student response:', response);
    return response.data;
  } catch (error) {
    console.error('Get student API error:', error);
    throw error;
  }
};