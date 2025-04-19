// components/dashboard/MetricCard.js
import { useState, useEffect } from 'react';
import theme from '../../styles/theme';
import { FaPhoneAlt, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtext,
  animationDelay = 0
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Determine which icon to use
  const getIcon = () => {
    switch (icon) {
      case '📞':
        return <FaPhoneAlt size={32} />;
      case '📅':
        return <FaCalendarAlt size={32} />;
      case '📈':
        return <FaChartLine size={32} />;
      default:
        return null;
    }
  };
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000); // Convert to milliseconds
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  // Use brand primary color as default if none provided
  const cardColor = color || theme.colors.brand.primary;
  
  return (
    <div style={{
      flex: '1 0 300px', // This ensures cards have a minimum width and flex properly
      maxWidth: '400px', // Prevent getting too wide
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      borderTop: `4px solid ${cardColor}`,
      display: 'flex',
      flexDirection: 'column',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.95)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
    }}>
      <div style={{ padding: '1.5rem', textAlign: 'center', flex: 1 }}>
        <div style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem',
          color: cardColor
        }}>
          {getIcon()}
        </div>
        <h3 style={{ 
          margin: '0', 
          color: cardColor,
          fontSize: '1.1rem',
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          margin: '0.5rem 0', 
          color: cardColor,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: `opacity 0.5s ease ${animationDelay + 0.3}s, transform 0.5s ease ${animationDelay + 0.3}s`,
        }}>
          {value}
        </p>
        
        {subtext && (
          <p style={{ 
            margin: 0, 
            fontSize: '0.9rem', 
            color: theme.colors.brand.text,
            opacity: isVisible ? 1 : 0,
            transition: `opacity 0.5s ease ${animationDelay + 0.5}s`,
          }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}