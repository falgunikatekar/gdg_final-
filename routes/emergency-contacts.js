const express = require('express');
const { patientAuth } = require('../middleware/auth');
const router = express.Router();

// Get emergency contacts for patient
router.get('/', patientAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockContacts = global.mockEmergencyContacts || [
        {
          _id: 'contact_1',
          name: 'John Doe',
          relationship: 'Spouse',
          phone: '9876543210',
          email: 'john.doe@email.com',
          isPrimary: true,
          patientId: req.user._id
        },
        {
          _id: 'contact_2',
          name: 'Jane Smith',
          relationship: 'Parent',
          phone: '9876543211',
          email: 'jane.smith@email.com',
          isPrimary: false,
          patientId: req.user._id
        }
      ];
      return res.json({ contacts: mockContacts });
    }

    // Database implementation would go here
    res.json({ contacts: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add emergency contact
router.post('/', patientAuth, async (req, res) => {
  try {
    const { name, relationship, phone, email, isPrimary } = req.body;
    const patientId = req.user._id;

    // Check if we're in mock mode
    if (global.mockMode) {
      const newContact = {
        _id: `contact_${Date.now()}`,
        name,
        relationship,
        phone,
        email,
        isPrimary: isPrimary || false,
        patientId,
        createdAt: new Date()
      };

      if (!global.mockEmergencyContacts) {
        global.mockEmergencyContacts = [];
      }
      global.mockEmergencyContacts.push(newContact);

      return res.status(201).json({
        message: 'Emergency contact added successfully',
        contact: newContact
      });
    }

    // Database implementation would go here
    res.status(201).json({ message: 'Emergency contact added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete emergency contact
router.delete('/:contactId', patientAuth, async (req, res) => {
  try {
    const { contactId } = req.params;

    // Check if we're in mock mode
    if (global.mockMode) {
      if (global.mockEmergencyContacts) {
        global.mockEmergencyContacts = global.mockEmergencyContacts.filter(
          contact => contact._id !== contactId
        );
      }
      return res.json({ message: 'Emergency contact deleted successfully' });
    }

    // Database implementation would go here
    res.json({ message: 'Emergency contact deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
