import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Video,
  MapPin,
  Phone,
  Star
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

  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    symptoms: [],
    notes: ''
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow_up', label: 'Follow-up Visit' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'video_consultation', label: 'Video Consultation' },
    { value: 'home_visit', label: 'Home Visit' }
  ];

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Chest Pain', 'Fatigue', 
    'Nausea', 'Back Pain', 'Sore Throat', 'Shortness of Breath', 'Dizziness'
  ];

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/patient/appointments');
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/patient/doctors/available');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const bookAppointment = async () => {
    if (!newAppointment.doctorId || !newAppointment.date || !newAppointment.time) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/patient/appointments', newAppointment);
      toast.success('Appointment booked successfully');
      setShowBookingModal(false);
      setNewAppointment({
        doctorId: '',
        date: '',
        time: '',
        type: 'consultation',
        symptoms: [],
        notes: ''
      });
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to book appointment');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await axios.put(`/api/patient/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video_consultation': return <Video className="h-4 w-4" />;
      case 'home_visit': return <MapPin className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchTerm || 
      apt.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSymptomToggle = (symptom) => {
    setNewAppointment(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">Manage your medical appointments</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="btn btn-primary flex items-center"
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
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getTypeIcon(appointment.type)}
                    <h3 className="text-lg font-semibold text-gray-900 ml-2">
                      {appointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <span className={`ml-3 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      Dr. {appointment.doctor.name} - {appointment.doctor.specialization}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {appointment.doctor.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {appointment.doctor.department}
                    </div>
                  </div>

                  {appointment.symptoms && appointment.symptoms.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Symptoms:</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.symptoms.map((symptom, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  
                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() => cancelAppointment(appointment._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Book New Appointment</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor *
                  </label>
                  <select
                    value={newAppointment.doctorId}
                    onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Doctor</option>
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
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                  {commonSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                        newAppointment.symptoms.includes(symptom)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  rows={4}
                  placeholder="Describe your symptoms or any additional information..."
                  className="input-field"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={bookAppointment}
                  className="btn btn-primary flex-1"
                >
                  Book Appointment
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
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
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Doctor Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> Dr. {selectedAppointment.doctor.name}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Specialization:</span> {selectedAppointment.doctor.specialization}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Department:</span> {selectedAppointment.doctor.department}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Phone:</span> {selectedAppointment.doctor.phone}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Appointment Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span> {selectedAppointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Date:</span> {new Date(selectedAppointment.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Time:</span> {selectedAppointment.time}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Symptoms</h3>
                  <div className="flex flex-wrap gap-2">
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
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-sm text-gray-900">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.prescription && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Prescription</h3>
                  {selectedAppointment.prescription.medicines && selectedAppointment.prescription.medicines.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {selectedAppointment.prescription.medicines.map((med, index) => (
                        <div key={index} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}, {med.duration}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAppointment.prescription.instructions && (
                    <p className="text-sm text-gray-900">{selectedAppointment.prescription.instructions}</p>
                  )}
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