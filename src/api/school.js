import api from './axios';

// School API functions for user's own school
export const getMySchool = async () => {
  try {
    console.log('Making get my school request to:', `${api.defaults.baseURL}/schools/my-school`);
    const response = await api.get('/schools/my-school');
    console.log('Get my school response:', response);
    return response.data;
  } catch (error) {
    console.error('Get my school API error:', error);
    throw error;
  }
};

export const getMySchoolStats = async () => {
  try {
    console.log('Making get my school stats request to:', `${api.defaults.baseURL}/schools/my-school/stats`);
    const response = await api.get('/schools/my-school/stats');
    console.log('Get my school stats response:', response);
    return response.data;
  } catch (error) {
    console.error('Get my school stats API error:', error);
    throw error;
  }
};

export const createMySchool = async (schoolData) => {
  try {
    console.log('Making create my school request to:', `${api.defaults.baseURL}/schools`);
    console.log('School data being sent:', schoolData);
    const response = await api.post('/schools', schoolData);
    console.log('Create my school response:', response);
    return response.data;
  } catch (error) {
    console.error('Create my school API error:', error);
    // Check if it's a permission error (403) or role error
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw new Error('Only administrators can create schools. Please contact your system administrator to create a school for you.');
    }
    throw error;
  }
};

export const updateMySchool = async (schoolData) => {
  try {
    console.log('Making update my school request to:', `${api.defaults.baseURL}/schools/my-school`);
    console.log('School data being sent:', schoolData);
    const response = await api.put('/schools/my-school', schoolData);
    console.log('Update my school response:', response);
    return response.data;
  } catch (error) {
    console.error('Update my school API error:', error);
    throw error;
  }
};

export const getSchoolById = async (schoolId) => {
  try {
    console.log('Making get school by ID request to:', `${api.defaults.baseURL}/schools/${schoolId}`);
    const response = await api.get(`/schools/${schoolId}`);
    console.log('Get school by ID response:', response);
    return response.data;
  } catch (error) {
    console.error('Get school by ID API error:', error);
    throw error;
  }
};
