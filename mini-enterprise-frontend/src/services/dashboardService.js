import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Dashboard Summary
export const getDashboardSummary = async () => {
  const response = await API.get("/dashboard/summary");
  return response.data;
};

// AI Summary
export const getAISummary = async () => {
  const response = await API.get("/dashboard/ai-summary");
  return response.data;
};

// Task Distribution
export const getTaskDistribution = async () => {
  const response = await API.get("/dashboard/task-distribution");
  return response.data;
};

// Tasks
export const getTasks = async () => {
  const response = await API.get("/tasks/");
  return response.data;
};

// Notifications
export const getNotifications = async () => {
  const response = await API.get("/notifications/");
  return response.data;
};

// Mark Notification Read
export const markNotificationRead = async (notificationId) => {
  const response = await API.patch(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

// Audit Logs
export const getAuditLogs = async () => {
  const response = await API.get("/audit-logs/");
  return response.data;
};

export default API;