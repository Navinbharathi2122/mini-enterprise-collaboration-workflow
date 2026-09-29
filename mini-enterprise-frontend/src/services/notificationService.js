import axios from "axios";

// =====================================================
// AXIOS INSTANCE
// =====================================================

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach JWT Token automatically
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

// =====================================================
// GET ALL NOTIFICATIONS
// GET /notifications
// =====================================================

export const getNotifications = async () => {
  const response = await API.get("/notifications");
  return response.data;
};

// =====================================================
// REFRESH NOTIFICATIONS
// =====================================================

export const refreshNotifications = async () => {
  const response = await API.get("/notifications");
  return response.data;
};

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// PATCH /notifications/{id}/read
// =====================================================

export const markNotificationRead = async (notificationId) => {
  const response = await API.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /notifications/read-all
// =====================================================

export const markAllNotificationsRead = async () => {
  const response = await API.patch("/notifications/read-all");
  return response.data;
};

// =====================================================
// DELETE NOTIFICATION (Optional)
// DELETE /notifications/{id}
// =====================================================

export const deleteNotification = async (notificationId) => {
  const response = await API.delete(
    `/notifications/${notificationId}`
  );

  return response.data;
};

// =====================================================
// DELETE ALL NOTIFICATIONS (Optional)
// DELETE /notifications
// =====================================================

export const deleteAllNotifications = async () => {
  const response = await API.delete("/notifications");
  return response.data;
};

// =====================================================
// GET UNREAD COUNT
// =====================================================

export const getUnreadCount = (notifications = []) => {
  return notifications.filter((item) => !item.is_read).length;
};

// =====================================================
// GET NOTIFICATION CATEGORY
// =====================================================

export const getNotificationType = (title = "") => {
  const value = title.toLowerCase();

  if (
    value.includes("task") ||
    value.includes("assigned") ||
    value.includes("completed") ||
    value.includes("unassigned")
  ) {
    return "task";
  }

  if (value.includes("leave")) {
    return "leave";
  }

  if (value.includes("approval")) {
    return "approval";
  }

  if (value.includes("document")) {
    return "document";
  }

  return "system";
};

// =====================================================
// NOTIFICATION COLOR
// =====================================================

export const getNotificationColor = (title = "") => {
  const type = getNotificationType(title);

  switch (type) {
    case "task":
      return "#2563EB"; // Blue

    case "leave":
      return "#EA580C"; // Orange

    case "approval":
      return "#16A34A"; // Green

    case "document":
      return "#7C3AED"; // Purple

    default:
      return "#64748B"; // Gray
  }
};

// =====================================================
// FORMAT RELATIVE TIME
// =====================================================

export const formatNotificationTime = (timestamp) => {
  if (!timestamp) return "";

  const created = new Date(timestamp);
  const now = new Date();

  const diff = Math.floor((now - created) / 1000);

  if (diff < 60) return "Just now";

  if (diff < 3600)
    return `${Math.floor(diff / 60)} minute${
      Math.floor(diff / 60) > 1 ? "s" : ""
    } ago`;

  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${
      Math.floor(diff / 3600) > 1 ? "s" : ""
    } ago`;

  if (diff < 172800) return "Yesterday";

  if (diff < 604800)
    return `${Math.floor(diff / 86400)} days ago`;

  return created.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// GROUP NOTIFICATIONS BY DATE
// =====================================================

export const groupNotificationsByDate = (notifications = []) => {
  const grouped = {};

  notifications.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString("en-IN");

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(item);
  });

  return grouped;
};

// =====================================================
// SORT NOTIFICATIONS (Newest First)
// =====================================================

export const sortNotifications = (notifications = []) => {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );
};

// =====================================================
// FILTER NOTIFICATIONS
// =====================================================

export const filterNotifications = (
  notifications = [],
  filter = "all"
) => {
  switch (filter) {
    case "unread":
      return notifications.filter((n) => !n.is_read);

    case "read":
      return notifications.filter((n) => n.is_read);

    case "task":
      return notifications.filter(
        (n) => getNotificationType(n.title) === "task"
      );

    case "leave":
      return notifications.filter(
        (n) => getNotificationType(n.title) === "leave"
      );

    case "approval":
      return notifications.filter(
        (n) => getNotificationType(n.title) === "approval"
      );

    case "document":
      return notifications.filter(
        (n) => getNotificationType(n.title) === "document"
      );

    default:
      return notifications;
  }
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

const notificationService = {
  getNotifications,
  refreshNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  getNotificationType,
  getNotificationColor,
  formatNotificationTime,
  groupNotificationsByDate,
  sortNotifications,
  filterNotifications,
};

export default notificationService;