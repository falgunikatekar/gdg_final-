const express = require('express');
const { patientAuth } = require('../middleware/auth');
const router = express.Router();

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
        patientName: req.user.name || 'Patient',
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
      console.log(`👤 Patient: ${newRequest.patientName}`);

      // Emit real-time notification to all hospitals
      const io = req.app.get('io');
      if (io) {
        io.emit('new-emergency-request', {
          request: newRequest,
          timestamp: new Date(),
          message: `New ${severity} priority emergency request: ${type}`
        });
        
        console.log('📢 Emergency notification sent to all hospitals');
      }

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

module.exports = router;
