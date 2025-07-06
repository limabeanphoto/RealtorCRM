import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaChartBar, FaDownload } from 'react-icons/fa';
import theme from '../../styles/theme';

const UsageTracker = ({ userId, onUsageUpdate, showHeader = true }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Fetch usage data
  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/scraping/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsage(data.data);
      setAlerts(data.data.alerts || []);
      setError(null);
      
      if (onUsageUpdate) {
        onUsageUpdate(data.data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportUsageReport = async () => {
    try {
      const response = await fetch('/api/scraping/usage?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export usage report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scraping-usage-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting usage report:', err);
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 75) return '#f59e0b';
    if (percentage >= 50) return '#eab308';
    return '#10b981';
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return <FaExclamationTriangle />;
      case 'success': return <FaCheckCircle />;
      case 'info': return <FaInfoCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: `1px solid ${theme.colors.neutral[200]}`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.brand.background
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
        <p style={{ marginTop: '1rem', color: theme.colors.neutral[600] }}>Loading usage data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: `1px solid #ef4444`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#fef2f2'
      }}>
        <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }} />
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error loading usage data</p>
        <button 
          onClick={fetchUsage}
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

  if (!usage) {
    return null;
  }

  return (
    <div style={{ 
      border: `1px solid ${theme.colors.neutral[200]}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.brand.background,
      overflow: 'hidden'
    }}>
      {showHeader && (
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${theme.colors.neutral[200]}`,
          backgroundColor: theme.colors.brand.primary + '10',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: theme.colors.brand.primary }}>
            <FaChartBar style={{ marginRight: '0.5rem' }} />
            Usage Tracking
          </h3>
          <button
            onClick={exportUsageReport}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <FaDownload />
            Export Report
          </button>
        </div>
      )}

      <div style={{ padding: '1.5rem' }}>
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: getAlertColor(alert.type) + '10',
                  border: `1px solid ${getAlertColor(alert.type)}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ color: getAlertColor(alert.type) }}>
                  {getAlertIcon(alert.type)}
                </span>
                <div>
                  <strong style={{ color: getAlertColor(alert.type) }}>
                    {alert.title}
                  </strong>
                  <p style={{ margin: 0, color: theme.colors.neutral[600], fontSize: '0.875rem' }}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Month Usage */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: theme.colors.neutral[900] }}>
            Current Month Usage
          </h4>
          
          {/* Overall Usage Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 'bold', color: theme.colors.neutral[900] }}>
                Total Requests
              </span>
              <span style={{ color: theme.colors.neutral[600] }}>
                {usage.current.totalRequests} / {usage.quotas.monthly.requests}
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              backgroundColor: theme.colors.neutral[200],
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%',
                width: `${Math.min(100, (usage.current.totalRequests / usage.quotas.monthly.requests) * 100)}%`,
                backgroundColor: getUsageColor((usage.current.totalRequests / usage.quotas.monthly.requests) * 100),
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          {/* Cost Usage Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 'bold', color: theme.colors.neutral[900] }}>
                Total Cost
              </span>
              <span style={{ color: theme.colors.neutral[600] }}>
                ${usage.current.totalCost.toFixed(2)} / ${usage.budgets.monthly.toFixed(2)}
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              backgroundColor: theme.colors.neutral[200],
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%',
                width: `${Math.min(100, (usage.current.totalCost / usage.budgets.monthly) * 100)}%`,
                backgroundColor: getUsageColor((usage.current.totalCost / usage.budgets.monthly) * 100),
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: theme.colors.neutral[900] }}>
            Provider Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {Object.entries(usage.providers).map(([provider, data]) => (
              <div
                key={provider}
                style={{
                  padding: '1rem',
                  border: `1px solid ${theme.colors.neutral[200]}`,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: theme.colors.brand.background
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontWeight: 'bold', color: theme.colors.neutral[900] }}>
                    {provider}
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    backgroundColor: data.requests > 0 ? theme.colors.brand.primary : theme.colors.neutral[200],
                    color: data.requests > 0 ? 'white' : theme.colors.neutral[600],
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.75rem'
                  }}>
                    {data.requests > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: theme.colors.neutral[600] }}>
                  <div>Requests: {data.requests}</div>
                  <div>Cost: ${data.cost.toFixed(2)}</div>
                  <div>Success Rate: {(data.successRate * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: theme.colors.neutral[900] }}>
            Performance Metrics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: theme.colors.brand.primary 
              }}>
                {(usage.performance.avgResponseTime / 1000).toFixed(1)}s
              </div>
              <div style={{ fontSize: '0.875rem', color: theme.colors.neutral[600] }}>
                Avg Response Time
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: theme.colors.brand.primary 
              }}>
                {(usage.performance.overallSuccessRate * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: theme.colors.neutral[600] }}>
                Success Rate
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: theme.colors.brand.primary 
              }}>
                {usage.performance.avgConfidence.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: theme.colors.neutral[600] }}>
                Avg Confidence
              </div>
            </div>
          </div>
        </div>

        {/* Usage Forecast */}
        {usage.forecast && (
          <div>
            <h4 style={{ marginBottom: '1rem', color: theme.colors.neutral[900] }}>
              Usage Forecast
            </h4>
            <div style={{ 
              padding: '1rem',
              backgroundColor: theme.colors.brand.primary + '10',
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.brand.primary}30`
            }}>
              <div style={{ fontSize: '0.875rem', color: theme.colors.neutral[600] }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Projected Monthly Usage:</strong> {usage.forecast.projectedRequests} requests
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Projected Monthly Cost:</strong> ${usage.forecast.projectedCost.toFixed(2)}
                </div>
                <div>
                  <strong>Days Until Quota Reset:</strong> {usage.forecast.daysUntilReset} days
                </div>
              </div>
            </div>
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

export default UsageTracker;