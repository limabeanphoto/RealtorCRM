import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import Button from '../../components/common/Button'; // <-- Import Button

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
          {/* Replace with Button component */}
           <Button
            onClick={() => router.push('/admin/contacts?status=Open')}
            tooltip="View and manage contacts that are not yet assigned"
           >
            Manage Open Contacts
          </Button>
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
           {/* Replace with Button component */}
          <Button
            onClick={() => router.push('/admin/contacts?status=Assigned')}
            tooltip="View and manage contacts assigned to team members"
          >
            Manage Assigned Contacts
          </Button>
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
          {/* Use Button component with tooltip */}
          <Button
            onClick={() => router.push('/admin/users')}
            tooltip="Go to the user management page" // <-- Add tooltip
          >
            Manage Users
          </Button>
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
                    {/* Replace with Button component */}
                    <Button
                      onClick={() => router.push('/admin/users/new')}
                      size="small" // Use size prop for smaller button
                      tooltip="Add a new user to the team"
                    >
                      Add User
                    </Button>
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
        <h3 style={{ margin: '0 0 1rem 0' }}>Contact Management</h3>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <Button
            onClick={() => router.push('/admin/contacts/assign')}
            size="large"
            tooltip="Assign contacts to team members"
          >
            Assign Contacts
          </Button>
          
          <Button
            onClick={() => router.push('/admin/contacts?status=Open')}
            size="large"
            tooltip="View unassigned contacts"
          >
            View Open Contacts
          </Button>
          
          <Button
            onClick={() => router.push('/admin/contacts/import')}
            size="large"
            tooltip="Import contacts from a CSV file"
          >
            Import Contacts
          </Button>
        </div>
      </div>
    </div>
  );
}
