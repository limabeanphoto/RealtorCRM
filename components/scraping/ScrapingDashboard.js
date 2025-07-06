import { useState, useEffect } from 'react';
import { FaChartLine, FaClock, FaBolt, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import theme from '../../styles/theme';
import UsageTracker from './UsageTracker';

const ScrapingDashboard = ({ compact = false, showUsageTracker = true }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/scraping/usage?dashboard=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#059669';
      case 'fair': return '#eab308';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthStatus = (data) => {
    if (!data) return 'unknown';
    
    const successRate = data.performance?.overallSuccessRate || 0;
    const budgetUsage = (data.current?.totalCost || 0) / (data.budgets?.monthly || 1);
    
    if (successRate >= 0.95 && budgetUsage < 0.8) return 'excellent';
    if (successRate >= 0.85 && budgetUsage < 0.9) return 'good';
    if (successRate >= 0.7 && budgetUsage < 0.95) return 'fair';
    return 'poor';
  };

  const formatDuration = (ms) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div style={{ 
        padding: compact ? '1rem' : '2rem', 
        textAlign: 'center',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: `4px solid ${theme.colors.brand.primary}20`,
          borderTop: `4px solid ${theme.colors.brand.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '1rem', color: theme.colors.text.secondary }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: compact ? '1rem' : '2rem', 
        textAlign: 'center',
        border: `1px solid #ef4444`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#fef2f2'
      }}>
        <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }} />
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Dashboard unavailable</p>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: theme.colors.brand.primary,
            color: 'white',
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const healthStatus = getHealthStatus(dashboardData);

  return (
    <div style={{ 
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: compact ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.brand.primary + '10',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: theme.colors.brand.primary, fontSize: compact ? '1rem' : '1.125rem' }}>
          <FaChartLine style={{ marginRight: '0.5rem' }} />
          Scraping Dashboard
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {lastUpdate && (
            <span style={{ fontSize: '0.75rem', color: theme.colors.text.secondary }}>
              Updated {formatDuration(Date.now() - lastUpdate.getTime())} ago
            </span>
          )}
          <button
            onClick={fetchDashboardData}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              color: theme.colors.brand.primary,
              border: `1px solid ${theme.colors.brand.primary}`,
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            <FaSync />
          </button>
        </div>
      </div>

      <div style={{ padding: compact ? '1rem' : '1.5rem' }}>
        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr 1fr', 
          gap: compact ? '0.75rem' : '1rem',
          marginBottom: compact ? '1rem' : '2rem'
        }}>
          {/* System Health */}
          <div style={{
            padding: compact ? '0.75rem' : '1rem',
            border: `2px solid ${getStatusColor(healthStatus)}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: getStatusColor(healthStatus) + '10',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: compact ? '1rem' : '1.25rem', 
              fontWeight: 'bold', 
              color: getStatusColor(healthStatus),
              textTransform: 'capitalize'
            }}>
              {healthStatus}
            </div>
            <div style={{ fontSize: compact ? '0.75rem' : '0.875rem', color: theme.colors.text.secondary }}>
              System Health
            </div>
          </div>

          {/* Success Rate */}
          <div style={{
            padding: compact ? '0.75rem' : '1rem',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.background,
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: compact ? '1rem' : '1.25rem', 
              fontWeight: 'bold', 
              color: theme.colors.brand.primary 
            }}>
              {((dashboardData?.performance?.overallSuccessRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: compact ? '0.75rem' : '0.875rem', color: theme.colors.text.secondary }}>
              Success Rate
            </div>
          </div>

          {/* Response Time */}
          {!compact && (
            <div style={{
              padding: '1rem',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.background,
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: theme.colors.brand.primary 
              }}>
                {((dashboardData?.performance?.avgResponseTime || 0) / 1000).toFixed(1)}s
              </div>
              <div style={{ fontSize: '0.875rem', color: theme.colors.text.secondary }}>
                <FaClock style={{ marginRight: '0.25rem' }} />
                Avg Time
              </div>
            </div>
          )}

          {/* Budget Usage */}
          <div style={{
            padding: compact ? '0.75rem' : '1rem',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.background,
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: compact ? '1rem' : '1.25rem', 
              fontWeight: 'bold', 
              color: theme.colors.brand.primary 
            }}>
              ${(dashboardData?.current?.totalCost || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: compact ? '0.75rem' : '0.875rem', color: theme.colors.text.secondary }}>
              This Month
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {!compact && dashboardData?.recentActivity && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>
              Recent Activity
            </h4>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm
            }}>
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    borderBottom: index < 4 ? `1px solid ${theme.colors.border}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: theme.colors.text.primary }}>
                      {activity.url ? new URL(activity.url).hostname : 'Unknown URL'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.colors.text.secondary }}>
                      {activity.method} • {activity.confidence}% confidence
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: activity.success ? '#10b981' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {activity.success ? 'Success' : 'Failed'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.colors.text.secondary }}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Status */}
        {!compact && dashboardData?.providers && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>
              Provider Status
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {Object.entries(dashboardData.providers).map(([provider, data]) => (
                <div
                  key={provider}
                  style={{
                    padding: '0.75rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.background
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontWeight: 'bold', color: theme.colors.text.primary, fontSize: '0.875rem' }}>
                      {provider}
                    </span>
                    <span style={{ 
                      padding: '0.125rem 0.25rem',
                      backgroundColor: data.requests > 0 ? '#10b981' : '#6b7280',
                      color: 'white',
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.625rem'
                    }}>
                      {data.requests > 0 ? 'Active' : 'Idle'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme.colors.text.secondary }}>
                    <div>{data.requests} requests</div>
                    <div>{(data.successRate * 100).toFixed(0)}% success</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!compact && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>
              Quick Actions
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.href = '/settings'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.colors.brand.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Configure Providers
              </button>
              <button
                onClick={() => fetchDashboardData()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: theme.colors.brand.primary,
                  border: `1px solid ${theme.colors.brand.primary}`,
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <FaBolt style={{ marginRight: '0.25rem' }} />
                Test Scraping
              </button>
            </div>
          </div>
        )}

        {/* Usage Tracker Integration */}
        {showUsageTracker && !compact && (
          <div style={{ marginTop: '2rem' }}>
            <UsageTracker showHeader={false} />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScrapingDashboard;