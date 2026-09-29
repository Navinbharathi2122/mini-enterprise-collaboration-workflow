import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  // Current Logged-in Role
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const canViewAuditLogs = role === "admin" || role === "manager";

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

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================
  // Dashboard Loader
  // =====================================
  const loadDashboard = async () => {
    setLoading(true);

    try {
      // Load APIs that every role can access
      const [dashboardRes, aiRes, notificationRes, taskRes] =
        await Promise.all([
          getDashboardSummary(),
          getAISummary(),
          getNotifications(),
          getTasks(),
        ]);

      setDashboardData(dashboardRes);
      setAiSummary(aiRes);
      setNotifications(notificationRes);
      setTasks(taskRes);

      // Only Admin / Manager fetch audit logs
      if (canViewAuditLogs) {
        try {
          const auditRes = await getAuditLogs();
          setAuditLogs(auditRes);
        } catch (err) {
          console.log("Audit Logs unavailable.");
          setAuditLogs([]);
        }
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Notification Read
  // =====================================
  const handleReadNotification = async (id) => {
    try {
      await markNotificationRead(id);

      const updatedNotifications = await getNotifications();
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error(error);
    }
  };

  const unreadNotifications = notifications.filter(
    (item) => item.is_read === false
  ).length;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Activity className="spin" size={40} />
        <h2>Loading Enterprise Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar title="Enterprise Workflow Dashboard" />

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <h2>Welcome Back 👋</h2>
            <p>
              Monitor your workflow, tasks, approvals, leave requests,
              notifications and AI productivity from one dashboard.
            </p>
          </div>

          <div className="banner-score">
            <h1>{aiSummary.productivity_score}%</h1>
            <span>{aiSummary.ai_status}</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Tasks"
            value={dashboardData.total_tasks}
            icon={<ClipboardList size={26} />}
            color="blue"
          />

          <StatCard
            title="Completed Tasks"
            value={dashboardData.completed_tasks}
            icon={<ShieldCheck size={26} />}
            color="green"
          />

          <StatCard
            title="Pending Tasks"
            value={dashboardData.pending_tasks}
            icon={<FileClock size={26} />}
            color="orange"
          />

          <StatCard
            title="Users"
            value={dashboardData.total_users}
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

        {/* AI Summary */}
        <div className="dashboard-section">
          <AISummaryCard aiSummary={aiSummary} />
        </div>

        {/* Task Analytics */}
        <div className="section-divider">
          <h3>Task Analytics</h3>
        </div>

        <div className="dashboard-grid-two">
          {/* Task Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Task Status Overview</h3>
              <span>Live Workflow Analytics</span>
            </div>

            <TaskStatusChart dashboardData={dashboardData} />
          </div>

          {/* Notifications */}
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

        {/* Recent Tasks */}
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
                        className={`status-badge ${String(task.status)
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`priority-badge ${String(task.priority)
                          .toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td>{task.assigned_to_name || "Not Assigned"}</td>
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

        {/* Audit Logs (Admin & Manager Only) */}
        {canViewAuditLogs && (
          <>
            <div className="section-divider">
              <h3>System Activity</h3>
            </div>

            <div className="dashboard-card audit-card">
              <div className="card-header">
                <div>
                  <h3>Audit Log Activity</h3>
                  <span>Latest Enterprise Workflow Activities</span>
                </div>

                <button className="refresh-btn" onClick={loadDashboard}>
                  Refresh
                </button>
              </div>

              <AuditLogTable auditLogs={auditLogs} />
            </div>
          </>
        )}

        {/* Footer */}
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
              <h3>{dashboardData.total_tasks}</h3>
            </div>

            <div className="footer-stat">
              <span className="footer-label">Users</span>
              <h3>{dashboardData.total_users}</h3>
            </div>

            <div className="footer-stat">
              <span className="footer-label">Unread Notifications</span>
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