import axios from "axios";

const API_URL = "http://localhost:3000";

export const createNotification = async (notificationData: {
  userId: string;
  projectId: string;
  message: string;
}) => {
  const response = await axios.post(`${API_URL}/notifications`, notificationData);
  return response.data;
};

export const getNotificationsQueryFn = async (userId: string): Promise<{ notifications: any[] }> => {
  const response = await axios.get(`${API_URL}/notifications?userId=${userId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await axios.patch(`${API_URL}/notifications/${notificationId}/read`);
  return response.data;
}; 