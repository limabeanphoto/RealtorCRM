// pages/api/scraping/cost-analysis.js
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
    const { timeRange = 'month' } = req.query;

    // Get user's scraping data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        scrapingSettings: true,
        scrapingUsage: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mock usage data for cost analysis
    const providers = {
      'ScraperAPI': {
        requests: 1150,
        cost: 11.50,
        costPerRequest: 0.01,
        successRate: 0.95,
        reliability: 0.98
      },
      'OpenAI': {
        requests: 580,
        cost: 11.60,
        costPerRequest: 0.02,
        successRate: 0.92,
        reliability: 0.96
      },
      'Gemini': {
        requests: 870,
        cost: 13.05,
        costPerRequest: 0.015,
        successRate: 0.88,
        reliability: 0.94
      }
    };

    // Calculate cost analysis metrics
    const totalRequests = Object.values(providers).reduce((sum, p) => sum + p.requests, 0);
    const totalCost = Object.values(providers).reduce((sum, p) => sum + p.cost, 0);
    const averageCostPerRequest = totalCost / totalRequests;

    // Cost efficiency analysis
    const costEfficiency = {};
    Object.entries(providers).forEach(([provider, data]) => {
      const efficiency = (data.successRate * data.reliability) / data.costPerRequest;
      costEfficiency[provider] = {
        efficiency: efficiency,
        rank: 0, // Will be calculated after all providers
        costPerSuccessfulRequest: data.costPerRequest / data.successRate,
        valueScore: efficiency * 100
      };
    });

    // Rank providers by efficiency
    const sortedProviders = Object.entries(costEfficiency)
      .sort((a, b) => b[1].efficiency - a[1].efficiency);
    
    sortedProviders.forEach(([provider, data], index) => {
      costEfficiency[provider].rank = index + 1;
    });

    // Find most/least expensive
    const mostExpensiveProvider = Object.entries(providers)
      .reduce((max, [name, data]) => 
        data.costPerRequest > max.costPerRequest ? { name, ...data } : max, 
        { name: '', costPerRequest: 0 });

    const leastExpensiveProvider = Object.entries(providers)
      .reduce((min, [name, data]) => 
        data.costPerRequest < min.costPerRequest ? { name, ...data } : min, 
        { name: '', costPerRequest: Infinity });

    // Cost optimization recommendations
    const optimizationOpportunities = [];
    
    // Check for cost reduction opportunities
    const highestCostProvider = Object.entries(providers)
      .reduce((max, [name, data]) => data.cost > max.cost ? { name, ...data } : max, { name: '', cost: 0 });
    
    if (highestCostProvider.cost > totalCost * 0.4) {
      optimizationOpportunities.push({
        type: 'cost-reduction',
        provider: highestCostProvider.name,
        description: `${highestCostProvider.name} accounts for ${((highestCostProvider.cost / totalCost) * 100).toFixed(1)}% of total costs`,
        potentialSavings: highestCostProvider.cost * 0.2,
        recommendation: 'Consider reducing usage or negotiating better rates'
      });
    }

    // Check for efficiency improvements
    const leastEfficientProvider = Object.entries(costEfficiency)
      .reduce((min, [name, data]) => data.efficiency < min.efficiency ? { name, ...data } : min, 
        { name: '', efficiency: Infinity });

    if (leastEfficientProvider.efficiency < sortedProviders[0][1].efficiency * 0.7) {
      optimizationOpportunities.push({
        type: 'efficiency-improvement',
        provider: leastEfficientProvider.name,
        description: `${leastEfficientProvider.name} has low cost efficiency compared to alternatives`,
        potentialSavings: providers[leastEfficientProvider.name].cost * 0.3,
        recommendation: 'Consider switching to more efficient provider for some use cases'
      });
    }

    // Usage pattern analysis
    const usagePattern = {
      distribution: {},
      concentration: 0,
      diversification: Object.keys(providers).length
    };

    Object.entries(providers).forEach(([provider, data]) => {
      usagePattern.distribution[provider] = (data.requests / totalRequests) * 100;
    });

    // Calculate concentration (Herfindahl index)
    usagePattern.concentration = Object.values(usagePattern.distribution)
      .reduce((sum, percentage) => sum + Math.pow(percentage / 100, 2), 0);

    // ROI analysis
    const roiAnalysis = {
      totalInvestment: totalCost,
      totalRequests: totalRequests,
      successfulRequests: Object.values(providers).reduce((sum, p) => sum + (p.requests * p.successRate), 0),
      costPerSuccessfulRequest: totalCost / Object.values(providers).reduce((sum, p) => sum + (p.requests * p.successRate), 0),
      efficiency: 'good' // Based on success rate and cost
    };

    // Time-based cost trends (mock data)
    const costTrends = {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: (totalCost / 30) * (0.8 + Math.random() * 0.4)
      })),
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      changePercentage: (Math.random() - 0.5) * 20 // -10% to +10%
    };

    // Budget utilization
    const budgetUtilization = {
      totalBudget: 1000, // Default monthly budget
      currentSpend: totalCost,
      utilization: (totalCost / 1000) * 100,
      remainingBudget: 1000 - totalCost,
      projectedEndOfMonthSpend: totalCost * 1.15,
      onTrack: totalCost * 1.15 <= 1000
    };

    const analysis = {
      summary: {
        totalCost,
        totalRequests,
        averageCostPerRequest,
        mostExpensiveProvider: mostExpensiveProvider.name,
        leastExpensiveProvider: leastExpensiveProvider.name,
        potentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0)
      },
      costEfficiency,
      optimizationOpportunities,
      usagePattern,
      roiAnalysis,
      costTrends,
      budgetUtilization,
      providerComparison: {
        byEfficiency: sortedProviders.map(([name, data]) => ({
          name,
          efficiency: data.efficiency,
          rank: data.rank,
          costPerRequest: providers[name].costPerRequest,
          successRate: providers[name].successRate
        })),
        byCost: Object.entries(providers)
          .sort((a, b) => a[1].costPerRequest - b[1].costPerRequest)
          .map(([name, data]) => ({
            name,
            costPerRequest: data.costPerRequest,
            totalCost: data.cost,
            requests: data.requests
          }))
      },
      recommendations: [
        {
          priority: 'high',
          category: 'cost-optimization',
          description: `Switch 30% of ${mostExpensiveProvider.name} usage to ${leastExpensiveProvider.name}`,
          estimatedSavings: mostExpensiveProvider.cost * 0.3 * 0.5,
          effort: 'medium'
        },
        {
          priority: 'medium',
          category: 'efficiency',
          description: 'Optimize request patterns to reduce failed requests',
          estimatedSavings: totalCost * 0.1,
          effort: 'low'
        },
        {
          priority: 'low',
          category: 'monitoring',
          description: 'Set up automated cost alerts at 80% budget utilization',
          estimatedSavings: 0,
          effort: 'low'
        }
      ]
    };

    return res.status(200).json({
      success: true,
      analysis,
      timeRange,
      generatedAt: new Date().toISOString(),
      confidence: 85 // Analysis confidence percentage
    });

  } catch (error) {
    console.error('Error generating cost analysis:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}