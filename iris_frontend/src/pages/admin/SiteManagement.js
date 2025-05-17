// Updated SiteManagement.js
import React, { useState } from 'react';
import './SiteManagement.css';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';

const SiteManagement = () => {
  const [sites, setSites] = useState([
    { id: 1, name: 'Site A', clients: 2 },
    { id: 2, name: 'Site B', clients: 1 },
    { id: 3, name: 'Site C', clients: 0 }
  ]);
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [newClient, setNewClient] = useState('');
  const [activeTab, setActiveTab] = useState('addSite'); // 'addSite' or 'addClient'
  const [editingSite, setEditingSite] = useState(null);
  const [editSiteName, setEditSiteName] = useState('');

  const handleAddSite = () => {
    if (newSiteName.trim()) {
      const newSite = {
        id: sites.length + 1,
        name: newSiteName,
        clients: 0
      };
      setSites([...sites, newSite]);
      setNewSiteName('');
    }
  };

  const handleAddClient = () => {
    if (selectedSite && newClient.trim()) {
      const updatedSites = sites.map(site => 
        site.id === selectedSite.id 
          ? { ...site, clients: site.clients + 1 } 
          : site
      );
      setSites(updatedSites);
      setNewClient('');
    }
  };

  const handleDeleteSite = (siteId) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setSites(sites.filter(site => site.id !== siteId));
    }
  };

  const handleEditClick = (site) => {
    setEditingSite(site);
    setEditSiteName(site.name);
    setActiveTab('addSite');
  };

  const handleUpdateSite = () => {
    if (editSiteName.trim()) {
      setSites(sites.map(site => 
        site.id === editingSite.id 
          ? { ...site, name: editSiteName.trim() }
          : site
      ));
      setEditingSite(null);
      setEditSiteName('');
      setActiveTab('addSite');
    }
  };

  return (
    <div className="site-management-container">
      <div className="white-card">
        <div className="site-management-header">
          <h1>Site Management</h1>
          <p className="subtitle">Manage your sites and their clients</p>
        </div>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'addSite' ? 'active' : ''}`}
            onClick={() => setActiveTab('addSite')}
          >
            {editingSite ? 'Edit Site' : 'Add New Site'}
          </div>
          <div 
            className={`tab ${activeTab === 'addClient' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('addClient');
              setEditingSite(null);
              setEditSiteName('');
            }}
          >
            Add Client to Site
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addSite' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>{editingSite ? 'Edit Site Name' : 'Site Name'}</label>
              <input
                type="text"
                value={editingSite ? editSiteName : newSiteName}
                onChange={(e) => editingSite ? setEditSiteName(e.target.value) : setNewSiteName(e.target.value)}
                placeholder="Enter site name"
              />
            </div>
          </div>
          {editingSite ? (
            <div className="button-group">
              <button onClick={handleUpdateSite} className="add-button" disabled={!editSiteName.trim()}>
                Update Site
              </button>
              <button onClick={() => {
                setEditingSite(null);
                setEditSiteName('');
              }} className="cancel-button">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={handleAddSite} className="add-button" disabled={!newSiteName.trim()}>
              + Add New Site
            </button>
          )}
        </div>

        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Client Name</label>
              <input
                type="text"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div className="form-group">
              <label>Select Site</label>
              <select
                value={selectedSite ? selectedSite.id : ''}
                onChange={(e) => {
                  const site = sites.find(s => s.id === parseInt(e.target.value));
                  setSelectedSite(site || null);
                }}
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={handleAddClient} 
            className="add-button"
            disabled={!selectedSite || !newClient.trim()}
          >
            + Add Client to Site
          </button>
        </div>

        <div className="existing-sites">
          <h2>Existing Sites</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Site Name</th>
                <th>Clients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(site => (
                <tr key={site.id}>
                  <td>{site.id}</td>
                  <td>{site.name}</td>
                  <td>{site.clients}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEditClick(site)} className="edit-btn">
                        <FaPencilAlt size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeleteSite(site.id)} className="delete-btn">
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
  );
};

export default SiteManagement;