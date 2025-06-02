// components/stats/ModernMetricCard.js - Clean dashboard-style metric card
import React from 'react';
import theme from '../../styles/theme';

export default function ModernMetricCard({ title, value, icon, subtitle }) {
  return (
    <div className="dashboard-card stat-card">
      <div 
        className="stat-icon" 
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.secondary})`,
          color: 'white',
          boxShadow: `0 4px 20px ${theme.colors.brand.primary}30`
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      
      <h3 className="stat-title">{title}</h3>
      
      <p 
        className="stat-value" 
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.secondary})`,
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