import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  MapPin,
  Phone
} from 'lucide-react';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: '',
    notes: ''
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'test', label: 'Medical Test' }
  ];

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`/api/appointments/patient?${params}`);
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/appointments/doctors/available');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    
    setLoadingSlots(true);
    try {
      const response = await axios.get(`/api/appointments/doctors/${doctorId}/slots?date=${date}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const bookAppointment = async () => {
    try {
      const symptoms = newAppointment.symptoms.split(',').map(s => s.trim()).filter(s => s);
      
      await axios.post('/api/appointments', {
        ...newAppointment,
        symptoms
      });
      
      toast.success('Appointment booked successfully');
      setShowBookingModal(false);
      setNewAppointment({
        doctorId: '',
        date: '',
        time: '',
        type: 'consultation',
        symptoms: '',
        notes: ''
      });
      setBookingStep(1);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to book appointment');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.delete(`/api/appointments/${appointmentId}`);
        toast.success('Appointment cancelled successfully');
        fetchAppointments();
      } catch (error) {
        toast.error('Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no_show': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchTerm || 
      apt.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your medical appointments</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {appointment.doctor.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.doctor.specialization} • {appointment.doctor.department}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {appointment.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {appointment.hospital?.name || 'Hospital'}
                      </div>
                    </div>

                    {appointment.symptoms && appointment.symptoms.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                        <div className="flex flex-wrap gap-1">
                          {appointment.symptoms.map((symptom, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
                    </span>
                    
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                        className="block w-full btn btn-secondary text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => cancelAppointment(appointment._id)}
                          className="block w-full btn btn-danger text-sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found</p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="mt-4 btn btn-primary"
            >
              Book Your First Appointment
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStep(1);
                    setNewAppointment({
                      doctorId: '',
                      date: '',
                      time: '',
                      type: 'consultation',
                      symptoms: '',
                      notes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor *
                    </label>
                    <select
                      value={newAppointment.doctorId}
                      onChange={(e) => {
                        setNewAppointment({...newAppointment, doctorId: e.target.value});
                        if (newAppointment.date) {
                          fetchAvailableSlots(e.target.value, newAppointment.date);
                        }
                      }}
                      className="input-field"
                    >
                      <option value="">Choose a doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type *
                    </label>
                    <select
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
                      className="input-field"
                    >
                      {appointmentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => {
                        setNewAppointment({...newAppointment, date: e.target.value});
                        if (newAppointment.doctorId) {
                          fetchAvailableSlots(newAppointment.doctorId, e.target.value);
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>

                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={!newAppointment.doctorId || !newAppointment.date}
                    className="btn btn-primary w-full disabled:opacity-50"
                  >
                    Next - Select Time Slot
                  </button>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots *
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setNewAppointment({...newAppointment, time: slot})}
                            className={`p-2 text-sm border rounded-lg transition-colors ${
                              newAppointment.time === slot
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No available slots for this date. Please select another date.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newAppointment.symptoms}
                      onChange={(e) => setNewAppointment({...newAppointment, symptoms: e.target.value})}
                      className="input-field"
                      placeholder="fever, headache, cough"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      className="input-field"
                      rows="3"
                      placeholder="Any additional information..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="btn btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={bookAppointment}
                      disabled={!newAppointment.time}
                      className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
                  <p className="text-sm text-gray-900">Dr. {selectedAppointment.doctor.name}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.doctor.specialization}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Hospital</h3>
                  <p className="text-sm text-gray-900">{selectedAppointment.hospital?.name}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.hospital?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`status-badge ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Symptoms</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedAppointment.symptoms.map((symptom, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <p className="text-sm text-gray-900">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.prescription && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Prescription</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {selectedAppointment.prescription.medicines?.map((med, index) => (
                      <div key={index} className="text-sm text-gray-900 mb-1">
                        {med.name} - {med.dosage}, {med.frequency}, {med.duration}
                      </div>
                    ))}
                    {selectedAppointment.prescription.instructions && (
                      <p className="text-sm text-gray-700 mt-2">{selectedAppointment.prescription.instructions}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
