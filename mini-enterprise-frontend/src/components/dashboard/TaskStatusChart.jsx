import React from "react";
import "./TaskStatusChart.css";

const TaskStatusChart = ({ dashboard }) => {
  const taskData = [
    {
      label: "Pending",
      value: dashboard?.pending_tasks || 0,
      color: "#F59E0B",
    },
    {
      label: "In Progress",
      value: dashboard?.in_progress_tasks || 0,
      color: "#2563EB",
    },
    {
      label: "Approved",
      value: dashboard?.approved_tasks || 0,
      color: "#10B981",
    },
    {
      label: "Completed",
      value: dashboard?.completed_tasks || 0,
      color: "#059669",
    },
    {
      label: "Rejected",
      value: dashboard?.rejected_tasks || 0,
      color: "#EF4444",
    },
  ];

  const maxValue = Math.max(...taskData.map((item) => item.value), 1);

  return (
    <div className="task-chart-card">
      <div className="task-chart-header">
        <h3>Task Status Overview</h3>
        <p>Live task distribution from FastAPI Dashboard API</p>
      </div>

      <div className="task-chart-body">
        {taskData.map((task, index) => (
          <div className="task-chart-row" key={index}>
            <div className="task-chart-label">
              <span
                className="task-dot"
                style={{ backgroundColor: task.color }}
              ></span>

              <span>{task.label}</span>
            </div>

            <div className="task-chart-progress">
              <div
                className="task-chart-fill"
                style={{
                  width: `${(task.value / maxValue) * 100}%`,
                  backgroundColor: task.color,
                }}
              ></div>
            </div>

            <div className="task-chart-value">{task.value}</div>
          </div>
        ))}
      </div>

      <div className="task-chart-footer">
        <strong>Total Tasks:</strong> {dashboard?.total_tasks || 0}
      </div>
    </div>
  );
};

export default TaskStatusChart;