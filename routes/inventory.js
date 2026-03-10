const express = require('express');
const { hospitalAuth } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const router = express.Router();

// Get all medicines for the hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;
    const hospitalId = req.user._id;
    
    const query = { hospital: hospitalId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const medicines = await Medicine.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Medicine.countDocuments(query);
    
    res.json({
      medicines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medicines expiring soon (within 30 days)
router.get('/expiring-soon', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const medicines = await Medicine.find({
      hospital: hospitalId,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      status: { $ne: 'expired' }
    }).sort({ expiryDate: 1 });
    
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expired medicines
router.get('/expired', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    
    const medicines = await Medicine.find({
      hospital: hospitalId,
      expiryDate: { $lt: new Date() }
    }).sort({ expiryDate: -1 });
    
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock medicines
router.get('/low-stock', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    
    const medicines = await Medicine.find({
      hospital: hospitalId,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    }).sort({ stock: 1 });
    
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new medicine
router.post('/', hospitalAuth, async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      category,
      description,
      unitPrice,
      stock,
      minStockLevel,
      batchNumber,
      manufactureDate,
      expiryDate,
      storageConditions,
      supplier
    } = req.body;
    
    const medicine = new Medicine({
      name,
      manufacturer,
      category,
      description,
      unitPrice,
      stock,
      minStockLevel,
      batchNumber,
      manufactureDate,
      expiryDate,
      storageConditions,
      supplier,
      hospital: req.user._id
    });
    
    // Check if expired
    if (new Date(expiryDate) < new Date()) {
      medicine.status = 'expired';
    } else if (stock <= minStockLevel) {
      medicine.status = 'low_stock';
    }
    
    await medicine.save();
    
    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('medicine-added', {
      medicine
    });
    
    res.status(201).json({ message: 'Medicine added successfully', medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medicine stock
router.put('/:medicineId/stock', hospitalAuth, async (req, res) => {
  try {
    const { stock } = req.body;
    const { medicineId } = req.params;
    
    const medicine = await Medicine.findOne({
      _id: medicineId,
      hospital: req.user._id
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    medicine.stock = stock;
    
    // Update status based on stock and expiry
    if (new Date(medicine.expiryDate) < new Date()) {
      medicine.status = 'expired';
    } else if (stock <= 0) {
      medicine.status = 'out_of_stock';
    } else if (stock <= medicine.minStockLevel) {
      medicine.status = 'low_stock';
    } else {
      medicine.status = 'available';
    }
    
    await medicine.save();
    
    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('medicine-stock-updated', {
      medicineId: medicine._id,
      stock: medicine.stock,
      status: medicine.status
    });
    
    res.json({ message: 'Stock updated successfully', medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medicine details
router.put('/:medicineId', hospitalAuth, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const updates = req.body;
    
    const medicine = await Medicine.findOne({
      _id: medicineId,
      hospital: req.user._id
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    Object.assign(medicine, updates);
    
    // Update status based on stock and expiry
    if (new Date(medicine.expiryDate) < new Date()) {
      medicine.status = 'expired';
    } else if (medicine.stock <= 0) {
      medicine.status = 'out_of_stock';
    } else if (medicine.stock <= medicine.minStockLevel) {
      medicine.status = 'low_stock';
    } else {
      medicine.status = 'available';
    }
    
    await medicine.save();
    
    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('medicine-updated', {
      medicine
    });
    
    res.json({ message: 'Medicine updated successfully', medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medicine
router.delete('/:medicineId', hospitalAuth, async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    const medicine = await Medicine.findOneAndDelete({
      _id: medicineId,
      hospital: req.user._id
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Emit real-time update
    req.app.get('io').to(req.user._id.toString()).emit('medicine-deleted', {
      medicineId
    });
    
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory statistics
router.get('/stats/overview', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    
    const stats = await Medicine.aggregate([
      { $match: { hospital: hospitalId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$unitPrice'] } }
        }
      }
    ]);
    
    const categoryStats = await Medicine.aggregate([
      { $match: { hospital: hospitalId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' }
        }
      }
    ]);
    
    const expiringSoonCount = await Medicine.countDocuments({
      hospital: hospitalId,
      expiryDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $gte: new Date()
      },
      status: { $ne: 'expired' }
    });
    
    const expiredCount = await Medicine.countDocuments({
      hospital: hospitalId,
      expiryDate: { $lt: new Date() }
    });
    
    res.json({
      statusStats: stats,
      categoryStats,
      expiringSoonCount,
      expiredCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
