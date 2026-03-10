const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { hospitalAuth } = require('../middleware/auth');

// Get all equipment for the hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    // Check if we're in mock mode
    if (global.mockMode) {
      res.json(global.mockEquipment || []);
      return;
    }
    
    const equipment = await Equipment.find({ hospitalId: req.user._id }).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Failed to fetch equipment' });
  }
});

// Add new equipment
router.post('/', hospitalAuth, async (req, res) => {
  try {
    const { name, type, total } = req.body;
    
    console.log('Adding equipment request:', { name, type, total });
    console.log('Hospital ID:', req.user._id);
    
    // Validate input
    if (!name || !type || !total || total <= 0) {
      return res.status(400).json({ 
        message: 'Please provide valid equipment details (name, type, and total quantity > 0)' 
      });
    }
    
    const newEquipment = {
      _id: 'equip_' + Date.now(),
      hospitalId: req.user._id,
      name: String(name),
      type: String(type),
      total: parseInt(total),
      available: parseInt(total),
      status: 'working',
      createdAt: new Date()
    };
    
    console.log('New equipment object:', newEquipment);
    
    // Check if we're in mock mode
    if (global.mockMode) {
      global.mockEquipment.push(newEquipment);
      console.log('Equipment saved successfully in mock mode');
      
      // Emit real-time update
      try {
        req.app.get('io').to(req.user._id.toString()).emit('equipment-added', {
          equipment: newEquipment
        });
      } catch (socketError) {
        console.log('Socket emit failed, but equipment was added:', socketError.message);
      }
      
      res.status(201).json({ 
        message: 'Equipment added successfully',
        equipment: newEquipment
      });
      return;
    }
    
    // Normal database operations
    const equipment = new Equipment(newEquipment);
    await equipment.save();
    
    console.log('Equipment saved successfully');
    
    // Emit real-time update
    try {
      req.app.get('io').to(req.user._id.toString()).emit('equipment-added', {
        equipment: equipment
      });
    } catch (socketError) {
      console.log('Socket emit failed, but equipment was added:', socketError.message);
    }
    
    res.status(201).json({ 
      message: 'Equipment added successfully',
      equipment: equipment
    });
  } catch (error) {
    console.error('Error adding equipment:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Try to provide more specific error information
    let errorMessage = 'Failed to add equipment';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'CastError') {
      errorMessage = `Data type error: ${error.message}`;
    } else {
      errorMessage = `Server error: ${error.message}`;
    }
    
    res.status(500).json({ 
      message: errorMessage
    });
  }
});

// Update equipment status
router.put('/:equipmentId/status', hospitalAuth, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { status } = req.body;
    
    const equipment = await Equipment.findOne({ 
      _id: equipmentId, 
      hospitalId: req.user._id 
    });
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    equipment.status = status;
    await equipment.save();
    
    // Emit real-time update
    try {
      req.app.get('io').to(req.user._id.toString()).emit('equipment-updated', {
        equipmentId,
        equipment: equipment
      });
    } catch (socketError) {
      console.log('Socket emit failed, but equipment was updated:', socketError.message);
    }
    
    res.json({ 
      message: 'Equipment status updated',
      equipment: equipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Failed to update equipment' });
  }
});

// Delete equipment
router.delete('/:equipmentId', hospitalAuth, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    
    const equipment = await Equipment.findOneAndDelete({ 
      _id: equipmentId, 
      hospitalId: req.user._id 
    });
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Emit real-time update
    try {
      req.app.get('io').to(req.user._id.toString()).emit('equipment-deleted', {
        equipmentId
      });
    } catch (socketError) {
      console.log('Socket emit failed, but equipment was deleted:', socketError.message);
    }
    
    res.json({ 
      message: 'Equipment deleted successfully',
      equipment: equipment
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Failed to delete equipment' });
  }
});

module.exports = router;
