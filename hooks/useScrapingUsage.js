import { useState, useEffect, useCallback } from 'react';

const useScrapingUsage = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    onUsageUpdate,
    onQuotaExceeded,
    onAlert
  } = options;

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [quotas, setQuotas] = useState(null);

  // Fetch usage data
  const fetchUsage = useCallback(async () => {
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
      
      // Call callbacks
      if (onUsageUpdate) {
        onUsageUpdate(data.data);
      }
      
      // Check for quota exceeded
      if (data.data.quotaExceeded && onQuotaExceeded) {
        onQuotaExceeded(data.data.quotaExceeded);
      }
      
      // Check for new alerts
      if (data.data.alerts && data.data.alerts.length > 0 && onAlert) {
        data.data.alerts.forEach(alert => {
          if (alert.isNew) {
            onAlert(alert);
          }
        });
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching usage:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onUsageUpdate, onQuotaExceeded, onAlert]);

  // Fetch quota configuration
  const fetchQuotas = useCallback(async () => {
    try {
      const response = await fetch('/api/scraping/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota configuration');
      }
      
      const data = await response.json();
      setQuotas(data.data.budgets);
      return data.data.budgets;
    } catch (err) {
      console.error('Error fetching quotas:', err);
      throw err;
    }
  }, []);

  // Update quota configuration
  const updateQuotas = useCallback(async (newQuotas) => {
    try {
      const response = await fetch('/api/scraping/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          budgets: newQuotas
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quotas');
      }

      const data = await response.json();
      setQuotas(data.data.budgets);
      
      // Refresh usage data to reflect new quotas
      await fetchUsage();
      
      return data.data.budgets;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchUsage]);

  // Clear usage data (for testing or admin purposes)
  const clearUsage = useCallback(async (type = 'current') => {
    try {
      const response = await fetch('/api/scraping/usage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        throw new Error('Failed to clear usage data');
      }

      // Refresh usage data
      await fetchUsage();
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchUsage]);

  // Track a manual usage event
  const trackUsage = useCallback(async (usageData) => {
    try {
      const response = await fetch('/api/scraping/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'track',
          data: usageData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to track usage');
      }

      // Refresh usage data
      await fetchUsage();
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchUsage]);

  // Check if budget/quota would be exceeded for a planned operation
  const checkQuota = useCallback(async (plannedCost = 0, plannedRequests = 1) => {
    try {
      const response = await fetch('/api/scraping/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'check',
          plannedCost,
          plannedRequests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check quota');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Export usage data
  const exportUsage = useCallback(async (format = 'csv', dateRange = null) => {
    try {
      let url = `/api/scraping/usage?format=${format}`;
      if (dateRange) {
        url += `&start=${dateRange.start}&end=${dateRange.end}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export usage data');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `scraping-usage-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Dismiss an alert
  const dismissAlert = useCallback(async (alertId) => {
    try {
      // Update local state immediately for better UX
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      // Call API to dismiss server-side
      await fetch('/api/scraping/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'dismissAlert',
          alertId
        })
      });
      
      return true;
    } catch (err) {
      console.error('Error dismissing alert:', err);
      // Refresh to get correct state
      await fetchUsage();
      throw err;
    }
  }, [fetchUsage]);

  // Get usage statistics and insights
  const getUsageInsights = useCallback(() => {
    if (!usage) return null;

    const insights = {
      budgetHealth: 'good',
      quotaHealth: 'good',
      costEfficiency: 'good',
      recommendations: []
    };

    // Analyze budget health
    const monthlyBudgetUsage = (usage.current?.totalCost || 0) / (usage.budgets?.monthly || 1);
    if (monthlyBudgetUsage >= 0.9) {
      insights.budgetHealth = 'critical';
      insights.recommendations.push('Consider increasing monthly budget or reducing usage');
    } else if (monthlyBudgetUsage >= 0.75) {
      insights.budgetHealth = 'warning';
      insights.recommendations.push('Monitor budget usage closely');
    }

    // Analyze quota health
    const monthlyQuotaUsage = (usage.current?.totalRequests || 0) / (usage.quotas?.monthly?.requests || 1);
    if (monthlyQuotaUsage >= 0.9) {
      insights.quotaHealth = 'critical';
      insights.recommendations.push('Consider upgrading ScraperAPI plan or optimizing usage');
    } else if (monthlyQuotaUsage >= 0.75) {
      insights.quotaHealth = 'warning';
      insights.recommendations.push('Monitor request usage closely');
    }

    // Analyze cost efficiency
    const avgCostPerRequest = (usage.current?.totalCost || 0) / (usage.current?.totalRequests || 1);
    if (avgCostPerRequest > 0.05) {
      insights.costEfficiency = 'poor';
      insights.recommendations.push('High cost per request - consider optimizing AI usage');
    } else if (avgCostPerRequest > 0.02) {
      insights.costEfficiency = 'fair';
      insights.recommendations.push('Moderate cost per request - room for optimization');
    }

    // Success rate analysis
    const successRate = usage.performance?.overallSuccessRate || 0;
    if (successRate < 0.8) {
      insights.recommendations.push('Low success rate - check provider configurations');
    }

    return insights;
  }, [usage]);

  // Auto-refresh setup
  useEffect(() => {
    fetchUsage();
    fetchQuotas();
    
    if (autoRefresh) {
      const interval = setInterval(fetchUsage, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchUsage, fetchQuotas, autoRefresh, refreshInterval]);

  return {
    // State
    usage,
    quotas,
    loading,
    error,
    alerts,
    
    // Actions
    fetchUsage,
    fetchQuotas,
    updateQuotas,
    clearUsage,
    trackUsage,
    checkQuota,
    exportUsage,
    dismissAlert,
    
    // Utilities
    getUsageInsights,
    
    // Derived state
    isOverBudget: usage && quotas && (usage.current?.totalCost || 0) > (quotas.monthly || 0),
    isOverQuota: usage && (usage.current?.totalRequests || 0) > (usage.quotas?.monthly?.requests || Infinity),
    budgetUsagePercentage: usage && quotas ? ((usage.current?.totalCost || 0) / (quotas.monthly || 1)) * 100 : 0,
    quotaUsagePercentage: usage ? ((usage.current?.totalRequests || 0) / (usage.quotas?.monthly?.requests || 1)) * 100 : 0,
    insights: getUsageInsights()
  };
};

export default useScrapingUsage;