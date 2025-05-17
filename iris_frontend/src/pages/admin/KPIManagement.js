// KPIManagement.js
import React, { useState, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload } from 'react-icons/fa';

const KPIManagement = () => {
  const [activeTab, setActiveTab] = useState('addKPI');
  const [editingKpi, setEditingKpi] = useState(null);
  const [kpis, setKpis] = useState([
    { id: 1, name: 'Revenue Growth', category: 'Financial', behavior: 'Increase', description: 'Measures growth in total revenue' }
  ]);
  
  // Add this at the top with other state declarations
  const [descriptionCount, setDescriptionCount] = useState(0);
  const MAX_CHARS = 150;
  const MAX_NAME_LENGTH = 30;
  

  // Form states
  const [kpiName, setKpiName] = useState('');
  const [category, setCategory] = useState('');
  const [behavior, setBehavior] = useState('');
  const [description, setDescription] = useState('');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);

  // Add bulk upload states
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkKpis, setBulkKpis] = useState([]);
  const [invalidKpis, setInvalidKpis] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);

  const categories = ['Financial', 'Operational', 'Customer', 'Employee'];
  const behaviors = ['Increase', 'Decrease', 'Maintain', 'Target'];

  // Handle file drop for bulk upload
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Simulate file processing
  const handleFile = (file) => {
    setFile(file);
    // Mock data
    const mockValidKpis = [
      {
        name: 'Customer Satisfaction',
        category: 'Customer',
        behavior: 'Increase',
        description: 'Measures overall customer satisfaction score',
        valid: true
      },
      {
        name: 'Employee Turnover',
        category: 'Employee',
        behavior: 'Decrease',
        description: 'Tracks employee turnover rate',
        valid: true
      }
    ];
    const mockInvalidKpis = [
      {
        name: 'Invalid KPI',
        category: 'Unknown',
        behavior: 'Invalid',
        description: 'Invalid description',
        valid: false,
        reason: 'Invalid Category'
      },
      {
        name: 'Duplicate KPI',
        category: 'Financial',
        behavior: 'Increase',
        description: 'Duplicate description',
        valid: false,
        reason: 'Duplicate Entry'
      }
    ];
    setBulkKpis(mockValidKpis);
    setInvalidKpis(mockInvalidKpis);
    setPreviewTab('valid');
  };

  // Remove uploaded file
  const removeFile = () => {
    setFile(null);
    setBulkKpis([]);
    setInvalidKpis([]);
  };

  // Generate template for bulk upload
  const generateTemplate = () => {
    const csvContent = "KPI Name,Category,Behavior,Description\nRevenue Growth,Financial,Increase,Measures growth in total revenue";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'kpi_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = () => {
  if (editingKpi) {
    handleUpdateKpi();
  } else {
    handleAddKpi();
  }
};

  const handleAddKpi = async () => {
    try {
      const kpiData = {
        dKPI_Name: kpiName.trim(),
        dCategory: category,
        dDescription: description,
        dCalculationBehavior: behavior,
        dCreatedBy: '2505170018'
      };

      const response = await fetch('http://localhost:3000/api/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(kpiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Get the newly created KPI
      const createdKpi = await response.json();

      // Fetch updated KPI list to ensure we have the latest data
      const refreshResponse = await fetch('http://localhost:3000/api/kpis');
      const updatedKpis = await refreshResponse.json();
      setKpis(updatedKpis);

      // Reset form and switch to view tab
      resetForm();
    }
  };

  const handleDeleteKpi = (kpiId) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setKpis(kpis.filter(kpi => kpi.dKPI_ID !== kpiId));
      } catch (error) {
        console.error('Error deleting KPI:', error);
        alert('Failed to delete KPI. Please try again.');
      }
    }
  };

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setDescription(text);
      setDescriptionCount(text.length);
    }
  };

  const handleKpiNameChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_NAME_LENGTH) {
      setKpiName(text);
    }
  };

  const resetForm = () => {
    setKpiName('');
    setDescriptionCount(0);
    setCategory('');
    setBehavior('');
    setDescription('');
    setCurrentKpi(null);
  };

  return (
    <div className="kpi-management-container">
      <div className="white-card">
        <div className="kpi-management-header">
          <h1>KPI Management</h1>
          <p className="subtitle">Manage your Key Performance Indicators</p>
        </div>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'addKPI' ? 'active' : ''}`}
            onClick={() => setActiveTab('addKPI')}
          >
            {editingKpi ? 'Edit KPI' : 'Add New KPI'}
          </div>
          <div 
            className={`tab ${activeTab === 'viewKPIs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('viewKPIs');
              resetForm();
            }}
          >
            Existing KPIs
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addKPI' ? 'active' : ''}`}>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>KPI Name</label>
                <input
                  type="text"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  placeholder="Enter KPI name"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Calculation Behavior</label>
                <select
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                >
                  <option value="">Select behavior</option>
                  {behaviors.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this KPI measures and why it's important"
                rows="3"
              />
            </div>

            <button 
              onClick={handleAddKpi} 
              className="add-button"
              disabled={!kpiName.trim() || !category || !behavior}
            >
              + Add New KPI
            </button>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'viewKPIs' ? 'active' : ''}`}>
          <div className="existing-kpis">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>KPI Name</th>
                  <th>Category</th>
                  <th>Calculation Behavior</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi, index) => (
                  <tr key={kpi.dKPI_ID}>
                    <td>{kpi.dKPI_ID}</td>
                    <td>{kpi.dKPI_Name}</td>
                    <td>{kpi.dCategory}</td>
                    <td>{kpi.dCalculationBehavior}</td>
                    <td>{kpi.dDescription}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(kpi.dKPI_ID)} className="edit-btn">
                          <FaPencilAlt size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteKpi(kpi.dKPI_ID)} className="delete-btn">
                          <FaTrash size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit KPI Modal */}
      {editModalOpen && currentKpi && (
        <div className="modal-overlay">
          <div className="modal edit-kpi-modal">
            <div className="modal-header">
              <h2>Edit KPI</h2>
              <button onClick={() => setEditModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>KPI Name</label>
                <input
                  type="text"
                  value={currentKpi.name}
                  onChange={(e) => setCurrentKpi({...currentKpi, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={currentKpi.category}
                  onChange={(e) => setCurrentKpi({...currentKpi, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Calculation Behavior</label>
                <select
                  value={currentKpi.behavior}
                  onChange={(e) => setCurrentKpi({...currentKpi, behavior: e.target.value})}
                >
                  <option value="">Select behavior</option>
                  {behaviors.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={currentKpi.description}
                onChange={(e) => setCurrentKpi({...currentKpi, description: e.target.value})}
                placeholder="Describe what this KPI measures and why it's important"
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
              <button 
                onClick={() => handleSave(currentKpi)} 
                className="save-btn"
                disabled={!currentKpi.name.trim() || !currentKpi.category || !currentKpi.behavior}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagement;