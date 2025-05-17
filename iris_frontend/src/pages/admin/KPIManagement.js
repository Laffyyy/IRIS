// KPIManagement.js
import React, { useState, useEffect } from 'react';
import './KPIManagement.css';

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

  const categories = ['Financial', 'Operational', 'Customer', 'Employee'];
  const behaviors = ['Increase', 'Decrease', 'Maintain', 'Target'];

  const handleAddKpi = async () => {
  if (kpiName.trim() && category && behavior) {
    try {
      const response = await fetch('http://localhost:3000/api/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dKPI_Name: kpiName,
          dCategory: category,
          dDescription: description,
          dCalculationBehavior: behavior,
          dCreatedBy: '1'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('KPI added successfully:', result);

      // Update the KPIs list with the new data
      const updatedResponse = await fetch('http://localhost:3000/api/kpis');
      const updatedData = await updatedResponse.json();
      setKpis(updatedData);

      // Reset form
      setKpiName('');
      setCategory('');
      setBehavior('');
      setDescription('');

      // Switch to view tab
      setActiveTab('viewKPIs');

    } catch (error) {
      console.error('Error adding KPI:', error);
      alert('Failed to add KPI. Please try again.');
    }
  }
};

useEffect(() => {
  const fetchKPIs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/kpis');
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  fetchKPIs();
}, []);

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
            Add New KPI
          </div>
          <div 
            className={`tab ${activeTab === 'viewKPIs' ? 'active' : ''}`}
            onClick={() => setActiveTab('viewKPIs')}
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
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi, index) => (
                <tr key={kpi.dKPI_ID || index}>
                  <td>{kpi.dKPI_ID}</td>
                  <td>{kpi.dKPI_Name}</td>
                  <td>{kpi.dCategory}</td>
                  <td>{kpi.dCalculationBehavior}</td>
                  <td>{kpi.dDescription}</td>
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