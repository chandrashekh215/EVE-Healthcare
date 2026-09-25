import apiClient from './client';

export const triggerWebhookApi = async (data) => {
  const response = await apiClient.post('/payments/webhook', data);
  return response.data;
};
