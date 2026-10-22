
import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../services/axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  getDashboardSummary,
  getAISummary,
  getTasks,
  getNotifications,
  getAuditLogs,
  markNotificationRead,
} from "../services/dashboardService";

import StatCard from "../components/dashboard/StatCard";
import TaskStatusChart from "../components/dashboard/TaskStatusChart";
import AISummaryCard from "../components/dashboard/AISummaryCard";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import AuditLogTable from "../components/dashboard/AuditLogTable";

import {
  ClipboardList,
  Users,
  Bell,
  ShieldCheck,
  FileClock,
  Activity,
} from "lucide-react";

import "../styles/dashboard.css";

const Dashboard = () => {
  const {
    isLoading: authLoading,
    isAuthenticated,
    getAccessTokenSilently,
    user,
  } = useAuth0();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [dashboardData, setDashboardData] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    todo_tasks: 0,
    in_progress_tasks: 0,
    review_tasks: 0,
    done_tasks: 0,
    total_users: 0,
    pending_approvals: 0,
    leave_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
  });

  const [aiSummary, setAiSummary] = useState({
    productivity_score: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    pending_approvals: 0,
    leave_requests: 0,
    unread_notifications: 0,
    ai_status: "",
    ai_message: "",
  });

  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState("employee");

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || authLoading) return undefined;
    api.get("/users/me")
      .then((response) => {
        if (!cancelled && response.data?.role) {
          setRole(String(response.data.role).trim().toLowerCase());
        }
      })
      .catch((error) => {
        console.error("Unable to load role from backend:", error.response?.data || error.message);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading]);

  const canViewAuditLogs = [
    "admin",
    "manager",
    "super_admin",
    "hr_manager",
  ].includes(role);

  const loadDashboard = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      setErrorMessage("Please log in to view the dashboard.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Get an Auth0 access token for the MECW API.
      const token = await getAccessTokenSilently();

      if (!token) {
        throw new Error("Auth0 access token was not obtained.");
      }

      // Every service call receives the same access token.
      const [
        dashboardRes,
        aiRes,
        notificationRes,
        taskRes,
      ] = await Promise.all([
        getDashboardSummary(token),
        getAISummary(token),
        getNotifications(token),
        getTasks(token),
      ]);

      setDashboardData(dashboardRes || {});
      setAiSummary(aiRes || {});

      setNotifications(
        Array.isArray(notificationRes)
          ? notificationRes
          : Array.isArray(notificationRes?.items)
            ? notificationRes.items
            : []
      );

      setTasks(Array.isArray(taskRes) ? taskRes : []);

      if (canViewAuditLogs) {
        try {
          const auditRes = await getAuditLogs(token);

          setAuditLogs(
            Array.isArray(auditRes) ? auditRes : []
          );
        } catch (error) {
          console.error(
            "Audit Logs Error:",
            error.response?.data || error.message
          );

          setAuditLogs([]);
        }
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error(
        "Dashboard Load Error:",
        error.response?.data || error.message
      );

      if (error?.error === "login_required") {
        setErrorMessage(
          "Your session has expired. Please log in again."
        );
      } else if (error?.error === "consent_required") {
        setErrorMessage(
          "API access consent is required. Please log in again."
        );
      } else if (error?.response?.status === 401) {
        setErrorMessage(
          "Authentication failed. Please log in again and verify the API token."
        );
      } else if (error?.response?.status === 403) {
        setErrorMessage(
          "You do not have permission to access this information."
        );
      } else {
        setErrorMessage(
          error.message ||
            "Unable to load dashboard data. Check the backend server."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    getAccessTokenSilently,
    canViewAuditLogs,
  ]);

  useEffect(() => {
    if (!authLoading) {
      loadDashboard();
    }
  }, [authLoading, loadDashboard]);

  const handleReadNotification = async (id) => {
    try {
      const token = await getAccessTokenSilently();

      await markNotificationRead(id, token);

      const updatedNotifications = await getNotifications(token);

      setNotifications(
        Array.isArray(updatedNotifications)
          ? updatedNotifications
          : []
      );
    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error.response?.data || error.message
      );
    }
  };

  const unreadNotifications = notifications.filter(
    (item) => !item.is_read
  ).length;

  if (authLoading || loading) {
    return (
      <div className="dashboard-loading">
        <Activity className="spin" size={40} />
        <h2>Loading Enterprise Dashboard...</h2>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="dashboard-loading">
        <Activity size={40} />
        <h2>Dashboard Could Not Load</h2>
        <p>{errorMessage}</p>

        <button
          className="refresh-btn"
          onClick={loadDashboard}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar title="Enterprise Workflow Dashboard" />

        <div className="welcome-banner">
          <div>
            <h2>Welcome Back 👋</h2>
            <p>
              Monitor your workflow, tasks, approvals, leave requests,
              notifications and AI productivity from one dashboard.
            </p>
          </div>

          <div className="banner-score">
            <h1>{aiSummary.productivity_score ?? 0}%</h1>
            <span>{aiSummary.ai_status || ""}</span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            title="Total Tasks"
            value={dashboardData.total_tasks ?? 0}
            icon={<ClipboardList size={26} />}
            color="blue"
          />

          <StatCard
            title="Completed Tasks"
            value={dashboardData.completed_tasks ?? 0}
            icon={<ShieldCheck size={26} />}
            color="green"
          />

          <StatCard
            title="Pending Tasks"
            value={dashboardData.pending_tasks ?? 0}
            icon={<FileClock size={26} />}
            color="orange"
          />

          <StatCard
            title="Users"
            value={dashboardData.total_users ?? 0}
            icon={<Users size={26} />}
            color="purple"
          />

          <StatCard
            title="Notifications"
            value={notifications.length}
            badge={unreadNotifications}
            icon={<Bell size={26} />}
            color="red"
          />

          {canViewAuditLogs && (
            <StatCard
              title="Audit Logs"
              value={auditLogs.length}
              icon={<Activity size={26} />}
              color="dark"
            />
          )}
        </div>

        <div className="dashboard-section">
          <AISummaryCard aiSummary={aiSummary} />
        </div>

        <div className="section-divider">
          <h3>Task Analytics</h3>
        </div>

        <div className="dashboard-grid-two">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Task Status Overview</h3>
              <span>Live Workflow Analytics</span>
            </div>

            <TaskStatusChart dashboardData={dashboardData} />
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Notifications</h3>
              <span>{unreadNotifications} Unread</span>
            </div>

            <NotificationPanel
              notifications={notifications}
              onRead={handleReadNotification}
            />
          </div>
        </div>

        <div className="dashboard-card recent-tasks-card">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <span>Latest Tasks from FastAPI</span>
          </div>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>

            <tbody>
              {tasks.length > 0 ? (
                tasks.slice(0, 8).map((task) => (
                  <tr key={task.id}>
                    <td>#{task.id}</td>
                    <td>{task.title}</td>

                    <td>
                      <span
                        className={`status-badge ${String(
                          task.status || ""
                        )
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`priority-badge ${String(
                          task.priority || ""
                        ).toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td>
                      {task.assigned_to_name || "Not Assigned"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table">
                    No Tasks Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canViewAuditLogs && (
          <>
            <div className="section-divider">
              <h3>System Activity</h3>
            </div>

            <div className="dashboard-card audit-card">
              <div className="card-header">
                <div>
                  <h3>Audit Log Activity</h3>
                  <span>
                    Latest Enterprise Workflow Activities
                  </span>
                </div>

                <button
                  className="refresh-btn"
                  onClick={loadDashboard}
                >
                  Refresh
                </button>
              </div>

              <AuditLogTable auditLogs={auditLogs} />
            </div>
          </>
        )}

        <footer className="dashboard-footer">
          <div className="footer-left">
            <h4>Stackly Enterprise Workflow Management</h4>
            <p>
              Enterprise Dashboard with AI Summary, Notifications,
              Leave Requests, Approvals and Workflow Analytics.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-stat">
              <span className="footer-label">Tasks</span>
              <h3>{dashboardData.total_tasks ?? 0}</h3>
            </div>

            <div className="footer-stat">
              <span className="footer-label">Users</span>
              <h3>{dashboardData.total_users ?? 0}</h3>
            </div>

            <div className="footer-stat">
              <span className="footer-label">
                Unread Notifications
              </span>
              <h3>{unreadNotifications}</h3>
            </div>

            {canViewAuditLogs && (
              <div className="footer-stat">
                <span className="footer-label">Audit Logs</span>
                <h3>{auditLogs.length}</h3>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
