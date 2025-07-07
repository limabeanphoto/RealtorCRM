// pages/api/scraping/providers.js - Provider management endpoint
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
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

    const userId = decoded.id || decoded.userId;

    if (req.method === 'GET') {
      return handleGetProviders(req, res, userId);
    } else if (req.method === 'POST') {
      return handleUpdateProvider(req, res, userId);
    } else {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error in scraping providers endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGetProviders(req, res, userId) {
  try {
    // Get user's scraping settings
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { scrapingSettings: true }
      });
    } catch (dbError) {
      // If scraping fields don't exist in schema, return default providers
      user = { scrapingSettings: null };
    }

    let scrapingSettings = {};
    if (user?.scrapingSettings) {
      try {
        scrapingSettings = JSON.parse(user.scrapingSettings);
      } catch (error) {
        console.error('Error parsing scraping settings:', error);
      }
    }

    // Default providers configuration
    const providers = [
      {
        id: 'scraperapi',
        name: 'ScraperAPI',
        type: 'web_scraper',
        description: 'High-performance web scraping with 5,000 free requests per month',
        enabled: scrapingSettings.providers?.scraperAPI?.enabled !== false, // Default to enabled
        priority: 1,
        config: {
          apiKey: scrapingSettings.providers?.scraperAPI?.apiKey || '',
          timeout: 15000,
          retryAttempts: 2
        },
        pricing: {
          freeQuota: 5000,
          costPerRequest: 0.001
        },
        status: scrapingSettings.providers?.scraperAPI?.apiKey ? 'configured' : 'needs_setup',
        capabilities: ['realtor.com', 'javascript_rendering', 'proxy_rotation']
      },
      {
        id: 'gemini',
        name: 'Google Gemini Flash',
        type: 'ai_vision',
        description: 'AI-powered content extraction using Google\'s Gemini vision model',
        enabled: scrapingSettings.providers?.gemini?.enabled || false,
        priority: 2,
        config: {
          apiKey: scrapingSettings.providers?.gemini?.apiKey || '',
          model: 'gemini-flash',
          timeout: 10000
        },
        pricing: {
          freeQuota: 0,
          costPerRequest: 0.00025
        },
        status: scrapingSettings.providers?.gemini?.apiKey ? 'configured' : 'not_configured',
        capabilities: ['ai_vision', 'fallback_extraction', 'high_accuracy']
      },
      {
        id: 'openai',
        name: 'OpenAI GPT-4 Vision',
        type: 'ai_vision',
        description: 'Advanced AI content extraction using OpenAI\'s GPT-4 vision capabilities',
        enabled: scrapingSettings.providers?.openai?.enabled || false,
        priority: 3,
        config: {
          apiKey: scrapingSettings.providers?.openai?.apiKey || '',
          model: 'gpt-4-vision-preview',
          timeout: 30000
        },
        pricing: {
          freeQuota: 0,
          costPerRequest: 0.01
        },
        status: scrapingSettings.providers?.openai?.apiKey ? 'configured' : 'not_configured',
        capabilities: ['ai_vision', 'fallback_extraction', 'premium_accuracy']
      }
    ];

    return res.status(200).json({
      success: true,
      data: providers,
      metadata: {
        total: providers.length,
        enabled: providers.filter(p => p.enabled).length,
        configured: providers.filter(p => p.status === 'configured').length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch providers'
    });
  }
}

async function handleUpdateProvider(req, res, userId) {
  try {
    const { providerId, config, enabled } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    // Get current settings
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { scrapingSettings: true }
      });
    } catch (dbError) {
      user = { scrapingSettings: null };
    }

    let scrapingSettings = {};
    if (user?.scrapingSettings) {
      try {
        scrapingSettings = JSON.parse(user.scrapingSettings);
      } catch (error) {
        console.error('Error parsing scraping settings:', error);
      }
    }

    // Initialize providers object if it doesn't exist
    if (!scrapingSettings.providers) {
      scrapingSettings.providers = {};
    }

    // Map frontend provider IDs to backend format
    const providerKeyMap = {
      'scraperapi': 'scraperAPI',
      'gemini': 'gemini',
      'openai': 'openai'
    };

    const providerKey = providerKeyMap[providerId] || providerId;

    // Update provider settings
    if (!scrapingSettings.providers[providerKey]) {
      scrapingSettings.providers[providerKey] = {};
    }

    // Update configuration
    if (config) {
      Object.assign(scrapingSettings.providers[providerKey], config);
    }

    // Update enabled status
    if (enabled !== undefined) {
      scrapingSettings.providers[providerKey].enabled = enabled;
    }

    // Save back to database
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          scrapingSettings: JSON.stringify(scrapingSettings)
        }
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save provider configuration'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Provider updated successfully',
      data: {
        providerId,
        config: scrapingSettings.providers[providerKey]
      }
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update provider'
    });
  }
}