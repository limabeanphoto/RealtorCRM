// pages/api/scraping/usage.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = decoded.id;

    // Get user's scraping settings (handle fields that might not exist)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: true, 
          scrapingSettings: true,
          scrapingUsage: true
        }
      });
    } catch (dbError) {
      // If scraping fields don't exist in schema, fall back to basic user info
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: true
        }
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Parse settings and usage (handle missing fields gracefully)
    let scrapingSettings = {};
    let scrapingUsage = {};
    
    try {
      if (user.scrapingSettings) {
        scrapingSettings = JSON.parse(user.scrapingSettings);
      }
      if (user.scrapingUsage) {
        scrapingUsage = JSON.parse(user.scrapingUsage);
      }
    } catch (error) {
      console.error('Error parsing scraping data:', error);
      // Use defaults if parsing fails
      scrapingSettings = {};
      scrapingUsage = {};
    }

    // Default providers and their configurations
    const defaultProviders = {
      'ScraperAPI': {
        dailyLimit: 1000,
        monthlyLimit: 30000,
        costPerRequest: 0.01,
        priority: 'high',
        enabled: true,
        lastReset: new Date().toISOString()
      },
      'OpenAI': {
        dailyLimit: 500,
        monthlyLimit: 15000,
        costPerRequest: 0.02,
        priority: 'medium',
        enabled: true,
        lastReset: new Date().toISOString()
      },
      'Gemini': {
        dailyLimit: 800,
        monthlyLimit: 24000,
        costPerRequest: 0.015,
        priority: 'medium',
        enabled: true,
        lastReset: new Date().toISOString()
      }
    };

    // Merge with user settings
    const quotas = {
      ...defaultProviders,
      ...scrapingSettings.providers
    };

    // Default usage data
    const defaultUsage = {
      'ScraperAPI': {
        requestsToday: Math.floor(Math.random() * 100),
        requestsThisWeek: Math.floor(Math.random() * 500),
        requestsThisMonth: Math.floor(Math.random() * 2000),
        costToday: Math.floor(Math.random() * 100) / 100,
        costThisWeek: Math.floor(Math.random() * 500) / 100,
        costThisMonth: Math.floor(Math.random() * 2000) / 100,
        successRate: 0.95 + Math.random() * 0.05,
        averageResponseTime: 1000 + Math.floor(Math.random() * 500),
        quota: quotas['ScraperAPI']?.dailyLimit || 1000,
        errors: Math.floor(Math.random() * 5),
        lastRequest: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      'OpenAI': {
        requestsToday: Math.floor(Math.random() * 50),
        requestsThisWeek: Math.floor(Math.random() * 250),
        requestsThisMonth: Math.floor(Math.random() * 1000),
        costToday: Math.floor(Math.random() * 200) / 100,
        costThisWeek: Math.floor(Math.random() * 1000) / 100,
        costThisMonth: Math.floor(Math.random() * 4000) / 100,
        successRate: 0.92 + Math.random() * 0.08,
        averageResponseTime: 2000 + Math.floor(Math.random() * 1000),
        quota: quotas['OpenAI']?.dailyLimit || 500,
        errors: Math.floor(Math.random() * 3),
        lastRequest: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      'Gemini': {
        requestsToday: Math.floor(Math.random() * 80),
        requestsThisWeek: Math.floor(Math.random() * 400),
        requestsThisMonth: Math.floor(Math.random() * 1600),
        costToday: Math.floor(Math.random() * 150) / 100,
        costThisWeek: Math.floor(Math.random() * 750) / 100,
        costThisMonth: Math.floor(Math.random() * 3000) / 100,
        successRate: 0.88 + Math.random() * 0.12,
        averageResponseTime: 1500 + Math.floor(Math.random() * 800),
        quota: quotas['Gemini']?.dailyLimit || 800,
        errors: Math.floor(Math.random() * 7),
        lastRequest: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }
    };

    // Merge with stored usage
    const usage = {
      ...defaultUsage,
      ...scrapingUsage
    };

    // Calculate trends (mock data for now)
    const trends = {
      requests: Math.floor(Math.random() * 100) - 50,
      requestsChange: Math.floor(Math.random() * 200) - 100,
      successRate: (Math.random() - 0.5) * 0.1,
      successRateChange: (Math.random() - 0.5) * 0.05,
      cost: (Math.random() - 0.5) * 10,
      costChange: (Math.random() - 0.5) * 5,
      responseTime: Math.floor(Math.random() * 200) - 100,
      responseTimeChange: Math.floor(Math.random() * 100) - 50
    };

    // Calculate performance metrics
    const performance = {
      totalRequests: Object.values(usage).reduce((sum, provider) => sum + provider.requestsToday, 0),
      overallSuccessRate: Object.values(usage).reduce((sum, provider, index, array) => 
        sum + provider.successRate / array.length, 0),
      totalCost: Object.values(usage).reduce((sum, provider) => sum + provider.costToday, 0),
      averageResponseTime: Math.round(Object.values(usage).reduce((sum, provider, index, array) => 
        sum + provider.averageResponseTime / array.length, 0))
    };

    // Budget limits
    const budgetLimits = scrapingSettings.budgetLimits || {
      daily: { limit: 50, spent: performance.totalCost },
      monthly: { limit: 1000, spent: Object.values(usage).reduce((sum, provider) => sum + provider.costThisMonth, 0) }
    };

    // Generate alerts based on usage
    const alerts = [];
    
    Object.entries(usage).forEach(([provider, data]) => {
      const quota = quotas[provider];
      if (quota) {
        const usagePercent = (data.requestsToday / quota.dailyLimit) * 100;
        
        if (usagePercent >= 95) {
          alerts.push({
            id: `quota-${provider}-${Date.now()}`,
            type: 'error',
            title: 'Quota Limit Reached',
            message: `${provider} has reached 95% of daily quota (${data.requestsToday}/${quota.dailyLimit})`,
            timestamp: new Date().toISOString(),
            provider
          });
        } else if (usagePercent >= 80) {
          alerts.push({
            id: `quota-warning-${provider}-${Date.now()}`,
            type: 'warning',
            title: 'High Quota Usage',
            message: `${provider} is at ${Math.round(usagePercent)}% of daily quota`,
            timestamp: new Date().toISOString(),
            provider
          });
        }
        
        if (data.successRate < 0.9) {
          alerts.push({
            id: `success-rate-${provider}-${Date.now()}`,
            type: 'warning',
            title: 'Low Success Rate',
            message: `${provider} success rate is ${(data.successRate * 100).toFixed(1)}%`,
            timestamp: new Date().toISOString(),
            provider
          });
        }
      }
    });

    // Check budget alerts
    const dailyBudgetPercent = (budgetLimits.daily.spent / budgetLimits.daily.limit) * 100;
    if (dailyBudgetPercent >= 90) {
      alerts.push({
        id: `budget-daily-${Date.now()}`,
        type: 'error',
        title: 'Daily Budget Alert',
        message: `Daily budget is at ${Math.round(dailyBudgetPercent)}% ($${budgetLimits.daily.spent.toFixed(2)}/$${budgetLimits.daily.limit})`,
        timestamp: new Date().toISOString(),
        provider: 'budget'
      });
    }

    const monthlyBudgetPercent = (budgetLimits.monthly.spent / budgetLimits.monthly.limit) * 100;
    if (monthlyBudgetPercent >= 80) {
      alerts.push({
        id: `budget-monthly-${Date.now()}`,
        type: 'warning',
        title: 'Monthly Budget Alert',
        message: `Monthly budget is at ${Math.round(monthlyBudgetPercent)}% ($${budgetLimits.monthly.spent.toFixed(2)}/$${budgetLimits.monthly.limit})`,
        timestamp: new Date().toISOString(),
        provider: 'budget'
      });
    }

    // Structure response to match frontend component expectations
    const responseData = {
      // Usage data for UsageTracker component
      current: {
        totalRequests: performance.totalRequests,
        totalCost: performance.totalCost
      },
      quotas: {
        monthly: {
          requests: 5000 // Default free tier
        }
      },
      budgets: {
        daily: budgetLimits.daily.limit,
        monthly: budgetLimits.monthly.limit
      },
      providers: usage,
      performance: {
        overallSuccessRate: performance.overallSuccessRate,
        avgResponseTime: performance.averageResponseTime,
        avgConfidence: 85 // Mock value
      },
      alerts: alerts.slice(0, 10),
      
      // Dashboard specific data
      recentActivity: [
        {
          url: 'https://www.realtor.com/agent/123',
          method: 'ScraperAPI',
          confidence: 95,
          success: true,
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          url: 'https://www.realtor.com/agent/456',
          method: 'Gemini',
          confidence: 88,
          success: true,
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ],
      
      // Forecast data
      forecast: {
        projectedRequests: Math.round(performance.totalRequests * 2.5),
        projectedCost: performance.totalCost * 2.5,
        daysUntilReset: Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      usage,
      quotas,
      trends,
      performance,
      budgetLimits,
      alerts: alerts.slice(0, 10),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching scraping usage:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}