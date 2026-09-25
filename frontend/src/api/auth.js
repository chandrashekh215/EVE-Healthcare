import apiClient from './client';

export const signupApi = async (data) => {
  const response = await apiClient.post('/auth/signup', data);
  return response.data;
};

export const loginApi = async (data) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};
