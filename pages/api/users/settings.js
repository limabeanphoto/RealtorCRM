// pages/api/users/settings.js
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from 'next-auth/react';
import bcrypt from 'bcryptjs';

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
  const { name, email, currentPassword, newPassword } = req.body;

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


  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate current password if password change is requested

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }
    }
    // Update user data
    const updatedData = { name, email };
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatedData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    return res.status(200).json({ message: 'Settings updated successfully', user: updatedUser });
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
}