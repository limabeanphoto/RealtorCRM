import { useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
    
    // Removed the admin redirect logic - all users now use the same dashboard
  }, [router]);
  
  return (
    <ProtectedRoute>
      <div className="page-transition" style={{ width: '100%' }}>
        <DashboardSummary />
      </div>
    </ProtectedRoute>
  );
}