// components/dashboard/TeamLeaderboard.js
import { useState, useEffect } from 'react';
import { FaTrophy, FaPhone, FaHandshake, FaExchangeAlt } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function TeamLeaderboard({ animationDelay = 0 }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Fetch team members data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }
        
        // Fetch team members
        const usersResponse = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const userData = await usersResponse.json();
        
        if (userData.success) {
          // Only include member users (not admins)
          const memberUsers = userData.data.filter(user => user.role === 'member');
          
          // For each user, fetch their performance metrics
          const userPromises = memberUsers.map(async (user) => {
            // Get current date range for this week
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(today);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Fetch user's metrics for this week
            const metricsResponse = await fetch(
              `/api/stats/metrics?startDate=${encodeURIComponent(startOfWeek.toISOString())}&endDate=${encodeURIComponent(endOfWeek.toISOString())}&userId=${user.id}`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            
            const metricsData = await metricsResponse.json();
            
            if (metricsData.success) {
              return {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                calls: metricsData.callsMetrics?.total || 0,
                deals: metricsData.dealsMetrics?.total || 0,
                conversionRate: metricsData.conversionRates?.rate || 0,
                assignedContacts: 0 // We'll fetch this separately if needed
              };
            }
            
            // Default data if metrics fetch fails
            return {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              calls: 0,
              deals: 0,
              conversionRate: 0,
              assignedContacts: 0
            };
          });
          
          const teamData = await Promise.all(userPromises);
          
          // Sort by calls made (descending)
          teamData.sort((a, b) => b.calls - a.calls);
          
          setTeamMembers(teamData);
        } else {
          console.error('Error fetching team members:', userData.message);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setLoading(false);
      }
    };
    
    fetchTeamData();
    
    // Animation timer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      boxShadow: theme.shadows.sm,
      marginBottom: '1rem',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
      overflow: 'hidden',
      width: '100%'
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: theme.colors.brand.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <FaTrophy />
        Team Performance
      </h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Loading team data...
        </div>
      ) : teamMembers.length > 0 ? (
        <div style={{ overflow: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '600px'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '0.75rem 0.5rem', 
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  Team Member
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem 0.5rem', 
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaPhone size={14} />
                    Calls
                  </div>
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem 0.5rem', 
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaHandshake size={14} />
                    Deals
                  </div>
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '0.75rem 0.5rem', 
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaExchangeAlt size={14} />
                    Conv. Rate
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, index) => (
                <tr 
                  key={member.id}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                    transition: `opacity 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s, transform 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s`,
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                  }}
                >
                  <td style={{ 
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {index === 0 && (
                      <span style={{ color: '#FFD700' }}>
                        <FaTrophy size={14} />
                      </span>
                    )}
                    {member.name}
                  </td>
                  <td style={{ 
                    textAlign: 'center', 
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: member.calls === Math.max(...teamMembers.map(m => m.calls)) && member.calls > 0 ? 'bold' : 'normal',
                    color: member.calls === Math.max(...teamMembers.map(m => m.calls)) && member.calls > 0 ? theme.colors.brand.primary : 'inherit'
                  }}>
                    {member.calls}
                  </td>
                  <td style={{ 
                    textAlign: 'center', 
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: member.deals === Math.max(...teamMembers.map(m => m.deals)) && member.deals > 0 ? 'bold' : 'normal',
                    color: member.deals === Math.max(...teamMembers.map(m => m.deals)) && member.deals > 0 ? theme.colors.brand.secondary : 'inherit'
                  }}>
                    {member.deals}
                  </td>
                  <td style={{ 
                    textAlign: 'center', 
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: member.conversionRate === Math.max(...teamMembers.map(m => m.conversionRate)) && member.conversionRate > 0 ? 'bold' : 'normal',
                    color: member.conversionRate === Math.max(...teamMembers.map(m => m.conversionRate)) && member.conversionRate > 0 ? theme.colors.brand.accent : 'inherit'
                  }}>
                    {member.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: theme.colors.brand.text 
        }}>
          No team members found. Add team members to view performance.
        </div>
      )}
    </div>
  );
}