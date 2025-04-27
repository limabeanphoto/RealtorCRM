// Updated components/dashboard/GoalProgress.js with enhanced shadows
import React from 'react';
import { FaPhone, FaTrophy } from 'react-icons/fa';

export default function GoalProgress({ title, current, target, color }) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  // Get appropriate color based on progress
  const getBarColor = () => {
    if (percentage < 30) return '#e74c3c'; // Red for low progress
    if (percentage < 70) return '#f39c12'; // Orange for medium progress
    return color || '#2ecc71'; // Green or provided color for good progress
  };
  
  // Determine icon based on title
  const getIcon = () => {
    if (title.toLowerCase().includes('call')) {
      return <FaPhone size={18} />;
    }
    return <FaTrophy size={18} />;
  };

  return (
    <div className="dashboard-card goal-card">
      <div className="goal-header">
        <div className="goal-title">
          <span className="goal-icon" style={{ color: color || '#4a69bd' }}>
            {getIcon()}
          </span>
          <h3>{title}</h3>
        </div>
        <div className="goal-counts">
          <span className="goal-current" style={{ color: color || '#4a69bd' }}>{current}</span>
          <span className="goal-separator">/</span>
          <span className="goal-target">{target}</span>
        </div>
      </div>
      
      <div className="goal-progress-bar">
        <div 
          className="goal-progress" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getBarColor()
          }}
        ></div>
      </div>
      
      <div className="goal-percentage">
        {percentage}% Complete
        {percentage >= 100 && (
          <span className="goal-complete"> - Goal Achieved!</span>
        )}
      </div>
    </div>
  );
}