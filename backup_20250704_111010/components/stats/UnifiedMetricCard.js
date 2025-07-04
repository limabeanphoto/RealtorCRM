// components/stats/UnifiedMetricCard.js - Consolidated metric card with all features preserved
import React from 'react';
import theme from '../../styles/theme';

/**
 * Unified MetricCard component that consolidates MetricCard and ModernMetricCard
 * while preserving all unique features and visual styles
 * 
 * @param {string} title - The metric title
 * @param {string|number} value - The metric value
 * @param {React.ReactNode} icon - Icon to display
 * @param {string} color - Color for borders/accents (classic style only)
 * @param {string} subtext - Additional text below value (classic style only)
 * @param {string} subtitle - Subtitle text (modern style only)
 * @param {number} change - Change percentage with +/- indicator (analytics style only)
 * @param {'classic'|'modern'|'analytics'} variant - Visual style variant
 * @param {object} style - Additional custom styles
 */
export default function UnifiedMetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtext, 
  subtitle, 
  change = null,
  variant = 'classic',
  style = {} 
}) {
  // Use brand primary color as default if none provided
  const cardColor = color || theme.colors.brand.primary;

  // Analytics variant (from TeamAnalytics.js local component)
  if (variant === 'analytics') {
    return (
      <div style={{
        padding: theme.spacing(2),
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.cardBackground,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        ':hover': {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
        },
        ...style
      }}>
        {/* Icon display for analytics variant */}
        {icon && (
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: cardColor }}>
            {icon}
          </div>
        )}
        
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '0.9rem', 
          fontWeight: '500',
          color: theme.colors.text,
          lineHeight: 1.2
        }}>
          {title}
        </h3>
        
        <p style={{ 
          margin: '0', 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          color: theme.colors.text,
          lineHeight: 1
        }}>
          {value}
        </p>
        
        {change !== null && (
          <div style={{
            marginTop: theme.spacing(1),
            fontSize: '0.75rem',
            fontWeight: '500',
            color: change >= 0 ? theme.colors.success : theme.colors.error
          }}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    );
  }

  // Modern variant (from ModernMetricCard.js)
  if (variant === 'modern') {
    return (
      <div 
        className="dashboard-card stat-card"
        style={{
          ...style
        }}
      >
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

  // Classic variant (from MetricCard.js) - DEFAULT
  return (
    <div style={{
      flex: '1',
      minWidth: '200px',
      padding: '1.5rem',
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      textAlign: 'center',
      border: `1px solid ${cardColor}`,
      borderTop: `4px solid ${cardColor}`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.md
      },
      ...style
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <h3 style={{ margin: '0', color: cardColor }}>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: cardColor }}>
        {value}
      </p>
      {subtext && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: theme.colors.brand.text }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

// Export individual variant components for backward compatibility
export const ClassicMetricCard = (props) => (
  <UnifiedMetricCard {...props} variant="classic" />
);

export const ModernMetricCard = (props) => (
  <UnifiedMetricCard {...props} variant="modern" />
);

export const AnalyticsMetricCard = (props) => (
  <UnifiedMetricCard {...props} variant="analytics" />
);