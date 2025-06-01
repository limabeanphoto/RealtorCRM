// components/stats/ModernMetricCard.js - Dashboard-style metric card
import React from 'react';

export default function ModernMetricCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="dashboard-card stat-card">
      <div 
        className="stat-icon" 
        style={{ 
          background: `linear-gradient(135deg, ${color}, ${adjustColor(color, 20)})`,
          color: 'white',
          boxShadow: `0 4px 20px ${color}30`
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      
      <h3 className="stat-title">{title}</h3>
      
      <p 
        className="stat-value" 
        style={{ 
          background: `linear-gradient(135deg, ${color}, ${adjustColor(color, 20)})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        {value}
      </p>
      
      {subtitle && (
        <p style={{ 
          fontSize: '0.85rem', 
          color: '#7A7A73', 
          margin: '0.5rem 0 0 0',
          textAlign: 'center',
          opacity: 0.8
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  // Simple color adjustment - in production you might want a more robust solution
  const colors = {
    '#8F9F3B': '#BCCB5C',
    '#BCCB5C': '#8F9F3B', 
    '#6187BC': '#7BA7E1',
    '#e58e26': '#f5a623',
    '#b71540': '#d63031'
  };
  
  return colors[color] || color;
}