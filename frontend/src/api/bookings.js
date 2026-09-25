import apiClient from './client';

export const createBookingApi = async (data) => {
  const response = await apiClient.post('/bookings', data);
  return response.data;
};

export const getUserBookingsApi = async (params = {}) => {
  const response = await apiClient.get('/bookings', { params });
  return response.data;
};

export const getBookingByIdApi = async (id) => {
  const response = await apiClient.get(`/bookings/${id}`);
  return response.data;
};

export const cancelBookingApi = async (id) => {
  const response = await apiClient.post(`/bookings/${id}/cancel`);
  return response.data;
};
