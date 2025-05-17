// Updated SiteManagement.js
import React, { useState } from 'react';
import { useEffect } from 'react';
import './SiteManagement.css';
import { FaTrash, FaPencilAlt, FaTimes } from 'react-icons/fa';

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]); 
  const [siteClients, setSiteClients] = useState([]);
  const [editingSite, setEditingSite] = useState(null);
  const [editSiteName, setEditSiteName] = useState('');
  const [clientSiteMappings, setClientSiteMappings] = useState([]);

  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeTab, setActiveTab] = useState('addSite');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch sites when component mounts
    fetchSites();
    fetchClients();
    fetchClientSiteMappings();
  }, []);

  const fetchSites = async () => {
    setIsFetching(true);
    setError(null);
    
    try {
      // Use the existing manageSite function with 'getAll' operation
      const data = await manageSite('getAll', {});
      
      if (data && data.sites) {
        // Format sites data the same way
        const formattedSites = data.sites.map(site => ({
          id: site.dSite_ID,
          name: site.dSiteName,
          clients: site.clientCount || 0
        }));
        
        setSites(formattedSites);
      }
    } catch (error) {
      // Error is already logged and set in manageSite
      console.error('Failed to fetch sites:', error);
      setError('Failed to load sites. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchClientSiteMappings = async () => {
    try {
      const data = await manageSite('getClientSiteMappings', {});
      
      if (data && data.mappings) {
        setClientSiteMappings(data.mappings);
      }
    } catch (error) {
      console.error('Failed to fetch client-site mappings:', error);
    }
  };

  // Add after your fetchSites function
  const fetchClients = async () => {
    try {
      const data = await manageSite('getClients', {}); // Use 'getClients' operation
      
      if (data && data.clients) {
        // Map the DB fields to your component's data structure
        const formattedClients = data.clients.map(client => ({
          id: client.dClient_ID,
          name: client.dClientName
        }));
        
        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Error already handled in manageSite
    }
  };

  // Generic site management API function
  const manageSite = async (operation, data) => {
    setError(null);
    
    if (operation === 'getAll') {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const userId = localStorage.getItem('userId') || '0001'; // Default if not available
      
      const response = await fetch('http://localhost:3000/api/sites/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation, // 'add', 'edit', or 'delete'
          ...data,   // Data specific to the operation
          userID: userId // Always include userID
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`Failed to ${operation} site:`, error);
      setError(`Failed to ${operation} site. Please try again.`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
  
    try {
      const data = await manageSite('add', { siteName: newSiteName });
      
      // Add the new site to the state with ID from database
      const newSite = {
        id: data.siteId,
        name: newSiteName,
        clients: 0
      };
      
      setSites([...sites, newSite]);
      setNewSiteName('');
      fetchSites();
      
    } catch (error) {
      // Error already handled in manageSite
    }
  };

  const handleUpdateSite = async () => {
    if (!editSiteName.trim() || !editingSite) return;
    
    try {
      await manageSite('edit', { 
        siteId: editingSite.id, 
        siteName: editSiteName
      });
      
      // Update local state
      setSites(sites.map(site => 
        site.id === editingSite.id 
          ? { ...site, name: editSiteName.trim() }
          : site
      ));
      
      setEditingSite(null);
      setEditSiteName('');
      setActiveTab('addSite');
      fetchSites();
    } catch (error) {
      // Error already handled in manageSite
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    
    try {
      await manageSite('delete', { siteId });
      
      // Remove site from local state
      setSites(sites.filter(site => site.id !== siteId));
      fetchSites();
    } catch (error) {
      // Error already handled in manageSite
    }
  };
  
  const handleAddClient = async () => {
    if (selectedSite && selectedClientId) {
      try {
        // Call the API to add client to site
        await manageSite('addClientToSite', { 
          clientId: parseInt(selectedClientId), 
          siteId: parseInt(selectedSite.id)
        });
        
        // After successful API call, update the local state
        // Check if client is already assigned to this site
        const isClientAlreadyAssigned = siteClients.some(
          sc => sc.siteId === selectedSite.id && sc.clientId === parseInt(selectedClientId)
        );
  
        if (!isClientAlreadyAssigned) {
          // Add to siteClients
          setSiteClients([...siteClients, {
            siteId: parseInt(selectedSite.id),
            clientId: parseInt(selectedClientId)
          }]);
  
          // Update site's client count
          const updatedSites = sites.map(site => 
            site.id === selectedSite.id 
              ? { ...site, clients: site.clients + 1 } 
              : site
          );
          setSites(updatedSites);
        }
        
        // Reset selection
        setSelectedClientId('');
        
        // Show success message
        alert('Client has been assigned to the site successfully!');
        
        // Refresh data from server to ensure UI is in sync
        fetchSites();
        fetchClientSiteMappings();
        
      } catch (error) {
        // Error is already handled in manageSite function
        console.error('Failed to assign client to site:', error);
      }
    }
  };

  const handleEditClick = (site) => {
    setCurrentSite(site);
    setEditModalOpen(true);
  };

  const handleSave = async (updatedSite) => {
    try {
      // Call the API to update the site
      await manageSite('edit', { 
        siteId: updatedSite.id, 
        siteName: updatedSite.name 
      });
      
      // Update local state after successful API call
      setSites(sites.map(site => 
        site.id === updatedSite.id ? updatedSite : site
      ));
      
      // Refresh site data from server
      fetchSites();
      
      // Close modal and reset current site
      setEditModalOpen(false);
      setCurrentSite(null);
      
    } catch (error) {
      console.error('Failed to update site:', error);
      // Error is already handled in manageSite function
    }
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
        
        {/* Add Site Section */}
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
          <button 
            onClick={handleAddSite} 
            className="add-button" 
            disabled={!newSiteName.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : '+ Add New Site'}
          </button>
        )}
        {error && <p className="error-message">{error}</p>}

          {/* Move Existing Sites table here */}
          <div className="existing-sites">
            <h2>Existing Sites</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Site Name</th>
                  {/* Removed Clients column */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr key={site.id}>
                    <td>{site.id}</td>
                    <td>{site.name}</td>
                    {/* Removed Clients column data */}
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
        
        {/* Add Client to Site */}
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Select Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={!selectedSite}
              >
                <option key="default-client" value="">Select a client</option>
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
                <option key="default-site" value="">Select a site</option>
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
          {/* New Client-Site Mappings Table */}
          <div className="client-site-mappings">
          <h2>Client Site Assignments</h2>
          {isFetching ? (
            <p>Loading client-site mappings...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>Site ID</th>
                  <th>Site Name</th>
                </tr>
              </thead>
              <tbody>
                {/* Filter to only show clients with assigned sites (dSite_ID exists and is not empty) */}
                {clientSiteMappings
                  .filter(mapping => mapping.dSite_ID)
                  .map((mapping, index) => (
                    <tr key={index}>
                      <td>{mapping.dClient_ID}</td>
                      <td>{mapping.dClientName}</td>
                      <td>{mapping.dSite_ID}</td>
                      <td>{mapping.dSiteName}</td>
                    </tr>
                  ))}
                {clientSiteMappings.filter(mapping => mapping.dSite_ID).length === 0 && (
                  <tr>
                    <td colSpan="4">No client-site assignments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
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