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
    
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockAllocations = [
        {
          _id: 'alloc_1',
          type: 'bed',
          resourceName: 'Bed A-101',
          status: 'allocated',
          patient: { name: 'John Doe', age: 45, gender: 'Male', contact: '9876543210' },
          doctor: { name: 'Dr. Rajesh Sharma', specialization: 'Cardiology' },
          allocationDate: new Date(),
          notes: 'Emergency admission'
        },
        {
          _id: 'alloc_2',
          type: 'room',
          resourceName: 'Room 201',
          status: 'allocated',
          patient: { name: 'Jane Smith', age: 32, gender: 'Female', contact: '9876543211' },
          doctor: { name: 'Dr. Priya Nair', specialization: 'Pediatrics' },
          allocationDate: new Date(),
          notes: 'Post-surgery recovery'
        },
        {
          _id: 'alloc_3',
          type: 'equipment',
          resourceName: 'Ventilator V-001',
          status: 'in_use',
          patient: { name: 'Bob Johnson', age: 28, gender: 'Male', contact: '9876543212' },
          doctor: { name: 'Dr. Amit Patel', specialization: 'Emergency Medicine' },
          allocationDate: new Date(),
          notes: 'Critical care support'
        }
      ];
      
      res.json({
        allocations: mockAllocations,
        totalPages: 1,
        currentPage: page,
        total: mockAllocations.length
      });
      return;
    }
    
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
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Failed to fetch allocations' });
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

    // Check if we're in mock mode
    if (global.mockMode) {
      // Mock allocation - no database validation needed
      const mockAllocation = {
        _id: `alloc_${Date.now()}`,
        type,
        resourceId: resourceId || `resource_${Date.now()}`,
        resourceName,
        patient: patientId,
        patientName: 'Mock Patient', // In real app, this would come from patient lookup
        doctor: doctorId,
        doctorName: doctorId ? 'Mock Doctor' : null, // In real app, this would come from doctor lookup
        allocationDate: new Date(),
        expectedDischargeDate,
        status: 'allocated',
        notes,
        hospital: hospitalId
      };

      return res.status(201).json({
        message: 'Resource allocated successfully',
        allocation: mockAllocation
      });
    }

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
    // Check if we're in mock mode
    if (global.mockMode) {
      return res.json({
        message: 'Resource released successfully',
        allocation: {
          _id: req.params.id,
          status: 'released',
          updatedAt: new Date()
        }
      });
    }

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

    // Check if we're in mock mode
    if (global.mockMode) {
      const mockStats = {
        allocatedBeds: 12,
        allocatedRooms: 8,
        allocatedEquipment: 5,
        allocatedDoctors: 3,
        totalAllocated: 28,
        totalInUse: 22,
        totalReleased: 6
      };
      return res.json(mockStats);
    }

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
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockPatients = [
        { _id: 'patient_1', name: 'John Doe', age: 45, gender: 'male', contact: '9876543210' },
        { _id: 'patient_2', name: 'Jane Smith', age: 32, gender: 'female', contact: '9876543211' },
        { _id: 'patient_3', name: 'Robert Johnson', age: 28, gender: 'male', contact: '9876543212' },
        { _id: 'patient_4', name: 'Maria Garcia', age: 55, gender: 'female', contact: '9876543213' },
        { _id: 'patient_5', name: 'David Wilson', age: 41, gender: 'male', contact: '9876543214' }
      ];
      return res.json(mockPatients);
    }

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
    // Check if we're in mock mode
    if (global.mockMode) {
      const mockDoctors = [
        { _id: 'doctor_1', name: 'Dr. Rajesh Sharma', specialization: 'Cardiology', department: 'Cardiology' },
        { _id: 'doctor_2', name: 'Dr. Priya Nair', specialization: 'Pediatrics', department: 'Pediatrics' },
        { _id: 'doctor_3', name: 'Dr. Amit Patel', specialization: 'Orthopedics', department: 'Orthopedics' },
        { _id: 'doctor_4', name: 'Dr. Sneha Reddy', specialization: 'Gynecology', department: 'Gynecology' },
        { _id: 'doctor_5', name: 'Dr. Vikram Malhotra', specialization: 'Neurology', department: 'Neurology' },
        { _id: 'doctor_6', name: 'Dr. Bharat Ramrao Sontakke', specialization: 'General Anatomy', department: 'Anatomy' },
        { _id: 'doctor_7', name: 'Dr. Amol Dube', specialization: 'General Medicine', department: 'General Medicine' },
        { _id: 'doctor_8', name: 'Dr. Akash Bang', specialization: 'Pediatrics/Hematology', department: 'Pediatrics' },
        { _id: 'doctor_9', name: 'Dr. Anand Chellappan', specialization: 'Nephrology', department: 'Nephrology' },
        { _id: 'doctor_10', name: 'Dr. Chetana Ratnaparkhi', specialization: 'Radio Diagnosis', department: 'Radio Diagnosis' }
      ];
      return res.json(mockDoctors);
    }

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
