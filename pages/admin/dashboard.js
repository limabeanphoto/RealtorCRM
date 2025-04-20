import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardSummary from '../../components/dashboard/DashboardSummary';
import Layout from '../../components/Layout';

export default function AdminDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      // Redirect to regular dashboard if not admin
      router.push('/');
      return;
    }
  }, [router]);
  
  return (
    <ProtectedRoute adminOnly={true}>
      <div className="page-transition" style={{ width: '100%' }}>
        <DashboardSummary />
      </div>
    </ProtectedRoute>
  );
}