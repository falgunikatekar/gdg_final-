const express = require('express');
const { hospitalAuth, patientAuth } = require('../middleware/auth');
const Allocation = require('../models/Allocation');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const router = express.Router();

// Get all allocations for hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const hospitalId = req.user._id;
    
    let query = { hospital: hospitalId };
    if (type) query.type = type;
    if (status) query.status = status;
    
    const allocations = await Allocation.find(query)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name specialization')
      .sort({ allocationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Allocation.countDocuments(query);
    
    res.json({
      allocations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate resource to patient
router.post('/', hospitalAuth, async (req, res) => {
  try {
    const {
      type,
      resourceId,
      resourceName,
      patientId,
      doctorId,
      expectedDischargeDate,
      notes
    } = req.body;
    
    const hospitalId = req.user._id;
    
    // Validate patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Validate doctor if provided
    let doctorName = null;
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      doctorName = doctor.name;
    }
    
    // Check if resource is already allocated
    const existingAllocation = await Allocation.findOne({
      type,
      resourceId,
      status: { $in: ['allocated', 'in_use'] },
      hospital: hospitalId
    });
    
    if (existingAllocation) {
      return res.status(400).json({ message: 'Resource is already allocated' });
    }
    
    const allocation = new Allocation({
      type,
      resourceId,
      resourceName,
      patient: patientId,
      patientName: patient.name,
      doctor: doctorId,
      doctorName,
      expectedDischargeDate,
      notes,
      hospital: hospitalId
    });
    
    await allocation.save();
    
    // Update hospital resource counts
    if (type === 'bed') {
      await Hospital.findByIdAndUpdate(hospitalId, {
        $inc: { availableBeds: -1 }
      });
    } else if (type === 'room') {
      await Hospital.findByIdAndUpdate(hospitalId, {
        $inc: { availableRooms: -1 }
      });
    }
    
    res.status(201).json({
      message: 'Resource allocated successfully',
      allocation: await Allocation.findById(allocation._id)
        .populate('patient', 'name age gender contact')
        .populate('doctor', 'name specialization')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Release allocation
router.put('/:id/release', hospitalAuth, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    if (allocation.hospital.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (allocation.status === 'released') {
      return res.status(400).json({ message: 'Resource already released' });
    }
    
    allocation.status = 'released';
    allocation.updatedAt = new Date();
    await allocation.save();
    
    // Update hospital resource counts
    if (allocation.type === 'bed') {
      await Hospital.findByIdAndUpdate(allocation.hospital, {
        $inc: { availableBeds: 1 }
      });
    } else if (allocation.type === 'room') {
      await Hospital.findByIdAndUpdate(allocation.hospital, {
        $inc: { availableRooms: 1 }
      });
    }
    
    res.json({
      message: 'Resource released successfully',
      allocation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allocation statistics
router.get('/stats', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    
    const stats = await Promise.all([
      Allocation.countDocuments({ hospital: hospitalId, type: 'bed', status: { $in: ['allocated', 'in_use'] } }),
      Allocation.countDocuments({ hospital: hospitalId, type: 'room', status: { $in: ['allocated', 'in_use'] } }),
      Allocation.countDocuments({ hospital: hospitalId, type: 'equipment', status: { $in: ['allocated', 'in_use'] } }),
      Allocation.countDocuments({ hospital: hospitalId, type: 'doctor', status: { $in: ['allocated', 'in_use'] } }),
      Allocation.countDocuments({ hospital: hospitalId, status: 'allocated' }),
      Allocation.countDocuments({ hospital: hospitalId, status: 'in_use' }),
      Allocation.countDocuments({ hospital: hospitalId, status: 'released' })
    ]);
    
    res.json({
      allocatedBeds: stats[0],
      allocatedRooms: stats[1],
      allocatedEquipment: stats[2],
      allocatedDoctors: stats[3],
      totalAllocated: stats[4],
      totalInUse: stats[5],
      totalReleased: stats[6]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patients for allocation dropdown
router.get('/patients', hospitalAuth, async (req, res) => {
  try {
    const patients = await Patient.find({ hospital: req.user._id })
      .select('name age gender contact')
      .sort({ name: 1 });
    
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctors for allocation dropdown
router.get('/doctors', hospitalAuth, async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospital: req.user._id, available: true })
      .select('name specialization department')
      .sort({ name: 1 });
    
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
