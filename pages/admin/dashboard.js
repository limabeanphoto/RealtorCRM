import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  DashboardCard, 
  StatCard, 
  ContactsCard, 
  ActionButton,
  RowLayout,
  Column
} from '../../components/dashboard/DashboardComponents';

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
    // Simulate fetching data - replace with your actual API calls
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
      {/* Metrics Row - 3 equal columns */}
      <RowLayout>
        <Column width="33.333%" mobileWidth="100%">
          <StatCard title="Weekly Team Calls" value="0" />
        </Column>
        <Column width="33.333%" mobileWidth="100%">
          <StatCard title="Weekly Team Deals" value="0" />
        </Column>
        <Column width="33.333%" mobileWidth="100%">
          <StatCard title="Team Conversion Rate" value="0%" />
        </Column>
      </RowLayout>

      {/* Contacts Row - 2 equal columns */}
      <RowLayout>
        <Column width="50%" mobileWidth="100%">
          <ContactsCard 
            title="Open Contacts" 
            count="0" 
            buttonText="Manage Open Contacts" 
            onClick={() => router.push('/admin/contacts?status=Open')}
          />
        </Column>
        <Column width="50%" mobileWidth="100%">
          <ContactsCard 
            title="Assigned Contacts" 
            count="0" 
            buttonText="Manage Assigned Contacts" 
            onClick={() => router.push('/admin/contacts?status=Assigned')}
          />
        </Column>
      </RowLayout>
      
      {/* Team Performance - Full Width Section */}
      <DashboardCard 
        title="Team Performance"
        actionButton={
          <ActionButton onClick={() => router.push('/admin/users')}>
            Manage Users
          </ActionButton>
        }
      >
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
                    <ActionButton small onClick={() => router.push('/admin/users/new')}>
                      Add User
                    </ActionButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DashboardCard>
      
      {/* Admin Actions - Full Width Section */}
      <DashboardCard title="Admin Actions">
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <ActionButton onClick={() => router.push('/admin/users/new')}>
            Add New User
          </ActionButton>
          <ActionButton onClick={() => router.push('/admin/contacts/import')}>
            Import Contacts
          </ActionButton>
          <ActionButton onClick={() => router.push('/admin/contacts/assign')}>
            Assign Contacts
          </ActionButton>
          <ActionButton onClick={() => router.push('/admin/analytics')}>
            Team Analytics
          </ActionButton>
        </div>
      </DashboardCard>
    </div>
  );
}