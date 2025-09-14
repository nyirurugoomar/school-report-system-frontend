import api from './axios'

export const createClass = async (classData) => {
  try {
    console.log('Making create class request to:', `${api.defaults.baseURL}/classes`);
    console.log('Class data being sent:', classData);
    const response = await api.post('/classes', classData);
    console.log('Create class response:', response);
    return response.data;
  } catch (error) {
    console.error('Create class API error:', error);
    throw error;
  }
};

export const getClasses = async () => {
  try {
    console.log('Making get classes request to:', `${api.defaults.baseURL}/classes`);
    const response = await api.get('/classes');
    console.log('Get classes response:', response);
    return response.data;
  } catch (error) {
    console.error('Get classes API error:', error);
    throw error;
  }
};

export const getClassById = async (id) => {
  try {
    console.log('Making get class request to:', `${api.defaults.baseURL}/classes/${id}`);
    const response = await api.get(`/classes/${id}`);
    console.log('Get class response:', response);
    return response.data;
  } catch (error) {
    console.error('Get class API error:', error);
    throw error;
  }
};