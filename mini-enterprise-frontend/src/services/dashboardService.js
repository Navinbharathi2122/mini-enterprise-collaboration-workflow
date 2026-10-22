
import api from "./axios";

// Dashboard Summary
export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary/");
  return response.data;
};

// AI Summary
export const getAISummary = async () => {
  const response = await api.get("/dashboard/ai-summary/");
  return response.data;
};

// Task Distribution
export const getTaskDistribution = async () => {
  const response = await api.get("/dashboard/task-distribution/");
  return response.data;
};

// Tasks
export const getTasks = async () => {
  const response = await api.get("/tasks/");
  return response.data;
};

// Notifications
export const getNotifications = async () => {
  const response = await api.get("/notifications/");
  return response.data;
};

// Mark one notification as read
export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`,
    {}
  );
  return response.data;
};

// Audit Logs
export const getAuditLogs = async () => {
  const response = await api.get("/audit-logs/");
  return response.data;
};

export default api;
