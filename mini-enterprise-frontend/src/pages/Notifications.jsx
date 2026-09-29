import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  Bell,
  CheckCircle,
  RefreshCw,
  CheckCheck,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  FileText,
  Settings,
} from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatNotificationTime,
  getNotificationType,
} from "../services/notificationService";

import "../styles/dashboard.css";
import "../styles/notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  // ================= LOAD NOTIFICATIONS =================

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();

      const sorted = Array.isArray(data)
        ? data.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        : [];

      setNotifications(sorted);
    } catch (error) {
      console.error("Notification Load Error:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ================= INITIAL LOAD + AUTO REFRESH =================

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000); // refresh every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // ================= REFRESH BUTTON =================

  const refreshNotifications = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // ================= MARK SINGLE READ =================

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ================= MARK ALL READ =================

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ================= COUNTERS =================

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  // ================= FILTER =================

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.is_read);
    }

    if (filter === "read") {
      return notifications.filter((item) => item.is_read);
    }

    return notifications;
  }, [notifications, filter]);

  // ================= ICON =================

  const getIcon = (title) => {
    const type = getNotificationType(title);

    switch (type) {
      case "task":
        return <ClipboardList size={22} color="#2563EB" />;

      case "leave":
        return <CalendarDays size={22} color="#EA580C" />;

      case "approval":
        return <ShieldCheck size={22} color="#16A34A" />;

      case "document":
        return <FileText size={22} color="#7C3AED" />;

      default:
        return <Bell size={22} color="#64748B" />;
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-main">
          <Navbar />

          <div className="dashboard-content">
            <div className="notification-loader">
              <RefreshCw className="spin" size={34} />
              <p>Loading Enterprise Notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= PAGE =================

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <div className="dashboard-content">
          <div className="notification-page">

            {/* HEADER */}

            <div className="notification-header">
              <div>
                <h2>Enterprise Notifications</h2>

                <p>
                  Task assignments, Leave requests, Approval workflow,
                  Documents and System alerts.
                </p>
              </div>

              <div className="notification-actions">
                <button
                  className="refresh-btn"
                  onClick={refreshNotifications}
                >
                  <RefreshCw
                    size={18}
                    className={refreshing ? "spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  className="markall-btn"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck size={18} />
                  Mark All Read
                </button>
              </div>
            </div>

            {/* KPI */}

            <div className="notification-stats">

              <div className="notification-stat-card">
                <Bell size={28} />

                <div>
                  <span>Total Notifications</span>
                  <h2>{notifications.length}</h2>
                </div>
              </div>

              <div className="notification-stat-card unread">
                <ShieldCheck size={28} />

                <div>
                  <span>Unread</span>
                  <h2>{unreadCount}</h2>
                </div>
              </div>

              <div className="notification-stat-card read">
                <CheckCircle size={28} />

                <div>
                  <span>Read</span>
                  <h2>{readCount}</h2>
                </div>
              </div>

            </div>

            {/* FILTER */}

            <div className="notification-filter">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                className={filter === "unread" ? "active" : ""}
                onClick={() => setFilter("unread")}
              >
                Unread
              </button>

              <button
                className={filter === "read" ? "active" : ""}
                onClick={() => setFilter("read")}
              >
                Read
              </button>
            </div>

            {/* LIST */}

            <div className="notification-list">

              {filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={60} />

                  <h3>No Notifications</h3>

                  <p>
                    No notifications available for your account.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const type = getNotificationType(item.title);

                  return (
                    <div
                      key={item.id}
                      className={`notification-card ${
                        item.is_read ? "read" : "unread"
                      }`}
                    >
                      <div className={`notification-icon ${type}`}>
                        {getIcon(item.title)}
                      </div>

                      <div className="notification-content">

                        <div className="notification-top">

                          <div>
                            <h3>{item.title}</h3>

                            <span className={`notification-type ${type}`}>
                              {type.toUpperCase()}
                            </span>
                          </div>

                          {!item.is_read && (
                            <span className="unread-badge">
                              Unread
                            </span>
                          )}
                        </div>

                        <p>{item.message}</p>

                        <div className="notification-footer">

                          <small>
                            {formatNotificationTime(item.created_at)}
                          </small>

                          {!item.is_read ? (
                            <button
                              className="read-btn"
                              onClick={() => handleMarkRead(item.id)}
                            >
                              <CheckCircle size={15} />
                              Mark as Read
                            </button>
                          ) : (
                            <span className="read-text">
                              <CheckCircle size={15} />
                              Read
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* FOOTER */}

            <div className="notification-footer-note">
              <div>
                <Bell size={18} />

                Showing{" "}
                <strong>{filteredNotifications.length}</strong> of{" "}
                <strong>{notifications.length}</strong> notifications.
              </div>

              <div>
                <RefreshCw size={16} />
                Auto refresh every 15 seconds
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}