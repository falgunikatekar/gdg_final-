import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  TrendingDown,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';

const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    manufacturer: '',
    category: '',
    description: '',
    unitPrice: 0,
    stock: 0,
    minStockLevel: 10,
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    supplier: {
      name: '',
      contact: '',
      email: ''
    }
  });

  useEffect(() => {
    fetchInventoryData();
    fetchStats();
    fetchExpiringSoon();
    fetchLowStock();
  }, []);

  useEffect(() => {
    const filtered = medicines.filter(medicine => {
      const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || medicine.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    // Update display logic here if needed
  }, [searchTerm, statusFilter, medicines]);

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setMedicines(response.data.medicines);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/inventory/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  const fetchExpiringSoon = async () => {
    try {
      const response = await axios.get('/api/inventory/expiring-soon');
      setExpiringSoon(response.data);
    } catch (error) {
      toast.error('Failed to load expiring medicines');
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get('/api/inventory/low-stock');
      setLowStock(response.data);
    } catch (error) {
      toast.error('Failed to load low stock medicines');
    }
  };

  const addMedicine = async () => {
    // Validation
    if (!newMedicine.name || !newMedicine.manufacturer || !newMedicine.category || 
        !newMedicine.description || !newMedicine.batchNumber || 
        !newMedicine.manufactureDate || !newMedicine.expiryDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (newMedicine.unitPrice <= 0 || newMedicine.stock < 0) {
      toast.error('Price must be positive and stock cannot be negative');
      return;
    }

    if (new Date(newMedicine.expiryDate) <= new Date(newMedicine.manufactureDate)) {
      toast.error('Expiry date must be after manufacture date');
      return;
    }

    try {
      const response = await axios.post('/api/inventory', newMedicine);
      toast.success('Medicine added successfully');
      setNewMedicine({
        name: '',
        manufacturer: '',
        category: '',
        description: '',
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        stock: 0,
        unitPrice: 0,
        reorderLevel: 10
      });
      setShowAddForm(false);
      fetchInventoryData();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add medicine');
    }
  };

  const updateMedicineStock = async (medicineId, stock) => {
    try {
      await axios.put(`/api/inventory/${medicineId}/stock`, { stock });
      toast.success('Stock updated successfully');
      fetchInventoryData();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const deleteMedicine = async (medicineId) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`/api/inventory/${medicineId}`);
        toast.success('Medicine deleted successfully');
        fetchInventoryData();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'out_of_stock': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
        <p className="text-gray-600">Manage hospital medicine stock and track expiry dates</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Medicines</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStock.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringSoon.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expiredCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(expiringSoon.length > 0 || lowStock.length > 0) && (
        <div className="space-y-4">
          {expiringSoon.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="text-sm font-medium text-orange-800">
                  {expiringSoon.length} medicines expiring within 30 days
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {expiringSoon.slice(0, 6).map((medicine) => (
                  <div key={medicine._id} className="text-sm text-orange-700">
                    {medicine.name} - {getDaysUntilExpiry(medicine.expiryDate)} days
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">
                  {lowStock.length} medicines with low stock
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStock.slice(0, 6).map((medicine) => (
                  <div key={medicine._id} className="text-sm text-yellow-700">
                    {medicine.name} - {medicine.stock} units left
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
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
              <option value="available">Available</option>
              <option value="low_stock">Low Stock</option>
              <option value="expired">Expired</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </button>
        </div>

        {/* Add Medicine Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Medicine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Enter medicine name (e.g., Paracetamol 500mg)"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Enter manufacturer name (e.g., Cipla, Sun Pharma)"
                value={newMedicine.manufacturer}
                onChange={(e) => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Select category (e.g., Antibiotics, Pain Killers)"
                value={newMedicine.category}
                onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})}
                className="input-field"
                required
              />
              <textarea
                placeholder="Enter description (e.g., Used for fever and mild pain)"
                value={newMedicine.description}
                onChange={(e) => setNewMedicine({...newMedicine, description: e.target.value})}
                className="input-field md:col-span-2 lg:col-span-3"
                rows="2"
                required
              />
              <input
                type="number"
                placeholder="Enter unit price in ₹ (e.g., 25.50)"
                value={newMedicine.unitPrice}
                onChange={(e) => setNewMedicine({...newMedicine, unitPrice: parseFloat(e.target.value) || 0})}
                className="input-field"
                step="0.01"
                min="0"
                required
              />
              <input
                type="number"
                placeholder="Enter stock quantity (e.g., 100 tablets)"
                value={newMedicine.stock}
                onChange={(e) => setNewMedicine({...newMedicine, stock: parseInt(e.target.value) || 0})}
                className="input-field"
                min="0"
                required
              />
              <input
                type="number"
                placeholder="Minimum stock level for alerts (e.g., 20)"
                value={newMedicine.minStockLevel}
                onChange={(e) => setNewMedicine({...newMedicine, minStockLevel: parseInt(e.target.value) || 10})}
                className="input-field"
                min="0"
              />
              <input
                type="text"
                placeholder="Enter batch number (e.g., BATCH2024001)"
                value={newMedicine.batchNumber}
                onChange={(e) => setNewMedicine({...newMedicine, batchNumber: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="date"
                placeholder="Select manufacture date"
                value={newMedicine.manufactureDate}
                onChange={(e) => setNewMedicine({...newMedicine, manufactureDate: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="date"
                placeholder="Select expiry date"
                value={newMedicine.expiryDate}
                onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Supplier name (e.g., MedSupply Corp)"
                value={newMedicine.supplier.name}
                onChange={(e) => setNewMedicine({...newMedicine, supplier: {...newMedicine.supplier, name: e.target.value}})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Supplier contact (e.g., +91 9876543210)"
                value={newMedicine.supplier.contact}
                onChange={(e) => setNewMedicine({...newMedicine, supplier: {...newMedicine.supplier, contact: e.target.value}})}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Supplier email (e.g., supplier@medcorp.com)"
                value={newMedicine.supplier.email}
                onChange={(e) => setNewMedicine({...newMedicine, supplier: {...newMedicine.supplier, email: e.target.value}})}
                className="input-field"
              />
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button onClick={addMedicine} className="btn btn-success">
                <Save className="h-4 w-4 mr-2" />
                Add Medicine
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Medicines Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
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
              {medicines
                .filter(medicine => {
                  const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       medicine.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = !statusFilter || medicine.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((medicine) => {
                  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
                  const isEditing = editingMedicine === medicine._id;
                  
                  return (
                    <tr key={medicine._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                          <div className="text-sm text-gray-500">{medicine.category}</div>
                          <div className="text-xs text-gray-400">Batch: {medicine.batchNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medicine.manufacturer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={medicine.stock}
                            onChange={(e) => {
                              const updatedMedicines = medicines.map(m => 
                                m._id === medicine._id ? {...m, stock: parseInt(e.target.value) || 0} : m
                              );
                              setMedicines(updatedMedicines);
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm">
                            <span className={`font-medium ${
                              medicine.stock <= medicine.minStockLevel ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {medicine.stock}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">
                              (Min: {medicine.minStockLevel})
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${medicine.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className={daysUntilExpiry < 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </div>
                          {daysUntilExpiry < 30 && (
                            <div className="text-xs text-red-500">
                              {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days left`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${getStatusColor(medicine.status)}`}>
                          {medicine.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => {
                                updateMedicineStock(medicine._id, medicine.stock);
                                setEditingMedicine(null);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMedicine(null);
                                fetchInventoryData();
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingMedicine(medicine._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteMedicine(medicine._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
