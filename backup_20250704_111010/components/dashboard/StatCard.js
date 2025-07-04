// Updated components/dashboard/StatCard.js with white icons on colored backgrounds
import React from 'react';
import { FaPhone, FaCalendarAlt, FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';

export default function StatCard({ title, value, icon, color }) {
  const getIcon = () => {
    switch (icon) {
      case 'phone':
        return <FaPhone size={32} color="white" />; // Changed to white
      case 'calendar':
        return <FaCalendarAlt size={32} color="white" />; // Changed to white
      case 'chart':
        return <FaChartLine size={32} color="white" />; // Changed to white
      case 'users':
        return <FaUsers size={32} color="white" />; // Changed to white
      case 'check':
        return <FaCheckCircle size={32} color="white" />; // Changed to white
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-card stat-card">
      <div className="stat-icon" style={{ 
        color: 'white', // Ensure icon container also uses white
        backgroundColor: color || '#4a69bd' // Use the provided color for background
      }}>
        {getIcon()}
      </div>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value" style={{ color: color || '#4a69bd' }}>
        {value}
      </p>
    </div>
  );
}