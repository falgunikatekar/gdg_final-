import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Search,
  Eye,
  Plus
} from 'lucide-react';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (statusFilter) params.append('status', statusFilter);
      if (doctorFilter) params.append('doctorId', doctorFilter);
      
      const response = await axios.get(`/api/appointments?${params}`);
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, doctorFilter]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/appointments/doctors/available');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/appointments/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchStats();
  }, [selectedDate, statusFilter, doctorFilter, fetchAppointments]);

  const seedDoctors = async () => {
    try {
      const response = await axios.post('/api/appointments/doctors/seed');
      toast.success(response.data.message);
      fetchDoctors(); // Refresh the doctors list
    } catch (error) {
      console.error('Failed to seed doctors:', error);
      toast.error('Failed to seed doctors');
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      toast.success('Appointment status updated');
      fetchAppointments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update appointment');
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
      apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.contact.includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
        <p className="text-gray-600">Manage patient appointments and doctor schedules</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.weekAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.monthAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.statusStats?.reduce((sum, stat) => sum + stat.totalRevenue, 0).toFixed(2) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
            
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
            
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={seedDoctors}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Seed Doctors
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">{appointment.time}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{appointment.patient.name}</div>
                      <div className="text-gray-500">Age: {appointment.patient.age}</div>
                      <div className="text-gray-500">{appointment.patient.contact}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Dr. {appointment.doctor.name}</div>
                      <div className="text-gray-500">{appointment.doctor.specialization}</div>
                      <div className="text-gray-500">{appointment.doctor.department}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {appointment.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        ${appointment.payment?.amount || 0}
                      </div>
                      <div className={`text-xs ${
                        appointment.payment?.status === 'paid' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {appointment.payment?.status || 'pending'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'in_progress')}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    )}
                    
                    {appointment.status === 'in_progress' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAppointments.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> {selectedAppointment.patient.name}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Age:</span> {selectedAppointment.patient.age}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Contact:</span> {selectedAppointment.patient.contact}
                    </p>
                  </div>
                </div>
                
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
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Date:</span> {new Date(selectedAppointment.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Time:</span> {selectedAppointment.time}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Duration:</span> {selectedAppointment.duration} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span> {selectedAppointment.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status.replace('_', ' ')}
                      </span>
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Payment:</span> ${selectedAppointment.payment?.amount || 0}
                      <span className={`ml-2 text-xs ${
                        selectedAppointment.payment?.status === 'paid' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({selectedAppointment.payment?.status || 'pending'})
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

export default AppointmentManagement;