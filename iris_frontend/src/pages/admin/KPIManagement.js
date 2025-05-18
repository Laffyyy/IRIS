// KPIManagement.js
import React, { useState, useCallback } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload } from 'react-icons/fa';

const KPIManagement = () => {
  const [activeTab, setActiveTab] = useState('addKPI');
  const [kpis, setKpis] = useState([
    { id: 1, name: 'Revenue Growth', category: 'Financial', behavior: 'Increase', description: 'Measures growth in total revenue' }
  ]);
  
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

  const handleAddKpi = () => {
    if (kpiName.trim() && category && behavior) {
      const newKpi = {
        id: kpis.length + 1,
        name: kpiName,
        category: category,
        behavior: behavior,
        description: description
      };
      setKpis([...kpis, newKpi]);
      resetForm();
    }
  };

  // Handle adding individual KPI to preview
  const handleAddToList = () => {
    if (kpiName.trim() && category && behavior) {
      setIndividualPreview([{
        name: kpiName,
        category: category,
        behavior: behavior,
        description: description
      }]);
    }
  };

  // Handle bulk upload submission
  const handleBulkUpload = () => {
    const kpisToAdd = bulkKpis.map((kpi, index) => ({
      ...kpi,
      id: kpis.length > 0 ? Math.max(...kpis.map(k => k.id)) + index + 1 : index + 1
    }));
    setKpis([...kpis, ...kpisToAdd]);
    setEditModalOpen(false);
    setBulkKpis([]);
    setInvalidKpis([]);
    setFile(null);
  };

  const handleDeleteKpi = (kpiId) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      setKpis(kpis.filter(kpi => kpi.id !== kpiId));
    }
  };

  const handleEditClick = (kpi) => {
    setCurrentKpi(kpi);
    setEditModalOpen(true);
  };

  const handleSave = (updatedKpi) => {
    setKpis(kpis.map(kpi => 
      kpi.id === updatedKpi.id ? updatedKpi : kpi
    ));
    setEditModalOpen(false);
    setCurrentKpi(null);
  };

  const resetForm = () => {
    setKpiName('');
    setCategory('');
    setBehavior('');
    setDescription('');
    setCurrentKpi(null);
    setIndividualPreview([]);
  };

  const removeIndividualPreview = () => {
    setIndividualPreview([]);
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
            {currentKpi ? 'Edit KPI' : 'Add New KPI'}
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
            <p className="modal-subtitle">Choose how you want to add new KPIs.</p>
            <div className="upload-method-tabs">
              <button
                className={`tab-btn ${uploadMethod === 'individual' ? 'active' : ''}`}
                onClick={() => setUploadMethod('individual')}
              >
                Individual Upload
              </button>
              <button
                className={`tab-btn ${uploadMethod === 'bulk' ? 'active' : ''}`}
                onClick={() => setUploadMethod('bulk')}
              >
                Bulk Upload
              </button>
            </div>

            {uploadMethod === 'individual' ? (
              <div className="individual-upload-form">
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
                  onClick={handleAddToList} 
                  className="add-to-list-btn"
                  disabled={!kpiName.trim() || !category || !behavior}
                >
                  Add to List
                </button>

                {individualPreview.length > 0 && (
                  <div className="individual-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>KPI Name</th>
                          <th>Category</th>
                          <th>Behavior</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {individualPreview.map((kpi, index) => (
                          <tr key={`individual-preview-${index}`}>
                            <td>{kpi.name}</td>
                            <td>{kpi.category}</td>
                            <td>{kpi.behavior}</td>
                            <td>{kpi.description}</td>
                            <td>
                              <button onClick={removeIndividualPreview} className="delete-btn">
                                <FaTrash size={12} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    onClick={handleAddKpi} 
                    className="save-btn"
                    disabled={individualPreview.length === 0}
                  >
                    Add KPI
                  </button>
                </div>
              </div>
            ) : (
              <div className="bulk-upload-form">
                <div className="bulk-upload-actions">
                  <h3><FaUpload /> Upload KPIs</h3>
                  <button onClick={generateTemplate} className="generate-template-btn">
                    <FaFileDownload /> Generate Template
                  </button>
                </div>

                <div
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="drop-zone-content">
                    <p>Drag and drop your file here or</p>
                    <p>CSV or Excel files only (max 5MB)</p>
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="browse-files-btn">
                      Browse Files
                    </label>
                  </div>
                </div>

                {file && (
                  <div className="file-preview">
                    <span>📄 {file.name}</span>
                    <button onClick={removeFile} className="remove-file-btn">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}

                {(bulkKpis.length > 0 || invalidKpis.length > 0) && (
                  <div className="upload-preview">
                    <div className="preview-tabs">
                      <button
                        className={`preview-tab ${previewTab === 'valid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('valid')}
                        disabled={bulkKpis.length === 0}
                      >
                        Valid ({bulkKpis.length})
                      </button>
                      <button
                        className={`preview-tab ${previewTab === 'invalid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('invalid')}
                        disabled={invalidKpis.length === 0}
                      >
                        Invalid ({invalidKpis.length})
                      </button>
                    </div>

                    <div className="preview-content">
                      {previewTab === 'valid' && bulkKpis.length > 0 && (
                        <div className="valid-kpis-table">
                          <table>
                            <thead>
                              <tr>
                                <th>KPI Name</th>
                                <th>Category</th>
                                <th>Behavior</th>
                                <th>Description</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkKpis.map((kpi, index) => (
                                <tr key={`valid-${index}`}>
                                  <td>{kpi.name}</td>
                                  <td>{kpi.category}</td>
                                  <td>{kpi.behavior}</td>
                                  <td>{kpi.description}</td>
                                  <td>
                                    <button onClick={() => {
                                      const updatedKpis = [...bulkKpis];
                                      updatedKpis.splice(index, 1);
                                      setBulkKpis(updatedKpis);
                                    }} className="delete-btn">
                                      <FaTrash size={12} /> Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {previewTab === 'invalid' && invalidKpis.length > 0 && (
                        <div className="invalid-kpis-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Reason</th>
                                <th>KPI Name</th>
                                <th>Category</th>
                                <th>Behavior</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invalidKpis.map((kpi, index) => (
                                <tr key={`invalid-${index}`}>
                                  <td className="reason-cell">{kpi.reason}</td>
                                  <td>{kpi.name}</td>
                                  <td>{kpi.category}</td>
                                  <td>{kpi.behavior}</td>
                                  <td>{kpi.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    onClick={handleBulkUpload}
                    className="save-btn"
                    disabled={bulkKpis.length === 0}
                  >
                    Submit KPIs {bulkKpis.length > 0 && `(${bulkKpis.length})`}
                  </button>
                </div>
              </div>
            )}
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
                {kpis.map(kpi => (
                  <tr key={kpi.id}>
                    <td>{kpi.id}</td>
                    <td>{kpi.name}</td>
                    <td>{kpi.category}</td>
                    <td>{kpi.behavior}</td>
                    <td>{kpi.description}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(kpi)} className="edit-btn">
                          <FaPencilAlt size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteKpi(kpi.id)} className="delete-btn">
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