// KPIManagement.js
import React, { useState, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';

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
  const [editingKpi, setEditingKpi] = useState(null);

  const categories = ['Financial', 'Operational', 'Customer', 'Employee'];
  const behaviors = ['Increase', 'Decrease', 'Maintain', 'Target'];

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

  const handleDeleteKpi = (kpiId) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      setKpis(kpis.filter(kpi => kpi.id !== kpiId));
    }
  };

  const handleEditClick = (kpi) => {
    setEditingKpi(kpi);
    setKpiName(kpi.name);
    setCategory(kpi.category);
    setBehavior(kpi.behavior);
    setDescription(kpi.description);
    setActiveTab('addKPI');
  };

  const handleUpdateKpi = () => {
    if (kpiName.trim() && category && behavior) {
      setKpis(kpis.map(kpi => 
        kpi.id === editingKpi.id 
          ? {
              ...kpi,
              name: kpiName.trim(),
              category: category,
              behavior: behavior,
              description: description
            }
          : kpi
      ));
      resetForm();
    }
  };

  const resetForm = () => {
    setKpiName('');
    setCategory('');
    setBehavior('');
    setDescription('');
    setEditingKpi(null);
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
                  {categories.map((cat, index) => (
                  <option key={cat || index} value={cat}>
                    {cat}
                  </option>
                ))}

                {behaviors.map((behavior, index) => (
                  <option key={behavior || index} value={behavior}>
                    {behavior}
                  </option>
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

            {editingKpi ? (
              <div className="button-group">
                <button 
                  onClick={handleUpdateKpi} 
                  className="add-button"
                  disabled={!kpiName.trim() || !category || !behavior}
                >
                  Update KPI
                </button>
                <button onClick={resetForm} className="cancel-button">
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAddKpi} 
                className="add-button"
                disabled={!kpiName.trim() || !category || !behavior}
              >
                + Add New KPI
              </button>
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
    </div>
  );
};

export default KPIManagement;