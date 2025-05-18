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
  const [existingAssignment, setExistingAssignment] = useState(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const [existingAssignments, setExistingAssignments] = useState([]);

  useEffect(() => {
    fetchSites();
    fetchClients();
    fetchSiteClients();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchExistingAssignments(selectedSite.id);
    } else {
      setExistingAssignments([]);
    }
  }, [selectedSite]);

  /**
   * Handles all API requests to the site management endpoints
   * @param {string} operation - The operation to perform (e.g. 'add', 'edit', 'delete', etc.)
   * @param {object} data - Additional data required for the operation
   * @returns {Promise<object>} - Response data from the API
   */
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
      
      const responseData = await response.json();
      console.log('API Response for operation', operation, ':', responseData);
      
      return responseData;
      
    } catch (error) {
      setError(`Failed to ${operation} site. Please try again.`);
      throw error;
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };
  
  /**
   * Retrieves all sites from the backend and updates the sites state
   */
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
      // Error handling
    }
  };

  /**
   * Retrieves all clients from the backend and updates the clients state
   */
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
      // Error handling
    }
  };

  /**
   * Retrieves all client-site relationships from the backend and updates the siteClients state
   * @returns {Array} - Formatted site clients data or empty array if error occurs
   */
  const fetchSiteClients = async () => {
    try {
      const data = await manageSite('getSiteClients', {});
      
      if (data?.siteClients) {
        const formattedSiteClients = data.siteClients.map(sc => ({
          siteId: parseInt(sc.dSite_ID),
          clientId: parseInt(sc.dClient_ID),
          siteName: sc.dSiteName,
          clientName: sc.dClientName,
          lobName: sc.dLOB,
          subLobName: sc.dSubLOB
        }));
        
        setSiteClients(formattedSiteClients);
        return formattedSiteClients;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  /**
   * Adds a new site to the database and updates the UI
   */
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
      // Error already handled
    }
  };

  /**
   * Opens the edit modal for a selected site
   * @param {object} site - The site object to edit
   */
  const handleEditClick = (site) => {
    setCurrentSite(site);
    setEditModalOpen(true);
  };

  /**
   * Deletes a site and all its client associations after confirmation
   * @param {number} siteId - The ID of the site to delete
   */
  const handleDeleteSite = async (siteId) => {
    const siteName = sites.find(site => site.id === siteId)?.name;
    
    if (!window.confirm('Deleting the site will also remove the associated clients to that site. Continue?')) return;
    
    try {
      await manageSite('delete', { siteId });
      setSites(sites.filter(site => site.id !== siteId));
      fetchSites();
      fetchSiteClients();
      
      alert(`Site "${siteName}" Successfully Deleted`);
    } catch (error) {
      // Error already handled
    }
  };
  
  /**
   * Adds a client to a site, optionally with specific LOB and/or SubLOB
   * Also handles moving LOBs/SubLOBs between sites
   */
  const handleAddClient = async () => {
    if (selectedSite && selectedClientId) {
      const clientName = clients.find(c => c.id == selectedClientId)?.name;
      
      const selectedLob = clientLobs.find(lob => lob.id === selectedLobId);
      const lobName = selectedLob ? selectedLob.name : null;
      
      const selectedSubLob = clientSubLobs.find(subLob => subLob.id === selectedSubLobId);
      const subLobName = selectedSubLob ? selectedSubLob.name : null;
      
      let confirmMessage = "";
      if (lobName && subLobName) {
        confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and Sub LOB "${subLobName}" to site "${selectedSite.name}"?`;
      } else if (lobName) {
        confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and all its Sub LOBs to site "${selectedSite.name}"?`;
      } else {
        confirmMessage = `Are you sure you want to add client "${clientName}" with all its LOBs and Sub LOBs to site "${selectedSite.name}"?`;
      }
      
      if (!window.confirm(confirmMessage)) return;
      
      try {
        await manageSite('addClientToSite', { 
          clientId: parseInt(selectedClientId), 
          siteId: parseInt(selectedSite.id),
          lobName: lobName,
          subLobName: subLobName
        });
        
        let successMessage = "";
        if (lobName && subLobName) {
          successMessage = `Client "${clientName}" with LOB "${lobName}" and Sub LOB "${subLobName}" has been added to site "${selectedSite.name}"`;
        } else if (lobName) {
          successMessage = `Client "${clientName}" with LOB "${lobName}" and all its Sub LOBs has been added to site "${selectedSite.name}"`;
        } else {
          successMessage = `Client "${clientName}" with all its LOBs and Sub LOBs has been added to site "${selectedSite.name}"`;
        }
        
        alert(successMessage);
        
        setSelectedClientId('');
        setSelectedLobId('');
        setSelectedSubLobId('');
        setClientLobs([]);
        setClientSubLobs([]);
        
        await fetchSiteClients();
        await fetchSites();
        await fetchExistingAssignments(selectedSite.id);
      } catch (error) {
        // Error handling
      }
    }
  };

  /**
   * Removes a client from a site
   * @param {number} clientId - The ID of the client to remove
   * @param {string} clientName - The name of the client (for display purposes)
   */
  const handleRemoveClient = async (clientId, clientName) => {
    try {
      await manageSite('removeClientFromSite', { clientId });
      
      setSiteClients(siteClients.filter(sc => !(sc.clientId === clientId)));
      
      fetchSites();
      fetchSiteClients();
      
      alert(`Client "${clientName}" successfully removed from site`);
    } catch (error) {
      // Error handling
    }
  };

  /**
   * Saves changes to a site (e.g., name change)
   * @param {object} updatedSite - The updated site object with new values
   */
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
      // Error handling
    }
  };

  /**
   * Returns the list of clients available for assignment to a site
   * This includes clients that might already have some LOBs assigned but not all
   * @param {number} siteId - The ID of the site
   * @returns {Array} - List of clients available for assignment
   */
  const getAvailableClients = (siteId) => {
    const numericSiteId = parseInt(siteId);
    
    return clients.filter(client => {
      const relevantCombinations = siteClients.filter(sc => 
        parseInt(sc.siteId) === numericSiteId && 
        parseInt(sc.clientId) === parseInt(client.id)
      );
      
      const assignedCombinations = relevantCombinations.map(sc => `${sc.lobName}-${sc.subLobName}`);
      
      return true;
    });
  };
  
  /**
   * Fetches LOBs and SubLOBs for a specific client, filtering out those already assigned to the selected site
   * @param {number} clientId - The ID of the client
   */
  const fetchClientLobsAndSubLobs = async (clientId) => {
    try {
      if (!clientId) {
        setClientLobs([]);
        setClientSubLobs([]);
        return;
      }

      const response = await manageSite('getClientLobs', { clientId });
      const allLobs = response.lobs || [];
      
      // Filter out LOBs and Sub LOBs that are already assigned to the selected site
      const filteredLobs = allLobs.map(lob => {
        const existingSubLobs = existingAssignments
          .filter(assignment => 
            assignment.dClientName === clients.find(c => c.id == clientId)?.name &&
            assignment.dLOB === lob.name
          )
          .map(assignment => assignment.dSubLOB);

        return {
          ...lob,
          subLobs: lob.subLobs.filter(subLob => !existingSubLobs.includes(subLob.name))
        };
      }).filter(lob => lob.subLobs.length > 0);

      setClientLobs(filteredLobs);
      setClientSubLobs([]);
      setSelectedLobId('');
      setSelectedSubLobId('');
    } catch (error) {
      console.error('Error fetching client LOBs:', error);
      setClientLobs([]);
      setClientSubLobs([]);
      setSelectedLobId('');
      setSelectedSubLobId('');
    }
  };

  /**
   * Handles SubLOB dropdown selection change
   * Checks if the selected SubLOB is assigned to another site and sets existingAssignment state
   * @param {object} e - Event object from the selection change
   */
  const handleSubLobChange = (e) => {
    const subLobId = e.target.value;
    setSelectedSubLobId(subLobId);
  };

  /**
   * Handles LOB dropdown selection change
   * Filters SubLOBs based on the selected LOB and checks for existing assignments
   * @param {object} e - Event object from the selection change
   */
  const handleLobChange = (e) => {
    const lobId = e.target.value;
    setSelectedLobId(lobId);
    
    if (lobId) {
      const selectedLob = clientLobs.find(l => l.id === lobId);
      if (selectedLob && Array.isArray(selectedLob.subLobs)) {
        setClientSubLobs(selectedLob.subLobs);
      } else {
        setClientSubLobs([]);
      }
    } else {
      setClientSubLobs([]);
    }
    setSelectedSubLobId('');
  };

  const fetchExistingAssignments = async (siteId) => {
    try {
      if (!siteId) {
        setExistingAssignments([]);
        return;
      }
      
      const response = await manageSite('getExistingAssignments', { 
        siteId: parseInt(siteId)
      });
      
      if (response && response.assignments) {
        setExistingAssignments(response.assignments);
      } else {
        setExistingAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching existing assignments:', error);
      setExistingAssignments([]);
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
                        .filter(Boolean)
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
                fetchSiteClients();
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
              {Array.isArray(clientLobs) && clientLobs.length > 0 ? (
                clientLobs.map(lob => (
                  <option key={lob.id} value={lob.id}>
                    {lob.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No LOBs available</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Select Sub LOB</label>
            <select
              value={selectedSubLobId}
              onChange={handleSubLobChange}
              disabled={!selectedLobId}
            >
              <option value="">Select a Sub LOB</option>
              {Array.isArray(clientSubLobs) && clientSubLobs.length > 0 ? (
                clientSubLobs.map(subLob => (
                  <option key={subLob.id} value={subLob.id}>
                    {subLob.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No Sub LOBs available</option>
              )}
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
                        .filter(Boolean)
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