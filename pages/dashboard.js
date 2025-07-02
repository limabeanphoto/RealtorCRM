import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import Layout from '../components/Layout';

export default function Dashboard() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
  }, [router]);
  
  return (
    <ProtectedRoute>
      <div className="page-transition">
        <DashboardSummary />
      </div>
    </ProtectedRoute>
  );
}