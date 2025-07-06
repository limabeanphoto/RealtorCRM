// pages/api/users/settings.js
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSession({ req });

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const userId = session.user.id;
  const { 
    name, 
    email, 
    currentPassword, 
    newPassword,
    scrapingSettings 
  } = req.body;

    // Validate input data
  if (!name || !email ) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  
  if (newPassword && !currentPassword) {
    return res.status(400).json({ message: 'Current password is required to change the password' });
  }
  
  if (currentPassword && newPassword && newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  // Validate scraping settings if provided
  if (scrapingSettings) {
    const validProviders = ['ScraperAPI', 'OpenAI', 'Gemini'];
    const validPriorities = ['low', 'medium', 'high'];
    
    if (scrapingSettings.providers) {
      for (const [provider, config] of Object.entries(scrapingSettings.providers)) {
        if (!validProviders.includes(provider)) {
          return res.status(400).json({ message: `Invalid provider: ${provider}` });
        }
        
        if (config.dailyLimit && (config.dailyLimit < 0 || config.dailyLimit > 10000)) {
          return res.status(400).json({ message: `Invalid daily limit for ${provider}: must be between 0 and 10000` });
        }
        
        if (config.monthlyLimit && (config.monthlyLimit < 0 || config.monthlyLimit > 100000)) {
          return res.status(400).json({ message: `Invalid monthly limit for ${provider}: must be between 0 and 100000` });
        }
        
        if (config.priority && !validPriorities.includes(config.priority)) {
          return res.status(400).json({ message: `Invalid priority for ${provider}: must be low, medium, or high` });
        }
        
        if (config.costPerRequest && (config.costPerRequest < 0 || config.costPerRequest > 1)) {
          return res.status(400).json({ message: `Invalid cost per request for ${provider}: must be between 0 and 1` });
        }
      }
    }
    
    if (scrapingSettings.budgetLimits) {
      const { daily, monthly } = scrapingSettings.budgetLimits;
      if (daily && (daily < 0 || daily > 1000)) {
        return res.status(400).json({ message: 'Invalid daily budget limit: must be between 0 and 1000' });
      }
      if (monthly && (monthly < 0 || monthly > 10000)) {
        return res.status(400).json({ message: 'Invalid monthly budget limit: must be between 0 and 10000' });
      }
    }
  }


  try{
    
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch){
        return res.status(401).json({ message: 'Incorrect current password' });
      }
    }
    // Update user data
    const updatedData = { name, email };
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatedData.password = hashedPassword;
    }

    // Add scraping settings if provided
    if (scrapingSettings) {
      updatedData.scrapingSettings = JSON.stringify(scrapingSettings);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    // Parse scraping settings for response
    let responseUser = { ...updatedUser };
    if (responseUser.scrapingSettings) {
      try {
        responseUser.scrapingSettings = JSON.parse(responseUser.scrapingSettings);
      } catch (error) {
        console.error('Error parsing scraping settings:', error);
        responseUser.scrapingSettings = null;
      }
    }

    return res.status(200).json({ 
      message: 'Settings updated successfully', 
      user: responseUser,
      success: true
    });
  } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(400).json({ message: 'Email is already in use' });
        }
    } else {
      console.error('Error updating settings:', error);
      }
      
      return res.status(500).json({ message: 'Error updating settings' });
  }
};

