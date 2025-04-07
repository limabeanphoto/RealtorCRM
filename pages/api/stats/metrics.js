import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }

  try {
    // Get date range from query params
    const { startDate, endDate, userId } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get calls metrics
    const callsData = await getCallsMetrics(start, end, userId)
    
    // Get deals metrics
    const dealsData = await getDealsMetrics(start, end, userId)
    
    // Get deal value metrics
    const dealValueMetrics = await getDealValueMetrics(start, end, userId)
    
    // Get contacts metrics
    const contactsData = await getContactsMetrics(start, end)
    
    // Get tasks metrics
    const tasksData = await getTasksMetrics(start, end, userId)
    
    // Get call outcomes distribution
    const callOutcomes = await getCallOutcomesDistribution(start, end, userId)
    
    // Get conversion rates
    const conversionRates = {
      calls: callsData.total,
      deals: dealsData.total,
      rate: callsData.total > 0 
        ? Math.round((dealsData.total / callsData.total) * 100) 
        : 0
    }

    return res.status(200).json({
      success: true,
      callsMetrics: callsData,
      dealsMetrics: dealsData,
      dealValueMetrics: dealValueMetrics,
      contactsMetrics: contactsData,
      tasksMetrics: tasksData,
      callOutcomes,
      conversionRates
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return res.status(500).json({ success: false, message: 'Error fetching metrics' })
  }
}

// Get calls metrics
async function getCallsMetrics(startDate, endDate, userId = null) {
  // Build where clause
  const whereClause = {
    date: {
      gte: startDate,
      lte: endDate
    }
  }
  
  // Add userId filter if provided
  if (userId) {
    whereClause.userId = userId
  }
  
  // Get total calls in date range
  const totalCalls = await prisma.call.count({
    where: whereClause
  })

  // Determine interval based on date range
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  let interval, format
  
  if (days <= 1) {
    interval = 'hour'
    format = 'HH:mm'
  } else if (days <= 31) {
    interval = 'day'
    format = 'MMM dd'
  } else if (days <= 365) {
    interval = 'week'
    format = 'MMM dd'
  } else {
    interval = 'month'
    format = 'MMM yyyy'
  }

  // Get calls grouped by interval
  let callsByInterval = []
  
  // Add userId to where clause in raw queries if present
  let userIdFilter = ''
  if (userId) {
    userIdFilter = `AND "userId" = '${userId}'`
  }
  
  if (interval === 'hour') {
    // Group by hour
    const calls = await prisma.$queryRaw`
      SELECT date_trunc('hour', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    callsByInterval = calls.map(call => ({
      date: formatDate(call.interval_date, format),
      timestamp: call.interval_date,
      count: Number(call.count)
    }))
  } else if (interval === 'day') {
    // Group by day
    const calls = await prisma.$queryRaw`
      SELECT date_trunc('day', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    callsByInterval = calls.map(call => ({
      date: formatDate(call.interval_date, format),
      timestamp: call.interval_date,
      count: Number(call.count)
    }))
  } else if (interval === 'week') {
    // Group by week
    const calls = await prisma.$queryRaw`
      SELECT date_trunc('week', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    callsByInterval = calls.map(call => ({
      date: formatDate(call.interval_date, format),
      timestamp: call.interval_date,
      count: Number(call.count)
    }))
  } else {
    // Group by month
    const calls = await prisma.$queryRaw`
      SELECT date_trunc('month', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    callsByInterval = calls.map(call => ({
      date: formatDate(call.interval_date, format),
      timestamp: call.interval_date,
      count: Number(call.count)
    }))
  }

  return {
    total: totalCalls,
    data: callsByInterval
  }
}

// Get deals metrics
async function getDealsMetrics(startDate, endDate, userId = null) {
  // Build where clause
  const whereClause = {
    date: {
      gte: startDate,
      lte: endDate
    },
    isDeal: true
  }
  
  // Add userId filter if provided
  if (userId) {
    whereClause.userId = userId
  }
  
  // Get total deals in date range
  const totalDeals = await prisma.call.count({
    where: whereClause
  })

  // Determine interval based on date range
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  let interval, format
  
  if (days <= 1) {
    interval = 'hour'
    format = 'HH:mm'
  } else if (days <= 31) {
    interval = 'day'
    format = 'MMM dd'
  } else if (days <= 365) {
    interval = 'week'
    format = 'MMM dd'
  } else {
    interval = 'month'
    format = 'MMM yyyy'
  }

  // Get deals grouped by interval
  let dealsByInterval = []
  
  // Add userId to where clause in raw queries if present
  let userIdFilter = ''
  if (userId) {
    userIdFilter = `AND "userId" = '${userId}'`
  }
  
  if (interval === 'hour') {
    // Group by hour
    const deals = await prisma.$queryRaw`
      SELECT date_trunc('hour', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate}
        AND "isDeal" = true ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    dealsByInterval = deals.map(deal => ({
      date: formatDate(deal.interval_date, format),
      timestamp: deal.interval_date,
      count: Number(deal.count)
    }))
  } else if (interval === 'day') {
    // Group by day
    const deals = await prisma.$queryRaw`
      SELECT date_trunc('day', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate}
        AND "isDeal" = true ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    dealsByInterval = deals.map(deal => ({
      date: formatDate(deal.interval_date, format),
      timestamp: deal.interval_date,
      count: Number(deal.count)
    }))
  } else if (interval === 'week') {
    // Group by week
    const deals = await prisma.$queryRaw`
      SELECT date_trunc('week', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate}
        AND "isDeal" = true ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    dealsByInterval = deals.map(deal => ({
      date: formatDate(deal.interval_date, format),
      timestamp: deal.interval_date,
      count: Number(deal.count)
    }))
  } else {
    // Group by month
    const deals = await prisma.$queryRaw`
      SELECT date_trunc('month', "date") as interval_date, COUNT(*) as count
      FROM "Call"
      WHERE "date" >= ${startDate} AND "date" <= ${endDate}
        AND "isDeal" = true ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    dealsByInterval = deals.map(deal => ({
      date: formatDate(deal.interval_date, format),
      timestamp: deal.interval_date,
      count: Number(deal.count)
    }))
  }

  return {
    total: totalDeals,
    data: dealsByInterval
  }
}

// Get deal value metrics
async function getDealValueMetrics(startDate, endDate, userId = null) {
  // Build where clause
  const whereClause = {
    date: {
      gte: startDate,
      lte: endDate
    },
    isDeal: true,
    dealValue: {
      not: null
    }
  }
  
  // Add userId filter if provided
  if (userId) {
    whereClause.userId = userId
  }
  
  // Add userId to where clause in raw queries if present
  let userIdFilter = ''
  if (userId) {
    userIdFilter = `AND "userId" = '${userId}'`
  }
  
  // Get sum and average of deal values
  const dealValues = await prisma.$queryRaw`
    SELECT 
      COALESCE(SUM("dealValue"), 0) as total_value,
      COALESCE(AVG("dealValue"), 0) as average_value,
      COUNT(*) as deal_count
    FROM "Call"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
      AND "isDeal" = true
      AND "dealValue" IS NOT NULL ${prisma.raw(userIdFilter)}
  `
  
  return {
    totalValue: Number(dealValues[0].total_value).toFixed(2),
    averageValue: Number(dealValues[0].average_value).toFixed(2),
    count: Number(dealValues[0].deal_count)
  }
}

// Get contacts metrics
async function getContactsMetrics(startDate, endDate) {
  // Get total contacts added in date range
  const totalContacts = await prisma.contact.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Determine interval based on date range
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  let interval, format
  
  if (days <= 1) {
    interval = 'hour'
    format = 'HH:mm'
  } else if (days <= 31) {
    interval = 'day'
    format = 'MMM dd'
  } else if (days <= 365) {
    interval = 'week'
    format = 'MMM dd'
  } else {
    interval = 'month'
    format = 'MMM yyyy'
  }

  // Get contacts grouped by interval
  let contactsByInterval = []
  
  if (interval === 'hour') {
    // Group by hour
    const contacts = await prisma.$queryRaw`
      SELECT date_trunc('hour', "createdAt") as interval_date, COUNT(*) as count
      FROM "Contact"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    contactsByInterval = contacts.map(contact => ({
      date: formatDate(contact.interval_date, format),
      timestamp: contact.interval_date,
      count: Number(contact.count)
    }))
  } else if (interval === 'day') {
    // Group by day
    const contacts = await prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt") as interval_date, COUNT(*) as count
      FROM "Contact"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    contactsByInterval = contacts.map(contact => ({
      date: formatDate(contact.interval_date, format),
      timestamp: contact.interval_date,
      count: Number(contact.count)
    }))
  } else if (interval === 'week') {
    // Group by week
    const contacts = await prisma.$queryRaw`
      SELECT date_trunc('week', "createdAt") as interval_date, COUNT(*) as count
      FROM "Contact"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    contactsByInterval = contacts.map(contact => ({
      date: formatDate(contact.interval_date, format),
      timestamp: contact.interval_date,
      count: Number(contact.count)
    }))
  } else {
    // Group by month
    const contacts = await prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") as interval_date, COUNT(*) as count
      FROM "Contact"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    contactsByInterval = contacts.map(contact => ({
      date: formatDate(contact.interval_date, format),
      timestamp: contact.interval_date,
      count: Number(contact.count)
    }))
  }

  return {
    total: totalContacts,
    data: contactsByInterval
  }
}

// Get tasks metrics
async function getTasksMetrics(startDate, endDate, userId = null) {
  // Build where clause
  const whereClause = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }
  
  // Add userId filter if provided
  if (userId) {
    whereClause.userId = userId
  }
  
  // Get total tasks created in date range
  const totalTasks = await prisma.task.count({
    where: whereClause
  })

  // Determine interval based on date range
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  let interval, format
  
  if (days <= 1) {
    interval = 'hour'
    format = 'HH:mm'
  } else if (days <= 31) {
    interval = 'day'
    format = 'MMM dd'
  } else if (days <= 365) {
    interval = 'week'
    format = 'MMM dd'
  } else {
    interval = 'month'
    format = 'MMM yyyy'
  }

  // Get tasks grouped by interval
  let tasksByInterval = []
  
  // Add userId to where clause in raw queries if present
  let userIdFilter = ''
  if (userId) {
    userIdFilter = `AND "userId" = '${userId}'`
  }
  
  if (interval === 'hour') {
    // Group by hour
    const tasks = await prisma.$queryRaw`
      SELECT date_trunc('hour', "createdAt") as interval_date, COUNT(*) as count
      FROM "Task"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    tasksByInterval = tasks.map(task => ({
      date: formatDate(task.interval_date, format),
      timestamp: task.interval_date,
      count: Number(task.count)
    }))
  } else if (interval === 'day') {
    // Group by day
    const tasks = await prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt") as interval_date, COUNT(*) as count
      FROM "Task"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    tasksByInterval = tasks.map(task => ({
      date: formatDate(task.interval_date, format),
      timestamp: task.interval_date,
      count: Number(task.count)
    }))
  } else if (interval === 'week') {
    // Group by week
    const tasks = await prisma.$queryRaw`
      SELECT date_trunc('week', "createdAt") as interval_date, COUNT(*) as count
      FROM "Task"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    tasksByInterval = tasks.map(task => ({
      date: formatDate(task.interval_date, format),
      timestamp: task.interval_date,
      count: Number(task.count)
    }))
  } else {
    // Group by month
    const tasks = await prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") as interval_date, COUNT(*) as count
      FROM "Task"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate} ${prisma.raw(userIdFilter)}
      GROUP BY interval_date
      ORDER BY interval_date
    `
    
    tasksByInterval = tasks.map(task => ({
      date: formatDate(task.interval_date, format),
      timestamp: task.interval_date,
      count: Number(task.count)
    }))
  }

  return {
    total: totalTasks,
    data: tasksByInterval
  }
}

// Get call outcomes distribution
async function getCallOutcomesDistribution(startDate, endDate, userId = null) {
  // Build where clause
  const whereClause = {
    date: {
      gte: startDate,
      lte: endDate
    }
  }
  
  // Add userId filter if provided
  if (userId) {
    whereClause.userId = userId
  }
  
  // Get counts of each call outcome
  const outcomesCounts = await prisma.call.groupBy({
    by: ['outcome'],
    where: whereClause,
    _count: {
      _all: true
    }
  })

  // Format data for pie chart
  return outcomesCounts.map(item => ({
    name: item.outcome,
    value: item._count._all
  }))
}

// Helper function to format date
function formatDate(date, format) {
  const d = new Date(date)
  
  if (format === 'HH:mm') {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  
  if (format === 'MMM dd') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[d.getMonth()]} ${d.getDate()}`
  }
  
  if (format === 'MMM yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[d.getMonth()]} ${d.getFullYear()}`
  }
  
  return d.toLocaleDateString()
}