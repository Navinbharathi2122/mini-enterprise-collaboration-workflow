
import api from "./axios";

const getNotifications = async (token) => {
  const response = await api.get("/notifications/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const markNotificationRead = async (id, token) => {
  const response = await api.patch(
    `/notifications/${id}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const markAllNotificationsRead = async (token) => {
  const response = await api.patch(
    "/notifications/read-all",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const formatNotificationTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString();
};

const getNotificationType = (title = "") => {
  const value = title.toLowerCase();

  if (value.includes("task")) return "task";
  if (value.includes("leave")) return "leave";
  if (value.includes("approval")) return "approval";
  if (
    value.includes("document") ||
    value.includes("resume")
  ) {
    return "document";
  }

  return "system";
};

const refreshNotifications = getNotifications;

export {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatNotificationTime,
  getNotificationType,
  refreshNotifications,
};

export default {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatNotificationTime,
  getNotificationType,
  refreshNotifications,
};
