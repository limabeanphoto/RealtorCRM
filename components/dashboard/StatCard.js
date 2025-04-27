// Updated components/dashboard/StatCard.js with enhanced shadows
import React from 'react';
import { FaPhone, FaCalendarAlt, FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';

export default function StatCard({ title, value, icon, color }) {
  const getIcon = () => {
    switch (icon) {
      case 'phone':
        return <FaPhone size={32} />;
      case 'calendar':
        return <FaCalendarAlt size={32} />;
      case 'chart':
        return <FaChartLine size={32} />;
      case 'users':
        return <FaUsers size={32} />;
      case 'check':
        return <FaCheckCircle size={32} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-card stat-card">
      <div className="stat-icon" style={{ color: color || '#4a69bd' }}>
        {getIcon()}
      </div>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value" style={{ color: color || '#4a69bd' }}>
        {value}
      </p>
    </div>
  );
}