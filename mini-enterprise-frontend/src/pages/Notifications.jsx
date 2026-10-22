
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

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
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = useCallback(async () => {
    return await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    });
  }, [getAccessTokenSilently]);

  const loadNotifications = useCallback(async (showRefresh = false) => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setNotifications([]);
      setErrorMessage("Please log in to view notifications.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const token = await getToken();
      const data = await getNotifications(token);

      const sorted = Array.isArray(data)
        ? [...data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        : [];

      setNotifications(sorted);
    } catch (error) {
      console.error(
        "Notification Load Error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.status === 401
          ? "Authentication failed. Please log out and log in again."
          : "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, isAuthenticated, getToken]);

  useEffect(() => {
    if (authLoading) return;

    loadNotifications();

    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated, loadNotifications]);

  const refreshNotifications = () => {
    loadNotifications(true);
  };

  const handleMarkRead = async (id) => {
    try {
      const token = await getToken();

      await markNotificationRead(id, token);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error.response?.data || error.message
      );

      setErrorMessage("Unable to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();

      await markAllNotificationsRead(token);

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark All Notifications Read Error:",
        error.response?.data || error.message
      );

      setErrorMessage("Unable to mark all notifications as read.");
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.is_read);
    }

    if (filter === "read") {
      return notifications.filter((item) => item.is_read);
    }

    return notifications;
  }, [notifications, filter]);

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

  if (authLoading || loading) {
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

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <div className="dashboard-content">
          <div className="notification-page">
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
                  disabled={refreshing}
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
                  disabled={notifications.length === 0 || unreadCount === 0}
                >
                  <CheckCheck size={18} />
                  Mark All Read
                </button>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="notification-error">
                <p>{errorMessage}</p>
                <button onClick={refreshNotifications}>
                  Try Again
                </button>
              </div>
            )}

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

            <div className="notification-list">
              {filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={60} />
                  <h3>No Notifications</h3>
                  <p>
                    {errorMessage
                      ? "Notifications could not be loaded."
                      : "No notifications available for your account."}
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
                            <span className="unread-badge">Unread</span>
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
