const express = require('express');
const { patientAuth } = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;
