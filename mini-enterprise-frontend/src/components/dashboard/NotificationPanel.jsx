
import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell, CheckCircle, Clock } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
} from "../../services/dashboardService";

import "../../styles/dashboard.css";

const NotificationPanel = () => {
  const {
    getAccessTokenSilently,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth0();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Load notifications using the Auth0 access token
  const loadNotifications = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      setErrorMessage("Please log in to view notifications.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const token = await getAccessTokenSilently();
      const data = await getNotifications(token);

      setNotifications(
        Array.isArray(data) ? data : data?.items ?? []
      );
    } catch (error) {
      console.error(
        "Notification Error:",
        error.response?.data ?? error.message
      );

      setErrorMessage(
        error.response?.data?.detail ||
        error.message ||
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    getAccessTokenSilently,
  ]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark notification as read using the Auth0 access token
  const handleRead = async (id) => {
    try {
      const token = await getAccessTokenSilently();

      await markNotificationRead(id, token);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Mark Read Error:",
        error.response?.data ?? error.message
      );

      setErrorMessage(
        error.response?.data?.detail ||
        error.message ||
        "Unable to mark notification as read."
      );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="dashboard-card notification-panel">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card notification-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Bell size={20} color="#2563eb" />
          <h3>Notifications</h3>
        </div>

        <span className="notification-count">
          {notifications.filter((n) => !n.is_read).length} Unread
        </span>
      </div>

      {errorMessage && (
        <div role="alert" className="notification-error">
          <p>{errorMessage}</p>
          <button onClick={loadNotifications}>
            Try Again
          </button>
        </div>
      )}

      {!errorMessage && notifications.length === 0 ? (
        <div className="empty-panel">
          <Bell size={40} color="#94a3b8" />
          <p>No Notifications Available</p>
        </div>
      ) : (
        !errorMessage && (
          <div className="notification-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  notification.is_read ? "read" : "unread"
                }`}
              >
                <div className="notification-top">
                  <h4>{notification.title}</h4>

                  {!notification.is_read && (
                    <span className="unread-badge">NEW</span>
                  )}
                </div>

                <p>{notification.message}</p>

                <div className="notification-bottom">
                  <div className="time">
                    <Clock size={14} />
                    <span>
                      {notification.created_at
                        ? new Date(
                            notification.created_at
                          ).toLocaleString()
                        : "Date unavailable"}
                    </span>
                  </div>

                  {!notification.is_read ? (
                    <button
                      className="read-btn"
                      onClick={() =>
                        handleRead(notification.id)
                      }
                    >
                      <CheckCircle size={16} />
                      Mark Read
                    </button>
                  ) : (
                    <span className="read-status">
                      <CheckCircle size={16} color="green" />
                      Read
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default NotificationPanel;
