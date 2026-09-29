import React, { useEffect, useState } from "react";
import { Bell, CheckCircle, Clock } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
} from "../../services/dashboardService";

import "../../styles/dashboard.css";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- Load Notifications ----------------
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Notification Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // ---------------- Mark as Read ----------------
  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error("Mark Read Error:", error);
    }
  };

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

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="empty-panel">
          <Bell size={40} color="#94a3b8" />
          <p>No Notifications Available</p>
        </div>
      ) : (
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
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>

                {!notification.is_read ? (
                  <button
                    className="read-btn"
                    onClick={() => handleRead(notification.id)}
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
      )}
    </div>
  );
};

export default NotificationPanel;