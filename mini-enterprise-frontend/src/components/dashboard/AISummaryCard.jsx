import React from "react";
import "./AISummaryCard.css";

const AISummaryCard = ({ aiSummary }) => {
  if (!aiSummary) {
    return (
      <div className="ai-card loading-card">
        <h3>AI Enterprise Summary</h3>
        <p>Loading AI insights...</p>
      </div>
    );
  }

  const score = aiSummary.productivity_score || 0;

  const scoreColor =
    score >= 80
      ? "#16A34A"
      : score >= 60
      ? "#2563EB"
      : score >= 40
      ? "#F59E0B"
      : "#DC2626";

  const riskColor =
    aiSummary.risk_level === "Low"
      ? "#16A34A"
      : aiSummary.risk_level === "Medium"
      ? "#F59E0B"
      : "#DC2626";

  return (
    <div className="ai-card">
      <div className="ai-header">
        <div>
          <h2>Enterprise AI Summary</h2>
          <p>Live intelligence generated from FastAPI AI Dashboard API</p>
        </div>

        <div className="ai-badge">AI</div>
      </div>

      {/* Productivity Score */}
      <div className="score-section">
        <div className="score-info">
          <h4>Productivity Score</h4>
          <h1 style={{ color: scoreColor }}>{score}%</h1>
        </div>

        <div className="score-bar">
          <div
            className="score-fill"
            style={{
              width: `${score}%`,
              backgroundColor: scoreColor,
            }}
          ></div>
        </div>
      </div>

      {/* AI Metrics */}
      <div className="ai-grid">
        <div className="metric-card">
          <span className="metric-title">Risk Level</span>

          <h3 style={{ color: riskColor }}>
            {aiSummary.risk_level || "Unknown"}
          </h3>
        </div>

        <div className="metric-card">
          <span className="metric-title">Pending Approvals</span>

          <h3>{aiSummary.pending_approvals || 0}</h3>
        </div>

        <div className="metric-card">
          <span className="metric-title">Leave Alerts</span>

          <h3>{aiSummary.leave_alerts || 0}</h3>
        </div>

        <div className="metric-card">
          <span className="metric-title">Notifications</span>

          <h3>{aiSummary.notification_count || 0}</h3>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="recommendation-box">
        <h3>AI Recommendations</h3>

        {aiSummary.recommendations &&
        aiSummary.recommendations.length > 0 ? (
          <ul>
            {aiSummary.recommendations.map((item, index) => (
              <li key={index}> {item}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available.</p>
        )}
      </div>
    </div>
  );
};

export default AISummaryCard;