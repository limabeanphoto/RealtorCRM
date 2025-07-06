// pages/api/scraping/quota/[provider].js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { provider } = req.query;

  if (req.method !== 'PUT') {
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

    // Validate provider
    const validProviders = ['ScraperAPI', 'OpenAI', 'Gemini'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ success: false, message: 'Invalid provider' });
    }

    // Validate quota data
    const { dailyLimit, monthlyLimit, costPerRequest, priority, enabled } = req.body;

    if (dailyLimit !== undefined && (dailyLimit < 0 || dailyLimit > 10000)) {
      return res.status(400).json({ success: false, message: 'Daily limit must be between 0 and 10000' });
    }

    if (monthlyLimit !== undefined && (monthlyLimit < 0 || monthlyLimit > 100000)) {
      return res.status(400).json({ success: false, message: 'Monthly limit must be between 0 and 100000' });
    }

    if (costPerRequest !== undefined && (costPerRequest < 0 || costPerRequest > 1)) {
      return res.status(400).json({ success: false, message: 'Cost per request must be between 0 and 1' });
    }

    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
    }

    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { scrapingSettings: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Parse current settings
    let scrapingSettings = {};
    if (user.scrapingSettings) {
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

    // Update the specific provider's quota
    const updatedQuota = {
      ...scrapingSettings.providers[provider],
      dailyLimit: dailyLimit !== undefined ? dailyLimit : scrapingSettings.providers[provider]?.dailyLimit || 1000,
      monthlyLimit: monthlyLimit !== undefined ? monthlyLimit : scrapingSettings.providers[provider]?.monthlyLimit || 30000,
      costPerRequest: costPerRequest !== undefined ? costPerRequest : scrapingSettings.providers[provider]?.costPerRequest || 0.01,
      priority: priority !== undefined ? priority : scrapingSettings.providers[provider]?.priority || 'medium',
      enabled: enabled !== undefined ? enabled : scrapingSettings.providers[provider]?.enabled !== false,
      lastReset: new Date().toISOString()
    };

    scrapingSettings.providers[provider] = updatedQuota;

    // Update user settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        scrapingSettings: JSON.stringify(scrapingSettings)
      }
    });

    return res.status(200).json({
      success: true,
      quota: updatedQuota,
      message: `Quota updated for ${provider}`
    });

  } catch (error) {
    console.error('Error updating quota:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}