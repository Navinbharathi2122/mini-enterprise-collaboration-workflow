import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import auditService, {
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

  /* ================= LOAD LOGS ================= */

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const data = await getAuditLogs();

      console.log("Audit Logs API:", data);

      const sorted = Array.isArray(data)
        ? [...data].sort(
            (a, b) =>
              new Date(b.created_at) - new Date(a.created_at)
          )
        : [];

      setAuditLogs(sorted);
    } catch (error) {
      console.error("Audit Log Error:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= REFRESH ================= */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const data = await refreshAuditLogs();

      const sorted = Array.isArray(data)
        ? [...data].sort(
            (a, b) =>
              new Date(b.created_at) - new Date(a.created_at)
          )
        : [];

      setAuditLogs(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  /* ================= SEARCH FILTER ================= */

  const filteredLogs = useMemo(() => {
    return searchAuditLogs(auditLogs, search);
  }, [auditLogs, search]);

  /* ================= KPI CARDS ================= */

  const todayLogs = auditLogs.filter((log) => {
    const today = new Date().toDateString();
    return new Date(log.created_at).toDateString() === today;
  });

  const taskLogs = auditLogs.filter((log) =>
    log.entity?.toLowerCase().includes("task")
  );

  const loginLogs = auditLogs.filter((log) =>
    log.action?.toUpperCase().includes("LOGIN")
  );

  /* ================= LOADING ================= */

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

  /* ================= MAIN PAGE ================= */

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <div className="dashboard-content">
          <div className="audit-page">

            {/* ================= HEADER ================= */}

            <div className="audit-header">
              <div>
                <h2>Enterprise Audit Logs</h2>

                <p>
                  Monitor every activity performed inside the Enterprise
                  Workflow Management System.
                </p>
              </div>

              <button
                className="audit-refresh-btn"
                onClick={handleRefresh}
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "spin" : ""}
                />

                Refresh Logs
              </button>
            </div>

            {/* ================= KPI CARDS ================= */}

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

            {/* ================= SEARCH ================= */}

            <div className="audit-search-box">
              <Search
                size={20}
                className="audit-search-icon"
              />

              <input
                type="text"
                placeholder="Search by Action, Entity, Description or User ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* ================= TABLE WRAPPER ================= */}

            <div className="audit-table-wrapper">

              <div className="audit-table-header">
                <h3>Latest System Activities</h3>

                <span>{filteredLogs.length} Records Found</span>
              </div>

                            {filteredLogs.length === 0 ? (
                <div className="audit-empty">
                  <ShieldCheck size={60} />

                  <h3>No Audit Logs Found</h3>

                  <p>
                    No audit logs match your search. Try changing the search
                    keyword or refresh the logs.
                  </p>
                </div>
              ) : (
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Description</th>
                      <th>User ID</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={log.id || index}>
                        {/* Serial Number */}
                        <td>
                          <span className="audit-index">
                            {index + 1}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td>
                          <span
                            className={`audit-badge ${getActionColor(
                              log.action
                            )}`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>

                        {/* Entity */}
                        <td>
                          <div className="audit-entity">
                            {log.entity?.toLowerCase().includes("task") ? (
                              <ClipboardList size={16} />
                            ) : log.entity
                                ?.toLowerCase()
                                .includes("document") ? (
                              <FileText size={16} />
                            ) : log.entity
                                ?.toLowerCase()
                                .includes("approval") ? (
                              <CheckCircle size={16} />
                            ) : log.entity
                                ?.toLowerCase()
                                .includes("login") ? (
                              <LogIn size={16} />
                            ) : (
                              <ShieldCheck size={16} />
                            )}

                            <span>{log.entity}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="audit-description">
                          {log.description || "No description available"}
                        </td>

                        {/* User */}
                        <td>
                          <span className="audit-user">
                            #{log.user_id}
                          </span>
                        </td>

                        {/* Time */}
                        <td>
                          <div className="audit-time">
                            {formatAuditDate(log.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ================= FOOTER ================= */}

            <div className="audit-footer">
              <div className="audit-footer-left">
                <Activity size={18} />

                <span>
                  Showing <strong>{filteredLogs.length}</strong> of{" "}
                  <strong>{auditLogs.length}</strong> audit log records.
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