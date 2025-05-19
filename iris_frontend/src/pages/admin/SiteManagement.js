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

  const [clientSiteEditModalOpen, setClientSiteEditModalOpen] = useState(false);
  const [currentClientSite, setCurrentClientSite] = useState(null);
  const [editClientLobs, setEditClientLobs] = useState([]);
  const [editClientSubLobs, setEditClientSubLobs] = useState([]);
  const [editSelectedClientId, setEditSelectedClientId] = useState('');
  const [editSelectedSiteId, setEditSelectedSiteId] = useState('');
  const [editSelectedLobId, setEditSelectedLobId] = useState('');
  const [editSelectedSubLobId, setEditSelectedSubLobId] = useState('');
  
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
      fetchExistingAssignments(selectedSite.dSite_ID);
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
      console.log('Sites data from API:', data?.sites);
      
      if (data?.sites) {
        // Store the exact structure returned from the backend
        setSites(data.sites);
      } else {
        setSites([]); // Clear the table if no sites are returned
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]); // Clear the table in case of an error
    }
  };

  /**
   * Retrieves all clients from the backend and updates the clients state
   */
  const fetchClients = async () => {
    try {
      const data = await manageSite('getClients', {});
      console.log('Fetched clients data:', data?.clients);
      
      if (data?.clients) {
        setClients(data.clients.map(client => ({
          id: client.dClient_ID,
          name: client.dClientName
        })));
        console.log('Mapped clients:', clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
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
        setSiteClients(data.siteClients.map(sc => ({
          dClientSite_ID: sc.dClientSite_ID,
          dClient_ID: sc.dClient_ID,  // Make sure this field is included
          dClientName: sc.dClientName,
          dLOB: sc.dLOB,
          dSubLOB: sc.dSubLOB,
          dSite_ID: sc.dSite_ID,  // Make sure this field is included
          dSiteName: sc.dSiteName,
        })));
        console.log("Fetched site clients:", data.siteClients); // For debugging
      }
    } catch (error) {
      console.error('Error fetching site clients:', error);
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
    setCurrentSite({
      ...site,
      name: site.dSiteName || '', // Ensure the name property is always defined
    });
    setEditModalOpen(true);
  };

  /**
   * Deletes a site and all its client associations after confirmation
   * @param {number} siteId - The ID of the site to delete
   */
  const handleDeleteSite = async (siteId) => {
    const site = sites.find(s => s.dSite_ID === siteId);
    const siteName = site ? site.dSiteName : '';
    
    if (!window.confirm(`Deleting site "${siteName}" will also remove all associated client relationships. Continue?`)) return;
    
    try {
      await manageSite('delete', { siteId });
      
      // Refresh both tables
      fetchSites();
      fetchSiteClients();
      
      alert(`Site "${siteName}" Successfully Deleted with all its client associations`);
    } catch (error) {
      console.error('Error deleting site:', error);
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
      confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and Sub LOB "${subLobName}" to site "${selectedSite.dSiteName}"?`;
    } else if (lobName) {
      confirmMessage = `Are you sure you want to add client "${clientName}" with LOB "${lobName}" and all its Sub LOBs to site "${selectedSite.dSiteName}"?`;
    } else {
      confirmMessage = `Are you sure you want to add client "${clientName}" with all its LOBs and Sub LOBs to site "${selectedSite.dSiteName}"?`;
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

      setSelectedClientId('');
      setSelectedLobId('');
      setSelectedSubLobId('');
      setClientLobs([]);
      setClientSubLobs([]);

      await fetchSiteClients();
      await fetchSites();
      await fetchExistingAssignments(selectedSite.dSite_ID); // Change this to use dSite_ID as well
    } catch (error) {
      console.error('Error adding client to site:', error);
    }
  }
};

  /**
   * Removes a client from a site
   * @param {number} clientId - The ID of the client to remove
   * @param {string} clientName - The name of the client (for display purposes)
   */
  const handleRemoveClient = async (clientSiteId, clientName) => {
    if (!window.confirm(`Are you sure you want to remove "${clientName}" from this site?`)) {
      return;
    }
    
    try {
      // Update the parameter name to match what the backend expects
      await manageSite('removeClientFromSite', { clientSiteId });
      
      // Update local state
      setSiteClients(siteClients.filter(sc => sc.dClientSite_ID !== clientSiteId));
      
      // Refresh data
      fetchSites();
      fetchSiteClients();
      
      alert(`Client "${clientName}" successfully removed from site`);
    } catch (error) {
      console.error('Error removing client from site:', error);
      alert('Error removing client from site');
    }
  };

  /**
   * Saves changes to a site (e.g., name change)
   * @param {object} updatedSite - The updated site object with new values
   */
  const handleSave = async (updatedSite) => {
    if (!updatedSite?.name?.trim()) {
      alert('Site name cannot be empty.');
      return;
    }
  
    try {
      await manageSite('edit', { 
        siteId: updatedSite.id || updatedSite.dSite_ID, // Ensure correct ID is used
        siteName: updatedSite.name,
        updateClientSiteTable: true, // This ensures tbl_clientsite is also updated
      });
  
      fetchSites();
      fetchSiteClients(); // Add this line to refresh the client-site table after editing
  
      setEditModalOpen(false);
      setCurrentSite(null);
    } catch (error) {
      console.error('Error saving site:', error);
    }
  };

  /**
   * Returns the list of clients available for assignment to a site
   * This includes clients that might already have some LOBs assigned but not all
   * @param {number} siteId - The ID of the site
   * @returns {Array} - List of clients available for assignment
   */
  const getAvailableClients = (siteId) => {
    // Simply return all clients - we'll filter LOBs/SubLOBs later
    // This ensures users can select any client and then choose LOBs/SubLOBs
    // that haven't already been assigned
    return clients;
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
      console.log("All LOBs from API:", allLobs);
      console.log("Existing assignments:", existingAssignments);
      
      // Get client name for comparison
      const clientName = clients.find(c => c.id == clientId)?.name;
      console.log("Client name for filtering:", clientName);
      
      // Filter out LOBs and Sub LOBs that are already assigned to the selected site
      const filteredLobs = allLobs.map(lob => {
        // Find existing assignments for this client and LOB
        const matchingAssignments = existingAssignments.filter(
          assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
        );
        console.log(`Matching assignments for LOB ${lob.name}:`, matchingAssignments);
        
        const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
        console.log(`Existing SubLOBs for LOB ${lob.name}:`, existingSubLobs);
        
        return {
          ...lob,
          subLobs: lob.subLobs.filter(subLob => !existingSubLobs.includes(subLob.name))
        };
      }).filter(lob => {
        // Only include LOBs that have at least one available Sub LOB
        return lob.subLobs.length > 0;
      });
  
      console.log("Filtered LOBs:", filteredLobs);
      setClientLobs(filteredLobs);
      setClientSubLobs([]);
      setSelectedLobId('');
      setSelectedSubLobId('');
      
      // Add feedback if no LOBs are available
      if (filteredLobs.length === 0) {
        console.log("No available LOBs for this client-site combination");
      }
    } catch (error) {
      console.error('Error fetching client LOBs:', error);
      setClientLobs([]);
      setClientSubLobs([]);
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
        siteId: parseInt(siteId) // Ensure siteId is a valid number
      });

      console.log('Fetching existing assignments for siteId:', siteId);
  
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

  /**
   * Opens the edit modal for a client-site assignment
   * @param {object} clientSite - The client-site object to edit
   */
  const handleEditClientSite = async (clientSite) => {
    console.log("Editing client-site:", clientSite);
    
    // Set the current client-site being edited
    setCurrentClientSite(clientSite);
    
    // Set the selected site ID - ensure it's a number
    const siteId = typeof clientSite.dSite_ID === 'string' ? parseInt(clientSite.dSite_ID) : clientSite.dSite_ID;
    setEditSelectedSiteId(siteId);
  
    // Find the matching client using the client name as a fallback
    let clientToUse = null;
    
    // First, try to find by client ID if available
    if (clientSite.dClient_ID) {
      const clientId = typeof clientSite.dClient_ID === 'string' ? parseInt(clientSite.dClient_ID) : clientSite.dClient_ID;
      clientToUse = clients.find(c => c.id === clientId);
    }
    
    // If not found by ID, try to find by name
    if (!clientToUse) {
      clientToUse = clients.find(c => c.name === clientSite.dClientName);
    }
  
    console.log("Client to use:", clientToUse);
    
    // Set the selected client ID (if available)
    if (clientToUse) {
      setEditSelectedClientId(clientToUse.id.toString()); // Convert to string to ensure consistent comparison
      
      // Set LOB and Sub LOB if they exist
      if (clientSite.dLOB) {
        try {
          await fetchClientLobsForEdit(clientToUse.id, clientSite.dLOB, clientSite.dSubLOB);
        } catch (error) {
          console.error("Error fetching LOBs for edit:", error);
        }
      } else {
        setEditClientLobs([]);
        setEditClientSubLobs([]);
        setEditSelectedLobId('');
        setEditSelectedSubLobId('');
      }
    } else {
      console.error("Could not find client for:", clientSite.dClientName);
      setEditSelectedClientId('');
      setEditClientLobs([]);
      setEditClientSubLobs([]);
      setEditSelectedLobId('');
      setEditSelectedSubLobId('');
    }
    
    // Open the modal
    setClientSiteEditModalOpen(true);
  };

  /**
   * Fetches LOBs for a client when editing
   * @param {number} clientId - The client ID
   * @param {string} initialLob - The initial LOB to select
   * @param {string} initialSubLob - The initial Sub LOB to select
   */
  const fetchClientLobsForEdit = async (clientId, initialLob = null, initialSubLob = null) => {
    try {
      if (!clientId) {
        setEditClientLobs([]);
        setEditClientSubLobs([]);
        return;
      }
  
      console.log("Fetching LOBs for client:", clientId, "Initial LOB:", initialLob, "Initial Sub LOB:", initialSubLob);
      
      const response = await manageSite('getClientLobs', { clientId });
      const allLobs = response.lobs || [];
      console.log("Retrieved LOBs:", allLobs);
      
      // Get client name for comparison
      const clientName = clients.find(c => c.id == clientId)?.name;
      
      // Fetch existing assignments for filtering (but exclude the current one being edited)
      let filteredAssignments = existingAssignments;
      if (currentClientSite) {
        filteredAssignments = existingAssignments.filter(a => 
          a.dClientSite_ID !== currentClientSite.dClientSite_ID
        );
      }
      
      // Filter out LOBs and Sub LOBs that are already assigned to other client-site combinations
      const filteredLobs = allLobs.map(lob => {
        const matchingAssignments = filteredAssignments.filter(
          assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
        );
        
        const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
        
        // Keep the current LOB/SubLOB in the list even if it's already assigned
        const currentSubLob = (lob.name === initialLob && initialSubLob) ? initialSubLob : null;
        
        return {
          ...lob,
          subLobs: lob.subLobs.filter(subLob => 
            !existingSubLobs.includes(subLob.name) || subLob.name === currentSubLob
          )
        };
      }).filter(lob => {
        // Include the LOB if it has available Sub LOBs or it's the currently selected LOB
        return lob.subLobs.length > 0 || lob.name === initialLob;
      });
      
      console.log("Filtered LOBs for edit:", filteredLobs);
      setEditClientLobs(filteredLobs);
      
      // The rest of the function with selection logic remains the same
      // Handle initial LOB selection
      if (initialLob && filteredLobs.length > 0) {
        // First try exact match
        let selectedLob = filteredLobs.find(lob => lob.name === initialLob);
        
        // If not found, try case-insensitive match
        if (!selectedLob) {
          selectedLob = filteredLobs.find(lob => 
            lob.name.toLowerCase() === initialLob.toLowerCase()
          );
        }
        
        if (selectedLob) {
          console.log("Selected LOB:", selectedLob);
          setEditSelectedLobId(selectedLob.id);
          
          // Set initial Sub LOB if available
          if (initialSubLob && selectedLob.subLobs && selectedLob.subLobs.length > 0) {
            let selectedSubLob = selectedLob.subLobs.find(
              subLob => subLob.name === initialSubLob || 
                       subLob.name.toLowerCase() === initialSubLob.toLowerCase()
            );
            
            if (selectedSubLob) {
              console.log("Selected Sub LOB:", selectedSubLob);
              setEditSelectedSubLobId(selectedSubLob.id);
            } else {
              console.log("Sub LOB not found:", initialSubLob);
              setEditSelectedSubLobId('');
            }
            
            setEditClientSubLobs(selectedLob.subLobs);
          } else {
            setEditClientSubLobs([]);
            setEditSelectedSubLobId('');
          }
        } else {
          console.log("LOB not found:", initialLob);
          setEditSelectedLobId('');
          setEditClientSubLobs([]);
          setEditSelectedSubLobId('');
        }
      } else {
        setEditSelectedLobId('');
        setEditClientSubLobs([]);
        setEditSelectedSubLobId('');
      }
    } catch (error) {
      console.error('Error fetching client LOBs for edit:', error);
      setEditClientLobs([]);
      setEditClientSubLobs([]);
      setEditSelectedLobId('');
      setEditSelectedSubLobId('');
    }
  };

  /**
   * Handles client dropdown change in the edit modal
   */
  const handleEditClientChange = (e) => {
    const clientId = e.target.value;
    setEditSelectedClientId(clientId);
    setEditSelectedLobId('');
    setEditSelectedSubLobId('');
    setEditClientSubLobs([]);
    
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
    // Reset any previous warnings
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
  
    if (!editSelectedLobId && editClientLobs.length > 0) {
      warningMessage += '• LOB is recommended\n';
    }
  
    if (!editSelectedSubLobId && editClientSubLobs.length > 0) {
      warningMessage += '• Sub LOB is recommended\n';
    }
  
    if (hasErrors) {
      alert('Please correct the following issues:\n\n' + warningMessage);
      return;
    }
  
    try {
      const selectedClient = clients.find(c => c.id == editSelectedClientId);
      const selectedSite = sites.find(s => s.id == editSelectedSiteId);
      
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.length > 0 ? (
                sites.map(site => (
                  <tr key={site.dSite_ID}>
                    <td>{site.dSite_ID}</td>
                    <td>{site.dSiteName}</td>
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
          <div className="form-group">
          <label>Select Site</label>
          <select
            value={selectedSite ? selectedSite.dSite_ID : ''}
            onChange={(e) => {
              const site = sites.find(s => s.dSite_ID === parseInt(e.target.value));
              setSelectedSite(site || null);
              setSelectedClientId('');
              setClientLobs([]);
              setClientSubLobs([]);
              setSelectedLobId('');
              setSelectedSubLobId('');
              if (site) {
                fetchExistingAssignments(site.dSite_ID); // Add this line
              }
              fetchSiteClients();
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
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <h2>Existing Client-Site Assignments</h2>
          <table className="existing-client-site-table">
            <thead>
              <tr>
                <th>Client Site ID</th>
                <th>Client Name</th>
                <th>LOB</th>
                <th>Sub LOB</th>
                <th>Site Name</th>
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

          {/* Add current editing information */}
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
                
                // If there's a valid site ID selected, fetch associated data
                if (newSiteId) {
                  // Optionally fetch any site-specific data here
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
              {clients.map(client => (
                <option key={client.id} value={client.id.toString()}>
                  {client.name}
                </option>
              ))}
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