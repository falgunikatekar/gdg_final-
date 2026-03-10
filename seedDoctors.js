const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
require('dotenv').config();

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first hospital (or create one if needed)
    let hospital = await Hospital.findOne();
    if (!hospital) {
      hospital = new Hospital({
        name: 'City General Hospital',
        email: 'admin@cityhospital.com',
        phone: '+91 9876543210',
        address: '123 Main Street, City',
        registrationNumber: 'HOS001'
      });
      await hospital.save();
    }

    // Clear existing doctors
    await Doctor.deleteMany({});

    const doctors = [
      {
        name: 'Dr. Rajesh Sharma',
        specialization: 'Cardiology',
        email: 'rajesh.sharma@hospital.com',
        phone: '+91 9876543211',
        experience: 15,
        qualification: 'MD, DM (Cardiology)',
        department: 'Cardiology',
        hospital: hospital._id,
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
        hospital: hospital._id,
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
        hospital: hospital._id,
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
        hospital: hospital._id,
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
        hospital: hospital._id,
        schedule: [
          { day: 'Monday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 },
          { day: 'Wednesday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 },
          { day: 'Friday', startTime: '08:00', endTime: '16:00', maxAppointments: 12 }
        ]
      }
    ];

    // Insert doctors
    await Doctor.insertMany(doctors);
    console.log(`${doctors.length} doctors added successfully!`);

    // Display added doctors
    const addedDoctors = await Doctor.find().populate('hospital', 'name');
    console.log('\nAdded Doctors:');
    addedDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.name} - ${doctor.specialization} (${doctor.department})`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors();
