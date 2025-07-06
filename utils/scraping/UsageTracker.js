/**
 * Centralized Usage and Cost Tracker for Scraping Providers
 * 
 * This comprehensive usage tracker manages:
 * - Real-time usage tracking across all providers
 * - Cost calculation and budget management
 * - Quota monitoring and alerts
 * - Performance analytics and optimization
 * - Usage forecasting and recommendations
 * - Export capabilities for reporting
 * 
 * Features:
 * - Multi-provider cost tracking
 * - Budget alerts and limits
 * - Usage analytics and trends
 * - Performance optimization suggestions
 * - Real-time monitoring dashboard data
 * - Historical usage patterns
 */

import { ERROR_TYPES, PROVIDER_TYPES } from './types.js';

/**
 * Centralized usage and cost tracker for all scraping providers
 */
export class UsageTracker {
  /**
   * Create a new usage tracker
   * @param {Object} config - Tracker configuration
   */
  constructor(config = {}) {
    this.config = {
      // Budget configuration
      budgets: {
        daily: config.dailyBudget || 10, // $10 daily budget
        weekly: config.weeklyBudget || 50, // $50 weekly budget
        monthly: config.monthlyBudget || 200, // $200 monthly budget
        yearly: config.yearlyBudget || 2000 // $2000 yearly budget
      },
      
      // Alert thresholds
      alerts: {
        warning: config.warningThreshold || 0.8, // 80% budget warning
        critical: config.criticalThreshold || 0.95, // 95% budget critical
        quotaWarning: config.quotaWarningThreshold || 0.9, // 90% quota warning
        stopOnBudgetExceeded: config.stopOnBudgetExceeded !== false
      },
      
      // Tracking configuration
      tracking: {
        enabled: config.trackingEnabled !== false,
        detailedMetrics: config.detailedMetrics !== false,
        historicalData: config.historicalData !== false,
        maxHistoryDays: config.maxHistoryDays || 365,
        aggregationIntervals: config.aggregationIntervals || ['hour', 'day', 'week', 'month']
      },
      
      // Provider-specific limits
      providerLimits: config.providerLimits || {},
      
      // Notification configuration
      notifications: {
        enabled: config.notificationsEnabled !== false,
        email: config.notificationEmail,
        webhook: config.notificationWebhook,
        slack: config.slackWebhook
      },
      
      ...config
    };

    // Usage tracking data structures
    this.usage = {
      // Current period usage
      current: {
        requests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        startTime: Date.now(),
        lastReset: Date.now()
      },
      
      // Time-based usage (daily, weekly, monthly, yearly)
      periods: {
        daily: this.initializePeriodData(),
        weekly: this.initializePeriodData(),
        monthly: this.initializePeriodData(),
        yearly: this.initializePeriodData()
      },
      
      // Provider-specific usage
      providers: new Map(),
      
      // Historical data
      history: []
    };

    // Real-time metrics
    this.metrics = {
      // Performance metrics
      averageResponseTime: 0,
      averageConfidence: 0,
      successRate: 0,
      costPerRequest: 0,
      costPerSuccessfulRequest: 0,
      
      // Efficiency metrics
      mostEfficientProvider: null,
      leastEfficientProvider: null,
      costSavings: 0,
      
      // Trend analysis
      trends: {
        cost: [],
        usage: [],
        performance: []
      },
      
      // Forecasting
      forecast: {
        dailyCost: 0,
        weeklyCost: 0,
        monthlyCost: 0,
        quotaDepletion: {}
      }
    };

    // Alert states
    this.alerts = {
      active: new Map(),
      history: [],
      notificationsSent: new Set()
    };

    // Performance optimization suggestions
    this.suggestions = [];

    this.logger = config.logger || console;
    
    // Initialize tracking
    this.initializeTracking();
  }

  /**
   * Initialize period data structure
   * @returns {Object} - Period data structure
   * @private
   */
  initializePeriodData() {
    return {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cost: 0,
      tokens: 0,
      providers: new Map(),
      startTime: Date.now(),
      resetTime: null
    };
  }

  /**
   * Initialize tracking system
   * @private
   */
  initializeTracking() {
    // Set up periodic resets
    this.setupPeriodicResets();
    
    // Start metrics calculation
    this.calculateMetrics();
    
    this.logger.info('Usage tracker initialized successfully');
  }

  /**
   * Set up periodic resets for time-based tracking
   * @private
   */
  setupPeriodicResets() {
    // Daily reset at midnight UTC
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyUsage();
      setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilMidnight);
    
    // Weekly reset on Sunday at midnight UTC
    const sunday = new Date(now);
    sunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
    sunday.setUTCHours(0, 0, 0, 0);
    
    const timeUntilSunday = sunday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetWeeklyUsage();
      setInterval(() => this.resetWeeklyUsage(), 7 * 24 * 60 * 60 * 1000); // Every week
    }, timeUntilSunday);
    
    // Monthly reset on 1st at midnight UTC
    const nextMonth = new Date(now);
    nextMonth.setUTCMonth(now.getUTCMonth() + 1);
    nextMonth.setUTCDate(1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    
    const timeUntilFirstOfMonth = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetMonthlyUsage();
      // Calculate next month reset
      this.scheduleNextMonthlyReset();
    }, timeUntilFirstOfMonth);
  }

  /**
   * Schedule next monthly reset (handles variable month lengths)
   * @private
   */
  scheduleNextMonthlyReset() {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setUTCMonth(now.getUTCMonth() + 1);
    nextMonth.setUTCDate(1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    
    const timeUntilNext = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetMonthlyUsage();
      this.scheduleNextMonthlyReset();
    }, timeUntilNext);
  }

  /**
   * Track a provider request
   * @param {string} providerName - Provider name
   * @param {Object} request - Request details
   * @param {Object} response - Response details (if available)
   */
  trackRequest(providerName, request, response = null) {
    if (!this.config.tracking.enabled) return;

    const timestamp = Date.now();
    const isSuccess = response && response.success;
    const cost = response?.metadata?.cost || 0;
    const tokens = response?.metadata?.tokens || 0;
    const confidence = response?.confidence || 0;
    const duration = response?.duration || 0;

    // Update current usage
    this.usage.current.requests++;
    if (isSuccess) {
      this.usage.current.successfulRequests++;
    } else {
      this.usage.current.failedRequests++;
    }
    this.usage.current.totalCost += cost;
    this.usage.current.totalTokens += tokens;

    // Update period usage
    this.updatePeriodUsage('daily', { requests: 1, cost, tokens, success: isSuccess });
    this.updatePeriodUsage('weekly', { requests: 1, cost, tokens, success: isSuccess });
    this.updatePeriodUsage('monthly', { requests: 1, cost, tokens, success: isSuccess });
    this.updatePeriodUsage('yearly', { requests: 1, cost, tokens, success: isSuccess });

    // Update provider-specific usage
    this.updateProviderUsage(providerName, {
      requests: 1,
      cost,
      tokens,
      success: isSuccess,
      confidence,
      duration,
      timestamp
    });

    // Store historical data
    if (this.config.tracking.historicalData) {
      this.storeHistoricalData({
        timestamp,
        provider: providerName,
        request: {
          url: request.url,
          type: request.type || 'scraping'
        },
        response: {
          success: isSuccess,
          cost,
          tokens,
          confidence,
          duration
        }
      });
    }

    // Check alerts
    this.checkAlerts();

    // Update metrics
    this.calculateMetrics();

    // Generate suggestions
    this.generateSuggestions();
  }

  /**
   * Track cost for a provider
   * @param {string} providerName - Provider name
   * @param {number} cost - Cost incurred
   */
  trackCost(providerName, cost) {
    if (!this.config.tracking.enabled || !cost) return;

    // Update current usage
    this.usage.current.totalCost += cost;

    // Update period usage
    this.updatePeriodUsage('daily', { cost });
    this.updatePeriodUsage('weekly', { cost });
    this.updatePeriodUsage('monthly', { cost });
    this.updatePeriodUsage('yearly', { cost });

    // Update provider-specific usage
    this.updateProviderUsage(providerName, { cost });

    // Check budget alerts
    this.checkBudgetAlerts();
  }

  /**
   * Update period usage data
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @param {Object} data - Usage data to add
   * @private
   */
  updatePeriodUsage(period, data) {
    const periodData = this.usage.periods[period];
    
    if (data.requests) periodData.requests += data.requests;
    if (data.cost) periodData.cost += data.cost;
    if (data.tokens) periodData.tokens += data.tokens;
    
    if (data.success !== undefined) {
      if (data.success) {
        periodData.successfulRequests++;
      } else {
        periodData.failedRequests++;
      }
    }
  }

  /**
   * Update provider-specific usage
   * @param {string} providerName - Provider name
   * @param {Object} data - Usage data
   * @private
   */
  updateProviderUsage(providerName, data) {
    if (!this.usage.providers.has(providerName)) {
      this.usage.providers.set(providerName, {
        requests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        averageConfidence: 0,
        averageResponseTime: 0,
        successRate: 0,
        costPerRequest: 0,
        lastUsed: null,
        firstUsed: Date.now(),
        dailyUsage: this.initializePeriodData(),
        weeklyUsage: this.initializePeriodData(),
        monthlyUsage: this.initializePeriodData(),
        performance: {
          responseTimeHistory: [],
          confidenceHistory: [],
          costHistory: []
        }
      });
    }

    const providerData = this.usage.providers.get(providerName);
    
    if (data.requests) {
      providerData.requests += data.requests;
      providerData.lastUsed = data.timestamp || Date.now();
    }
    
    if (data.cost) {
      providerData.totalCost += data.cost;
      providerData.performance.costHistory.push(data.cost);
      if (providerData.performance.costHistory.length > 100) {
        providerData.performance.costHistory.shift();
      }
    }
    
    if (data.tokens) {
      providerData.totalTokens += data.tokens;
    }
    
    if (data.success !== undefined) {
      if (data.success) {
        providerData.successfulRequests++;
      } else {
        providerData.failedRequests++;
      }
      providerData.successRate = providerData.successfulRequests / providerData.requests;
    }
    
    if (data.confidence) {
      providerData.performance.confidenceHistory.push(data.confidence);
      if (providerData.performance.confidenceHistory.length > 100) {
        providerData.performance.confidenceHistory.shift();
      }
      
      // Calculate average confidence
      const confidenceSum = providerData.performance.confidenceHistory.reduce((a, b) => a + b, 0);
      providerData.averageConfidence = confidenceSum / providerData.performance.confidenceHistory.length;
    }
    
    if (data.duration) {
      providerData.performance.responseTimeHistory.push(data.duration);
      if (providerData.performance.responseTimeHistory.length > 100) {
        providerData.performance.responseTimeHistory.shift();
      }
      
      // Calculate average response time
      const timeSum = providerData.performance.responseTimeHistory.reduce((a, b) => a + b, 0);
      providerData.averageResponseTime = timeSum / providerData.performance.responseTimeHistory.length;
    }
    
    // Calculate cost per request
    if (providerData.requests > 0) {
      providerData.costPerRequest = providerData.totalCost / providerData.requests;
    }
  }

  /**
   * Store historical data point
   * @param {Object} dataPoint - Historical data point
   * @private
   */
  storeHistoricalData(dataPoint) {
    this.usage.history.push(dataPoint);
    
    // Limit history size
    const maxHistoryPoints = this.config.tracking.maxHistoryDays * 24 * 60; // Assuming 1 point per minute max
    if (this.usage.history.length > maxHistoryPoints) {
      this.usage.history.shift();
    }
  }

  /**
   * Check for budget and quota alerts
   * @private
   */
  checkAlerts() {
    this.checkBudgetAlerts();
    this.checkQuotaAlerts();
  }

  /**
   * Check budget alerts
   * @private
   */
  checkBudgetAlerts() {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    for (const period of periods) {
      const usage = this.usage.periods[period];
      const budget = this.config.budgets[period];
      
      if (!budget) continue;
      
      const percentage = usage.cost / budget;
      const alertKey = `budget-${period}`;
      
      // Check for warning threshold
      if (percentage >= this.config.alerts.warning && percentage < this.config.alerts.critical) {
        this.triggerAlert('warning', alertKey, {
          type: 'budget-warning',
          period,
          usage: usage.cost,
          budget,
          percentage: percentage * 100,
          message: `${period} budget warning: $${usage.cost.toFixed(4)} of $${budget} used (${(percentage * 100).toFixed(1)}%)`
        });
      }
      
      // Check for critical threshold
      if (percentage >= this.config.alerts.critical) {
        this.triggerAlert('critical', alertKey, {
          type: 'budget-critical',
          period,
          usage: usage.cost,
          budget,
          percentage: percentage * 100,
          message: `${period} budget critical: $${usage.cost.toFixed(4)} of $${budget} used (${(percentage * 100).toFixed(1)}%)`
        });
      }
      
      // Check for budget exceeded
      if (percentage >= 1.0 && this.config.alerts.stopOnBudgetExceeded) {
        this.triggerAlert('exceeded', alertKey, {
          type: 'budget-exceeded',
          period,
          usage: usage.cost,
          budget,
          percentage: percentage * 100,
          message: `${period} budget exceeded: $${usage.cost.toFixed(4)} of $${budget} used`,
          stopRequests: true
        });
      }
    }
  }

  /**
   * Check quota alerts for providers
   * @private
   */
  checkQuotaAlerts() {
    for (const [providerName, providerData] of this.usage.providers) {
      const limits = this.config.providerLimits[providerName];
      if (!limits) continue;
      
      // Check request quota
      if (limits.dailyRequests && providerData.dailyUsage.requests >= limits.dailyRequests * this.config.alerts.quotaWarning) {
        this.triggerAlert('warning', `quota-${providerName}-requests`, {
          type: 'quota-warning',
          provider: providerName,
          metric: 'requests',
          usage: providerData.dailyUsage.requests,
          limit: limits.dailyRequests,
          message: `${providerName} approaching daily request quota: ${providerData.dailyUsage.requests}/${limits.dailyRequests}`
        });
      }
      
      // Check token quota
      if (limits.dailyTokens && providerData.dailyUsage.tokens >= limits.dailyTokens * this.config.alerts.quotaWarning) {
        this.triggerAlert('warning', `quota-${providerName}-tokens`, {
          type: 'quota-warning',
          provider: providerName,
          metric: 'tokens',
          usage: providerData.dailyUsage.tokens,
          limit: limits.dailyTokens,
          message: `${providerName} approaching daily token quota: ${providerData.dailyUsage.tokens}/${limits.dailyTokens}`
        });
      }
    }
  }

  /**
   * Trigger an alert
   * @param {string} severity - Alert severity (warning, critical, exceeded)
   * @param {string} key - Unique alert key
   * @param {Object} alert - Alert details
   * @private
   */
  triggerAlert(severity, key, alert) {
    const existingAlert = this.alerts.active.get(key);
    
    // Don't trigger duplicate alerts
    if (existingAlert && existingAlert.severity === severity) {
      return;
    }
    
    const alertData = {
      ...alert,
      severity,
      timestamp: Date.now(),
      key
    };
    
    this.alerts.active.set(key, alertData);
    this.alerts.history.push(alertData);
    
    // Send notification if enabled
    if (this.config.notifications.enabled) {
      this.sendNotification(alertData);
    }
    
    this.logger.warn(`Usage Alert [${severity.toUpperCase()}]:`, alert.message);
  }

  /**
   * Send notification for alert
   * @param {Object} alert - Alert data
   * @private
   */
  async sendNotification(alert) {
    const notificationKey = `${alert.key}-${alert.severity}`;
    
    // Avoid sending duplicate notifications
    if (this.alerts.notificationsSent.has(notificationKey)) {
      return;
    }
    
    try {
      // Email notification
      if (this.config.notifications.email) {
        await this.sendEmailNotification(alert);
      }
      
      // Webhook notification
      if (this.config.notifications.webhook) {
        await this.sendWebhookNotification(alert);
      }
      
      // Slack notification
      if (this.config.notifications.slack) {
        await this.sendSlackNotification(alert);
      }
      
      this.alerts.notificationsSent.add(notificationKey);
      
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
    }
  }

  /**
   * Send webhook notification
   * @param {Object} alert - Alert data
   * @private
   */
  async sendWebhookNotification(alert) {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      service: 'RealtorCRM-ScrapingService',
      usage: this.getUsageSummary()
    };
    
    await fetch(this.config.notifications.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send Slack notification
   * @param {Object} alert - Alert data
   * @private
   */
  async sendSlackNotification(alert) {
    const color = alert.severity === 'critical' ? 'danger' : 
                  alert.severity === 'exceeded' ? 'danger' : 'warning';
    
    const payload = {
      attachments: [{
        color,
        title: `Scraping Service Alert - ${alert.severity.toUpperCase()}`,
        text: alert.message,
        fields: [
          {
            title: 'Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ],
        footer: 'RealtorCRM Scraping Service'
      }]
    };
    
    await fetch(this.config.notifications.slack, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Calculate comprehensive metrics
   * @private
   */
  calculateMetrics() {
    const current = this.usage.current;
    
    // Basic metrics
    this.metrics.successRate = current.requests > 0 ? 
      current.successfulRequests / current.requests : 0;
    
    this.metrics.costPerRequest = current.requests > 0 ? 
      current.totalCost / current.requests : 0;
    
    this.metrics.costPerSuccessfulRequest = current.successfulRequests > 0 ? 
      current.totalCost / current.successfulRequests : 0;
    
    // Calculate averages across providers
    let totalResponseTime = 0;
    let totalConfidence = 0;
    let responseTimeCount = 0;
    let confidenceCount = 0;
    
    for (const [providerName, providerData] of this.usage.providers) {
      if (providerData.averageResponseTime > 0) {
        totalResponseTime += providerData.averageResponseTime;
        responseTimeCount++;
      }
      
      if (providerData.averageConfidence > 0) {
        totalConfidence += providerData.averageConfidence;
        confidenceCount++;
      }
    }
    
    this.metrics.averageResponseTime = responseTimeCount > 0 ? 
      totalResponseTime / responseTimeCount : 0;
    
    this.metrics.averageConfidence = confidenceCount > 0 ? 
      totalConfidence / confidenceCount : 0;
    
    // Find most/least efficient providers
    this.findEfficiencyExtremes();
    
    // Calculate forecasts
    this.calculateForecasts();
  }

  /**
   * Find most and least efficient providers
   * @private
   */
  findEfficiencyExtremes() {
    let mostEfficient = null;
    let leastEfficient = null;
    let bestScore = -1;
    let worstScore = Infinity;
    
    for (const [providerName, providerData] of this.usage.providers) {
      if (providerData.requests === 0) continue;
      
      // Efficiency score based on success rate, response time, and cost
      const efficiencyScore = 
        (providerData.successRate * 0.4) +
        (Math.max(0, 1 - (providerData.averageResponseTime / 10000)) * 0.3) +
        (Math.max(0, 1 - (providerData.costPerRequest * 100)) * 0.3);
      
      if (efficiencyScore > bestScore) {
        bestScore = efficiencyScore;
        mostEfficient = providerName;
      }
      
      if (efficiencyScore < worstScore && providerData.requests > 5) {
        worstScore = efficiencyScore;
        leastEfficient = providerName;
      }
    }
    
    this.metrics.mostEfficientProvider = mostEfficient;
    this.metrics.leastEfficientProvider = leastEfficient;
  }

  /**
   * Calculate usage and cost forecasts
   * @private
   */
  calculateForecasts() {
    const daily = this.usage.periods.daily;
    const hoursElapsed = (Date.now() - daily.startTime) / (1000 * 60 * 60);
    
    if (hoursElapsed > 0) {
      const hourlyRate = daily.cost / hoursElapsed;
      this.metrics.forecast.dailyCost = hourlyRate * 24;
      this.metrics.forecast.weeklyCost = hourlyRate * 24 * 7;
      this.metrics.forecast.monthlyCost = hourlyRate * 24 * 30;
    }
    
    // Calculate quota depletion forecasts for each provider
    for (const [providerName, providerData] of this.usage.providers) {
      const limits = this.config.providerLimits[providerName];
      if (!limits) continue;
      
      const hourlyRequestRate = providerData.dailyUsage.requests / Math.max(hoursElapsed, 1);
      const hourlyTokenRate = providerData.dailyUsage.tokens / Math.max(hoursElapsed, 1);
      
      if (limits.dailyRequests && hourlyRequestRate > 0) {
        const hoursToQuotaDepletion = (limits.dailyRequests - providerData.dailyUsage.requests) / hourlyRequestRate;
        this.metrics.forecast.quotaDepletion[`${providerName}-requests`] = hoursToQuotaDepletion;
      }
      
      if (limits.dailyTokens && hourlyTokenRate > 0) {
        const hoursToQuotaDepletion = (limits.dailyTokens - providerData.dailyUsage.tokens) / hourlyTokenRate;
        this.metrics.forecast.quotaDepletion[`${providerName}-tokens`] = hoursToQuotaDepletion;
      }
    }
  }

  /**
   * Generate optimization suggestions
   * @private
   */
  generateSuggestions() {
    this.suggestions = [];
    
    // Cost optimization suggestions
    if (this.metrics.costPerRequest > 0.01) {
      this.suggestions.push({
        type: 'cost-optimization',
        priority: 'high',
        message: 'High cost per request detected. Consider using cheaper providers first.',
        action: 'Review provider priority order and fallback strategy'
      });
    }
    
    // Performance optimization suggestions
    if (this.metrics.averageResponseTime > 10000) {
      this.suggestions.push({
        type: 'performance-optimization',
        priority: 'medium',
        message: 'High average response time detected.',
        action: 'Consider optimizing provider selection or request batching'
      });
    }
    
    // Provider-specific suggestions
    for (const [providerName, providerData] of this.usage.providers) {
      if (providerData.successRate < 0.8 && providerData.requests > 10) {
        this.suggestions.push({
          type: 'provider-reliability',
          priority: 'high',
          provider: providerName,
          message: `${providerName} has low success rate: ${(providerData.successRate * 100).toFixed(1)}%`,
          action: `Review ${providerName} configuration or consider alternative providers`
        });
      }
    }
    
    // Budget optimization suggestions
    const dailyUsage = this.usage.periods.daily;
    const dailyBudget = this.config.budgets.daily;
    
    if (dailyBudget && dailyUsage.cost > dailyBudget * 0.8) {
      this.suggestions.push({
        type: 'budget-management',
        priority: 'high',
        message: 'Approaching daily budget limit',
        action: 'Consider reducing usage or increasing budget'
      });
    }
  }

  /**
   * Reset daily usage data
   * @private
   */
  resetDailyUsage() {
    this.usage.periods.daily = this.initializePeriodData();
    
    // Reset provider daily usage
    for (const [_, providerData] of this.usage.providers) {
      providerData.dailyUsage = this.initializePeriodData();
    }
    
    // Clear daily alert notifications
    this.alerts.notificationsSent.clear();
    
    this.logger.info('Daily usage data reset');
  }

  /**
   * Reset weekly usage data
   * @private
   */
  resetWeeklyUsage() {
    this.usage.periods.weekly = this.initializePeriodData();
    
    // Reset provider weekly usage
    for (const [_, providerData] of this.usage.providers) {
      providerData.weeklyUsage = this.initializePeriodData();
    }
    
    this.logger.info('Weekly usage data reset');
  }

  /**
   * Reset monthly usage data
   * @private
   */
  resetMonthlyUsage() {
    this.usage.periods.monthly = this.initializePeriodData();
    
    // Reset provider monthly usage
    for (const [_, providerData] of this.usage.providers) {
      providerData.monthlyUsage = this.initializePeriodData();
    }
    
    this.logger.info('Monthly usage data reset');
  }

  /**
   * Get comprehensive usage summary
   * @returns {Object} - Usage summary
   */
  getUsageSummary() {
    return {
      current: this.usage.current,
      periods: this.usage.periods,
      providers: Object.fromEntries(this.usage.providers),
      metrics: this.metrics,
      alerts: {
        active: Object.fromEntries(this.alerts.active),
        count: this.alerts.active.size
      },
      suggestions: this.suggestions,
      config: this.config
    };
  }

  /**
   * Get provider-specific usage
   * @param {string} providerName - Provider name
   * @returns {Object} - Provider usage data
   */
  getProviderUsage(providerName) {
    return this.usage.providers.get(providerName) || null;
  }

  /**
   * Get usage for a specific time period
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @returns {Object} - Period usage data
   */
  getPeriodUsage(period) {
    return this.usage.periods[period] || null;
  }

  /**
   * Check if provider can make a request based on quotas
   * @param {string} providerName - Provider name
   * @returns {Object} - Quota status
   */
  checkProviderQuota(providerName) {
    const providerData = this.usage.providers.get(providerName);
    const limits = this.config.providerLimits[providerName];
    
    if (!providerData || !limits) {
      return { allowed: true, reason: 'no limits configured' };
    }
    
    // Check daily request limit
    if (limits.dailyRequests && providerData.dailyUsage.requests >= limits.dailyRequests) {
      return {
        allowed: false,
        reason: 'daily request quota exceeded',
        usage: providerData.dailyUsage.requests,
        limit: limits.dailyRequests
      };
    }
    
    // Check daily token limit
    if (limits.dailyTokens && providerData.dailyUsage.tokens >= limits.dailyTokens) {
      return {
        allowed: false,
        reason: 'daily token quota exceeded',
        usage: providerData.dailyUsage.tokens,
        limit: limits.dailyTokens
      };
    }
    
    return {
      allowed: true,
      remaining: {
        requests: limits.dailyRequests ? limits.dailyRequests - providerData.dailyUsage.requests : null,
        tokens: limits.dailyTokens ? limits.dailyTokens - providerData.dailyUsage.tokens : null
      }
    };
  }

  /**
   * Check if budget allows for more requests
   * @param {number} estimatedCost - Estimated cost of next request
   * @returns {Object} - Budget status
   */
  checkBudget(estimatedCost = 0) {
    const daily = this.usage.periods.daily;
    const monthly = this.usage.periods.monthly;
    
    // Check daily budget
    if (this.config.budgets.daily && daily.cost + estimatedCost > this.config.budgets.daily) {
      return {
        allowed: false,
        reason: 'daily budget would be exceeded',
        budget: this.config.budgets.daily,
        usage: daily.cost,
        estimatedCost
      };
    }
    
    // Check monthly budget
    if (this.config.budgets.monthly && monthly.cost + estimatedCost > this.config.budgets.monthly) {
      return {
        allowed: false,
        reason: 'monthly budget would be exceeded',
        budget: this.config.budgets.monthly,
        usage: monthly.cost,
        estimatedCost
      };
    }
    
    return {
      allowed: true,
      remaining: {
        daily: this.config.budgets.daily ? this.config.budgets.daily - daily.cost : null,
        monthly: this.config.budgets.monthly ? this.config.budgets.monthly - monthly.cost : null
      }
    };
  }

  /**
   * Export usage data for external reporting
   * @param {Object} options - Export options
   * @returns {Object} - Exported data
   */
  exportUsageData(options = {}) {
    const {
      format = 'json',
      period = 'all',
      providers = 'all',
      includeHistory = false
    } = options;
    
    let data = {
      summary: this.getUsageSummary(),
      exportedAt: new Date().toISOString(),
      options
    };
    
    // Filter by period
    if (period !== 'all') {
      data.summary.periods = { [period]: data.summary.periods[period] };
    }
    
    // Filter by providers
    if (providers !== 'all' && Array.isArray(providers)) {
      const filteredProviders = {};
      providers.forEach(provider => {
        if (data.summary.providers[provider]) {
          filteredProviders[provider] = data.summary.providers[provider];
        }
      });
      data.summary.providers = filteredProviders;
    }
    
    // Include historical data if requested
    if (includeHistory) {
      data.history = this.usage.history;
    }
    
    return data;
  }

  /**
   * Clear all usage data
   */
  clearUsageData() {
    this.usage.current = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      totalTokens: 0,
      startTime: Date.now(),
      lastReset: Date.now()
    };
    
    this.usage.periods = {
      daily: this.initializePeriodData(),
      weekly: this.initializePeriodData(),
      monthly: this.initializePeriodData(),
      yearly: this.initializePeriodData()
    };
    
    this.usage.providers.clear();
    this.usage.history = [];
    
    this.alerts.active.clear();
    this.alerts.history = [];
    this.alerts.notificationsSent.clear();
    
    this.logger.info('All usage data cleared');
  }

  /**
   * Get real-time dashboard data
   * @returns {Object} - Dashboard data
   */
  getDashboardData() {
    return {
      summary: {
        totalRequests: this.usage.current.requests,
        successRate: this.metrics.successRate,
        totalCost: this.usage.current.totalCost,
        averageResponseTime: this.metrics.averageResponseTime
      },
      
      budgets: {
        daily: {
          used: this.usage.periods.daily.cost,
          limit: this.config.budgets.daily,
          percentage: this.config.budgets.daily ? 
            (this.usage.periods.daily.cost / this.config.budgets.daily) * 100 : 0
        },
        monthly: {
          used: this.usage.periods.monthly.cost,
          limit: this.config.budgets.monthly,
          percentage: this.config.budgets.monthly ? 
            (this.usage.periods.monthly.cost / this.config.budgets.monthly) * 100 : 0
        }
      },
      
      providers: Array.from(this.usage.providers.entries()).map(([name, data]) => ({
        name,
        requests: data.requests,
        successRate: data.successRate,
        avgResponseTime: data.averageResponseTime,
        costPerRequest: data.costPerRequest,
        lastUsed: data.lastUsed
      })),
      
      alerts: Array.from(this.alerts.active.values()),
      
      suggestions: this.suggestions.slice(0, 5), // Top 5 suggestions
      
      forecast: this.metrics.forecast
    };
  }
}

export default UsageTracker;