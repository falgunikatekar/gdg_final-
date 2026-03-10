import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const useSocket = () => {
  const { user, userType } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
      auth: {
        token: localStorage.getItem('token'),
        userType,
        userId: user.id || user._id
      }
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      
      // Join hospital room if user is hospital staff
      if (userType === 'hospital') {
        socket.emit('join-hospital', user.id || user._id);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Hospital-specific events
    if (userType === 'hospital') {
      // Resource updates
      socket.on('beds-updated', (data) => {
        toast.success(`Beds updated: ${data.availableBeds}/${data.totalBeds} available`);
      });

      socket.on('rooms-updated', (data) => {
        toast.success(`Rooms updated: ${data.availableRooms}/${data.totalRooms} available`);
      });

      socket.on('equipment-updated', (data) => {
        toast(`${data.equipment.name} status updated to ${data.equipment.status}`);
      });

      socket.on('medicine-added', (data) => {
        toast.success(`New medicine added: ${data.medicine.name}`);
      });

      socket.on('medicine-stock-updated', (data) => {
        if (data.status === 'low_stock') {
          toast.error(`Low stock alert: Medicine ID ${data.medicineId}`);
        } else if (data.status === 'expired') {
          toast.error(`Medicine expired: ID ${data.medicineId}`);
        }
      });

      // Appointment events
      socket.on('appointment-booked', (data) => {
        toast.success(`New appointment booked with ${data.appointment.doctor.name}`);
      });

      socket.on('appointment-updated', (data) => {
        toast(`Appointment ${data.appointmentId} status updated`);
      });

      socket.on('appointment-cancelled', (data) => {
        toast(`Appointment ${data.appointmentId} was cancelled`);
      });

      // Report events
      socket.on('report-uploaded', (data) => {
        toast.success(`New report uploaded: ${data.report.title}`);
      });

      socket.on('report-generated', (data) => {
        toast.success(`Report generated for appointment ${data.reportId}`);
      });

      socket.on('report-status-updated', (data) => {
        toast(`Report status updated: ${data.reportId}`);
      });

      socket.on('report-deleted', (data) => {
        toast(`Report deleted: ${data.reportId}`);
      });

      // Patient events
      socket.on('patient-status-updated', (data) => {
        toast(`Patient ${data.patientId} status updated to ${data.status}`);
      });
    }

    // Patient-specific events
    if (userType === 'patient') {
      socket.on('appointment-confirmed', (data) => {
        toast.success(`Your appointment has been confirmed!`);
      });

      socket.on('appointment-reminder', (data) => {
        toast(`Reminder: Appointment tomorrow at ${data.time}`);
      });

      socket.on('report-ready', (data) => {
        toast.success(`Your medical report is ready for download!`);
      });
    }

    // Generic notifications
    socket.on('notification', (data) => {
      if (data.type === 'success') {
        toast.success(data.message);
      } else if (data.type === 'error') {
        toast.error(data.message);
      } else if (data.type === 'info') {
        toast(data.message);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, userType]);

  // Function to emit events
  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  // Function to join a room
  const joinRoom = (room) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', room);
    }
  };

  // Function to leave a room
  const leaveRoom = (room) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', room);
    }
  };

  return {
    socket: socketRef.current,
    emit,
    joinRoom,
    leaveRoom
  };
};

export default useSocket;
