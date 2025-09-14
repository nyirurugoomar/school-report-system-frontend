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