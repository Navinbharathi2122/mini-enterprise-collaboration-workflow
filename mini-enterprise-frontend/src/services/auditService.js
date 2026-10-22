
import api from "./axios";

// =====================================================
// GET AUDIT LOGS
// Uses shared Axios instance and Auth0 token getter
// =====================================================

export const getAuditLogs = async () => {
  try {
    const response = await api.get("/audit-logs/");

    if (!Array.isArray(response.data)) {
      console.error(
        "Unexpected Audit Logs API response:",
        response.data
      );

      throw new Error(
        "Audit Logs API did not return a list."
      );
    }

    console.log(
      "Audit Logs successfully fetched:",
      response.data.length,
      "records"
    );

    return response.data;
  } catch (error) {
    console.error(
      "Get Audit Logs Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
};

// =====================================================
// REFRESH AUDIT LOGS
// =====================================================

export const refreshAuditLogs = async () => {
  return getAuditLogs();
};

// =====================================================
// SEARCH AUDIT LOGS
// =====================================================

export const searchAuditLogs = (logs, keyword) => {
  if (!keyword?.trim()) {
    return logs;
  }

  const value = keyword.toLowerCase().trim();

  return logs.filter((log) => {
    return (
      String(log.action || "").toLowerCase().includes(value) ||
      String(log.entity || "").toLowerCase().includes(value) ||
      String(log.description || "").toLowerCase().includes(value) ||
      String(log.user_id ?? "").includes(value) ||
      String(log.user_name || "").toLowerCase().includes(value) ||
      String(log.user_role || "").toLowerCase().includes(value)
    );
  });
};

// =====================================================
// FORMAT AUDIT DATE
// =====================================================

export const formatAuditDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// ACTION COLOR
// =====================================================

export const getActionColor = (action = "") => {
  const value = action.toUpperCase();

  if (
    value.includes("POST") ||
    value.includes("CREATE") ||
    value.includes("ADDED")
  ) {
    return "green";
  }

  if (
    value.includes("PATCH") ||
    value.includes("UPDATE") ||
    value.includes("PUT")
  ) {
    return "orange";
  }

  if (value.includes("DELETE")) return "red";
  if (value.includes("LOGIN")) return "blue";
  if (value.includes("APPROVE")) return "purple";
  if (value.includes("LEAVE")) return "yellow";
  if (value.includes("GET")) return "cyan";

  return "gray";
};

// =====================================================
// FORMAT ACTION
// =====================================================

export const formatAction = (action = "") => {
  return String(action).replaceAll("_", " ");
};

// =====================================================
// ENTITY TYPE
// =====================================================

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

// =====================================================
// DEFAULT EXPORT
// =====================================================

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
