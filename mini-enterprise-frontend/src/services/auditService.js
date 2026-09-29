import axios from "axios";




const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});



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



export const getAuditLogs = async () => {
  try {
    const response = await API.get("/audit-logs/");
    return response.data;
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    return [];
  }
};



export const refreshAuditLogs = async () => {
  return await getAuditLogs();
};



export const searchAuditLogs = (logs, keyword) => {
  if (!keyword) return logs;

  const value = keyword.toLowerCase();

  return logs.filter((log) => {
    return (
      log.action?.toLowerCase().includes(value) ||
      log.entity?.toLowerCase().includes(value) ||
      log.description?.toLowerCase().includes(value) ||
      String(log.user_id).includes(value)
    );
  });
};



export const formatAuditDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};



export const getActionColor = (action = "") => {
  const value = action.toUpperCase();

  if (value.includes("POST")) return "green";
  if (value.includes("CREATE")) return "green";

  if (value.includes("PATCH")) return "orange";
  if (value.includes("UPDATE")) return "orange";
  if (value.includes("PUT")) return "orange";

  if (value.includes("DELETE")) return "red";

  if (value.includes("LOGIN")) return "blue";

  if (value.includes("APPROVE")) return "purple";

  if (value.includes("LEAVE")) return "yellow";

  if (value.includes("GET")) return "cyan";

  return "gray";
};



export const formatAction = (action = "") => {
  return action.replaceAll("_", " ");
};



export const getEntityType = (entity = "") => {
  const value = entity.toLowerCase();

  if (value.includes("task")) return "task";
  if (value.includes("leave")) return "leave";
  if (value.includes("approval")) return "approval";
  if (value.includes("document")) return "document";
  if (value.includes("user")) return "user";
  if (value.includes("audit")) return "audit";

  return "system";
};



const auditService = {
  getAuditLogs,
  refreshAuditLogs,
  searchAuditLogs,
  formatAuditDate,
  getActionColor,
  formatAction,
  getEntityType,
};

export default auditService;