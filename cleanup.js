const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
require('dotenv').config();

const cleanupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear any malformed equipment data
    const hospitals = await Hospital.find({});
    
    for (const hospital of hospitals) {
      let needsSave = false;
      
      // Clean up equipment array
      if (hospital.equipment) {
        hospital.equipment = hospital.equipment.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 typeof item.name === 'string' && 
                 typeof item.type === 'string' && 
                 typeof item.total === 'number' &&
                 typeof item.available === 'number';
        });
        
        // Ensure all equipment has proper structure
        hospital.equipment = hospital.equipment.map(item => ({
          name: item.name || 'Unknown',
          type: item.type || 'Unknown',
          total: item.total || 0,
          available: item.available || item.total || 0,
          status: item.status || 'working'
        }));
        
        needsSave = true;
      }
      
      if (needsSave) {
        await hospital.save();
        console.log(`Cleaned up equipment for hospital: ${hospital.name}`);
      }
    }

    console.log('Database cleanup completed');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanupDatabase();
