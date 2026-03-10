import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Bed,
  UserPlus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  X
} from 'lucide-react';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, [statusFilter, currentPage]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage);
      
      const response = await axios.get(`/api/hospital/patients?${params}`);
      setPatients(response.data.patients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (patientId, status, assignedRoom = '', assignedBed = '') => {
    try {
      await axios.put(`/api/hospital/patients/${patientId}/status`, {
        status,
        assignedRoom,
        assignedBed
      });
      toast.success('Patient status updated successfully');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to update patient status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'outpatient': return 'bg-green-100 text-green-800';
      case 'admitted': return 'bg-blue-100 text-blue-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'discharged': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm || 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contact.includes(searchTerm) ||
      patient.currentIssue.toLowerCase().includes(searchTerm.toLowerCase());
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
        <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
        <p className="text-gray-600">Manage patient information and admission status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
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
              <option value="outpatient">Outpatient</option>
              <option value="admitted">Admitted</option>
              <option value="emergency">Emergency</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">Age: {patient.age} | {patient.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {patient.contact}
                      </div>
                      {patient.email && (
                        <div className="flex items-center text-gray-500">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {patient.currentIssue}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.assignedRoom && (
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1 text-gray-400" />
                          Room: {patient.assignedRoom}
                        </div>
                      )}
                      {patient.assignedBed && (
                        <div className="text-gray-500">Bed: {patient.assignedBed}</div>
                      )}
                      {!patient.assignedRoom && !patient.assignedBed && (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {patient.status === 'outpatient' && (
                      <button
                        onClick={() => {
                          const room = prompt('Enter room number:');
                          const bed = prompt('Enter bed number:');
                          if (room && bed) {
                            updatePatientStatus(patient._id, 'admitted', room, bed);
                          }
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Bed className="h-4 w-4" />
                      </button>
                    )}
                    
                    {patient.status === 'admitted' && (
                      <button
                        onClick={() => updatePatientStatus(patient._id, 'discharged')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No patients found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Patient Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Age:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPatient.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gender:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedPatient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`status-badge ${getStatusColor(selectedPatient.status)}`}>
                        {selectedPatient.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedPatient.contact}</span>
                    </div>
                    {selectedPatient.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedPatient.email}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-900">{selectedPatient.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Issue</h4>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      {selectedPatient.currentIssue}
                    </p>
                  </div>
                  
                  {selectedPatient.ongoingTreatments && selectedPatient.ongoingTreatments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ongoing Treatments</h4>
                      <div className="space-y-1">
                        {selectedPatient.ongoingTreatments.map((treatment, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-2 mb-1">
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical History */}
              {selectedPatient.medicalHistory && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Medical History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPatient.medicalHistory.bloodGroup && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Blood Group</h4>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                          {selectedPatient.medicalHistory.bloodGroup}
                        </span>
                      </div>
                    )}
                    
                    {selectedPatient.medicalHistory.allergies && selectedPatient.medicalHistory.allergies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
                        <div className="space-y-1">
                          {selectedPatient.medicalHistory.allergies.map((allergy, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mr-2 mb-1">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedPatient.medicalHistory.chronicDiseases && selectedPatient.medicalHistory.chronicDiseases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Chronic Diseases</h4>
                        <div className="space-y-1">
                          {selectedPatient.medicalHistory.chronicDiseases.map((disease, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mr-2 mb-1">
                              {disease}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedPatient.medicalHistory.currentMedications && selectedPatient.medicalHistory.currentMedications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Medications</h4>
                        <div className="space-y-1">
                          {selectedPatient.medicalHistory.currentMedications.map((medication, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mr-2 mb-1">
                              {medication}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedPatient.emergencyContact && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Emergency Contact</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Name:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Phone:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Relation:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedPatient.emergencyContact.relation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Information */}
              {(selectedPatient.assignedRoom || selectedPatient.assignedBed) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Current Assignment</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPatient.assignedRoom && (
                        <div>
                          <span className="text-sm text-gray-600">Room:</span>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.assignedRoom}</p>
                        </div>
                      )}
                      {selectedPatient.assignedBed && (
                        <div>
                          <span className="text-sm text-gray-600">Bed:</span>
                          <p className="text-sm font-medium text-gray-900">{selectedPatient.assignedBed}</p>
                        </div>
                      )}
                    </div>
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

export default PatientManagement;
