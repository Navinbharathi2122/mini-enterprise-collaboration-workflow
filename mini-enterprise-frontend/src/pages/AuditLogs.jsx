
import { useEffect, useMemo, useCallback, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  Search,
  RefreshCw,
  Activity,
  ClipboardList,
  LogIn,
  ShieldCheck,
  CheckCircle,
  FileText,
  AlertCircle,
  User,
} from "lucide-react";

import {
  getAuditLogs,
  refreshAuditLogs,
  searchAuditLogs,
  formatAuditDate,
  getActionColor,
  formatAction,
} from "../services/auditService";

import "../styles/dashboard.css";
import "../styles/auditlogs.css";

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // LOAD AUDIT LOGS
  // =====================================================

  const loadAuditLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const data = isRefresh
        ? await refreshAuditLogs()
        : await getAuditLogs();

      if (!Array.isArray(data)) {
        throw new Error("Invalid audit logs response from the server.");
      }

      console.log("Audit Logs API Response:", data);

      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

      setAuditLogs(sorted);
    } catch (error) {
      console.error("Audit Logs Loading Error:", error);

      const status = error?.response?.status;
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Unknown error";

      if (status === 401) {
        setErrorMessage(
          "Authentication failed. Please log in again."
        );
      } else if (status === 403) {
        setErrorMessage(
          "Access denied. Your account does not have permission to view audit logs."
        );
      } else {
        setErrorMessage(
          `Unable to load audit logs. ${detail}`
        );
      }

      // Avoid showing stale records after a failed refresh.
      setAuditLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    loadAuditLogs(true);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredLogs = useMemo(() => {
    return searchAuditLogs(auditLogs, search);
  }, [auditLogs, search]);

  // =====================================================
  // KPI CARDS
  // =====================================================

  const todayLogs = useMemo(() => {
    const today = new Date().toDateString();

    return auditLogs.filter((log) => {
      if (!log.created_at) return false;

      return new Date(log.created_at).toDateString() === today;
    });
  }, [auditLogs]);

  const taskLogs = useMemo(() => {
    return auditLogs.filter((log) =>
      String(log.entity || "")
        .toLowerCase()
        .includes("task")
    );
  }, [auditLogs]);

  const loginLogs = useMemo(() => {
    return auditLogs.filter((log) =>
      String(log.action || "")
        .toUpperCase()
        .includes("LOGIN")
    );
  }, [auditLogs]);

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-main">
          <Navbar />

          <div className="dashboard-content">
            <div className="audit-loader">
              <RefreshCw className="spin" size={36} />
              <p>Loading Audit Logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <div className="dashboard-content">
          <div className="audit-page">

            {/* HEADER */}

            <div className="audit-header">
              <div>
                <h2>Enterprise Audit Logs</h2>

                <p>
                  Monitor activities performed inside the
                  Enterprise Workflow Management System.
                </p>
              </div>

              <button
                type="button"
                className="audit-refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "spin" : ""}
                />

                {refreshing ? "Refreshing..." : "Refresh Logs"}
              </button>
            </div>

            {/* API ERROR */}

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
              >
                <AlertCircle size={22} />

                <div className="flex-1">
                  <h3 className="font-semibold">
                    Audit Logs Error
                  </h3>

                  <p className="mt-1 text-sm">
                    {errorMessage}
                  </p>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* KPI CARDS */}

            <div className="audit-stats">
              <div className="audit-stat-card">
                <Activity size={30} />

                <div>
                  <span>Total Logs</span>
                  <h2>{auditLogs.length}</h2>
                </div>
              </div>

              <div className="audit-stat-card today">
                <CheckCircle size={30} />

                <div>
                  <span>Today's Logs</span>
                  <h2>{todayLogs.length}</h2>
                </div>
              </div>

              <div className="audit-stat-card task">
                <ClipboardList size={30} />

                <div>
                  <span>Task Logs</span>
                  <h2>{taskLogs.length}</h2>
                </div>
              </div>

              <div className="audit-stat-card login">
                <LogIn size={30} />

                <div>
                  <span>Login Logs</span>
                  <h2>{loginLogs.length}</h2>
                </div>
              </div>
            </div>

            {/* SEARCH */}

            <div className="audit-search-box">
              <Search
                size={20}
                className="audit-search-icon"
              />

              <input
                type="text"
                placeholder="Search by action, entity, description or user..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {/* TABLE */}

            <div className="audit-table-wrapper">
              <div className="audit-table-header">
                <h3>Latest System Activities</h3>

                <span>
                  {filteredLogs.length} Records Found
                </span>
              </div>

              {!errorMessage && filteredLogs.length === 0 ? (
                <div className="audit-empty">
                  <ShieldCheck size={60} />

                  <h3>
                    {search
                      ? "No Matching Audit Logs"
                      : "No Audit Logs Found"}
                  </h3>

                  <p>
                    {search
                      ? "Try another search keyword."
                      : "No audit records were returned by the API. Perform an application activity and refresh the logs."}
                  </p>
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Description</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Date &amp; Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.map((log, index) => (
                        <tr key={log.id ?? index}>
                          {/* SERIAL NUMBER */}

                          <td>
                            <span className="audit-index">
                              {index + 1}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td>
                            <span
                              className={`audit-badge ${getActionColor(
                                log.action
                              )}`}
                            >
                              {formatAction(log.action || "UNKNOWN")}
                            </span>
                          </td>

                          {/* ENTITY */}

                          <td>
                            <div className="audit-entity">
                              {String(log.entity || "")
                                .toLowerCase()
                                .includes("task") ? (
                                <ClipboardList size={16} />
                              ) : String(log.entity || "")
                                  .toLowerCase()
                                  .includes("document") ? (
                                <FileText size={16} />
                              ) : String(log.entity || "")
                                  .toLowerCase()
                                  .includes("approval") ? (
                                <CheckCircle size={16} />
                              ) : String(log.entity || "")
                                  .toLowerCase()
                                  .includes("login") ? (
                                <LogIn size={16} />
                              ) : (
                                <ShieldCheck size={16} />
                              )}

                              <span>{log.entity || "—"}</span>
                            </div>
                          </td>

                          {/* DESCRIPTION */}

                          <td className="audit-description">
                            {log.description ||
                              "No description available"}
                          </td>

                          {/* USER */}

                          <td>
                            <span className="audit-user">
                              <User size={14} />
                              {log.user_name ||
                                (log.user_id != null
                                  ? `#${log.user_id}`
                                  : "Unknown user")}
                            </span>
                          </td>

                          {/* ROLE */}

                          <td>
                            {log.user_role || "—"}
                          </td>

                          {/* DATE */}

                          <td>
                            <div className="audit-time">
                              {formatAuditDate(log.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            {/* FOOTER */}

            <div className="audit-footer">
              <div className="audit-footer-left">
                <Activity size={18} />

                <span>
                  Showing{" "}
                  <strong>{filteredLogs.length}</strong>
                  {" "}of{" "}
                  <strong>{auditLogs.length}</strong>
                  {" "}audit log records.
                </span>
              </div>

              <div className="audit-footer-right">
                <ShieldCheck size={18} />

                <span>
                  Enterprise Workflow Audit Trail • FastAPI + React • Stackly
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
