const express = require('express');
const { patientAuth } = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;
