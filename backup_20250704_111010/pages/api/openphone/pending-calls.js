// API endpoint for managing pending calls
import { PrismaClient } from '@prisma/client';
import withAuth from '../../../utils/withAuth';
import { logError } from '../../../utils/logger';

const prisma = new PrismaClient();

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.id;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, userId);
        break;
      case 'PATCH':
        await handlePatch(req, res, userId);
        break;
      default:
        return res.status(405).json({ 
          success: false, 
          message: `Method ${method} not allowed` 
        });
    }
  } catch (error) {
    logError('Pending calls API error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

async function handleGet(req, res, userId) {
  const { status } = req.query;

  const pendingCalls = await prisma.pendingCall.findMany({
    where: {
      userId: userId,
      ...(status && { status })
    },
    include: {
      contact: true
    },
    orderBy: {
      initiatedAt: 'desc'
    }
  });

  return res.status(200).json(pendingCalls);
}

async function handlePatch(req, res, userId) {
  const { callId } = req.query;
  const updateData = req.body;

  if (!callId) {
    return res.status(400).json({
      success: false,
      message: 'Call ID is required'
    });
  }

  // Verify the pending call belongs to the user
  const pendingCall = await prisma.pendingCall.findFirst({
    where: {
      id: callId,
      userId: userId
    }
  });

  if (!pendingCall) {
    return res.status(404).json({
      success: false,
      message: 'Pending call not found'
    });
  }

  const updatedCall = await prisma.pendingCall.update({
    where: { id: callId },
    data: updateData
  });

  return res.status(200).json({
    success: true,
    data: updatedCall
  });
}

export default withAuth(handler);