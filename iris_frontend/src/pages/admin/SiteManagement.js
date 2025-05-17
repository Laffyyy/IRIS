// Updated SiteManagement.js
import React, { useState } from 'react';
import './SiteManagement.css';
import { FaTrash, FaPencilAlt, FaTimes } from 'react-icons/fa';

const SiteManagement = () => {
  const [sites, setSites] = useState([
    { id: 1, name: 'Site A', clients: 2 },
    { id: 2, name: 'Site B', clients: 1 },
    { id: 3, name: 'Site C', clients: 0 }
  ]);
  
  // Add clients state
  const [clients, setClients] = useState([
    { id: 1, name: 'Client A' },
    { id: 2, name: 'Client B' },
    { id: 3, name: 'Client C' }
  ]);
  
  // Add siteClients state to track which clients belong to which sites
  const [siteClients, setSiteClients] = useState([
    { siteId: 1, clientId: 1 },
    { siteId: 1, clientId: 2 },
    { siteId: 2, clientId: 3 }
  ]);

  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeTab, setActiveTab] = useState('addSite');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);

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
    if (selectedSite && selectedClientId) {
      // Check if client is already assigned to this site
      const isClientAlreadyAssigned = siteClients.some(
        sc => sc.siteId === selectedSite.id && sc.clientId === parseInt(selectedClientId)
      );

      if (!isClientAlreadyAssigned) {
        // Add to siteClients
        setSiteClients([...siteClients, {
          siteId: selectedSite.id,
          clientId: parseInt(selectedClientId)
        }]);

        // Update site's client count
        const updatedSites = sites.map(site => 
          site.id === selectedSite.id 
            ? { ...site, clients: site.clients + 1 } 
            : site
        );
        setSites(updatedSites);
        
        // Reset selection
        setSelectedClientId('');
      }
    }
  };

  const handleDeleteSite = (siteId) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setSites(sites.filter(site => site.id !== siteId));
      // Also remove all client associations for this site
      setSiteClients(siteClients.filter(sc => sc.siteId !== siteId));
    }
  };

  const handleEditClick = (site) => {
    setCurrentSite(site);
    setEditModalOpen(true);
  };

  const handleSave = (updatedSite) => {
    setSites(sites.map(site => 
      site.id === updatedSite.id ? updatedSite : site
    ));
    setEditModalOpen(false);
    setCurrentSite(null);
  };

  // Get available clients for a site (clients not already assigned to the site)
  const getAvailableClients = (siteId) => {
    const assignedClientIds = siteClients
      .filter(sc => sc.siteId === siteId)
      .map(sc => sc.clientId);
    
    return clients.filter(client => !assignedClientIds.includes(client.id));
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
            {currentSite ? 'Edit Site' : 'Add New Site'}
          </div>
          <div 
            className={`tab ${activeTab === 'addClient' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('addClient');
              setCurrentSite(null);
            }}
          >
            Add Client to Site
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addSite' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>{currentSite ? 'Edit Site Name' : 'Site Name'}</label>
              <input
                type="text"
                value={currentSite ? currentSite.name : newSiteName}
                onChange={(e) => currentSite ? setCurrentSite({...currentSite, name: e.target.value}) : setNewSiteName(e.target.value)}
              />
            </div>
          </div>
          {currentSite ? (
            <div className="button-group">
              <button onClick={() => handleSave(currentSite)} className="add-button" disabled={!currentSite.name.trim()}>
                Update Site
              </button>
              <button onClick={() => {
                setCurrentSite(null);
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
              <label>Select Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={!selectedSite}
              >
                <option value="">Select a client</option>
                {selectedSite && getAvailableClients(selectedSite.id).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Site</label>
              <select
                value={selectedSite ? selectedSite.id : ''}
                onChange={(e) => {
                  const site = sites.find(s => s.id === parseInt(e.target.value));
                  setSelectedSite(site || null);
                  setSelectedClientId(''); // Reset client selection when site changes
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
            disabled={!selectedSite || !selectedClientId}
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
                  <td>
                    {siteClients.filter(sc => sc.siteId === site.id).map(sc => 
                      clients.find(c => c.id === sc.clientId)?.name
                    ).join(', ') || '-'}
                  </td>
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

      {/* Edit Site Modal */}
      {editModalOpen && currentSite && (
        <div className="modal-overlay">
          <div className="modal edit-site-modal">
            <div className="modal-header">
              <h2>Edit Site</h2>
              <button onClick={() => setEditModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={currentSite.name}
                  onChange={(e) => setCurrentSite({...currentSite, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Assigned Clients</h3>
              <div className="assigned-clients">
                {siteClients
                  .filter(sc => sc.siteId === currentSite.id)
                  .map(sc => {
                    const client = clients.find(c => c.id === sc.clientId);
                    return client ? (
                      <div key={sc.clientId} className="assigned-client">
                        <span>{client.name}</span>
                        <button
                          onClick={() => {
                            setSiteClients(siteClients.filter(s => !(s.siteId === currentSite.id && s.clientId === client.id)));
                            setCurrentSite({
                              ...currentSite,
                              clients: currentSite.clients - 1
                            });
                          }}
                          className="remove-client-btn"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
              <button 
                onClick={() => handleSave(currentSite)} 
                className="save-btn"
                disabled={!currentSite.name.trim()}
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

export default SiteManagement;