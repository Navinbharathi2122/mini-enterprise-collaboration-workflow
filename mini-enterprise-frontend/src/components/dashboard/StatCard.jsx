
import React from "react";
import "./StatCard.css";

const StatCard = ({
  title,
  value,
  icon,
  color = "#2563eb",
  subtitle = "",
}) => {
  return (
    <div className="stat-card" style={{ borderLeft: `6px solid ${color}` }}>
      <div className="stat-card-top">
        <div className="stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>

        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h2 className="stat-value">{value}</h2>
        </div>
      </div>

      {subtitle && (
        <div className="stat-card-bottom">
          <span className="stat-subtitle">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;