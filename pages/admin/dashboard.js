import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamMetrics, setTeamMetrics] = useState({
    totalCalls: 0,
    totalDeals: 0,
    openContacts: 0,
    assignedContacts: 0,
    teamMembers: []
  });

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Metrics Cards - Fixed 3-column layout with proper spacing */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        marginBottom: '20px',
        gap: '20px',
      }}>
        {/* Card 1 */}
        <div style={{ 
          flex: '1 1 calc(33.333% - 14px)', 
          minWidth: '250px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h3>Weekly Team Calls</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</p>
        </div>
        
        {/* Card 2 */}
        <div style={{ 
          flex: '1 1 calc(33.333% - 14px)', 
          minWidth: '250px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h3>Weekly Team Deals</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</p>
        </div>
        
        {/* Card 3 */}
        <div style={{ 
          flex: '1 1 calc(33.333% - 14px)', 
          minWidth: '250px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h3>Team Conversion Rate</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>0%</p>
        </div>
      </div>
      
      {/* Contacts Cards - 2-column layout with proper spacing */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        marginBottom: '20px',
        gap: '20px',
      }}>
        {/* Open Contacts Card */}
        <div style={{ 
          flex: '1 1 calc(50% - 10px)', 
          minWidth: '300px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '20px',
        }}>
          <h3>Open Contacts</h3>
          <p>0 contacts available</p>
          <button
            onClick={() => router.push('/admin/contacts?status=Open')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Manage Open Contacts
          </button>
        </div>
        
        {/* Assigned Contacts Card */}
        <div style={{ 
          flex: '1 1 calc(50% - 10px)', 
          minWidth: '300px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '20px',
        }}>
          <h3>Assigned Contacts</h3>
          <p>0 contacts available</p>
          <button
            onClick={() => router.push('/admin/contacts?status=Assigned')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Manage Assigned Contacts
          </button>
        </div>
      </div>
      
      {/* Team Performance Section */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h3 style={{ margin: 0 }}>Team Performance</h3>
          <button
            onClick={() => router.push('/admin/users')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Manage Users
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
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
                        backgroundColor: theme.colors.brand.primary,
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        borderRadius: '4px',
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
      
      {/* Admin Actions Section */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Admin Actions</h3>
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => router.push('/admin/users/new')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add New User
          </button>
          <button
            onClick={() => router.push('/admin/contacts/import')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Import Contacts
          </button>
          <button
            onClick={() => router.push('/admin/contacts/assign')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Assign Contacts
          </button>
          <button
            onClick={() => router.push('/admin/analytics')}
            style={{
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
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