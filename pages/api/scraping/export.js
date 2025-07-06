// pages/api/scraping/export.js
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
    const { timeRange = 'month', provider = 'all' } = req.query;

    // Get user's scraping data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        scrapingSettings: true,
        scrapingUsage: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate mock usage data for export
    const providers = provider === 'all' ? ['ScraperAPI', 'OpenAI', 'Gemini'] : [provider];
    const startDate = new Date();
    const endDate = new Date();

    // Set date range based on timeRange
    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    // Generate CSV data
    const csvHeaders = [
      'Date',
      'Time',
      'Provider',
      'Requests',
      'Cost',
      'Success Rate',
      'Response Time (ms)',
      'Errors'
    ];

    const csvRows = [];
    csvRows.push(csvHeaders.join(','));

    // Generate sample data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      providers.forEach(providerName => {
        // Generate 1-3 entries per day per provider
        const entriesPerDay = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < entriesPerDay; i++) {
          const hour = Math.floor(Math.random() * 24);
          const minute = Math.floor(Math.random() * 60);
          const entryDate = new Date(currentDate);
          entryDate.setHours(hour, minute, 0, 0);

          const requests = Math.floor(Math.random() * 100) + 1;
          const costPerRequest = providerName === 'OpenAI' ? 0.02 : 
                                providerName === 'Gemini' ? 0.015 : 0.01;
          const cost = (requests * costPerRequest).toFixed(3);
          const successRate = (0.85 + Math.random() * 0.15).toFixed(3);
          const responseTime = Math.floor(Math.random() * 2000) + 500;
          const errors = Math.floor(Math.random() * 5);

          const row = [
            entryDate.toISOString().split('T')[0],
            entryDate.toTimeString().split(' ')[0],
            providerName,
            requests,
            cost,
            successRate,
            responseTime,
            errors
          ];

          csvRows.push(row.join(','));
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add summary row
    csvRows.push('');
    csvRows.push('SUMMARY');
    csvRows.push(`Export generated for: ${user.firstName} ${user.lastName} (${user.email})`);
    csvRows.push(`Time range: ${timeRange}`);
    csvRows.push(`Provider filter: ${provider}`);
    csvRows.push(`Generated at: ${new Date().toISOString()}`);
    csvRows.push(`Total rows: ${csvRows.length - 6}`); // Subtract header and summary rows

    const csvContent = csvRows.join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="scraping-usage-${timeRange}-${Date.now()}.csv"`);

    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting usage data:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}