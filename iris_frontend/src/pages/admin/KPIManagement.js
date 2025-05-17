// KPIManagement.js
import React, { useState, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';


const KPIManagement = () => {
  const [activeTab, setActiveTab] = useState('addKPI');
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
  const [editingKpi, setEditingKpi] = useState(null);

  const categories = ['Financial', 'Operational', 'Customer', 'Employee'];
  const behaviors = ['Increase', 'Decrease', 'Maintain', 'Target'];

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
      setActiveTab('viewKPIs');
      alert('KPI added successfully!');

    } catch (error) {
      console.error('Error details:', error);
      alert(`Failed to add KPI: ${error.message}`);
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

const handleDeleteKpi = async (kpiId) => {
      if (window.confirm('Are you sure you want to delete this KPI?')) {
        try {
          const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Update local state after successful deletion
          setKpis(kpis.filter(kpi => kpi.dKPI_ID !== kpiId));
        } catch (error) {
          console.error('Error deleting KPI:', error);
          alert('Failed to delete KPI. Please try again.');
        }
      }
    };  

  const handleEditClick = async (kpiId) => {
      try {
        const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const kpi = await response.json();
        
        // Set form data with fetched KPI
        setEditingKpi(kpi);
        setKpiName(kpi.dKPI_Name);
        setCategory(kpi.dCategory);
        setBehavior(kpi.dCalculationBehavior);
        setDescription(kpi.dDescription);
        setActiveTab('addKPI');
      } catch (error) {
        console.error('Error fetching KPI for edit:', error);
        alert('Failed to load KPI data for editing. Please try again.');
      }
    };

  const handleUpdateKpi = async () => {
      if (kpiName?.trim() && category && behavior) {
        try {
          const updateData = {
            dKPI_Name: kpiName,
            dCategory: category,
            dDescription: description,
            dCalculationBehavior: behavior
          };

          // Make the update request
          const response = await fetch(`http://localhost:3000/api/kpis/${editingKpi.dKPI_ID}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Server error: ${response.status}`);
          }

          // Fetch fresh data after update
          const refreshResponse = await fetch('http://localhost:3000/api/kpis');
          const updatedKpis = await refreshResponse.json();
          setKpis(updatedKpis);

          // Reset form and switch to view tab
          resetForm();
          setActiveTab('viewKPIs');
          alert('KPI updated successfully!');

        } catch (error) {
          console.error('Error updating KPI:', error);
          alert(`Failed to update KPI: ${error.message}`);
        }
      }
    };

    // Add this function before the return statement
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
        setDescriptionCount(0); // Add this line
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
              <div className="input-container">
                <input
                  type="text"
                  value={kpiName}
                  onChange={handleKpiNameChange}
                  placeholder="Enter KPI name"
                  maxLength={MAX_NAME_LENGTH}
                />
              </div>
            </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={`category-${cat}`} value={cat}>
                      {cat}
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
                  {behaviors.map((beh) => (
                    <option key={`behavior-${beh}`} value={beh}>
                      {beh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
            <label>Description</label>
            <div className="textarea-container">
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe what this KPI measures and why it's important"
                rows="3"
                maxLength={MAX_CHARS}
              />
              <small className={`char-count ${descriptionCount === MAX_CHARS ? 'limit-reached' : ''}`}>
                {descriptionCount}/{MAX_CHARS}
              </small>
            </div>
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
    </div>
  );
};

export default KPIManagement;