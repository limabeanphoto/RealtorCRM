// pages/admin/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [teamMetrics, setTeamMetrics] = useState({
    totalCalls: 0,
    totalDeals: 0,
    openContacts: 0,
    assignedContacts: 0,
    teamMembers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setLoading(false);
  }, []);

  // Card component for metric display
  const MetricCard = ({ title, value }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.sm,
      padding: '1.5rem',
      textAlign: 'center',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      <p style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        margin: 0 
      }}>{value}</p>
    </div>
  );

  // Card component for contact sections
  const ContactCard = ({ title, count, buttonText, onClick }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.sm,
      padding: '1.5rem',
      height: '100%',
      width: '100%', // Ensure full width within grid cell
    }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
        {count} contacts available
      </p>
      <button 
        onClick={onClick}
        style={{
          backgroundColor: theme.colors.brand.accent,
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
        }}
      >
        {buttonText}
      </button>
    </div>
  );

  if (loading) {
    return <p>Loading dashboard data...</p>;
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Metrics Row */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        width: '100%',
      }}>
        <MetricCard title="Weekly Team Calls" value="0" />
        <MetricCard title="Weekly Team Deals" value="0" />
        <MetricCard title="Team Conversion Rate" value="0%" />
      </div>
      
      {/* Contacts Row - Fixed to ensure proper spacing */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        width: '100%',
      }}>
        <div style={{ width: '100%' }}>
          <ContactCard 
            title="Open Contacts" 
            count="0" 
            buttonText="Manage Open Contacts" 
            onClick={() => router.push('/admin/contacts?status=Open')}
          />
        </div>
        <div style={{ width: '100%' }}>
          <ContactCard 
            title="Assigned Contacts" 
            count="0" 
            buttonText="Manage Assigned Contacts" 
            onClick={() => router.push('/admin/contacts?status=Assigned')}
          />
        </div>
      </div>
      
      {/* Team Performance */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.sm,
        padding: '1.5rem',
        marginBottom: '1.5rem',
        width: '100%',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ margin: 0 }}>Team Performance</h2>
          <button
            onClick={() => router.push('/admin/users')}
            style={{
              backgroundColor: theme.colors.brand.accent,
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            Manage Users
          </button>
        </div>
        
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Weekly Calls</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Weekly Deals</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Conversion Rate</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Assigned Contacts</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>No team members found.</span>
                    <button
                      onClick={() => router.push('/admin/users/new')}
                      style={{
                        backgroundColor: theme.colors.brand.accent,
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Add User
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Admin Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.sm,
        padding: '1.5rem',
        width: '100%',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Admin Actions</h2>
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => router.push('/admin/users/new')}
            style={{
              backgroundColor: theme.colors.brand.accent,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            Add New User
          </button>
          <button
            onClick={() => router.push('/admin/contacts/import')}
            style={{
              backgroundColor: theme.colors.brand.accent,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            Import Contacts
          </button>
          <button
            onClick={() => router.push('/admin/contacts/assign')}
            style={{
              backgroundColor: theme.colors.brand.accent,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            Assign Contacts
          </button>
          <button
            onClick={() => router.push('/admin/analytics')}
            style={{
              backgroundColor: theme.colors.brand.accent,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
            }}
          >
            Team Analytics
          </button>
        </div>
      </div>
    </div>
  );
}