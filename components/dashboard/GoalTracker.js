import theme from '../../styles/theme';
import { FaTrophy, FaPhone } from 'react-icons/fa';

export default function GoalTracker({ 
  current = 0, 
  target = 10, 
  title = 'Daily Call Goal', 
  icon = 'calls' 
}) {
  // Calculate percentage
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  // Determine color based on progress
  const getColor = () => {
    if (percentage < 30) return theme.colors.brand.accent;
    if (percentage < 70) return theme.colors.brand.secondary;
    return theme.colors.brand.primary;
  };
  
  // Get icon
  const getIcon = () => {
    if (icon === 'calls') return <FaPhone size={20} />;
    if (icon === 'trophy') return <FaTrophy size={20} />;
    return null;
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      boxShadow: theme.shadows.sm,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem' 
      }}>
        <h3 style={{ 
          margin: 0, 
          color: theme.colors.brand.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {getIcon()}
          {title}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}>
          <span style={{ color: getColor() }}>{current}</span>
          <span style={{ color: theme.colors.brand.text, fontSize: '1rem' }}>&nbsp;/&nbsp;{target}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        height: '12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: getColor(),
          borderRadius: '6px',
          transition: 'width 0.5s ease-in-out',
        }} />
      </div>
      
      {/* Status */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.9rem',
        color: theme.colors.brand.text,
      }}>
        {percentage >= 100 ? (
          <div style={{ 
            color: theme.colors.brand.primary,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <FaTrophy color={theme.colors.brand.highlight} />
            Goal Achieved! Well done!
          </div>
        ) : (
          `${percentage}% Complete - ${target - current} more to go!`
        )}
      </div>
    </div>
  );
}