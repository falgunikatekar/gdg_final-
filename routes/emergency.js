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

// Get nearby hospitals
router.get('/', patientAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockHospitals = [
        {
          _id: 'hospital_1',
          name: 'City General Hospital',
          address: '123 Main St, City',
          phone: '555-0101',
          distance: '2.5 km',
          emergencyServices: true,
          rating: 4.5,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        {
          _id: 'hospital_2',
          name: 'St. Mary Medical Center',
          address: '456 Oak Ave, City',
          phone: '555-0102',
          distance: '4.1 km',
          emergencyServices: true,
          rating: 4.2,
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        {
          _id: 'hospital_3',
          name: 'Regional Medical Center',
          address: '789 Pine Rd, City',
          phone: '555-0103',
          distance: '6.8 km',
          emergencyServices: true,
          rating: 4.0,
          coordinates: { lat: 40.6892, lng: -74.0445 }
        }
      ];
      return res.json({ hospitals: mockHospitals });
    }

    // Database implementation would go here
    res.json({ hospitals: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emergency requests for patient
router.get('/', patientAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockRequests = global.mockEmergencyRequests || [];
      return res.json({ requests: mockRequests });
    }

    // Database implementation would go here
    res.json({ requests: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create emergency request
router.post('/', patientAuth, async (req, res) => {
  try {
    const { type, severity, description, location, contactNumber, symptoms, additionalInfo } = req.body;
    const patientId = req.user._id;

    // Check if we're in mock mode
    if (global.mockMode) {
      const newRequest = {
        _id: `emergency_${Date.now()}`,
        type,
        severity,
        description,
        location,
        contactNumber,
        symptoms: symptoms || [],
        additionalInfo,
        patientId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!global.mockEmergencyRequests) {
        global.mockEmergencyRequests = [];
      }
      global.mockEmergencyRequests.push(newRequest);

      // Simulate emergency notification
      console.log(`🚨 EMERGENCY REQUEST: ${type} - ${severity} priority`);
      console.log(`📍 Location: ${location}`);
      console.log(`📞 Contact: ${contactNumber}`);
      console.log(`📝 Description: ${description}`);

      return res.status(201).json({
        message: 'Emergency request submitted successfully',
        request: newRequest
      });
    }

    // Database implementation would go here
    res.status(201).json({ message: 'Emergency request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update emergency request status
router.put('/:requestId/status', patientAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    // Check if we're in mock mode
    if (global.mockMode) {
      if (global.mockEmergencyRequests) {
        const request = global.mockEmergencyRequests.find(r => r._id === requestId);
        if (request) {
          request.status = status;
          request.updatedAt = new Date();
        }
      }
      return res.json({ message: 'Emergency request status updated' });
    }

    // Database implementation would go here
    res.json({ message: 'Emergency request status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emergency statistics
router.get('/', patientAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      const requests = global.mockEmergencyRequests || [];
      const stats = {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        averageResponseTime: '15 minutes',
        nearbyHospitals: 3,
        emergencyContacts: global.mockEmergencyContacts?.length || 0
      };
      return res.json(stats);
    }

    // Database implementation would go here
    res.json({
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      averageResponseTime: 'N/A',
      nearbyHospitals: 0,
      emergencyContacts: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
