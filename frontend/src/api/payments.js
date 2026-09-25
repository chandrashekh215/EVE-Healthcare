import apiClient from './client';

export const processPaymentApi = async (data) => {
  const response = await apiClient.post('/payments', data);
  return response.data;
};
