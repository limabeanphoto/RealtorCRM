// components/dashboard/AnimatedGreeting.js
import { useState, useEffect } from 'react';
import theme from '../../styles/theme';

export default function AnimatedGreeting({ firstName = 'Team' }) {
  const [greeting, setGreeting] = useState('');
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    // Get time of day for greeting
    const hour = new Date().getHours();
    let greetingText = '';
    
    if (hour < 12) {
      greetingText = 'Good morning';
    } else if (hour < 18) {
      greetingText = 'Good afternoon';
    } else {
      greetingText = 'Good evening';
    }
    
    setGreeting(greetingText);
    
    // Trigger animation after a short delay
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: theme.shadows.sm,
      borderLeft: `4px solid ${theme.colors.brand.primary}`,
      overflow: 'hidden',
      opacity: animated ? 1 : 0,
      transform: animated ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease',
    }}>
      <h1 style={{ 
        color: theme.colors.brand.primary,
        marginBottom: '0.5rem',
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
      }}>
        <span className="greeting-text">{greeting}, </span>
        <span className="greeting-name">{firstName}!</span>
      </h1>
      <p style={{ 
        fontSize: '1.1rem',
        color: theme.colors.brand.text,
        margin: 0,
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
      }}>
        Welcome to your Realtor CRM dashboard. Here's your activity for today.
      </p>
      
      <style jsx>{`
        .greeting-text, .greeting-name {
          display: inline-block;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}