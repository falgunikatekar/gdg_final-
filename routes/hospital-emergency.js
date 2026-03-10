const express = require('express');
const { hospitalAuth } = require('../middleware/auth');
const router = express.Router();

// Get emergency requests for hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      // Get all emergency requests and filter by location proximity
      const allRequests = global.mockEmergencyRequests || [];
      
      // In real implementation, this would filter by actual location proximity
      // For demo, we'll show all requests as if they're nearby
      const hospitalRequests = allRequests.map(request => ({
        ...request,
        distance: `${Math.floor(Math.random() * 10) + 1} km`,
        estimatedArrival: `${Math.floor(Math.random() * 15) + 5} mins`,
        priority: getPriorityLevel(request.severity),
        status: request.status || 'pending'
      }));

      return res.json({ 
        requests: hospitalRequests,
        total: hospitalRequests.length,
        pending: hospitalRequests.filter(r => r.status === 'pending').length,
        inProgress: hospitalRequests.filter(r => r.status === 'in_progress').length
      });
    }

    // Database implementation would go here
    res.json({ 
      requests: [],
      total: 0,
      pending: 0,
      inProgress: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept emergency request
router.put('/:requestId/accept', hospitalAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { estimatedArrival, notes } = req.body;

    // Check if we're in mock mode
    if (global.mockMode) {
      const request = global.mockEmergencyRequests?.find(r => r._id === requestId);
      if (request) {
        request.status = 'accepted';
        request.hospitalId = req.user._id;
        request.hospitalName = req.user.name;
        request.acceptedAt = new Date();
        request.estimatedArrival = estimatedArrival || '15 mins';
        request.hospitalNotes = notes || '';
        
        console.log(`🚨 Emergency request ${requestId} accepted by hospital ${req.user.name}`);
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          io.emit('emergency-request-updated', {
            requestId,
            status: 'accepted',
            hospitalName: req.user.name,
            patientId: request.patientId
          });
        }
      }
      return res.json({ message: 'Emergency request accepted successfully' });
    }

    // Database implementation would go here
    res.json({ message: 'Emergency request accepted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update emergency request status
router.put('/:requestId/status', hospitalAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes, location } = req.body;

    // Check if we're in mock mode
    if (global.mockMode) {
      const request = global.mockEmergencyRequests?.find(r => r._id === requestId);
      if (request) {
        request.status = status;
        request.updatedAt = new Date();
        request.hospitalNotes = notes || request.hospitalNotes || '';
        
        if (location) {
          request.ambulanceLocation = location;
        }
        
        console.log(`🚨 Emergency request ${requestId} status updated to ${status}`);
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          io.emit('emergency-request-updated', {
            requestId,
            status,
            hospitalName: req.user.name,
            patientId: request.patientId,
            location
          });
        }
      }
      return res.json({ message: 'Emergency request status updated successfully' });
    }

    // Database implementation would go here
    res.json({ message: 'Emergency request status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emergency request details
router.get('/:requestId', hospitalAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Check if we're in mock mode
    if (global.mockMode) {
      const request = global.mockEmergencyRequests?.find(r => r._id === requestId);
      if (request) {
        // Add hospital-specific information
        const enrichedRequest = {
          ...request,
          distance: `${Math.floor(Math.random() * 10) + 1} km`,
          estimatedArrival: `${Math.floor(Math.random() * 15) + 5} mins`,
          priority: getPriorityLevel(request.severity),
          ambulanceDispatched: request.status === 'accepted' || request.status === 'in_progress',
          ambulanceLocation: request.ambulanceLocation || null
        };
        return res.json(enrichedRequest);
      }
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Database implementation would go here
    res.status(404).json({ message: 'Emergency request not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emergency statistics for hospital
router.get('/stats/overview', hospitalAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      const allRequests = global.mockEmergencyRequests || [];
      const stats = {
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(r => r.status === 'pending').length,
        acceptedRequests: allRequests.filter(r => r.status === 'accepted').length,
        inProgressRequests: allRequests.filter(r => r.status === 'in_progress').length,
        completedRequests: allRequests.filter(r => r.status === 'completed').length,
        averageResponseTime: '8 minutes',
        activeAmbulances: 3,
        availableAmbulances: 2,
        todayRequests: allRequests.filter(r => {
          const today = new Date().toDateString();
          return new Date(r.createdAt).toDateString() === today;
        }).length,
        criticalRequests: allRequests.filter(r => r.severity === 'critical').length
      };
      return res.json(stats);
    }

    // Database implementation would go here
    res.json({
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
      inProgressRequests: 0,
      completedRequests: 0,
      averageResponseTime: 'N/A',
      activeAmbulances: 0,
      availableAmbulances: 0,
      todayRequests: 0,
      criticalRequests: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to determine priority level
function getPriorityLevel(severity) {
  switch (severity) {
    case 'critical': return 'High Priority';
    case 'high': return 'High Priority';
    case 'medium': return 'Medium Priority';
    case 'low': return 'Low Priority';
    default: return 'Medium Priority';
  }
}

module.exports = router;
