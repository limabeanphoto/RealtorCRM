// pages/api/contacts/import.js
import { PrismaClient } from '@prisma/client'
import { withAdminAuth } from '../../../utils/withAuth'

const prisma = new PrismaClient()

/**
 * Import contacts from CSV API handler
 * Only accessible to admin users
 */
async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
  
  try {
    const { contacts } = req.body
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No contacts provided or invalid format' 
      })
    }
    
    // Initialize results tracker
    const results = {
      total: contacts.length,
      imported: 0,
      duplicates: 0,
      errors: []
    }
    
    // Process contacts one by one to provide detailed error information
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      
      try {
        // Validate required fields
        if (!contact.name || !contact.phone) {
          results.errors.push({
            index: i,
            error: 'Name and phone are required',
            contact
          })
          continue
        }
        
        // Check for duplicates (based on phone or email if provided)
        const duplicateChecks = []
        
        // Always check phone number
        duplicateChecks.push({ phone: contact.phone })
        
        // Check email if provided
        if (contact.email) {
          duplicateChecks.push({ email: contact.email })
        }
        
        // Look for potential duplicates
        const existingContacts = await prisma.contact.findMany({
          where: {
            OR: duplicateChecks
          }
        })
        
        if (existingContacts.length > 0) {
          results.duplicates++
          results.errors.push({
            index: i,
            error: 'Duplicate contact found (based on phone or email)',
            contact,
            duplicates: existingContacts
          })
          continue
        }
        
        // Create the contact
        await prisma.contact.create({
          data: {
            name: contact.name,
            email: contact.email || null,
            phone: contact.phone,
            company: contact.company || null,
            notes: contact.notes || null,
            status: 'Open', // New contacts start as Open
            assignedTo: null // New contacts start unassigned
          }
        })
        
        // Increment successful imports counter
        results.imported++
      } catch (error) {
        // Add to errors list
        results.errors.push({
          index: i,
          error: error.message || 'Unknown error',
          contact
        })
      }
    }
    
    // Return results
    return res.status(200).json({ 
      success: true, 
      message: `Import completed. ${results.imported} contacts imported.`,
      data: results
    })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error importing contacts: ' + error.message
    })
  }
}

// Use admin auth middleware to ensure only admins can access this endpoint
export default withAdminAuth(handler)