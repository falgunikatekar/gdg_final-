import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  X
} from 'lucide-react';

const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState({});

  const reportTypes = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'mri', label: 'MRI' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ecg', label: 'ECG' },
    { value: 'general_checkup', label: 'General Checkup' },
    { value: 'pathology', label: 'Pathology' }
  ];

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await axios.get(`/api/reports/patient?${params}`);
      setReports(response.data.reports);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId) => {
    setDownloading({ ...downloading, [reportId]: true });
    try {
      const response = await axios.get(`/api/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical-report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    } finally {
      setDownloading({ ...downloading, [reportId]: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Loader className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
        <p className="text-gray-600">View and download your medical test reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
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
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{report.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="ml-1">{report.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Test Date: {new Date(report.testDate).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {report.images.length} image(s)
                  </div>

                  {report.hospital && (
                    <div className="text-sm text-gray-600">
                      Hospital: {report.hospital.name}
                    </div>
                  )}
                </div>

                {report.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {report.description}
                  </p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 btn btn-secondary text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  
                  {report.status === 'completed' && report.pdfReport && (
                    <button
                      onClick={() => downloadReport(report._id)}
                      disabled={downloading[report._id]}
                      className="flex-1 btn btn-primary text-sm disabled:opacity-50"
                    >
                      {downloading[report._id] ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Download
                    </button>
                  )}
                </div>

                {report.status === 'processing' && (
                  <div className="mt-3 text-xs text-blue-600 text-center">
                    <Loader className="h-3 w-3 inline mr-1 animate-spin" />
                    Report is being processed...
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No medical reports found</p>
            <p className="text-sm text-gray-400 mt-2">
              Your reports will appear here once they are uploaded by the hospital.
            </p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Report Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Title:</span> {selectedReport.title}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span> {selectedReport.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Test Date:</span> {new Date(selectedReport.testDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Hospital Information</h3>
                  <div className="space-y-1">
                    {selectedReport.hospital && (
                      <>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Hospital:</span> {selectedReport.hospital.name}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Address:</span> {selectedReport.hospital.address}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Phone:</span> {selectedReport.hospital.phone}
                        </p>
                      </>
                    )}
                    {selectedReport.doctor && (
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Doctor:</span> Dr. {selectedReport.doctor.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Uploaded Images */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Test Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedReport.images.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-2">
                        <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                          {image.mimetype.startsWith('image/') ? (
                            <img
                              src={`/uploads/reports/${image.filename}`}
                              alt={image.originalName}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.originalName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Results */}
              {selectedReport.results && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Test Results</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center">
                      <span className="font-medium">Result Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedReport.results.normal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedReport.results.normal ? 'Normal' : 'Abnormal'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="font-medium">Summary:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.summary}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Details:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.details}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Recommendations:</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.results.recommendations}</p>
                    </div>

                    {selectedReport.results.parameters && selectedReport.results.parameters.length > 0 && (
                      <div>
                        <span className="font-medium">Test Parameters:</span>
                        <div className="mt-2 space-y-1">
                          {selectedReport.results.parameters.map((param, index) => (
                            <div key={index} className="flex justify-between text-sm bg-white p-2 rounded">
                              <span>{param.name}: {param.value} {param.unit}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                param.status === 'normal' ? 'bg-green-100 text-green-800' :
                                param.status === 'high' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {param.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Download Button */}
              {selectedReport.status === 'completed' && selectedReport.pdfReport && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => downloadReport(selectedReport._id)}
                    disabled={downloading[selectedReport._id]}
                    className="btn btn-primary"
                  >
                    {downloading[selectedReport._id] ? (
                      <div className="flex items-center">
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF Report
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReports;
