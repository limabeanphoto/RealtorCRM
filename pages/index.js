import { useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';
import '../styles/dashboard.css';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
    
    // Redirect admin users to admin dashboard
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [router]);
  
  return (
    <ProtectedRoute>
      <div className="page-transition" style={{ width: '100%' }}>
        <DashboardSummary />
      </div>
    </ProtectedRoute>
  );
}