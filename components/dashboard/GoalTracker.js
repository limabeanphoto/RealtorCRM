// components/dashboard/GoalTracker.js
import { useState, useEffect } from 'react';
import { FaTrophy, FaPhone, FaCheck, FaCheckCircle } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function GoalTracker({ 
  current = 0, 
  target = 10, 
  title = 'Daily Call Goal', 
  icon = 'calls',
  animationDelay = 0
}) {
  const [percentage, setPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Animation effects
  useEffect(() => {
    // First make the card visible
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);
    
    // Then animate the progress bar
    const progressTimer = setTimeout(() => {
      const calculatedPercentage = Math.min(100, Math.round((current / target) * 100));
      setPercentage(calculatedPercentage);
      
      // Show celebration if goal achieved
      if (calculatedPercentage >= 100) {
        const celebrationTimer = setTimeout(() => {
          setShowCelebration(true);
        }, 1000);
        return () => clearTimeout(celebrationTimer);
      }
    }, (animationDelay + 0.5) * 1000);
    
    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(progressTimer);
    };
  }, [current, target, animationDelay]);
  
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
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Celebration Overlay - Only shows when goal is met */}
      {showCelebration && percentage >= 100 && (
        <div className="celebration-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          animation: 'fadeIn 0.5s ease-out',
        }}>
          <div className="trophy-icon" style={{
            color: theme.colors.brand.highlight,
            marginBottom: '1rem',
            animation: 'scaleIn 0.5s ease-out',
          }}>
            <FaTrophy size={64} />
          </div>
          <h3 style={{ 
            color: theme.colors.brand.primary,
            margin: '0 0 0.5rem 0',
            animation: 'moveUp 0.5s ease-out',
          }}>
            Goal Achieved!
          </h3>
          <p style={{ 
            color: theme.colors.brand.text,
            margin: 0,
            animation: 'moveUp 0.5s ease-out 0.2s',
            opacity: 1,
          }}>
            Great job! You've hit your target.
          </p>
          <button 
            className="close-celebration" 
            onClick={() => setShowCelebration(false)}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              marginTop: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'moveUp 0.5s ease-out 0.4s',
            }}
          >
            <FaCheck /> Got it!
          </button>
        </div>
      )}

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
          opacity: isVisible ? 1 : 0,
          transition: `opacity 0.5s ease ${animationDelay + 0.3}s`,
        }}>
          {getIcon()}
          {title}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          opacity: isVisible ? 1 : 0,
          transition: `opacity 0.5s ease ${animationDelay + 0.4}s`,
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
          transition: 'width 1s ease-in-out',
        }} />
      </div>
      
      {/* Status */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.9rem',
        color: theme.colors.brand.text,
        opacity: isVisible ? 1 : 0,
        transition: `opacity 0.5s ease ${animationDelay + 0.6}s`,
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
            <FaCheckCircle color={theme.colors.brand.highlight} />
            Goal Achieved! Well done!
          </div>
        ) : (
          `${percentage}% Complete - ${target - current} more to go!`
        )}
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes moveUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .celebration-overlay {
          animation: fadeIn 0.5s ease-out;
        }
        
        .trophy-icon {
          animation: scaleIn 0.5s ease-out 0.2s both;
        }
        
        .close-celebration {
          animation: moveUp 0.5s ease-out 0.4s both;
        }
        
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
      `}</style>
    </div>
  );
}