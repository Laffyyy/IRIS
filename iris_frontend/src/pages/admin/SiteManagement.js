import React, { useState, useEffect } from 'react';
import './SiteManagement.css';
import { FaTrash, FaPencilAlt, FaTimes } from 'react-icons/fa';

const SiteManagement = () => {
  // Core data states
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]); 
  const [siteClients, setSiteClients] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  
  // UI state for the main form
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeTab, setActiveTab] = useState('addSite');
  const [clientLobs, setClientLobs] = useState([]);
  const [clientSubLobs, setClientSubLobs] = useState([]);
  const [selectedLobId, setSelectedLobId] = useState('');
  const [selectedSubLobId, setSelectedSubLobId] = useState('');
  
  // Client availability tracking
  const [availableClientIds, setAvailableClientIds] = useState({});

  // Edit site modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);
  
  // Edit client-site modal state
  const [clientSiteEditModalOpen, setClientSiteEditModalOpen] = useState(false);
  const [currentClientSite, setCurrentClientSite] = useState(null);
  const [editClientLobs, setEditClientLobs] = useState([]);
  const [editClientSubLobs, setEditClientSubLobs] = useState([]);
  const [editSelectedClientId, setEditSelectedClientId] = useState('');
  const [editSelectedSiteId, setEditSelectedSiteId] = useState('');
  const [editSelectedLobId, setEditSelectedLobId] = useState('');
  const [editSelectedSubLobId, setEditSelectedSubLobId] = useState('');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // Initial data loading
  useEffect(() => {
    fetchSites();
    fetchClients();
    fetchSiteClients();
  }, []);

  // Fetch assignments when site changes
  useEffect(() => {
    if (selectedSite) {
      fetchExistingAssignments(selectedSite.dSite_ID);
    } else {
      setExistingAssignments([]);
    }
  }, [selectedSite]);

  /**
   * Handles all API requests to the site management endpoints
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
   * Retrieves all sites from the backend
   */
  const fetchSites = async () => {
    try {
      const data = await manageSite('getAll', {});
      
      if (data?.sites) {
        setSites(data.sites);
      } else {
        setSites([]);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    }
  };

  /**
   * Retrieves all clients from the backend
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
      console.error('Error fetching clients:', error);
    }
  };

  /**
   * Retrieves all client-site relationships
   */
  const fetchSiteClients = async () => {
    try {
      const data = await manageSite('getSiteClients', {});
      if (data?.siteClients) {
        setSiteClients(data.siteClients.map(sc => ({
          dClientSite_ID: sc.dClientSite_ID,
          dClient_ID: sc.dClient_ID,
          dClientName: sc.dClientName,
          dLOB: sc.dLOB,
          dSubLOB: sc.dSubLOB,
          dSite_ID: sc.dSite_ID,
          dSiteName: sc.dSiteName,
          dCreatedBy: sc.dCreatedBy,
          tCreatedAt: sc.tCreatedAt
        })));
      }
    } catch (error) {
      console.error('Error fetching site clients:', error);
    }
  };

  /**
   * Adds a new site to the database
   */
  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
  
    try {
      await manageSite('add', { siteName: newSiteName });
      setNewSiteName('');
      fetchSites();
    } catch (error) {
      // Error already handled by manageSite
    }
  };

  /**
   * Opens the edit modal for a site
   */
  const handleEditClick = (site) => {
    setCurrentSite({
      ...site,
      name: site.dSiteName || '',
    });
    setEditModalOpen(true);
  };

  /**
   * Deletes a site and its client associations
   */
  const handleDeleteSite = async (siteId) => {
    const site = sites.find(s => s.dSite_ID === siteId);
    const siteName = site ? site.dSiteName : '';
    
    if (!window.confirm(`Deleting site "${siteName}" will also remove all associated client relationships. Continue?`)) return;
    
    try {
      await manageSite('delete', { siteId });
      fetchSites();
      fetchSiteClients();
      alert(`Site "${siteName}" Successfully Deleted with all its client associations`);
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };
  
  /**
   * Adds a client to a site
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
        confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and Sub LOB "${subLobName}" to site "${selectedSite.dSiteName}"?`;
      } else if (lobName) {
        confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and all its Sub LOBs to site "${selectedSite.dSiteName}"?`;
      } else {
        confirmMessage = `Adding Client "${clientName}" and ALL AVAILABLE LOBs and Sub LOBs under it to site "${selectedSite.dSiteName}". Continue?`;
      }

      if (!window.confirm(confirmMessage)) return;

      try {
        await manageSite('addClientToSite', {
          clientId: parseInt(selectedClientId),
          siteId: parseInt(selectedSite.dSite_ID),
          lobName: lobName,
          subLobName: subLobName
        });

        alert(`Client "${clientName}" successfully added to site "${selectedSite.dSiteName}"`);

        // Reset form
        setSelectedClientId('');
        setSelectedLobId('');
        setSelectedSubLobId('');
        setClientLobs([]);
        setClientSubLobs([]);

        // Refresh data
        await fetchSiteClients();
        await fetchSites();
        await fetchExistingAssignments(selectedSite.dSite_ID);
      } catch (error) {
        console.error('Error adding client to site:', error);
      }
    }
  };

  /**
   * Removes a client from a site
   */
  const handleRemoveClient = async (clientSiteId, clientName) => {
    if (!window.confirm(`Are you sure you want to remove "${clientName}" from this site?`)) {
      return;
    }
    
    try {
      await manageSite('removeClientFromSite', { clientSiteId });
      
      // Find the site ID of the deleted relationship
      const deletedRelationship = siteClients.find(sc => sc.dClientSite_ID === clientSiteId);
      const siteId = deletedRelationship?.dSite_ID;
      
      // Update local state
      setSiteClients(siteClients.filter(sc => sc.dClientSite_ID !== clientSiteId));
      
      // Refresh data
      fetchSites();
      fetchSiteClients();
      
      // Update assignments
      if (siteId) {
        await fetchExistingAssignments(parseInt(siteId));
      }
      
      // Update edit modal if needed
      if (editSelectedSiteId && siteId && parseInt(editSelectedSiteId) === parseInt(siteId) && editSelectedClientId) {
        fetchClientLobsForEdit(editSelectedClientId);
      }
      
      alert(`Client "${clientName}" successfully removed from site`);
    } catch (error) {
      console.error('Error removing client from site:', error);
      alert('Error removing client from site');
    }
  };

  /**
   * Saves changes to a site
   */
  const handleSave = async (updatedSite) => {
    if (!updatedSite?.name?.trim()) {
      alert('Site name cannot be empty.');
      return;
    }
  
    try {
      await manageSite('edit', { 
        siteId: updatedSite.id || updatedSite.dSite_ID,
        siteName: updatedSite.name,
        updateClientSiteTable: true,
      });
  
      fetchSites();
      fetchSiteClients();
      setEditModalOpen(false);
      setCurrentSite(null);
    } catch (error) {
      console.error('Error saving site:', error);
    }
  };

  /**
   * Returns clients available for assignment to a site
   */
  const getAvailableClients = (siteId, editingClientId = null) => {
    if (!siteId) return clients;
    
    return clients.filter(client => {
      // Always include the client we're currently editing
    if (editingClientId && String(client.id) === String(editingClientId)) {
      return true;
    }
      
      // Find all assignments for this client at this site
      const clientAssignments = existingAssignments.filter(
        assignment => assignment.dClientName === client.name
      );
      
      if (clientAssignments.length === 0) return true;
      
      // Check if all LOBs/SubLOBs are already assigned
      const clientLobsResponse = availableClientIds[siteId];
      if (!clientLobsResponse) return true;
      
      return clientLobsResponse[client.id] !== false;
    });
  };
  
  /**
   * Fetches LOBs and SubLOBs for a client, filtering already assigned ones
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
      
      // Get client name for comparison
      const clientName = clients.find(c => c.id == clientId)?.name;
      
      // Filter out already assigned LOBs/SubLOBs
      const filteredLobs = allLobs.map(lob => {
        const matchingAssignments = existingAssignments.filter(
          assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
        );
        
        const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
        
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
    }
  };

  /**
   * Handles SubLOB dropdown selection change
   */
  const handleSubLobChange = (e) => {
    setSelectedSubLobId(e.target.value);
  };

  /**
   * Handles LOB dropdown selection change
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

  /**
   * Fetches existing assignments for a site
   */
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
        await updateAvailableClientsForSite(siteId, response.assignments);
      } else {
        setExistingAssignments([]);
        await updateAvailableClientsForSite(siteId, []);
      }
    } catch (error) {
      console.error('Error fetching existing assignments:', error);
      setExistingAssignments([]);
    }
  };

  /**
   * Updates the cache of which clients are available for a site
   */
  const updateAvailableClientsForSite = async (siteId, passedAssignments = null) => {
    if (!siteId) return;
    
    const assignments = passedAssignments || existingAssignments;
    const availableClients = {};
    
    for (const client of clients) {
      availableClients[client.id] = true;
    }
    
    for (const client of clients) {
      try {
        const response = await manageSite('getClientLobs', { clientId: client.id });
        const allLobs = response.lobs || [];
        const clientName = client.name;
        
        if (allLobs.length === 0) {
          continue;
        }
        
        let totalSubLobs = 0;
        let assignedSubLobs = 0;
        let hasAvailableSubLobs = false;
        
        for (const lob of allLobs) {
          totalSubLobs += lob.subLobs.length;
          
          const matchingAssignments = assignments.filter(
            assignment => assignment.dClientName === clientName && 
                         assignment.dLOB === lob.name
          );
          
          const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
          assignedSubLobs += existingSubLobs.length;
          
          const availableSubLobsInLob = lob.subLobs.filter(subLob => 
            !existingSubLobs.includes(subLob.name)
          );
          
          if (availableSubLobsInLob.length > 0) {
            hasAvailableSubLobs = true;
            break;
          }
        }
        
        if (totalSubLobs > 0) {
          availableClients[client.id] = hasAvailableSubLobs || totalSubLobs > assignedSubLobs;
        }
      } catch (error) {
        console.error(`Error checking availability for client ${client.id}:`, error);
      }
    }
    
    setAvailableClientIds(prev => ({
      ...prev,
      [siteId]: availableClients
    }));
  };

  /**
   * Opens the edit modal for a client-site assignment
   */
  const handleEditClientSite = async (clientSite) => {
    setCurrentClientSite(clientSite);
    setEditSelectedSiteId(clientSite.dSite_ID.toString());
    
    // Remove this line that sets it to empty first - this is causing the problem
    // setEditSelectedClientId('');
    
    // Convert to string to ensure consistent type comparison
    const clientId = clientSite.dClient_ID?.toString();
    
    // Set the client ID first
    setEditSelectedClientId(clientId);
    
    // Then fetch the LOBs after the client ID is set
    if (clientId) {
      try {
        // Pass the current LOB and SubLOB names to pre-select them in the dropdowns
        await fetchClientLobsForEdit(clientId, clientSite.dLOB, clientSite.dSubLOB);
      } catch (error) {
        console.error("Error fetching client LOBs for edit:", error);
      }
    }
    
    setClientSiteEditModalOpen(true);
  };

  /**
   * Fetches LOBs for a client during edit
   */
  const fetchClientLobsForEdit = async (clientId, initialLob = null, initialSubLob = null) => {
    try {
      if (!clientId) {
        setEditClientLobs([]);
        setEditClientSubLobs([]);
        return;
      }
      
      const response = await manageSite('getClientLobs', { clientId });
      const allLobs = response.lobs || [];
      
      // Get client name for comparison
      const clientName = clients.find(c => c.id == clientId)?.name;
      
      // Filter out already assigned LOBs/SubLOBs
      let filteredAssignments = existingAssignments.filter(a => 
        a.dClientSite_ID !== currentClientSite.dClientSite_ID
      );
      
      const filteredLobs = allLobs.map(lob => {
        const matchingAssignments = filteredAssignments.filter(
          assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
        );
        
        const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
        const isCurrentlySelectedLob = lob.name === initialLob;
        
        return {
          ...lob,
          subLobs: lob.subLobs.filter(subLob => 
            !existingSubLobs.includes(subLob.name) || 
            (isCurrentlySelectedLob && subLob.name === initialSubLob)
          )
        };
      }).filter(lob => lob.subLobs.length > 0 || lob.name === initialLob);
      
      setEditClientLobs(filteredLobs);
      
      // Handle initial selection if provided
      if (initialLob && filteredLobs.length > 0) {
        let selectedLob = filteredLobs.find(lob => lob.name === initialLob);
        
        if (!selectedLob) {
          selectedLob = filteredLobs.find(lob => 
            lob.name.toLowerCase() === initialLob.toLowerCase()
          );
        }
        
        if (selectedLob) {
          setEditSelectedLobId(selectedLob.id);
          
          if (initialSubLob && selectedLob.subLobs && selectedLob.subLobs.length > 0) {
            let selectedSubLob = selectedLob.subLobs.find(subLob => 
              subLob.name === initialSubLob || 
              subLob.name.toLowerCase() === initialSubLob.toLowerCase()
            );
            
            if (selectedSubLob) {
              setEditSelectedSubLobId(selectedSubLob.id);
            }
            
            setEditClientSubLobs(selectedLob.subLobs);
          } else {
            setEditClientSubLobs([]);
            setEditSelectedSubLobId('');
          }
        } else {
          resetEditSelection();
        }
      } else {
        resetEditSelection();
      }
    } catch (error) {
      console.error('Error fetching client LOBs for edit:', error);
      resetEditSelection();
    }
  };

  /**
   * Reset edit form selections
   */
  const resetEditSelection = () => {
    setEditSelectedLobId('');
    setEditClientSubLobs([]);
    setEditSelectedSubLobId('');
  };

  /**
   * Handles client dropdown change in the edit modal
   */
  const handleEditClientChange = (e) => {
    const clientId = e.target.value;
    setEditSelectedClientId(clientId);
    resetEditSelection();
    
    if (clientId) {
      fetchClientLobsForEdit(clientId);
    } else {
      setEditClientLobs([]);
    }
  };

  /**
   * Handles LOB dropdown change in the edit modal
   */
  const handleEditLobChange = (e) => {
    const lobId = e.target.value;
    setEditSelectedLobId(lobId);
    setEditSelectedSubLobId('');
    
    if (lobId) {
      const selectedLob = editClientLobs.find(lob => lob.id === lobId);
      if (selectedLob && Array.isArray(selectedLob.subLobs)) {
        setEditClientSubLobs(selectedLob.subLobs);
      } else {
        setEditClientSubLobs([]);
      }
    } else {
      setEditClientSubLobs([]);
    }
  };

  /**
   * Handles Sub LOB dropdown change in the edit modal
   */
  const handleEditSubLobChange = (e) => {
    setEditSelectedSubLobId(e.target.value);
  };

  /**
   * Saves changes to a client-site assignment
   */
  const handleSaveClientSite = async () => {
    // Validate form
    let hasErrors = false;
    let warningMessage = '';
  
    if (!editSelectedSiteId) {
      warningMessage += '• Site is required\n';
      hasErrors = true;
    }
  
    if (!editSelectedClientId) {
      warningMessage += '• Client is required\n';
      hasErrors = true;
    }
  
    if (hasErrors) {
      alert('Please correct the following issues:\n\n' + warningMessage);
      return;
    }
  
    try {
      const selectedLob = editClientLobs.find(lob => lob.id === editSelectedLobId);
      const lobName = selectedLob ? selectedLob.name : null;
      
      const selectedSubLob = editClientSubLobs.find(subLob => subLob.id === editSelectedSubLobId);
      const subLobName = selectedSubLob ? selectedSubLob.name : null;
      
      // Call API to update the client-site assignment
      await manageSite('updateClientSite', {
        clientSiteId: currentClientSite.dClientSite_ID,
        clientId: editSelectedClientId,
        siteId: editSelectedSiteId,
        lobName: lobName,
        subLobName: subLobName
      });
  
      // Refresh the table
      await fetchSiteClients();
      
      // Close the modal
      setClientSiteEditModalOpen(false);
      setCurrentClientSite(null);
      
      alert('Client-site assignment updated successfully');
    } catch (error) {
      console.error('Error updating client-site assignment:', error);
      alert('Error updating client-site assignment');
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

          <h2>Existing Sites</h2>
          <table className="existing-sites-table">
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Site Name</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.length > 0 ? (
                sites.map(site => (
                  <tr key={site.dSite_ID}>
                    <td>{site.dSite_ID}</td>
                    <td>{site.dSiteName}</td>
                    <td>{site.dCreatedBy || '-'}</td>
                    <td>{site.tCreatedAt ? new Date(site.tCreatedAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(site)}
                        >
                          <FaPencilAlt size={12} /> Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteSite(site.dSite_ID)}
                        >
                          <FaTrash size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>No sites available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Select Site</label>
              <select
                value={selectedSite ? selectedSite.dSite_ID : ''}
                onChange={async (e) => {
                  try {
                    const site = sites.find(s => s.dSite_ID === parseInt(e.target.value));
                    setSelectedSite(site || null);
                    setSelectedClientId('');
                    setClientLobs([]);
                    setClientSubLobs([]);
                    setSelectedLobId('');
                    setSelectedSubLobId('');
                    
                    if (site) {
                      const siteId = site.dSite_ID;
                      const response = await manageSite('getExistingAssignments', { 
                        siteId: parseInt(siteId)
                      });
                      
                      if (response && response.assignments) {
                        setExistingAssignments(response.assignments);
                      } else {
                        setExistingAssignments([]);
                      }
                    } else {
                      setExistingAssignments([]);
                    }
                    
                    await fetchSiteClients();
                  } catch (error) {
                    console.error('Error updating site data:', error);
                  }
                }}
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.dSite_ID} value={site.dSite_ID}>
                    {site.dSiteName}
                  </option>
                ))}
              </select>
            </div>
            
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
                {selectedSite && getAvailableClients(selectedSite.dSite_ID).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
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
          
          <h2>Existing Client-Site Assignments</h2>
          <table className="existing-client-site-table">
            <thead>
              <tr>
                <th>Client Site ID</th>
                <th>Client Name</th>
                <th>LOB</th>
                <th>Sub LOB</th>
                <th>Site Name</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {siteClients.map(clientSite => (
                <tr key={clientSite.dClientSite_ID}>
                  <td>{clientSite.dClientSite_ID}</td>
                  <td>{clientSite.dClientName}</td>
                  <td>{clientSite.dLOB || '-'}</td>
                  <td>{clientSite.dSubLOB || '-'}</td>
                  <td>{clientSite.dSiteName}</td>
                  <td>{clientSite.dCreatedBy || '-'}</td>
                  <td>{clientSite.tCreatedAt ? new Date(clientSite.tCreatedAt).toLocaleString() : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditClientSite(clientSite)}
                      >
                        <FaPencilAlt size={12} /> Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleRemoveClient(clientSite.dClientSite_ID, clientSite.dClientName)
                        }
                      >
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

            <div className="modal-actions">
              <button onClick={() => {
                setEditModalOpen(false);
                setCurrentSite(null);
              }} className="cancel-btn">Cancel</button>
              <button 
                onClick={() => handleSave(currentSite)} 
                className="save-btn"
                disabled={!currentSite.name?.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client-Site Modal */}
      {clientSiteEditModalOpen && currentClientSite && (
        <div className="modal-overlay">
          <div className="modal edit-clientsite-modal">
            <div className="modal-header">
              <h2>Edit Client-Site Assignment</h2>
              <button 
                onClick={() => {
                  setClientSiteEditModalOpen(false);
                  setCurrentClientSite(null);
                }} 
                className="close-btn"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-subtitle">
              <strong>Currently Editing:</strong> {currentClientSite.dSiteName} | {currentClientSite.dClientName} | 
              {currentClientSite.dLOB ? ` ${currentClientSite.dLOB}` : ' No LOB'} | 
              {currentClientSite.dSubLOB ? ` ${currentClientSite.dSubLOB}` : ' No Sub LOB'}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Select Site <span className="required-field">*</span></label>
                <select
                  value={editSelectedSiteId}
                  onChange={(e) => {
                    const newSiteId = e.target.value;
                    setEditSelectedSiteId(newSiteId);
                    
                    // Reset other selections when site changes
                    setEditSelectedClientId('');
                    setEditSelectedLobId('');
                    setEditSelectedSubLobId('');
                    setEditClientLobs([]);
                    setEditClientSubLobs([]);
                    
                    if (newSiteId) {
                      fetchExistingAssignments(parseInt(newSiteId));
                    }
                  }}
                  className={!editSelectedSiteId ? "validation-error" : ""}
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.dSite_ID} value={site.dSite_ID}>
                      {site.dSiteName}
                    </option>
                  ))}
                </select>
                {!editSelectedSiteId && <div className="error-message">Site is required</div>}
              </div>
              
              <div className="form-group">
                <label>Select Client <span className="required-field">*</span></label>
                <select
                  value={editSelectedClientId}
                  onChange={handleEditClientChange}
                  className={!editSelectedClientId ? "validation-error" : ""}
                >
                  <option value="">Select a client</option>
                  {/* First ensure we have the current client in the list */}
                  {currentClientSite && (
                    <option value={currentClientSite.dClient_ID.toString()} key={`current-${currentClientSite.dClient_ID}`}>
                      {currentClientSite.dClientName}
                    </option>
                  )}
                  {/* Then add other available clients */}
                  {editSelectedSiteId && 
                    getAvailableClients(editSelectedSiteId, currentClientSite?.dClient_ID)
                      .filter(client => !currentClientSite || client.id.toString() !== currentClientSite.dClient_ID.toString())
                      .map(client => (
                        <option key={client.id} value={client.id.toString()}>
                          {client.name}
                        </option>
                      ))
                  }
                </select>
                {!editSelectedClientId && <div className="error-message">Client is required</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Select LOB</label>
                <select
                  value={editSelectedLobId}
                  onChange={handleEditLobChange}
                  disabled={!editSelectedClientId}
                  className={editSelectedClientId && !editSelectedLobId && editClientLobs.length > 0 ? "validation-warning" : ""}
                >
                  <option value="">Select a LOB</option>
                  {Array.isArray(editClientLobs) && editClientLobs.length > 0 ? (
                    editClientLobs.map(lob => (
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
                  value={editSelectedSubLobId}
                  onChange={handleEditSubLobChange}
                  disabled={!editSelectedLobId}
                  className={editSelectedLobId && !editSelectedSubLobId && editClientSubLobs.length > 0 ? "validation-warning" : ""}
                >
                  <option value="">Select a Sub LOB</option>
                  {Array.isArray(editClientSubLobs) && editClientSubLobs.length > 0 ? (
                    editClientSubLobs.map(subLob => (
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

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setClientSiteEditModalOpen(false);
                  setCurrentClientSite(null);
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveClientSite} 
                className="save-btn"
                disabled={!editSelectedSiteId || !editSelectedClientId}
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