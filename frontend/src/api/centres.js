import apiClient from './client';

export const getCentresApi = async (params = {}) => {
  const response = await apiClient.get('/centres', { params });
  return response.data;
};

export const getCentreByIdApi = async (id) => {
  const response = await apiClient.get(`/centres/${id}`);
  return response.data;
};

export const createCentreApi = async (data) => {
  const response = await apiClient.post('/centres', data);
  return response.data;
};

export const addTestToCentreApi = async (centreId, data) => {
  const response = await apiClient.post(`/centres/${centreId}/tests`, data);
  return response.data;
};
