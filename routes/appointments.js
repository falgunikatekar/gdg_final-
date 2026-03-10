const express = require('express');
const { hospitalAuth, patientAuth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const router = express.Router();

// Seed doctors with specialties (for development)
router.post('/doctors/seed', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    
    // Clear existing doctors for this hospital
    await Doctor.deleteMany({ hospital: hospitalId });

    const doctors = [
      {
        name: 'Dr. Rajesh Sharma',
        specialization: 'Cardiology',
        email: 'rajesh.sharma@hospital.com',
        phone: '+91 9876543211',
        experience: 15,
        qualification: 'MD, DM (Cardiology)',
        department: 'Cardiology',
        hospital: hospitalId,
        schedule: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', maxAppointments: 20 },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', maxAppointments: 20 },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', maxAppointments: 20 }
        ]
      },
      {
        name: 'Dr. Priya Nair',
        specialization: 'Pediatrics',
        email: 'priya.nair@hospital.com',
        phone: '+91 9876543212',
        experience: 12,
        qualification: 'MD (Pediatrics)',
        department: 'Pediatrics',
        hospital: hospitalId,
        schedule: [
          { day: 'Tuesday', startTime: '08:00', endTime: '16:00', maxAppointments: 25 },
          { day: 'Thursday', startTime: '08:00', endTime: '16:00', maxAppointments: 25 },
          { day: 'Saturday', startTime: '09:00', endTime: '14:00', maxAppointments: 15 }
        ]
      },
      {
        name: 'Dr. Amit Patel',
        specialization: 'Orthopedics',
        email: 'amit.patel@hospital.com',
        phone: '+91 9876543213',
        experience: 18,
        qualification: 'MS (Orthopedics), MCh',
        department: 'Orthopedics',
        hospital: hospitalId,
        schedule: [
          { day: 'Monday', startTime: '10:00', endTime: '18:00', maxAppointments: 15 },
          { day: 'Wednesday', startTime: '10:00', endTime: '18:00', maxAppointments: 15 },
          { day: 'Friday', startTime: '10:00', endTime: '18:00', maxAppointments: 15 }
        ]
      },
      {
        name: 'Dr. Sneha Reddy',
        specialization: 'Gynecology',
        email: 'sneha.reddy@hospital.com',
        phone: '+91 9876543214',
        experience: 10,
        qualification: 'MD, DGO (Gynecology)',
        department: 'Gynecology',
        hospital: hospitalId,
        schedule: [
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', maxAppointments: 20 },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', maxAppointments: 20 },
          { day: 'Saturday', startTime: '09:00', endTime: '15:00', maxAppointments: 18 }
        ]
      },
      {
        name: 'Dr. Vikram Malhotra',
        specialization: 'Neurology',
        email: 'vikram.malhotra@hospital.com',
        phone: '+91 9876543215',
        experience: 20,
        qualification: 'MD, DM (Neurology)',
        department: 'Neurology',
        hospital: hospitalId,
        schedule: [
          { day: 'Monday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 },
          { day: 'Wednesday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 },
          { day: 'Friday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 }
        ]
      }
    ];

    const insertedDoctors = await Doctor.insertMany(doctors);
    res.json({ 
      message: 'Doctors seeded successfully', 
      doctors: insertedDoctors.map(d => ({
        id: d._id,
        name: d.name,
        specialization: d.specialization,
        department: d.department,
        experience: d.experience
      }))
    });
  } catch (error) {
    console.error('Error seeding doctors:', error);
    res.status(500).json({ message: 'Failed to seed doctors' });
  }
});

// Get available doctors with their schedules
router.get('/doctors/available', hospitalAuth, async (req, res) => {
  try {
    const { date, specialization } = req.query;
    const hospitalId = req.user._id;
    
    let query = { hospital: hospitalId, available: true };
    if (specialization) query.specialization = specialization;
    
    const doctors = await Doctor.find(query)
      .select('name specialization department schedule experience qualification')
      .sort({ name: 1 });
    
    // If date is provided, check availability for that date
    if (date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const doctorsWithAvailability = doctors.map(doctor => {
        const daySchedule = doctor.schedule.find(s => s.day === dayOfWeek);
        return {
          ...doctor.toObject(),
          isAvailable: !!daySchedule,
          schedule: daySchedule || null
        };
      });
      
      res.json(doctorsWithAvailability);
    } else {
      res.json(doctors);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/doctors/:doctorId/slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const daySchedule = doctor.schedule.find(s => s.day === dayOfWeek);
    if (!daySchedule) {
      return res.json({ availableSlots: [] });
    }
    
    // Get existing appointments for that date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: targetDate,
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('time duration');
    
    // Generate time slots
    const slots = [];
    const startTime = new Date(`2000-01-01T${daySchedule.startTime}`);
    const endTime = new Date(`2000-01-01T${daySchedule.endTime}`);
    const slotDuration = 30; // 30 minutes per appointment
    
    let currentTime = new Date(startTime);
    let appointmentCount = 0;
    
    while (currentTime < endTime && appointmentCount < daySchedule.maxAppointments) {
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      // Check if this slot is already booked
      const isBooked = existingAppointments.some(apt => {
        const aptTime = new Date(`2000-01-01T${apt.time}`);
        const aptEndTime = new Date(aptTime.getTime() + apt.duration * 60000);
        const slotEndTime = new Date(currentTime.getTime() + slotDuration * 60000);
        
        return (currentTime >= aptTime && currentTime < aptEndTime) ||
               (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
               (currentTime <= aptTime && slotEndTime >= aptEndTime);
      });
      
      if (!isBooked) {
        slots.push(timeString);
        appointmentCount++;
      }
      
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }
    
    res.json({ availableSlots: slots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book appointment (for patients)
router.post('/', patientAuth, async (req, res) => {
  try {
    const { doctorId, date, time, type, symptoms, notes } = req.body;
    const patientId = req.user._id;
    
    // Validate doctor and availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.available) {
      return res.status(400).json({ message: 'Doctor not available' });
    }
    
    // Check if slot is still available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      time,
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot not available' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      hospital: doctor.hospital,
      date: new Date(date),
      time,
      type: type || 'consultation',
      symptoms: symptoms || [],
      notes
    });
    
    await appointment.save();
    
    // Update doctor's patients list
    if (!doctor.patients.includes(patientId)) {
      doctor.patients.push(patientId);
      await doctor.save();
    }
    
    // Emit real-time update
    req.app.get('io').to(doctor.hospital.toString()).emit('appointment-booked', {
      appointment: await Appointment.findById(appointment._id)
        .populate('patient', 'name contact')
        .populate('doctor', 'name specialization')
    });
    
    res.status(201).json({ 
      message: 'Appointment booked successfully', 
      appointment 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for hospital
router.get('/', hospitalAuth, async (req, res) => {
  try {
    const { date, status, doctorId, page = 1, limit = 20 } = req.query;
    const hospitalId = req.user._id;
    
    const query = { hospital: hospitalId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name age contact')
      .populate('doctor', 'name specialization department')
      .sort({ date: 1, time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Appointment.countDocuments(query);
    
    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for patient
router.get('/patient', patientAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const patientId = req.user._id;
    
    const query = { patient: patientId };
    if (status) query.status = status;
    
    const appointments = await Appointment.find(query)
      .populate('doctor', 'name specialization department')
      .populate('hospital', 'name address phone')
      .sort({ date: -1, time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Appointment.countDocuments(query);
    
    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.put('/:appointmentId/status', hospitalAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, prescription, payment } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (status) appointment.status = status;
    if (prescription) appointment.prescription = prescription;
    if (payment) appointment.payment = payment;
    
    await appointment.save();
    
    // Emit real-time update
    req.app.get('io').to(appointment.hospital.toString()).emit('appointment-updated', {
      appointmentId: appointment._id,
      status: appointment.status
    });
    
    res.json({ 
      message: 'Appointment updated successfully', 
      appointment 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    // Emit real-time update
    req.app.get('io').to(appointment.hospital.toString()).emit('appointment-cancelled', {
      appointmentId: appointment._id
    });
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment statistics
router.get('/stats/overview', hospitalAuth, async (req, res) => {
  try {
    const hospitalId = req.user._id;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Appointment.aggregate([
      { $match: { hospital: hospitalId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'paid'] },
                '$payment.amount',
                0
              ]
            }
          }
        }
      }
    ]);
    
    const todayAppointments = await Appointment.countDocuments({
      hospital: hospitalId,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    const weekAppointments = await Appointment.countDocuments({
      hospital: hospitalId,
      date: { $gte: startOfWeek }
    });
    
    const monthAppointments = await Appointment.countDocuments({
      hospital: hospitalId,
      date: { $gte: startOfMonth }
    });
    
    res.json({
      statusStats: stats,
      todayAppointments,
      weekAppointments,
      monthAppointments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
