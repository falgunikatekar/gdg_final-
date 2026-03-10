import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bed, DoorOpen, Plus, Edit2, Save, X, Activity, AlertCircle } from 'lucide-react';

const ResourceManagement = () => {
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBeds, setEditingBeds] = useState(false);
  const [editingRooms, setEditingRooms] = useState(false);
  const [newEquipment, setNewEquipment] = useState({ name: '', type: '', total: 0 });
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    try {
      const response = await axios.get('/api/hospital/dashboard');
      setHospitalData(response.data.hospital);
    } catch (error) {
      toast.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  const updateBeds = async () => {
    try {
      await axios.put('/api/hospital/beds', {
        availableBeds: hospitalData.availableBeds
      });
      toast.success('Bed availability updated');
      setEditingBeds(false);
    } catch (error) {
      toast.error('Failed to update beds');
    }
  };

  const updateRooms = async () => {
    try {
      await axios.put('/api/hospital/rooms', {
        availableRooms: hospitalData.availableRooms
      });
      toast.success('Room availability updated');
      setEditingRooms(false);
    } catch (error) {
      toast.error('Failed to update rooms');
    }
  };

  const updateEquipmentStatus = async (equipmentId, status) => {
    try {
      await axios.put(`/api/hospital/equipment/${equipmentId}`, { status });
      toast.success('Equipment status updated');
      fetchHospitalData();
    } catch (error) {
      toast.error('Failed to update equipment');
    }
  };

  const addEquipment = async () => {
    try {
      await axios.post('/api/hospital/equipment', newEquipment);
      toast.success('Equipment added successfully');
      setNewEquipment({ name: '', type: '', total: 0 });
      setShowAddEquipment(false);
      fetchHospitalData();
    } catch (error) {
      toast.error('Failed to add equipment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hospitalData) {
    return <div className="text-center py-12">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
        <p className="text-gray-600">Manage hospital beds, rooms, and medical equipment</p>
      </div>

      {/* Beds Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bed className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Bed Management</h2>
            </div>
            <button
              onClick={() => setEditingBeds(!editingBeds)}
              className="btn btn-secondary"
            >
              {editingBeds ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Total Beds</p>
              <p className="text-3xl font-bold text-gray-900">{hospitalData.totalBeds}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Available Beds</p>
              {editingBeds ? (
                <input
                  type="number"
                  min="0"
                  max={hospitalData.totalBeds}
                  value={hospitalData.availableBeds}
                  onChange={(e) => setHospitalData({
                    ...hospitalData,
                    availableBeds: parseInt(e.target.value) || 0
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
              ) : (
                <p className="text-3xl font-bold text-green-600">{hospitalData.availableBeds}</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Occupied Beds</p>
              <p className="text-3xl font-bold text-red-600">
                {hospitalData.totalBeds - hospitalData.availableBeds}
              </p>
            </div>
          </div>
          
          {editingBeds && (
            <div className="mt-4 flex justify-center space-x-3">
              <button onClick={updateBeds} className="btn btn-success">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditingBeds(false);
                  fetchHospitalData();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${((hospitalData.totalBeds - hospitalData.availableBeds) / hospitalData.totalBeds) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {((hospitalData.totalBeds - hospitalData.availableBeds) / hospitalData.totalBeds * 100).toFixed(1)}% occupied
            </p>
          </div>
        </div>
      </div>

      {/* Rooms Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DoorOpen className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Room Management</h2>
            </div>
            <button
              onClick={() => setEditingRooms(!editingRooms)}
              className="btn btn-secondary"
            >
              {editingRooms ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Total Rooms</p>
              <p className="text-3xl font-bold text-gray-900">{hospitalData.totalRooms}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Available Rooms</p>
              {editingRooms ? (
                <input
                  type="number"
                  min="0"
                  max={hospitalData.totalRooms}
                  value={hospitalData.availableRooms}
                  onChange={(e) => setHospitalData({
                    ...hospitalData,
                    availableRooms: parseInt(e.target.value) || 0
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
              ) : (
                <p className="text-3xl font-bold text-green-600">{hospitalData.availableRooms}</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Occupied Rooms</p>
              <p className="text-3xl font-bold text-red-600">
                {hospitalData.totalRooms - hospitalData.availableRooms}
              </p>
            </div>
          </div>
          
          {editingRooms && (
            <div className="mt-4 flex justify-center space-x-3">
              <button onClick={updateRooms} className="btn btn-success">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditingRooms(false);
                  fetchHospitalData();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${((hospitalData.totalRooms - hospitalData.availableRooms) / hospitalData.totalRooms) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {((hospitalData.totalRooms - hospitalData.availableRooms) / hospitalData.totalRooms * 100).toFixed(1)}% occupied
            </p>
          </div>
        </div>
      </div>

      {/* Equipment Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Medical Equipment</h2>
            </div>
            <button
              onClick={() => setShowAddEquipment(!showAddEquipment)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </button>
          </div>
        </div>
        
        {showAddEquipment && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Equipment name"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Type (e.g., Ventilator)"
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Total quantity"
                value={newEquipment.total}
                onChange={(e) => setNewEquipment({...newEquipment, total: parseInt(e.target.value) || 0})}
                className="input-field"
              />
              <div className="flex space-x-2">
                <button onClick={addEquipment} className="btn btn-success">
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddEquipment(false);
                    setNewEquipment({ name: '', type: '', total: 0 });
                  }}
                  className="btn btn-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {hospitalData.equipment && hospitalData.equipment.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
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
                  {hospitalData.equipment.map((equipment) => (
                    <tr key={equipment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {equipment.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {equipment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipment.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipment.available}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${
                          equipment.status === 'working' ? 'status-available' :
                          equipment.status === 'maintenance' ? 'status-maintenance' :
                          'status-occupied'
                        }`}>
                          {equipment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={equipment.status}
                          onChange={(e) => updateEquipmentStatus(equipment._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="working">Working</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="out_of_order">Out of Order</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No equipment registered</p>
              <button
                onClick={() => setShowAddEquipment(true)}
                className="mt-4 btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Equipment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
