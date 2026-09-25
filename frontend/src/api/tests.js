import apiClient from './client';

export const getTestsApi = async (params = {}) => {
  const response = await apiClient.get('/tests', { params });
  return response.data;
};
