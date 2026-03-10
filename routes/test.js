const express = require('express');
const router = express.Router();

// Simple test route to check if server is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working',
    mockMode: global.mockMode || false,
    timestamp: new Date().toISOString()
  });
});

// Test authentication without middleware
router.post('/test-auth', (req, res) => {
  const { username, password } = req.body;
  
  if (global.mockMode) {
    if (username === 'admin' && password === 'admin123') {
      res.json({ 
        success: true,
        message: 'Mock authentication works',
        hospital: global.mockHospital
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid credentials'
      });
    }
  } else {
    res.json({ 
      success: false,
      message: 'Not in mock mode'
    });
  }
});

module.exports = router;
