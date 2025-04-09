// File: components/dashboard/Greeting.js
import { useState, useEffect } from 'react';
import theme from '../../styles/theme';

export default function Greeting() {
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState('');
  
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
    
    // For demo purposes, hardcoded name
    // In a real app, you'd get this from user context/state
    setName('Team');
    setGreeting(greetingText);
  }, []);
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: theme.shadows.sm,
      borderLeft: `4px solid ${theme.colors.brand.primary}`,
    }}>
      <h1 style={{ 
        color: theme.colors.brand.primary,
        marginBottom: '0.5rem'
      }}>
        {greeting}, {name}!
      </h1>
      <p style={{ 
        fontSize: '1.1rem',
        color: theme.colors.brand.text,
        margin: 0
      }}>
        Welcome to your Realtor CRM dashboard. Here's your activity for today.
      </p>
    </div>
  );
}