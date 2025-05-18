// Updated SiteManagement.js
import React, { useState, useEffect } from 'react';
import './SiteManagement.css';
import { FaTrash, FaPencilAlt, FaTimes } from 'react-icons/fa';

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]); 
  const [siteClients, setSiteClients] = useState([]);
  
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeTab, setActiveTab] = useState('addSite');

  const [clientLobs, setClientLobs] = useState([]);
  const [clientSubLobs, setClientSubLobs] = useState([]);
  const [selectedLobId, setSelectedLobId] = useState('');
  const [selectedSubLobId, setSelectedSubLobId] = useState('');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSites();
    fetchClients();
    fetchSiteClients();
  }, []);

  const manageSite = async (operation, data) => {
    setError(null);
    
    if (operation === 'getAll') {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const userId = localStorage.getItem('userId') || '0001';
      
      const response = await fetch('http://localhost:3000/api/sites/manage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          operation,
          ...data,
          userID: userId
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
      setIsFetching(false);
    }
  };
  
  const fetchSites = async () => {
    try {
      const data = await manageSite('getAll', {});
      
      if (data && data.sites) {
        const formattedSites = data.sites.map(site => ({
          id: site.dSite_ID,
          name: site.dSiteName,
          clients: site.clientCount || 0
        }));
        
        setSites(formattedSites);
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await manageSite('getClients', {});
      if (data?.clients) {
        setClients(data.clients.map(client => ({
          id: client.dClient_ID,
          name: client.dClientName
        })));
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchSiteClients = async () => {
    try {
      const data = await manageSite('getSiteClients', {});
      if (data?.siteClients) {
        // Transform the data into the format expected by the component
        const formattedSiteClients = data.siteClients.map(sc => ({
          siteId: sc.dSite_ID,
          clientId: sc.dClient_ID,
          siteName: sc.dSiteName,
          clientName: sc.dClientName
        }));
        setSiteClients(formattedSiteClients);
      }
    } catch (error) {
      console.error('Failed to fetch site-client relationships:', error);
    }
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
  
    try {
      const data = await manageSite('add', { siteName: newSiteName });
      setSites([...sites, {
        id: data.siteId,
        name: newSiteName,
        clients: 0
      }]);
      setNewSiteName('');
      fetchSites();
    } catch (error) {
      // Error already handled in manageSite
    }
  };

  const handleEditClick = (site) => {
    setCurrentSite(site);
    setEditModalOpen(true);
  };

  // Modified handleDeleteSite function with success alert
  const handleDeleteSite = async (siteId) => {
    // Get site name for the alert
    const siteName = sites.find(site => site.id === siteId)?.name;
    
    if (!window.confirm('Deleting the site will also remove the associated clients to that site. Continue?')) return;
    
    try {
      await manageSite('delete', { siteId });
      setSites(sites.filter(site => site.id !== siteId));
      fetchSites();
      fetchSiteClients(); // Also refresh the site clients to reflect the changes
      
      // Add success alert
      alert(`Site "${siteName}" Successfully Deleted`);
    } catch (error) {
      // Error already handled
    }
  };
  
  // Modified handleAddClient function with confirmation alert 
  const handleAddClient = async () => {
    if (selectedSite && selectedClientId) {
      // Get client name for the alert
      const clientName = clients.find(c => c.id == selectedClientId)?.name;
      
      // Add confirmation dialog
      if (!window.confirm(`Are you sure you want to add client "${clientName}" to site "${selectedSite.name}"?`)) return;
      
      try {
        await manageSite('addClientToSite', { 
          clientId: parseInt(selectedClientId), 
          siteId: parseInt(selectedSite.id)
        });
        
        // Show success alert
        alert(`Client "${clientName}" successfully added to site "${selectedSite.name}"`);
        
        // Reset selected client
        setSelectedClientId('');
        
        // Refresh all necessary data
        fetchSites();
        fetchSiteClients();
      } catch (error) {
        console.error('Failed to assign client to site:', error);
      }
    }
  };

  const handleRemoveClient = async (clientId, clientName) => {
    try {
      await manageSite('removeClientFromSite', { clientId });
      
      // Update local state to reflect the removal
      setSiteClients(siteClients.filter(sc => !(sc.clientId === clientId)));
      
      // Refresh site data
      fetchSites();
      fetchSiteClients();
      
      // Show success alert
      alert(`Client "${clientName}" successfully removed from site`);
    } catch (error) {
      console.error('Failed to remove client from site:', error);
    }
  };

  const handleSave = async (updatedSite) => {
    try {
      await manageSite('edit', { 
        siteId: updatedSite.id, 
        siteName: updatedSite.name,
        updateClientSiteTable: true
      });
      
      setSites(sites.map(site => 
        site.id === updatedSite.id ? updatedSite : site
      ));
      
      fetchSites();
      
      setEditModalOpen(false);
      setCurrentSite(null);
    } catch (error) {
      console.error('Failed to update site:', error);
    }
  };

  const getAvailableClients = (siteId) => {
    const assignedClientIds = siteClients
      .filter(sc => sc.siteId === siteId)
      .map(sc => sc.clientId);
    
    return clients.filter(client => !assignedClientIds.includes(client.id));
  };

  // Add this function to fetch LOBs and Sub LOBs when a client is selected
  const fetchClientLobsAndSubLobs = async (clientId) => {
    try {
      const data = await manageSite('getClientLobs', { clientId });
      if (data?.lobs) {
        setClientLobs(data.lobs);
        // Reset selected LOB and Sub LOB when client changes
        setSelectedLobId('');
        setSelectedSubLobId('');
        setClientSubLobs([]);
      }
    } catch (error) {
      console.error('Failed to fetch client LOBs:', error);
    }
  };

  const handleLobChange = (e) => {
    const lobId = e.target.value;
    setSelectedLobId(lobId);
    
    if (lobId) {
      // Filter sub LOBs based on selected LOB
      const lob = clientLobs.find(l => l.id === lobId);
      if (lob && lob.subLobs) {
        setClientSubLobs(lob.subLobs);
      }
    } else {
      setClientSubLobs([]);
    }
    setSelectedSubLobId('');
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
            Add New Site
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
              <label>Site Name</label>
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={handleAddSite} 
            className="add-button" 
            disabled={!newSiteName.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : '+ Add New Site'}
          </button>
          {error && <p className="error-message">{error}</p>}

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
                      {Array.from(new Set(siteClients
                        .filter(sc => sc.siteId === site.id)
                        .map(sc => {
                          const client = clients.find(c => c.id === sc.clientId);
                          return client?.name;
                        })
                        .filter(Boolean) // Remove any undefined values
                      )).join(', ') || '-'}
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
        
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
        <div className="form-row">
          <div className="form-group">
            <label>Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                if (e.target.value) {
                  fetchClientLobsAndSubLobs(e.target.value);
                } else {
                  setClientLobs([]);
                  setClientSubLobs([]);
                  setSelectedLobId('');
                  setSelectedSubLobId('');
                }
              }}
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
                setSelectedClientId('');
                setClientLobs([]);
                setClientSubLobs([]);
                setSelectedLobId('');
                setSelectedSubLobId('');
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
        
        <div className="form-row">
          <div className="form-group">
            <label>Select LOB</label>
            <select
              value={selectedLobId}
              onChange={handleLobChange}
              disabled={!selectedClientId}
            >
              <option value="">Select a LOB</option>
              {clientLobs.map(lob => (
                <option key={lob.id} value={lob.id}>
                  {lob.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Select Sub LOB</label>
            <select
              value={selectedSubLobId}
              onChange={(e) => setSelectedSubLobId(e.target.value)}
              disabled={!selectedLobId}
            >
              <option value="">Select a Sub LOB</option>
              {clientSubLobs.map(subLob => (
                <option key={subLob.id} value={subLob.id}>
                  {subLob.name}
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
                      {Array.from(new Set(siteClients
                        .filter(sc => sc.siteId === site.id)
                        .map(sc => {
                          const client = clients.find(c => c.id === sc.clientId);
                          return client?.name;
                        })
                        .filter(Boolean) // Remove any undefined values
                      )).join(', ') || '-'}
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
      </div>

      {editModalOpen && currentSite && (
        <div className="modal-overlay">
          <div className="modal edit-site-modal">
            <div className="modal-header">
              <h2>Edit Site</h2>
              <button onClick={() => {
                setEditModalOpen(false);
                setCurrentSite(null);
              }} className="close-btn">
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
                            if (window.confirm(`Are you sure you want to remove ${client.name} from this site?`)) {
                              handleRemoveClient(client.id, client.name);
                              setCurrentSite({
                                ...currentSite,
                                clients: currentSite.clients - 1
                              });
                            }
                          }}
                          className="remove-client-btn"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : null;
                  })}
                {siteClients.filter(sc => sc.siteId === currentSite.id).length === 0 && (
                  <div className="no-clients">No clients assigned to this site</div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => {
                setEditModalOpen(false);
                setCurrentSite(null);
              }} className="cancel-btn">Cancel</button>
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