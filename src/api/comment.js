import api from './axios'

export const getAvailableSchools = async () => {
  try {
    console.log('Making get available schools request to:', `${api.defaults.baseURL}/comments/available-schools`);
    const response = await api.get('/comments/available-schools');
    console.log('Get available schools response:', response);
    return response.data;
  } catch (error) {
    console.error('Get available schools API error:', error);
    throw error;
  }
};

export const createComment = async (commentData) => {
  try {
    console.log('Making create comment request to:', `${api.defaults.baseURL}/comments`);
    console.log('Comment data being sent:', commentData);
    const response = await api.post('/comments', commentData);
    console.log('Create comment response:', response);
    return response.data;
  } catch (error) {
    console.error('Create comment API error:', error);
    throw error;
  }
};

export const getComments = async () => {
  try {
    console.log('Making get comments request to:', `${api.defaults.baseURL}/comments`);
    const response = await api.get('/comments');
    console.log('Get comments response:', response);
    return response.data;
  } catch (error) {
    console.error('Get comments API error:', error);
    throw error;
  }
};

export const getCommentById = async (id) => {
  try {
    console.log('Making get comment request to:', `${api.defaults.baseURL}/comments/${id}`);
    const response = await api.get(`/comments/${id}`);
    console.log('Get comment response:', response);
    return response.data;
  } catch (error) {
    console.error('Get comment API error:', error);
    throw error;
  }
};