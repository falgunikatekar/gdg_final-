import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Bed,
  DoorOpen,
  User,
  Activity,
  Plus,
  Edit2,
  Save,
  X,
  Download,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  Stethoscope
} from 'lucide-react';

const ResourceAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [newAllocation, setNewAllocation] = useState({
    type: '',
    resourceId: '',
    resourceName: '',
    patientId: '',
    doctorId: '',
    expectedDischargeDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllocations();
    fetchPatients();
    fetchDoctors();
    fetchStats();
  }, []);

  const fetchAllocations = async () => {
    try {
      const response = await axios.get('/api/allocations');
      // Handle both mock and real data formats
      const allocationsData = response.data.allocations || response.data;
      setAllocations(allocationsData.map(allocation => ({
        ...allocation,
        patientName: allocation.patientName || allocation.patient?.name || 'Unknown Patient',
        doctorName: allocation.doctorName || allocation.doctor?.name || null
      })));
    } catch (error) {
      toast.error('Failed to load allocations');
      console.error('Allocation fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/allocations/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/allocations/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/allocations/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const allocateResource = async () => {
    // Validation
    if (!newAllocation.type || !newAllocation.resourceName || !newAllocation.patientId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post('/api/allocations', newAllocation);
      toast.success('Resource allocated successfully');

      // Add the new allocation to the list immediately for better UX
      const newAlloc = {
        ...response.data.allocation,
        patientName: response.data.allocation.patientName || 'Mock Patient',
        doctorName: response.data.allocation.doctorName || null
      };
      setAllocations(prev => [newAlloc, ...prev]);

      setNewAllocation({
        type: '',
        resourceId: '',
        resourceName: '',
        patientId: '',
        doctorId: '',
        expectedDischargeDate: '',
        notes: ''
      });
      setShowAllocateForm(false);
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to allocate resource');
      console.error('Allocation error:', error);
    }
  };

  const releaseAllocation = async (allocationId) => {
    try {
      await axios.put(`/api/allocations/${allocationId}/release`);
      toast.success('Resource released successfully');

      // Update the allocation status in the local state
      setAllocations(prev => prev.map(alloc =>
        alloc._id === allocationId
          ? { ...alloc, status: 'released', updatedAt: new Date() }
          : alloc
      ));

      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to release resource');
      console.error('Release error:', error);
    }
  };

  const downloadAllocationReport = () => {
    const reportData = allocations.map(allocation => ({
      'Resource Type': allocation.type,
      'Resource Name': allocation.resourceName,
      'Patient Name': allocation.patientName,
      'Doctor Name': allocation.doctorName || 'N/A',
      'Allocation Date': new Date(allocation.allocationDate).toLocaleDateString(),
      'Expected Discharge': allocation.expectedDischargeDate 
        ? new Date(allocation.expectedDischargeDate).toLocaleDateString() 
        : 'N/A',
      'Status': allocation.status,
      'Notes': allocation.notes || 'N/A'
    }));

    const csvContent = [
      Object.keys(reportData[0]).join(','),
      ...reportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-allocation-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'bed': return <Bed className="h-4 w-4" />;
      case 'room': return <DoorOpen className="h-4 w-4" />;
      case 'equipment': return <Activity className="h-4 w-4" />;
      case 'doctor': return <Stethoscope className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'allocated': return 'bg-blue-100 text-blue-800';
      case 'in_use': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAllocations = allocations.filter(allocation =>
    (allocation.resourceName && allocation.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (allocation.patientName && allocation.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (allocation.doctorName && allocation.doctorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Resource Allocation</h1>
        <p className="text-gray-600">Manage bed, room, equipment, and doctor allocations to patients</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Bed className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Allocated Beds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.allocatedBeds}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DoorOpen className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Allocated Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.allocatedRooms}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Allocated Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{stats.allocatedEquipment}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Allocated Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.allocatedDoctors}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search allocations by resource, patient, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="">All Resources</option>
              <option value="bed">Beds</option>
              <option value="room">Rooms</option>
              <option value="equipment">Equipment</option>
              <option value="doctor">Doctors</option>
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAllocateForm(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Allocate Resource
            </button>
            <button
              onClick={downloadAllocationReport}
              className="btn btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
          </div>
        </div>

        {/* Allocation Form */}
        {showAllocateForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Allocate Resource to Patient</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <select
                value={newAllocation.type}
                onChange={(e) => setNewAllocation({...newAllocation, type: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Select Resource Type</option>
                <option value="bed">Bed</option>
                <option value="room">Room</option>
                <option value="equipment">Equipment</option>
                <option value="doctor">Doctor</option>
              </select>
              
              <input
                type="text"
                placeholder="Enter resource identifier (e.g., Bed-101, Room-A205)"
                value={newAllocation.resourceName}
                onChange={(e) => setNewAllocation({...newAllocation, resourceName: e.target.value})}
                className="input-field"
                required
              />
              
              <select
                value={newAllocation.patientId}
                onChange={(e) => setNewAllocation({...newAllocation, patientId: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} ({patient.age}y, {patient.gender})
                  </option>
                ))}
              </select>
              
              <select
                value={newAllocation.doctorId}
                onChange={(e) => setNewAllocation({...newAllocation, doctorId: e.target.value})}
                className="input-field"
              >
                <option value="">Select Doctor (Optional)</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              
              <input
                type="date"
                placeholder="Expected discharge date"
                value={newAllocation.expectedDischargeDate}
                onChange={(e) => setNewAllocation({...newAllocation, expectedDischargeDate: e.target.value})}
                className="input-field"
              />
              
              <textarea
                placeholder="Additional notes (e.g., Special requirements, equipment details)"
                value={newAllocation.notes}
                onChange={(e) => setNewAllocation({...newAllocation, notes: e.target.value})}
                className="input-field md:col-span-2 lg:col-span-3"
                rows="2"
              />
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button onClick={allocateResource} className="btn btn-success">
                <Save className="h-4 w-4 mr-2" />
                Allocate Resource
              </button>
              <button
                onClick={() => setShowAllocateForm(false)}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Allocations Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Discharge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAllocations.map((allocation) => (
                <tr key={allocation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getResourceIcon(allocation.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {allocation.resourceName}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {allocation.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {allocation.patientName || allocation.patient?.name || 'Unknown Patient'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {allocation.patient?.age ? `${allocation.patient.age}y, ${allocation.patient.gender}` : 'Age/Gender not available'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {allocation.patient?.contact || 'Contact not available'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {allocation.doctorName || allocation.doctor?.name ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Dr. {allocation.doctorName || allocation.doctor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {allocation.doctor?.specialization || 'Specialization not available'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(allocation.allocationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {allocation.expectedDischargeDate 
                      ? new Date(allocation.expectedDischargeDate).toLocaleDateString()
                      : 'Not set'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(allocation.status)}`}>
                      {allocation.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {allocation.status !== 'released' && (
                      <button
                        onClick={() => releaseAllocation(allocation._id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Release
                      </button>
                    )}
                    {allocation.notes && (
                      <button className="text-blue-600 hover:text-blue-900">
                        Notes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAllocations.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No allocations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by allocating a resource to a patient.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;
