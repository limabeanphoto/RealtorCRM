// components/dashboard/AdminActions.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FaUsersCog, 
  FaUserPlus, 
  FaUserEdit, 
  FaFileImport, 
  FaChartBar
} from 'react-icons/fa';
import theme from '../../styles/theme';

export default function AdminActions({ animationDelay = 0 }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  // Set up animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  // Admin action items
  const actions = [
    {
      title: 'Assign Contacts',
      description: 'Bulk assign contacts to team members',
      icon: <FaUserEdit size={24} />,
      color: theme.colors.brand.primary,
      onClick: () => router.push('/admin/contacts/assign')
    },
    {
      title: 'Manage Users',
      description: 'Add, edit or remove team members',
      icon: <FaUsersCog size={24} />,
      color: theme.colors.brand.secondary,
      onClick: () => router.push('/admin/users')
    },
    {
      title: 'Add New User',
      description: 'Create a new team member account',
      icon: <FaUserPlus size={24} />,
      color: theme.colors.brand.accent,
      onClick: () => router.push('/admin/users/new')
    },
    {
      title: 'Import Contacts',
      description: 'Upload contact data from CSV',
      icon: <FaFileImport size={24} />,
      color: '#78e08f',
      onClick: () => router.push('/admin/contacts/import')
    },
    {
      title: 'View Analytics',
      description: 'See detailed team performance',
      icon: <FaChartBar size={24} />,
      color: '#e58e26',
      onClick: () => router.push('/stats')
    }
  ];
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      boxShadow: theme.shadows.sm,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: theme.colors.brand.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <FaUsersCog />
        Admin Actions
      </h3>
      
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {actions.map((action, index) => (
          <div
            key={action.title}
            onClick={action.onClick}
            style={{
              flex: '1 0 200px',
              backgroundColor: '#f8f9fa',
              borderRadius: theme.borderRadius.sm,
              padding: '1.25rem',
              cursor: 'pointer',
              borderLeft: `4px solid ${action.color}`,
              transition: 'all 0.2s ease',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
              transitionDelay: `${(animationDelay + 0.1 + (index * 0.1))}s`,
              ':hover': {
                backgroundColor: '#f0f0f0',
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows.md
              }
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{ 
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                {action.icon}
              </div>
              <h4 style={{ 
                margin: 0,
                color: theme.colors.brand.primary
              }}>
                {action.title}
              </h4>
            </div>
            <p style={{ 
              margin: 0,
              fontSize: '0.9rem',
              color: theme.colors.brand.text
            }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        div[style]:hover {
          background-color: #f0f0f0;
          transform: translateY(-2px);
          box-shadow: ${theme.shadows.md};
        }
      `}</style>
    </div>
  );
}