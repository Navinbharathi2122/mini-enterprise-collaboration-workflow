import React from "react";
import "./AuditLogTable.css";

const getBadgeColor = (action = "") => {
  const value = action.toUpperCase();

  if (value.includes("CREATE")) return "green";
  if (value.includes("POST")) return "green";

  if (value.includes("UPDATE")) return "blue";
  if (value.includes("PATCH")) return "blue";

  if (value.includes("DELETE")) return "red";

  if (value.includes("LOGIN")) return "purple";

  if (value.includes("APPROVE")) return "emerald";

  if (value.includes("LEAVE")) return "orange";

  if (value.includes("GET")) return "gray";

  return "default";
};

const AuditLogTable = ({ auditLogs = [] }) => {
  return (
    <div className="audit-table-card">
      <div className="audit-header">
        <div>
          <h2>Audit Logs</h2>
          <p>Live enterprise activity history from FastAPI</p>
        </div>

        <div className="audit-count">
          {auditLogs.length} Logs
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="audit-empty">
          <h3>No Audit Logs Found</h3>
          <p>System activities will appear here.</p>
        </div>
      ) : (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>

                  <td>User #{log.user_id}</td>

                  <td>
                    <span
                      className={`audit-badge ${getBadgeColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td>{log.entity}</td>

                  <td>{log.description}</td>

                  <td>
                    {new Date(log.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;