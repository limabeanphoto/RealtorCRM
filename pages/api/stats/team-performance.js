// pages/api/stats/team-performance.js
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../../utils/withAuth';
import metricsCache from '../../../utils/cache';

// Initialize Prisma client
const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  try {
    // Get date range from query params
    const { startDate, endDate, userId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    // Create a cache key based on parameters
    const cacheKey = `team_performance_${startDate}_${endDate}_${userId || 'all'}`;
    
    // Check if we have cached data
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached team performance data');
      return res.status(200).json(cachedData);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Make sure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' 
      });
    }

    // Build the response object
    const teamPerformance = {
      success: true,
      summary: {},
      goals: {},
      callsByOutcome: [],
      callsByDay: [],
      callsByTime: [],
      contactsStatus: [],
      tasksStatus: [],
      weeklyActivity: [],
      dailyPerformance: [],
      performanceMetrics: [],
      teamMembers: []
    };

    // Apply user filter if provided
    const userFilter = userId && userId !== 'all' ? { userId } : {};

    // Get calls metrics
    const totalCalls = await prisma.call.count({
      where: {
        date: {
          gte: start,
          lte: end
        },
        ...userFilter
      }
    });

    // Get deals metrics
    const totalDeals = await prisma.call.count({
      where: {
        date: {
          gte: start,
          lte: end
        },
        isDeal: true,
        ...userFilter
      }
    });

    // Calculate conversion rate
    const conversionRate = totalCalls > 0 
      ? parseFloat(((totalDeals / totalCalls) * 100).toFixed(2)) 
      : 0;

    // Get average calls per day
    const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const callsPerDay = parseFloat((totalCalls / daysDiff).toFixed(1));

    // Get total contacts added in the period
    const contactFilter = userId && userId !== 'all' ? { assignedTo: userId } : {};
    const totalContacts = await prisma.contact.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        ...contactFilter
      }
    });

    // Get tasks metrics
    const tasksFilter = userId && userId !== 'all' ? { userId } : {};
    const completedTasks = await prisma.task.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: 'Completed',
        ...tasksFilter
      }
    });

    const totalTasks = await prisma.task.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        ...tasksFilter
      }
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        dueDate: {
          lt: new Date()
        },
        status: {
          not: 'Completed'
        },
        ...tasksFilter
      }
    });

    // Calculate average follow-up time (simplified approximation)
    // In a real implementation, you'd need to calculate time between calls and follow-up tasks
    const followUpTimeDays = 2.3; // Placeholder - would be calculated from actual data

    // Populate the summary object
    teamPerformance.summary = {
      totalCalls,
      totalDeals,
      conversionRate,
      callsPerDay,
      totalContacts,
      tasksCompleted: completedTasks,
      tasksTotalCount: totalTasks,
      averageFollowUpTime: followUpTimeDays
    };

    // Populate goals data
    // In a real implementation, you'd likely fetch these from a goals table
    teamPerformance.goals = {
      callsGoal: { current: totalCalls, target: 400 },
      dealsGoal: { current: totalDeals, target: 50 },
      contactsGoal: { current: totalContacts, target: 250 },
      tasksGoal: { current: completedTasks, target: 100 }
    };

    // Get calls by outcome
    const callsOutcomes = await prisma.call.groupBy({
      by: ['outcome'],
      where: {
        date: {
          gte: start,
          lte: end
        },
        ...userFilter
      },
      _count: {
        _all: true
      }
    });

    teamPerformance.callsByOutcome = callsOutcomes.map(outcome => ({
      name: outcome.outcome,
      value: outcome._count._all
    }));

    // Get calls by day of week
    // In a real implementation, this would be a more complex database query
    // For demonstration, we'll generate placeholder data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysCounts = await Promise.all(dayNames.map(async (day, index) => {
      // This is a simplified example - in a real implementation you'd use SQL/Prisma
      // to count calls by day of week directly
      const count = Math.round(totalCalls / 7) + (index === 3 ? 15 : index === 5 ? -10 : Math.round(Math.random() * 10));
      return { day, calls: Math.max(0, count) };
    }));

    teamPerformance.callsByDay = daysCounts.slice(1, 6); // Mon-Fri

    // Generate calls by time of day (placeholder data)
    const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];
    teamPerformance.callsByTime = hours.map(time => {
      // Simulate a distribution with more calls in late morning and late afternoon
      let factor = 1;
      if (time === '11AM' || time === '4PM') factor = 1.5;
      if (time === '12PM' || time === '1PM') factor = 0.7;
      
      return {
        time,
        calls: Math.round((totalCalls / hours.length) * factor * (0.9 + Math.random() * 0.2))
      };
    });

    // Get contacts status distribution
    const contactsStatusData = await prisma.contact.groupBy({
      by: ['status'],
      where: {
        ...contactFilter
      },
      _count: {
        _all: true
      }
    });

    teamPerformance.contactsStatus = contactsStatusData.map(status => ({
      name: status.status,
      value: status._count._all
    }));

    // Get tasks status distribution
    const tasksStatusData = [
      { name: 'Completed', value: completedTasks },
      { name: 'Open', value: totalTasks - completedTasks }
    ];

    teamPerformance.tasksStatus = tasksStatusData;

    // Generate weekly activity data (placeholder)
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    teamPerformance.weeklyActivity = weeks.map(week => {
      const callCount = Math.round(totalCalls / 4 * (0.9 + Math.random() * 0.2));
      return {
        week,
        calls: callCount,
        deals: Math.round(callCount * (conversionRate / 100))
      };
    });

    // Generate daily performance data (combine with callsByDay)
    teamPerformance.dailyPerformance = teamPerformance.callsByDay.map(day => {
      return {
        name: day.day,
        calls: day.calls,
        tasks: Math.round(day.calls * 0.2),
        contacts: Math.round(day.calls * 0.15)
      };
    });

    // Generate performance metrics for radar chart
    teamPerformance.performanceMetrics = [
      { subject: 'Call Volume', A: calculatePerformanceScore(totalCalls, 400), fullMark: 100 },
      { subject: 'Deal Closing', A: calculatePerformanceScore(totalDeals, 50), fullMark: 100 },
      { subject: 'Task Completion', A: calculatePerformanceScore(completedTasks, 100), fullMark: 100 },
      { subject: 'Follow-up Speed', A: calculatePerformanceScore(3.5 - followUpTimeDays, 3, true), fullMark: 100 },
      { subject: 'Contact Creation', A: calculatePerformanceScore(totalContacts, 250), fullMark: 100 }
    ];

    // Only include team comparison when viewing all users
    if (!userId || userId === 'all') {
      // Get team member data
      const users = await prisma.user.findMany({
        where: {
          // Filter for non-admin users if needed
          // role: 'member'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      // For each user, get their performance metrics
      const teamMembersData = await Promise.all(users.map(async (user) => {
        // Get user's call count
        const userCalls = await prisma.call.count({
          where: {
            date: {
              gte: start,
              lte: end
            },
            userId: user.id
          }
        });

        // Get user's deal count
        const userDeals = await prisma.call.count({
          where: {
            date: {
              gte: start,
              lte: end
            },
            userId: user.id,
            isDeal: true
          }
        });

        // Calculate conversion rate
        const userRate = userCalls > 0 
          ? parseFloat(((userDeals / userCalls) * 100).toFixed(1)) 
          : 0;

        return {
          name: `${user.firstName} ${user.lastName}`,
          calls: userCalls,
          deals: userDeals,
          rate: userRate
        };
      }));

      teamPerformance.teamMembers = teamMembersData;
    }

    teamPerformance.overdueTasks = overdueTasks;

    // Cache the result
    metricsCache.set(cacheKey, teamPerformance);

    return res.status(200).json(teamPerformance);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching team performance: ' + error.message 
    });
  }
}

// Helper function to calculate performance score based on progress toward a goal
function calculatePerformanceScore(current, target, inverse = false) {
  if (inverse) {
    // For metrics where lower is better (like follow-up time)
    return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  }
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export default withAdminAuth(handler);