import React, { useState, useEffect, useRef } from 'react';
import './SiteManagement.css';
import { FaTrash, FaEdit, FaTimes, FaSearch, FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import Select from 'react-select';

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
  const [availableClients, setAvailableClients] = useState([]);

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

  const [selectedSiteIds, setSelectedSiteIds] = useState([]);
  const [selectedClientSiteIds, setSelectedClientSiteIds] = useState([]);
  const [selectAllSites, setSelectAllSites] = useState(false);
  const [selectAllClientSites, setSelectAllClientSites] = useState(false);
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [clientSiteSearchTerm, setClientSiteSearchTerm] = useState('');

  const [siteSortConfig, setSiteSortConfig] = useState({ key: null, direction: 'ascending' });
  const [clientSiteSortConfig, setClientSiteSortConfig] = useState({ key: null, direction: 'ascending' });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  //Delete Confirmation States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteType, setDeleteType] = useState(''); // 'site', 'client', 'bulk-sites', 'bulk-clients'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [siteStatusTab, setSiteStatusTab] = useState('ACTIVE');
  const [activeSites, setActiveSites] = useState([]);
  const [deactivatedSites, setDeactivatedSites] = useState([]);

  // Add this new state for available edit clients
  const [availableEditClients, setAvailableEditClients] = useState([]);
  const [showAddSiteConfirmModal, setShowAddSiteConfirmModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showClientAlreadyAddedModal, setShowClientAlreadyAddedModal] = useState(false);
  const [alreadyAddedClientName, setAlreadyAddedClientName] = useState('');

  const [showClientAddSuccessModal, setShowClientAddSuccessModal] = useState(false);
  const [clientAddSuccessDetails, setClientAddSuccessDetails] = useState({
    clientName: '',
    siteName: '',
    lobName: '',
    subLobName: '',
    addedAllLobs: false,
    addedAllSubLobs: false
  });

  const [showEditSiteConfirmModal, setShowEditSiteConfirmModal] = useState(false);
  const [siteBeingEdited, setSiteBeingEdited] = useState(null);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showEditErrorModal, setShowEditErrorModal] = useState(false);

  const [clientSiteStatusTab, setClientSiteStatusTab] = useState('ACTIVE');
  const [activeClientSites, setActiveClientSites] = useState([]);
  const [deactivatedClientSites, setDeactivatedClientSites] = useState([]);

  const [showDuplicateSiteModal, setShowDuplicateSiteModal] = useState(false);
  const [duplicateSiteName, setDuplicateSiteName] = useState('');

  const [showSiteDeactivatedWarning, setShowSiteDeactivatedWarning] = useState(false);
  const [deactivatedSiteName, setDeactivatedSiteName] = useState('');

  const [showAddClientSiteConfirmModal, setShowAddClientSiteConfirmModal] = useState(false);
  const [clientSiteConfirmDetails, setClientSiteConfirmDetails] = useState({
    clientName: '',
    lobName: '',
    subLobName: ''
  });

  // Add state for tracking last selected indices for shift-click functionality
  const [lastSelectedSiteIndex, setLastSelectedSiteIndex] = useState(null);
  const [lastSelectedClientSiteIndex, setLastSelectedClientSiteIndex] = useState(null);

  // Add refs to track shift-click state
  const shiftClickInProgress = useRef(false);
  const clientSiteShiftClickInProgress = useRef(false);

  // Refs for input fields
  const addSiteInputRef = useRef(null);
  const selectSiteRef = useRef(null);
  const selectClientRef = useRef(null);
  const selectLobRef = useRef(null);
  const selectSubLobRef = useRef(null);
  const deleteConfirmInputRef = useRef(null);
  const editSiteInputRef = useRef(null);

  // Focus management for Add New Site tab
  useEffect(() => {
    if (activeTab === 'addSite' && addSiteInputRef.current) {
      addSiteInputRef.current.focus();
    }
  }, [activeTab]);

  // Focus management for Add Client to Site tab
  useEffect(() => {
    if (activeTab === 'addClient' && selectSiteRef.current) {
      selectSiteRef.current.focus();
    }
  }, [activeTab]);

  // Focus management for modals
  useEffect(() => {
    if (showDeleteModal && deleteConfirmInputRef.current) {
      deleteConfirmInputRef.current.focus();
    }
  }, [showDeleteModal]);

  useEffect(() => {
    if (showAddSiteConfirmModal && addSiteInputRef.current) {
      addSiteInputRef.current.focus();
    }
  }, [showAddSiteConfirmModal]);

  useEffect(() => {
    if (editModalOpen && editSiteInputRef.current) {
      editSiteInputRef.current.focus();
    }
  }, [editModalOpen]);

  useEffect(() => {
    if (selectedSite && selectClientRef.current) {
      selectClientRef.current.focus();
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedClientId && selectLobRef.current) {
      selectLobRef.current.focus();
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedLobId && selectSubLobRef.current) {
      selectSubLobRef.current.focus();
    }
  }, [selectedLobId]);

  const slideInOut = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderRadius: '4px',
    animation: 'slideInOut 3s forwards',
    width: '400px',
    backgroundColor: '#f0fff4',
    borderLeft: '4px solid #68d391',
  };

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

  // Update the useEffect to load available clients when site changes
  useEffect(() => {
    const loadAvailableClients = async () => {
      if (!selectedSite) {
        setAvailableClients([]);
        return;
      }

      try {
        const clients = await getAvailableClients(selectedSite.dSite_ID);
        setAvailableClients(clients);
      } catch (error) {
        console.error('Error loading available clients:', error);
        setAvailableClients([]);
      }
    };

    loadAvailableClients();
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
      // Fetch active sites
      const activeData = await manageSite('getAllByStatus', { status: 'ACTIVE' });
      if (activeData?.sites) {
        setActiveSites(activeData.sites);
      } else {
        setActiveSites([]);
      }
  
      // Fetch deactivated sites
      const deactivatedData = await manageSite('getAllByStatus', { status: 'DEACTIVATED' });
      if (deactivatedData?.sites) {
        setDeactivatedSites(deactivatedData.sites);
      } else {
        setDeactivatedSites([]);
      }
  
      // Set the appropriate sites array based on active tab
      setSites(siteStatusTab === 'ACTIVE' ? activeData?.sites || [] : deactivatedData?.sites || []);
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
      // Fetch active client-site assignments
      const activeData = await manageSite('getClientSitesByStatus', { status: 'ACTIVE' });
      if (activeData?.siteClients) {
        setActiveClientSites(activeData.siteClients);
      } else {
        setActiveClientSites([]);
      }
  
      // Fetch deactivated client-site assignments
      const deactivatedData = await manageSite('getClientSitesByStatus', { status: 'DEACTIVATED' });
      if (deactivatedData?.siteClients) {
        setDeactivatedClientSites(deactivatedData.siteClients);
      } else {
        setDeactivatedClientSites([]);
      }
  
      // Set the appropriate client-sites array based on active tab
      setSiteClients(clientSiteStatusTab === 'ACTIVE' ? activeData?.siteClients || [] : deactivatedData?.siteClients || []);
    } catch (error) {
      console.error('Error fetching site clients:', error);
      setSiteClients([]);
    }
  };

  useEffect(() => {
    setSiteClients(clientSiteStatusTab === 'ACTIVE' ? activeClientSites : deactivatedClientSites);
    // Reset selection when switching tabs
    setSelectedClientSiteIds([]);
    setSelectAllClientSites(false);
    setLastSelectedClientSiteIndex(null);
  }, [clientSiteStatusTab, activeClientSites, deactivatedClientSites]);

  const sortData = (data, sortConfig) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      // Handle string, number and date comparisons
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Convert date strings to Date objects for proper comparison
      if (typeof aValue === 'string' && aValue.includes('-') && !isNaN(Date.parse(aValue))) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // Add these handler functions to toggle sort direction
  const handleSiteSort = (key) => {
    setSiteSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        if (prevConfig.direction === 'ascending') {
          return { key, direction: 'descending' };
        } else if (prevConfig.direction === 'descending') {
          return { key: null, direction: 'ascending' };
        }
      }
      return { key, direction: 'ascending' };
    });
  };
  
  const handleClientSiteSort = (key) => {
    setClientSiteSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        if (prevConfig.direction === 'ascending') {
          return { key, direction: 'descending' };
        } else if (prevConfig.direction === 'descending') {
          return { key: null, direction: 'ascending' };
        }
      }
      return { key, direction: 'ascending' };
    });
  };

  /**
   * Checks if a site with the given name already exists
   */
  const checkDuplicateSite = async (siteName) => {
    try {
      if (!siteName.trim()) return false;
      
      // Check active sites
      const isDuplicateActive = activeSites.some(
        site => site.dSiteName.toLowerCase() === siteName.toLowerCase()
      );
      
      // Check deactivated sites
      const isDuplicateDeactivated = deactivatedSites.some(
        site => site.dSiteName.toLowerCase() === siteName.toLowerCase()
      );
      
      return isDuplicateActive || isDuplicateDeactivated;
    } catch (error) {
      console.error('Error checking for duplicate site:', error);
      return false;
    }
  };

  /**
   * Adds a new site to the database
   */
  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
    
    // First check if the site already exists
    const isDuplicate = await checkDuplicateSite(newSiteName);
    
    if (isDuplicate) {
      // Show duplicate site modal
      setDuplicateSiteName(newSiteName);
      setShowDuplicateSiteModal(true);
    } else {
      // Proceed with normal add site flow
      setShowAddSiteConfirmModal(true);
    }
  };

  // Add the actual site creation logic in a new function
  const confirmAddSite = async () => {
    try {
      const response = await manageSite('add', { siteName: newSiteName });
      
      // Close the confirmation modal immediately
      setShowAddSiteConfirmModal(false);
      
      // Show the success message with the new site ID
      setSuccessMessage(`Site "${newSiteName}" (ID: ${response.siteId}) successfully added`);
      setShowSuccessModal(true);
      
      // Reset form and refresh data
      setNewSiteName('');
      fetchSites();
      
      // Remove the setTimeout - modal will be closed manually
    } catch (error) {
      // Close the confirmation modal
      setShowAddSiteConfirmModal(false);
      
      // Check if it's a duplicate site error
      if (error.message && error.message.toLowerCase().includes('duplicate')) {
        setDuplicateSiteName(newSiteName);
        setShowDuplicateSiteModal(true);
      } else {
        // Handle other errors with the existing error mechanism
        setErrorMessage(`Failed to add site: ${error.message}`);
        setShowErrorModal(true);
        setTimeout(() => {
          setShowErrorModal(false);
        }, 3000);
      }
    }
  };

  const isClientFullyAssignedToSite = async (clientName, siteId) => {
    try {
      // Filter assignments for this client and site
      const clientAssignments = existingAssignments.filter(
        assignment => assignment.dClientName === clientName && 
                      assignment.dSite_ID === siteId
      );
      
      // If no LOB is selected, we need to check if ALL client's LOBs/SubLOBs are already assigned
      if (!clientSiteConfirmDetails.lobName) {
        // Get all possible LOBs and SubLOBs for this client
        try {
          const response = await manageSite('getClientLobs', { 
            clientId: selectedClientId.toString()
            // Don't pass siteId here to get ALL LOBs/SubLOBs, not just available ones
          });
          const allClientLobs = response.lobs || [];
          
          // Count total possible SubLOBs for this client
          const totalPossibleSubLobs = allClientLobs.reduce((total, lob) => {
            return total + (lob.subLobs ? lob.subLobs.length : 0);
          }, 0);
          
          // If no LOBs exist for this client, they can't be assigned
          if (totalPossibleSubLobs === 0) {
            return false;
          }
          
          // Check if all possible LOB/SubLOB combinations are already assigned
          let assignedCount = 0;
          for (const lob of allClientLobs) {
            for (const subLob of lob.subLobs) {
              const isAssigned = clientAssignments.some(
                assignment => assignment.dLOB === lob.name && assignment.dSubLOB === subLob.name
              );
              if (isAssigned) {
                assignedCount++;
              }
            }
          }
          
          // Client is fully assigned if all possible combinations are assigned
          return assignedCount === totalPossibleSubLobs;
        } catch (error) {
          console.error('Error checking all client LOBs:', error);
          return false;
        }
      }
      
      // If LOB is selected but no Sub LOB, check if ALL SubLOBs for this LOB are assigned
      if (clientSiteConfirmDetails.lobName && !clientSiteConfirmDetails.subLobName) {
        // Get all SubLOBs for this specific LOB
        const selectedLob = clientLobs.find(lob => lob.name === clientSiteConfirmDetails.lobName);
        if (!selectedLob || !selectedLob.subLobs) {
          return false;
        }
        
        // Check if all SubLOBs for this LOB are assigned
        const assignedSubLobs = clientAssignments
          .filter(assignment => assignment.dLOB === clientSiteConfirmDetails.lobName)
          .map(assignment => assignment.dSubLOB);
        
        const allSubLobsAssigned = selectedLob.subLobs.every(subLob => 
          assignedSubLobs.includes(subLob.name)
        );
        
        return allSubLobsAssigned;
      }
      
      // If both LOB and Sub LOB are selected, check if that specific combination exists
      if (clientSiteConfirmDetails.lobName && clientSiteConfirmDetails.subLobName) {
        return clientAssignments.some(
          assignment => assignment.dLOB === clientSiteConfirmDetails.lobName && 
                        assignment.dSubLOB === clientSiteConfirmDetails.subLobName
        );
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if client is fully assigned:', error);
      return false;
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
  const handleDeactivateSite = async (siteId) => {
    const site = sites.find(s => s.dSite_ID === siteId);
    setDeleteType('site');
    setItemToDelete({ id: siteId, name: site?.dSiteName || 'Unknown site' });
    setShowDeleteModal(true);
  };
  
  /**
   * Adds a client to a site
   */
  const handleAddClient = async () => {
    if (selectedSite && selectedClientId) {
      try {
        // Get client name from the availableClients array first, then fall back to clients array
        const clientName = availableClients.find(c => {
          return c.id == selectedClientId;
        })?.name || 
        clients.find(c => {
          return c.id == selectedClientId;
        })?.name;
        
        if (!clientName) {
          console.error('Client name not found for ID:', selectedClientId);
          setErrorMessage('Client not found. Please try again.');
          setShowErrorModal(true);
          setTimeout(() => {
            setShowErrorModal(false);
          }, 3000);
          return;
        }
  
        const selectedLob = clientLobs.find(lob => lob.id === selectedLobId);
        const lobName = selectedLob ? selectedLob.name : null;
        const selectedSubLob = clientSubLobs.find(subLob => subLob.id === selectedSubLobId);
        const subLobName = selectedSubLob ? selectedSubLob.name : null;
  
        // Set confirmation details with the client name
        setClientSiteConfirmDetails({
          clientName: clientName, // Make sure this is set correctly
          lobName,
          subLobName
        });
        
        // Check if this client/LOB/Sub LOB is already assigned
        const isAlreadyAssigned = await isClientFullyAssignedToSite(clientName, selectedSite.dSite_ID);
        
        if (isAlreadyAssigned) {
          // Show "already added" modal instead of confirmation
          setAlreadyAddedClientName(clientName);
          setShowClientAlreadyAddedModal(true);
        } else {
          // Show confirmation modal if not already assigned
          setShowAddClientSiteConfirmModal(true);
        }
      } catch (error) {
        console.error('Error checking client assignment:', error);
        // Fallback to showing confirmation modal
        setShowAddClientSiteConfirmModal(true);
      }
    }
  };

  const confirmAddClient = async () => {
    try {
      // Use the client name from clientSiteConfirmDetails instead of searching in clients array
      const clientName = clientSiteConfirmDetails.clientName;
      
      console.log("Checking if client is already assigned:", clientName);
      console.log("Current assignments:", existingAssignments);
      console.log("Checking against LOB:", clientSiteConfirmDetails.lobName);
      console.log("Checking against Sub LOB:", clientSiteConfirmDetails.subLobName);
      
      // Use the clientName we already have from confirmation details
      const isAlreadyAssigned = await isClientFullyAssignedToSite(clientName, selectedSite.dSite_ID);
      
      console.log("Is client already assigned:", isAlreadyAssigned);
      
      if (isAlreadyAssigned) {
        // Close confirmation modal
        setShowAddClientSiteConfirmModal(false);
        
        // Show the "Client Already Added" modal
        setAlreadyAddedClientName(clientName);
        setShowClientAlreadyAddedModal(true);
        return; // Exit early
      }
      
      // If not already assigned, proceed with API call
      await manageSite('addClientToSite', {
        clientId: selectedClientId.toString(),
        siteId: selectedSite.dSite_ID.toString(),
        lobName: clientSiteConfirmDetails.lobName,
        subLobName: clientSiteConfirmDetails.subLobName,
        userID: localStorage.getItem('userId') || '0001' // Pass the user ID
      });
      
      // Close confirmation modal
      setShowAddClientSiteConfirmModal(false);
      
      // Determine what was added based on selections
      let addedAllLobs = false;
      let addedAllSubLobs = false;
      
      if (!clientSiteConfirmDetails.lobName) {
        // No LOB selected means all LOBs and SubLOBs were added
        addedAllLobs = true;
        addedAllSubLobs = true;
      } else if (!clientSiteConfirmDetails.subLobName) {
        // LOB selected but no SubLOB means all SubLOBs for that LOB were added
        addedAllSubLobs = true;
      }
      
      // Set success modal details with comprehensive information
      setClientAddSuccessDetails({
        clientName: clientName, // Use the clientName from confirmDetails
        siteName: selectedSite.dSiteName,
        lobName: clientSiteConfirmDetails.lobName || '',
        subLobName: clientSiteConfirmDetails.subLobName || '',
        addedAllLobs: addedAllLobs,
        addedAllSubLobs: addedAllSubLobs
      });
      setShowClientAddSuccessModal(true);
      
      // Reset form - including clearing the site selection
      setSelectedSite(null);
      setSelectedClientId('');
      setSelectedLobId('');
      setSelectedSubLobId('');
      setClientLobs([]);
      setClientSubLobs([]);
      setAvailableClients([]);
      setExistingAssignments([]);
      
      // Refresh data in the background
      fetchSiteClients();
      fetchSites();
      
    } catch (error) {
      console.error('Error adding client to site:', error);
      setShowAddClientSiteConfirmModal(false);
      
      if (error.message && error.message.toLowerCase().includes('already assigned') || 
          error.message && error.message.toLowerCase().includes('already added')) {
        const clientName = clientSiteConfirmDetails.clientName; // Use from confirmDetails
        setAlreadyAddedClientName(clientName);
        setShowClientAlreadyAddedModal(true);
      } else {
        setErrorMessage(`Failed to add client: ${error.message}`);
        setShowErrorModal(true);
        setTimeout(() => {
          setShowErrorModal(false);
        }, 3000);
      }
    }
  };

  /**
   * Removes a client from a site
   */
  const handleRemoveClient = async (clientSiteId, clientName) => {
    setDeleteType('client');
    setItemToDelete({ id: clientSiteId, name: clientName });
    setShowDeleteModal(true);
  };

  /**
   * Saves changes to a site
   */
  const handleSave = (updatedSite) => {
    if (!updatedSite?.name?.trim()) {
      // Show error modal instead of alert
      setErrorMessage('Site name cannot be empty');
      setShowErrorModal(true);
      
      // Auto-hide the error message after 3 seconds
      setTimeout(() => {
        setShowErrorModal(false);
      }, 3000);
      return;
    }
    
    // Store the original site for the confirmation modal
    const originalSite = sites.find(s => s.dSite_ID === (updatedSite.id || updatedSite.dSite_ID));
    setSiteBeingEdited({
      ...updatedSite,
      originalName: originalSite?.dSiteName || 'Unknown site'
    });
    
    setShowEditSiteConfirmModal(true);
  };

  const confirmSaveSite = async () => {
    try {
      // Check if the new name already exists
      const isDuplicate = await checkDuplicateSite(siteBeingEdited.name);
      
      if (isDuplicate && siteBeingEdited.name.toLowerCase() !== siteBeingEdited.originalName.toLowerCase()) {
        setShowEditSiteConfirmModal(false);
        setShowEditErrorModal(true);
        return;
      }
  
      const response = await manageSite('edit', { 
        siteId: siteBeingEdited.id || siteBeingEdited.dSite_ID,
        siteName: siteBeingEdited.name,
        updateClientSiteTable: true,
      });
  
      // Close the edit modal and confirmation modal
      setShowEditSiteConfirmModal(false);
      
      // Update the siteBeingEdited with the new site ID for the success modal
      setSiteBeingEdited(prev => ({
        ...prev,
        newSiteId: response.newSiteId
      }));
      
      setShowEditSuccessModal(true);
      
      // Reset form and refresh data
      setCurrentSite(null);
      fetchSites();
      fetchSiteClients();
    } catch (error) {
      console.error('Error saving site:', error);
      setShowEditSiteConfirmModal(false);
      setShowEditErrorModal(true);
    }
  };

  // Add these handler functions for client-site status changes
  const handleDeactivateClientSite = async (clientSiteId) => {
    const clientSite = siteClients.find(sc => sc.dClientSite_ID === clientSiteId);
    setDeleteType('client-site');
    setItemToDelete({ id: clientSiteId, name: clientSite?.dClientName || 'Unknown client' });
    setShowDeleteModal(true);
  };

  const handleReactivateClientSite = async (clientSiteId) => {
    const clientSite = siteClients.find(sc => sc.dClientSite_ID === clientSiteId);
    
    // Check if the parent site is active or deactivated
    const siteIsDeactivated = deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
    
    if (siteIsDeactivated) {
      // Show the site deactivated warning
      setDeactivatedSiteName(clientSite.dSiteName);
      setShowSiteDeactivatedWarning(true);
    } else {
      // If site is active, proceed to normal confirmation
      setDeleteType('reactivate-client-site');
      setItemToDelete({ id: clientSiteId, name: clientSite?.dClientName || 'Unknown client' });
      setShowDeleteModal(true);
    }
  };

  const handleBulkDeactivateClientSites = async () => {
    if (selectedClientSiteIds.length === 0) return;
    
    // Get the actual client-site objects for the selected IDs
    const selectedClientSites = siteClients.filter(clientSite => 
      selectedClientSiteIds.includes(clientSite.dClientSite_ID)
    );
    
    setDeleteType('bulk-deactivate-client-sites');
    setItemToDelete({ 
      count: selectedClientSiteIds.length,
      type: 'bulk-deactivate-client-sites',
      items: selectedClientSites
    });
    setShowDeleteModal(true);
  };

  const handleBulkReactivateClientSites = async () => {
    if (selectedClientSiteIds.length === 0) return;
    
    // Filter out client-site IDs that belong to deactivated sites
    const validClientSiteIds = selectedClientSiteIds.filter(csId => {
      const clientSite = siteClients.find(cs => cs.dClientSite_ID === csId);
      return clientSite && !deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
    });
    
    if (validClientSiteIds.length === 0) {
      setShowSiteDeactivatedWarning(true);
      return;
    }
    
    // Get the actual client-site objects for the valid IDs
    const selectedClientSites = siteClients.filter(clientSite => 
      validClientSiteIds.includes(clientSite.dClientSite_ID)
    );
    
    setDeleteType('bulk-reactivate-client-sites');
    setItemToDelete({ 
      count: validClientSiteIds.length,
      type: 'bulk-reactivate-client-sites',
      items: selectedClientSites
    });
    setShowDeleteModal(true);
  };

  /**
   * Returns clients available for assignment to a site
   */
  const getAvailableClients = async (siteId, editingClientId = null) => {
    if (!siteId) return clients;
    
    try {
      const response = await manageSite('getAvailableClients', { 
        siteId: siteId.toString()  // Ensure siteId is a string
      });
      
      // Directly use the clients returned from the backend
      const availableClients = response.clients || [];
      
      // If we're editing a client, ensure it's included in the results
      if (editingClientId) {
        const editingClient = clients.find(c => 
          c.id && c.id.toString() === editingClientId.toString()
        );
        
        if (editingClient && !availableClients.some(c => c.id === editingClient.id)) {
          availableClients.push(editingClient);
        }
      }
      
      return availableClients;
    } catch (error) {
      console.error('Error determining available clients:', error);
      return [];
    }
  };

  /**
   * Handles site row checkbox selection with shift-click support
   */
  const handleSiteSelection = (siteId, index, event) => {
    // If this is the onChange event from a shift-click, skip processing
    if (event?.type === 'change' && shiftClickInProgress.current) {
      shiftClickInProgress.current = false; // Reset the flag
      return;
    }
  
    if (event?.shiftKey && lastSelectedSiteIndex !== null) {
      // Shift-click: select range
      const startIndex = Math.min(lastSelectedSiteIndex, index);
      const endIndex = Math.max(lastSelectedSiteIndex, index);
      
      const rangeIds = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (filteredSites[i]) {
          rangeIds.push(filteredSites[i].dSite_ID);
        }
      }
      
      setSelectedSiteIds(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(id => newSelection.add(id));
        const newSelectionArray = Array.from(newSelection);
        
        // Update "Select All" checkbox state based on selection
        setSelectAllSites(newSelectionArray.length === filteredSites.length);
        
        return newSelectionArray;
      });
    } else {
      // Normal click: toggle single selection
      setSelectedSiteIds(prev => {
        const newSelection = prev.includes(siteId) 
          ? prev.filter(id => id !== siteId)
          : [...prev, siteId];
        
        // Update "Select All" checkbox state based on selection
        setSelectAllSites(newSelection.length === filteredSites.length);
        
        return newSelection;
      });
    }
    
    // Update last selected index for future shift-clicks
    setLastSelectedSiteIndex(index);
  };

  /**
   * Handles "select all sites" checkbox
   */
  const handleSelectAllSites = () => {
    if (selectAllSites) {
      setSelectedSiteIds([]);
      setLastSelectedSiteIndex(null);
    } else {
      // Only select IDs of the filtered sites currently visible in the table
      setSelectedSiteIds(filteredSites.map(site => site.dSite_ID));
      setLastSelectedSiteIndex(null);
    }
    setSelectAllSites(!selectAllSites);
  };

  /**
   * Handles client-site row checkbox selection with shift-click support
   */
  const handleClientSiteSelection = (clientSiteId, index, event) => {
    // If this is the onChange event from a shift-click, skip processing
    if (event?.type === 'change' && clientSiteShiftClickInProgress.current) {
      clientSiteShiftClickInProgress.current = false; // Reset the flag
      return;
    }
  
    // Get the client site record
    const clientSite = siteClients.find(cs => cs.dClientSite_ID === clientSiteId);
    
    // If we're in the DEACTIVATED tab and trying to select an item, check if its parent site is active
    if (clientSiteStatusTab === 'DEACTIVATED') {
      const siteIsDeactivated = deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
      
      if (siteIsDeactivated) {
        // Show the warning and prevent selection
        setDeactivatedSiteName(clientSite.dSiteName);
        setShowSiteDeactivatedWarning(true);
        return; // Don't proceed with selection
      }
    }
    
    if (event?.shiftKey && lastSelectedClientSiteIndex !== null) {
      // Shift-click: select range (only selectable items)
      const startIndex = Math.min(lastSelectedClientSiteIndex, index);
      const endIndex = Math.max(lastSelectedClientSiteIndex, index);
      
      const rangeIds = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (filteredSiteClients[i]) {
          const currentClientSite = filteredSiteClients[i];
          
          // Check if this item is selectable (not belonging to deactivated site if in DEACTIVATED tab)
          let isSelectable = true;
          if (clientSiteStatusTab === 'DEACTIVATED') {
            const siteIsDeactivated = deactivatedSites.some(site => site.dSite_ID === currentClientSite.dSite_ID);
            isSelectable = !siteIsDeactivated;
          }
          
          if (isSelectable) {
            rangeIds.push(currentClientSite.dClientSite_ID);
          }
        }
      }
      
      setSelectedClientSiteIds(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(id => newSelection.add(id));
        const newSelectionArray = Array.from(newSelection);
        
        // Get count of selectable items for comparison
        const selectableItems = filteredSiteClients.filter(clientSite => {
          if (clientSiteStatusTab === 'DEACTIVATED') {
            return !deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
          }
          return true;
        });
        
        // Update "Select All" checkbox state based on selection
        setSelectAllClientSites(newSelectionArray.length === selectableItems.length);
        
        return newSelectionArray;
      });
    } else {
      // Normal click: toggle single selection
      setSelectedClientSiteIds(prev => {
        const newSelection = prev.includes(clientSiteId)
          ? prev.filter(id => id !== clientSiteId)
          : [...prev, clientSiteId];
        
        // Get count of selectable items for comparison
        const selectableItems = filteredSiteClients.filter(clientSite => {
          if (clientSiteStatusTab === 'DEACTIVATED') {
            return !deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
          }
          return true;
        });
        
        // Update "Select All" checkbox state based on selection
        setSelectAllClientSites(newSelection.length === selectableItems.length);
        
        return newSelection;
      });
    }
    
    // Update last selected index for future shift-clicks
    setLastSelectedClientSiteIndex(index);
  };

  /**
   * Handles "select all client sites" checkbox
   */
  const handleSelectAllClientSites = () => {
    if (selectAllClientSites) {
      setSelectedClientSiteIds([]);
      setLastSelectedClientSiteIndex(null);
    } else {
      // Only select IDs of the filtered client-sites currently visible in the table
      // AND skip any assignments belonging to deactivated sites
      const selectableIds = filteredSiteClients
        .filter(clientSite => {
          // If we're in DEACTIVATED tab, check if parent site is also deactivated
          if (clientSiteStatusTab === 'DEACTIVATED') {
            return !deactivatedSites.some(site => site.dSite_ID === clientSite.dSite_ID);
          }
          return true; // If in ACTIVE tab, all are selectable
        })
        .map(clientSite => clientSite.dClientSite_ID);
      
      setSelectedClientSiteIds(selectableIds);
      setLastSelectedClientSiteIndex(null);
    }
    setSelectAllClientSites(!selectAllClientSites);
  };

  /**
   * Bulk deletes selected sites
   */
  const handleBulkDeactivateSites = async () => {
    if (selectedSiteIds.length === 0) return;
    
    // Get the actual site objects for the selected IDs
    const selectedSites = sites.filter(site => selectedSiteIds.includes(site.dSite_ID));
    
    setDeleteType('bulk-sites');
    setItemToDelete({ 
      count: selectedSiteIds.length,
      type: 'sites',
      items: selectedSites
    });
    setShowDeleteModal(true);
  };
  
  /**
   * Fetches LOBs and SubLOBs for a client, filtering already assigned ones
   */
  const fetchClientLobsAndSubLobs = async (clientId) => {
    try {
      if (!clientId || !selectedSite) {
        setClientLobs([]);
        setClientSubLobs([]);
        return;
      }

      const response = await manageSite('getClientLobs', { 
        clientId: clientId.toString(),
        siteId: selectedSite.dSite_ID.toString() // Add the siteId parameter
      });
      const allLobs = response.lobs || [];
      
      // Get client name for comparison
      const clientName = clients.find(c => c.id == clientId)?.name;
      
      // Filter out already assigned SubLOBs but keep all LOBs
      const filteredLobs = allLobs.map(lob => {
        const matchingAssignments = existingAssignments.filter(
          assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
        );
        
        const existingSubLobs = matchingAssignments.map(assignment => assignment.dSubLOB);
        
        return {
          ...lob,
          subLobs: lob.subLobs.filter(subLob => !existingSubLobs.includes(subLob.name))
        };
      });
      // Removed the filter that was excluding LOBs with no available Sub LOBs
  
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

  //Handle Confirm Delete Modal
  const handleConfirmedDelete = async () => {
    try {
      switch (deleteType) {
        case 'site':
          await manageSite('deactivate', { siteId: itemToDelete.id });
          fetchSites();
          fetchSiteClients();
          setSuccessMessage(`Site "${itemToDelete.name}" successfully deactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'bulk-sites':
          await manageSite('bulkDeactivateSites', { siteIds: selectedSiteIds });
          
          // Update state and reset selection
          fetchSites();
          fetchSiteClients();
          setSelectedSiteIds([]);
          setSelectAllSites(false);
          
          setSuccessMessage(`${itemToDelete.count} sites successfully deactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'reactivate-site':
          await manageSite('reactivate', { siteId: itemToDelete.id });
          fetchSites();
          fetchSiteClients();
          setSuccessMessage(`Site "${itemToDelete.name}" successfully reactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'bulk-reactivate-sites':
          await manageSite('bulkReactivateSites', { siteIds: selectedSiteIds });
          
          // Update state and reset selection
          fetchSites();
          fetchSiteClients();
          setSelectedSiteIds([]);
          setSelectAllSites(false);
          
          setSuccessMessage(`${itemToDelete.count} sites successfully reactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
          
        case 'client-site':
          await manageSite('deactivateClientSite', { clientSiteId: itemToDelete.id });
          fetchSiteClients();
          setSuccessMessage(`Client "${itemToDelete.name}" assignment successfully deactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'reactivate-client-site':
          await manageSite('reactivateClientSite', { clientSiteId: itemToDelete.id });
          fetchSiteClients();
          setSuccessMessage(`Client "${itemToDelete.name}" assignment successfully reactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'bulk-deactivate-client-sites':
          await manageSite('bulkDeactivateClientSites', { clientSiteIds: selectedClientSiteIds });
          fetchSiteClients();
          setSelectedClientSiteIds([]);
          setSelectAllClientSites(false);
          setSuccessMessage(`${itemToDelete.count} client-site assignments successfully deactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
  
        case 'bulk-reactivate-client-sites':
          await manageSite('bulkReactivateClientSites', { clientSiteIds: selectedClientSiteIds });
          fetchSiteClients();
          setSelectedClientSiteIds([]);
          setSelectAllClientSites(false);
          setSuccessMessage(`${itemToDelete.count} client-site assignments successfully reactivated`);
          setShowSuccessModal(true);
          // Remove the setTimeout - modal will be closed manually
          break;
      }
    } catch (error) {
      console.error('Error performing operation:', error);
      alert('Error performing operation');
    } finally {
      // Reset modal state
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      setItemToDelete(null);
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
        siteId: siteId
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

  const filteredSites = sortData(
    sites.filter(site => {
      return site.dSiteName.toLowerCase().includes(siteSearchTerm.toLowerCase());
    }),
    siteSortConfig
  );
  
  const filteredSiteClients = sortData(
    siteClients.filter(clientSite => {
      return (
        // Add null checks for all properties before calling toLowerCase()
        (clientSite.dClientName && clientSite.dClientName.toLowerCase().includes(clientSiteSearchTerm.toLowerCase())) ||
        (clientSite.dLOB && clientSite.dLOB.toLowerCase().includes(clientSiteSearchTerm.toLowerCase())) ||
        (clientSite.dSubLOB && clientSite.dSubLOB.toLowerCase().includes(clientSiteSearchTerm.toLowerCase())) ||
        (clientSite.dSiteName && clientSite.dSiteName.toLowerCase().includes(clientSiteSearchTerm.toLowerCase()))
      );
    }),
    clientSiteSortConfig
  );

  /**
   * Updates the cache of which clients are available for a site
   */
  const updateAvailableClientsForSite = async (siteId, passedAssignments = null) => {
    if (!siteId) return;
    
    const assignments = passedAssignments || existingAssignments;
    const availableClients = {};
    
    // Only process clients with valid IDs
    const validClients = clients.filter(client => client && client.id);

    for (const client of clients) {
      availableClients[client.id] = true;
    }
    
    for (const client of clients) {
      try {
        if (!client.id) continue;
        const response = await manageSite('getClientLobs', { 
          clientId: client.id.toString() 
        });
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
            assignment => assignment.dClientName === clientName && assignment.dLOB === lob.name
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
      if (!clientId || !editSelectedSiteId) {
        setEditClientLobs([]);
        setEditClientSubLobs([]);
        return;
      }
      
      const response = await manageSite('getClientLobs', { 
        clientId: clientId.toString(),
        siteId: editSelectedSiteId.toString() // Add the siteId parameter
      });
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
      })
      
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

  // Reusable utility function
  const sanitizeInput = (value) => {
    // First, trim leading spaces
    let trimmedValue = value.trimStart();
    
    // Then apply other sanitization rules
    return trimmedValue.replace(/[^\w\s-]/g, '')  // Remove special characters but allow dashes
                       .replace(/[\r\n\t\f\v]/g, '') // Remove all whitespace except normal spaces
                       .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  // Add handleReactivateSite function
  const handleReactivateSite = async (siteId) => {
    const site = deactivatedSites.find(s => s.dSite_ID === siteId);
    setDeleteType('reactivate-site');
    setItemToDelete({ id: siteId, name: site?.dSiteName || 'Unknown site' });
    setShowDeleteModal(true);
  };

  const handleBulkReactivateSites = async () => {
    if (selectedSiteIds.length === 0) return;
    
    // Get the actual site objects for the selected IDs
    const selectedSites = sites.filter(site => selectedSiteIds.includes(site.dSite_ID));
    
    setDeleteType('bulk-reactivate-sites');
    setItemToDelete({ 
      count: selectedSiteIds.length,
      type: 'sites',
      items: selectedSites
    });
    setShowDeleteModal(true);
  };

  // Add this new useEffect to load available clients when site changes in edit modal
  useEffect(() => {
    const loadAvailableEditClients = async () => {
      if (editSelectedSiteId) {
        try {
          const clients = await getAvailableClients(editSelectedSiteId, currentClientSite?.dClient_ID);
          setAvailableEditClients(clients);
        } catch (error) {
          console.error('Error loading available clients for edit:', error);
          setAvailableEditClients([]);
        }
      } else {
        setAvailableEditClients([]);
      }
    };

    loadAvailableEditClients();
  }, [editSelectedSiteId, currentClientSite]);

  useEffect(() => {
    setSites(siteStatusTab === 'ACTIVE' ? activeSites : deactivatedSites);
    // Reset selection when switching tabs
    setSelectedSiteIds([]);
    setSelectAllSites(false);
    setLastSelectedSiteIndex(null);
  }, [siteStatusTab, activeSites, deactivatedSites]);

  const renderSummaryBox = (message, selectedCount) => {
    // If message contains items to be processed, show them in a table
    if (message && typeof message === 'object' && message.items && Array.isArray(message.items)) {
      return (
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {/* Adjust headers based on the type of items */}
                {message.type === 'sites' && (
                  <>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Site ID</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Site Name</th>
                  </>
                )}
                {(message.type === 'client-sites' || message.type === 'bulk-deactivate-client-sites' || message.type === 'bulk-reactivate-client-sites') && (
                  <>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Client</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>LOB</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Sub LOB</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Site</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {message.items.map((item, index) => (
                <tr key={index} style={{ 
                  borderBottom: index < message.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc'
                }}>
                  {message.type === 'sites' && (
                    <>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.dSite_ID}</td>
                      <td style={{ padding: '8px 12px', color: '#333' }}>{item.dSiteName}</td>
                    </>
                  )}
                  {(message.type === 'client-sites' || message.type === 'bulk-deactivate-client-sites' || message.type === 'bulk-reactivate-client-sites') && (
                    <>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.dClientSite_ID}</td>
                      <td style={{ padding: '8px 12px', color: '#333' }}>{item.dClientName}</td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.dLOB || 'No LOB'}</td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.dSubLOB || 'No Sub LOB'}</td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.dSiteName}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Fallback to text display for other message types
    return message;
  };

  return (
    <div className="site-management-container">
      <div className="white-card">
        <div className="site-management-header">
          <h1>Site Management</h1>
          <p className="subtitle">Manage sites and their clients</p>
        </div>

        <div className="tab-container">
        <div 
          className={`tab ${activeTab === 'addSite' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('addSite');
            // Reset to ACTIVE tab when switching to Add New Site
            setSiteStatusTab('ACTIVE');
            setClientSiteStatusTab('ACTIVE');
          }}
        >
            Add New Site
          </div>
          <div 
            className={`tab ${activeTab === 'addClient' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('addClient');
              setCurrentSite(null);
              // Reset to ACTIVE tab when switching to Add Client to Site
              setSiteStatusTab('ACTIVE');
              setClientSiteStatusTab('ACTIVE');
            }}
          >
            Add Client to Site
          </div>
        </div>
        
        <div className={`tab-content ${activeTab === 'addSite' ? 'active' : ''}`}>
  <div className="site-management-two-column">
    {/* Left Card - Add New Site */}
    <div className="site-management-card">
      <div className="form-row">
        <div className="form-group">
          <label>Site Name</label>
          <input
            type="text"
            ref={addSiteInputRef}
            value={newSiteName}
            onChange={(e) => setNewSiteName(sanitizeInput(e.target.value))}
            maxLength={30}
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
    </div>
    
    {/* Right Card - Existing Sites */}
    <div className="site-management-card">
      <h3>Existing Sites</h3>
      <div className="site-status-tabs">
        <div
          className={`site-status-tab ${siteStatusTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setSiteStatusTab('ACTIVE')}
        >
          Active <span className="tab-count">{activeSites.length}</span>
        </div>
        <div
          className={`site-status-tab ${siteStatusTab === 'DEACTIVATED' ? 'active' : ''}`}
          onClick={() => setSiteStatusTab('DEACTIVATED')}
        >
          Deactivated <span className="tab-count">{deactivatedSites.length}</span>
        </div>
      </div>
      <div className="search-and-bulk-container">
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search sites by name..."
              value={siteSearchTerm}
              onChange={(e) => setSiteSearchTerm(sanitizeInput(e.target.value))}
              maxLength={50}
            />
          </div>
        </div>
        {selectedSiteIds.length > 0 && (
          <div className="bulk-delete-container">
            {siteStatusTab === 'ACTIVE' ? (
              <button onClick={handleBulkDeactivateSites} className="delete-btn bulk-delete-btn">
                <FaMinusCircle size={12} /> Deactivate Selected ({selectedSiteIds.length})
              </button>
            ) : (
              <button onClick={handleBulkReactivateSites} className="reactivate-btn bulk-reactivate-btn">
                <FaPlusCircle size={12} /> Reactivate Selected ({selectedSiteIds.length})
              </button>
            )}
          </div>
        )}
      </div>
      {activeTab === 'addSite' && (
        <div className="table-wrapper">
          {sites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
              No sites found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="site-id-col" onClick={() => handleSiteSort('dSite_ID')} style={{ cursor: 'pointer', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                    Site ID {siteSortConfig.key === 'dSite_ID' ? (siteSortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th className="site-name-col" onClick={() => handleSiteSort('dSiteName')} style={{ cursor: 'pointer', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                    Site Name {siteSortConfig.key === 'dSiteName' ? (siteSortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSiteSort('dCreatedBy')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                    Created By {siteSortConfig.key === 'dCreatedBy' ? (siteSortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSiteSort('tCreatedAt')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                    Created At {siteSortConfig.key === 'tCreatedAt' ? (siteSortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                  </th>
                  <th className="actions-col" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Actions</th>
                  <th className="select-col" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1}}>
                    <div className="select-all-container">
                    <p>Select All</p>
                      <input
                        type="checkbox"
                        checked={selectAllSites}
                        onChange={handleSelectAllSites}
                      />
                      <span className="selected-count">
                        {selectedSiteIds.length > 0 ? `${selectedSiteIds.length}` : ''}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site, index) => (
                  <tr
                    key={site.dSite_ID}
                    className={selectedSiteIds.includes(site.dSite_ID) ? 'selected-row' : ''}
                  >
                    <td>{site.dSite_ID}</td>
                    <td>{site.dSiteName}</td>
                    <td>{site.dCreatedBy || '-'}</td>
                    <td>{site.tCreatedAt ? new Date(site.tCreatedAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(site)} className="edit-btn">
                          <FaEdit size={12} /> Edit
                        </button>
                        {site.dStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => handleDeactivateSite(site.dSite_ID)}
                            className="delete-btn"
                          >
                            <FaMinusCircle size={12} /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateSite(site.dSite_ID)}
                            className="reactivate-btn"
                          >
                            <FaPlusCircle size={12} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSiteIds.includes(site.dSite_ID)}
                        onChange={(event) => handleSiteSelection(site.dSite_ID, index, event)}
                        onMouseDown={(event) => {
                          // Capture the shift key state before the onChange event
                          if (event.shiftKey) {
                            event.preventDefault(); // Prevent default checkbox behavior
                            shiftClickInProgress.current = true; // Set flag to indicate shift-click in progress
                            handleSiteSelection(site.dSite_ID, index, event);
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  </div>
</div>
        
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
  <div className="site-management-two-column">
    {/* Left Card - Client Form */}
    <div className="site-management-card">
      <div className="form-row">
        <div className="form-group">
          <label>Select Site</label>
          <Select
            ref={selectSiteRef}
            value={selectedSite ? { value: selectedSite.dSite_ID, label: selectedSite.dSiteName } : null}
            onChange={async (selectedOption) => {
              try {
                // Handle null case when X button is clicked
                if (!selectedOption) {
                  setSelectedSite(null);
                  setSelectedClientId('');
                  setClientLobs([]);
                  setClientSubLobs([]);
                  setSelectedLobId('');
                  setSelectedSubLobId('');
                  setExistingAssignments([]);
                  return;
                }
                
                // Original logic for when an option is selected
                const site = sites.find(s => s.dSite_ID === selectedOption.value);
                setSelectedSite(site || null);
                setSelectedClientId('');
                setClientLobs([]);
                setClientSubLobs([]);
                setSelectedLobId('');
                setSelectedSubLobId('');
                
                if (site) {
                  const siteId = site.dSite_ID;
                  const response = await manageSite('getExistingAssignments', { 
                    siteId: siteId
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
            onInputChange={(inputValue) => {
              const sanitized = sanitizeInput(inputValue);
              return sanitized.slice(0, 30);
            }}
            options={sites.map(site => ({
              value: site.dSite_ID,
              label: site.dSiteName
            }))}
            isClearable
            placeholder="Select a site"
            isDisabled={false}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>
            
      <div className="form-row">
        <div className="form-group">
          <label>Select Client</label>
          <Select
            ref={selectClientRef}
            value={selectedClientId ? { 
              value: selectedClientId, 
              label: availableClients.find(c => c.id.toString() === selectedClientId.toString())?.name || 
                     clients.find(c => c.id.toString() === selectedClientId.toString())?.name
            } : null}
            onChange={(selectedOption) => {
              const clientId = selectedOption ? selectedOption.value : '';
              setSelectedClientId(clientId);
              
              if (clientId) {
                fetchClientLobsAndSubLobs(clientId);
              } else {
                setClientLobs([]);
                setClientSubLobs([]);
                setSelectedLobId('');
                setSelectedSubLobId('');
              }
            }}
            onInputChange={(inputValue) => {
              const sanitized = sanitizeInput(inputValue);
              return sanitized.slice(0, 50);
            }}
            options={availableClients.map(client => ({
              value: client.id,
              label: client.name
            }))}
            isClearable
            placeholder="Select a client"
            isDisabled={!selectedSite}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '38px',
                height: '38px',
                maxWidth: '100%'
              }),
              valueContainer: (base) => ({
                ...base,
                height: '38px',
                padding: '0 8px',
                maxWidth: 'calc(100% - 30px)',
              }),
              input: (base) => ({
                ...base,
                margin: '0px',
                padding: '0px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }),
              singleValue: (base) => ({
                ...base,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              })
            }}
          />
        </div>
      </div>
          
      <div className="form-row">
        <div className="form-group">
          <label>Select LOB</label>
          <Select
            ref={selectLobRef}
            value={selectedLobId ? { value: selectedLobId, label: clientLobs.find(l => l.id === selectedLobId)?.name } : null}
            onChange={(selectedOption) => {
              const lobId = selectedOption ? selectedOption.value : '';
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
            }}
            onInputChange={(inputValue) => {
              const sanitized = sanitizeInput(inputValue);
              return sanitized.slice(0, 30); // Limit to 50 characters
            }}
            options={clientLobs.map(lob => ({
              value: lob.id,
              label: lob.name
            }))}
            maxLength={30}
            isClearable
            placeholder="Select a LOB"
            noOptionsMessage={() => "No Available LOBs - Add More in Client Mgt."}
            isDisabled={!selectedClientId}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Select Sub LOB</label>
          <Select
            ref={selectSubLobRef}
            value={selectedSubLobId ? { value: selectedSubLobId, label: clientSubLobs.find(s => s.id === selectedSubLobId)?.name } : null}
            onChange={(selectedOption) => {
              setSelectedSubLobId(selectedOption ? selectedOption.value : '');
            }}
            onInputChange={(inputValue) => {
              const sanitized = sanitizeInput(inputValue);
              return sanitized.slice(0, 30); // Limit to 50 characters
            }}
            options={clientSubLobs.map(subLob => ({
              value: subLob.id,
              label: subLob.name
            }))}
            maxLength={30}
            isClearable
            placeholder="Select a Sub LOB"
            noOptionsMessage={() => "No Available Sub LOBs - Add More in Client Mgt."}
            isDisabled={!selectedLobId}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>
          
      <div className="buttons-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '0px', width: '100%' }}>
      <button 
        onClick={handleAddClient} 
        className="add-button equal-width-button"
        disabled={!selectedSite || !selectedClientId}
        style={{ minWidth: '180px', margin: '0 auto' }}
      >
        + Add Client to Site
      </button>
    </div>
    </div>
    
    {/* Right Card - Existing Client-Site Assignments Table */}
    <div className="site-management-card">
      <h3>Existing Client-Site Assignments</h3>

      <div className="site-status-tabs">
        <div
          className={`site-status-tab ${clientSiteStatusTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setClientSiteStatusTab('ACTIVE')}
        >
          Active <span className="tab-count">{activeClientSites.length}</span>
        </div>
        <div
          className={`site-status-tab ${clientSiteStatusTab === 'DEACTIVATED' ? 'active' : ''}`}
          onClick={() => setClientSiteStatusTab('DEACTIVATED')}
        >
          Deactivated <span className="tab-count">{deactivatedClientSites.length}</span>
        </div>
      </div>

      <div className="search-and-bulk-container">
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by client name, LOB, Sub LOB, or site name..."
              value={clientSiteSearchTerm}
              onChange={(e) => setClientSiteSearchTerm(sanitizeInput(e.target.value))}
              maxLength={50}
            />
          </div>
        </div>
        {selectedClientSiteIds.length > 0 && (
          <div className="bulk-delete-container">
            {clientSiteStatusTab === 'ACTIVE' ? (
              <button onClick={handleBulkDeactivateClientSites} className="delete-btn bulk-delete-btn">
                <FaMinusCircle size={12} /> Deactivate Selected ({selectedClientSiteIds.length})
              </button>
            ) : (
              <button onClick={handleBulkReactivateClientSites} className="reactivate-btn bulk-reactivate-btn">
                <FaPlusCircle size={12} /> Reactivate Selected ({selectedClientSiteIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="table-wrapper">
        {siteClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
            No client-site assignments found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleClientSiteSort('dClientSite_ID')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Client Site ID {clientSiteSortConfig.key === 'dClientSite_ID' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('dClientName')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Client Name {clientSiteSortConfig.key === 'dClientName' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('dLOB')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  LOB {clientSiteSortConfig.key === 'dLOB' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('dSubLOB')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Sub LOB {clientSiteSortConfig.key === 'dSubLOB' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('dSiteName')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Site Name {clientSiteSortConfig.key === 'dSiteName' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('dCreatedBy')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Created By {clientSiteSortConfig.key === 'dCreatedBy' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleClientSiteSort('tCreatedAt')} className="sortable-header" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                  Created At {clientSiteSortConfig.key === 'tCreatedAt' && (clientSiteSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th className="actions-col" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Actions</th>
                <th className="select-col" style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1, marginLeft: 10 }}>
                  <div className="select-all-container">
                    <p>Select All</p>
                    <input
                      type="checkbox"
                      checked={selectAllClientSites}
                      onChange={handleSelectAllClientSites}
                    />
                    <span className="selected-count">
                      {selectedClientSiteIds.length > 0 ? `${selectedClientSiteIds.length}` : ''}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSiteClients.map((clientSite, index) => (
                <tr 
                  key={clientSite.dClientSite_ID}
                  className={selectedClientSiteIds.includes(clientSite.dClientSite_ID) ? 'selected-row' : ''}
                >
                  <td>{clientSite.dClientSite_ID}</td>
                  <td>{clientSite.dClientName}</td>
                  <td>{clientSite.dLOB || '-'}</td>
                  <td>{clientSite.dSubLOB || '-'}</td>
                  <td>{clientSite.dSiteName}</td>
                  <td>{clientSite.dCreatedBy || '-'}</td>
                  <td>{clientSite.tCreatedAt ? new Date(clientSite.tCreatedAt).toLocaleString() : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      {clientSiteStatusTab === 'ACTIVE' ? (
                        <button
                          onClick={() => handleDeactivateClientSite(clientSite.dClientSite_ID)}
                          className="delete-btn"
                        >
                          <FaMinusCircle size={12} /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateClientSite(clientSite.dClientSite_ID)}
                          className="reactivate-btn"
                        >
                          <FaPlusCircle size={12} /> Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedClientSiteIds.includes(clientSite.dClientSite_ID)}
                      onChange={(event) => handleClientSiteSelection(clientSite.dClientSite_ID, index, event)}
                      onMouseDown={(event) => {
                        // Capture the shift key state before the onChange event
                        if (event.shiftKey) {
                          event.preventDefault(); // Prevent default checkbox behavior
                          clientSiteShiftClickInProgress.current = true; // Set flag to indicate shift-click in progress
                          handleClientSiteSelection(clientSite.dClientSite_ID, index, event);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
</div>
      </div>

      {/* Edit Site Modal */}
      {editModalOpen && currentSite && (
        <div className="modal-overlay">
          <div className="modal edit-site-modal">
            <div className="modal-header">
              <h2>Edit Site</h2>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  ref={editSiteInputRef}
                  value={currentSite.name}
                  onChange={(e) => setCurrentSite({...currentSite, name: sanitizeInput(e.target.value)})}
                  required
                  maxLength={30}
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
                style={{ 
                  backgroundColor: !currentSite.name?.trim() ? '#cccccc' : '#004D8D',
                  cursor: !currentSite.name?.trim() ? 'not-allowed' : 'pointer'
                }}
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
                <Select
                  value={editSelectedSiteId ? { value: editSelectedSiteId, label: sites.find(s => s.dSite_ID === parseInt(editSelectedSiteId))?.dSiteName } : null}
                  onChange={(selectedOption) => {
                    const newSiteId = selectedOption ? selectedOption.value.toString() : '';
                    setEditSelectedSiteId(newSiteId);
                    
                    // Reset other selections when site changes
                    setEditSelectedClientId('');
                    setEditSelectedLobId('');
                    setEditSelectedSubLobId('');
                    setEditClientLobs([]);
                    setEditClientSubLobs([]);
                    
                    if (newSiteId) {
                      fetchExistingAssignments(newSiteId);
                    }
                  }}
                  onInputChange={(inputValue) => sanitizeInput(inputValue)}
                  options={sites.map(site => ({
                    value: site.dSite_ID,
                    label: site.dSiteName
                  }))}
                  isClearable
                  placeholder="Select a site"
                  className={`react-select-container ${!editSelectedSiteId ? "validation-error" : ""}`}
                  classNamePrefix="react-select"
                />
                {!editSelectedSiteId && <div className="error-message">Site is required</div>}
              </div>
              
              <div className="form-group">
                <label>Select Client <span className="required-field">*</span></label>
                <Select
                  value={editSelectedClientId ? {
                    value: editSelectedClientId,
                    label: currentClientSite?.dClientName || 
                           availableEditClients.find(c => c.id.toString() === editSelectedClientId)?.name || 
                           clients.find(c => c.id.toString() === editSelectedClientId)?.name
                  } : null}
                  onChange={(selectedOption) => {
                    const clientId = selectedOption ? selectedOption.value.toString() : '';
                    setEditSelectedClientId(clientId);
                    resetEditSelection();
                    
                    if (clientId) {
                      fetchClientLobsForEdit(clientId);
                    } else {
                      setEditClientLobs([]);
                    }
                  }}
                  onInputChange={(inputValue) => sanitizeInput(inputValue)}
                  options={[
                    // First ensure we have the current client in the list
                    ...(currentClientSite ? [{
                      value: currentClientSite.dClient_ID.toString(),
                      label: currentClientSite.dClientName
                    }] : []),
                    // Then add other available clients
                    ...availableEditClients
                      .filter(client => !currentClientSite || client.id.toString() !== currentClientSite.dClient_ID.toString())
                      .map(client => ({
                        value: client.id.toString(),
                        label: client.name
                      }))
                  ]}
                  isClearable
                  placeholder="Select a client"
                  className={`react-select-container ${!editSelectedClientId ? "validation-error" : ""}`}
                  classNamePrefix="react-select"
                />
                {!editSelectedClientId && <div className="error-message">Client is required</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Select LOB</label>
                <Select
                  value={editSelectedLobId ? { value: editSelectedLobId, label: editClientLobs.find(l => l.id === editSelectedLobId)?.name } : null}
                  onChange={(selectedOption) => {
                    const lobId = selectedOption ? selectedOption.value : '';
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
                  }}
                  onInputChange={(inputValue) => sanitizeInput(inputValue)}
                  options={editClientLobs.map(lob => ({
                    value: lob.id,
                    label: lob.name
                  }))}
                  isClearable
                  placeholder="Select a LOB"
                  noOptionsMessage={() => "No LOBs - Add More in Client Mgt."}
                  isDisabled={!editSelectedClientId}
                  className={`react-select-container ${editSelectedClientId && !editSelectedLobId && editClientLobs.length > 0 ? "validation-warning" : ""}`}
                  classNamePrefix="react-select"
                />
              </div>
              
              <div className="form-group">
                <label>Select Sub LOB</label>
                <Select
                  value={editSelectedSubLobId ? { value: editSelectedSubLobId, label: editClientSubLobs.find(s => s.id === editSelectedSubLobId)?.name } : null}
                  onChange={(selectedOption) => {
                    setEditSelectedSubLobId(selectedOption ? selectedOption.value : '');
                  }}
                  onInputChange={(inputValue) => sanitizeInput(inputValue)}
                  options={editClientSubLobs.map(subLob => ({
                    value: subLob.id,
                    label: subLob.name
                  }))}
                  isClearable
                  placeholder="Select a Sub LOB"
                  noOptionsMessage={() => "No Sub LOBs - Add More in Client Mgt."}
                  isDisabled={!editSelectedLobId}
                  className={`react-select-container ${editSelectedLobId && !editSelectedSubLobId && editClientSubLobs.length > 0 ? "validation-warning" : ""}`}
                  classNamePrefix="react-select"
                />
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

      {/* Edit Site Confirmation Modal */}
      {showEditSiteConfirmModal && siteBeingEdited && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '450px' }}>
          <div className="modal-header">
            <h2>Confirm Edit Site</h2>
            <button onClick={() => setShowEditSiteConfirmModal(false)} className="close-btn">
              <FaTimes />
            </button>
          </div>
          <div className="modal-content">
            <p>Are you sure you want to update this site?</p>
            <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
              <li><strong>Original name:</strong> {siteBeingEdited.originalName}</li>
              <li><strong>New name:</strong> {siteBeingEdited.name}</li>
            </ul>
            <p className="warning-text" style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '15px' }}>
              <strong>Note:</strong> This will update the site name and generate a new site ID based on the new name. 
              All associated client-site relationships will be updated accordingly.
            </p>
          </div>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="cancel-btn" onClick={() => setShowEditSiteConfirmModal(false)}>Cancel</button>
            <button
              className="save-btn"
              onClick={confirmSaveSite}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className={`modal ${deleteType.includes('reactivate') ? 'reactivate-confirmation-modal' : 'delete-confirmation-modal'}`} 
            style={{ 
              maxWidth: deleteType.includes('client-site') ? "400px" : "300px",
              borderTop: "none"
            }}
          >
            <div className="modal-header">
              <h2>          
                {deleteType.includes('reactivate') ? (
                <><FaPlusCircle className="reactivation-icon" /> Confirm Reactivation</>
              ) : (
                <><FaMinusCircle /> Confirm Deactivation</>
              )}
            </h2>
            </div>
            
            {deleteType === 'site' && (
              <p>
                You are about to deactivate site "<strong>{itemToDelete?.name}</strong>".
                <br />This will hide it from the sites list but preserve its data.
              </p>
            )}
            {deleteType === 'client' && (
              <p>
                You are about to remove client "<strong>{itemToDelete?.name}</strong>" from this site.
                <br />This action cannot be undone.
              </p>
            )}
            {deleteType === 'bulk-sites' && (
              <>
                <p>
                  You are about to deactivate <strong>{itemToDelete?.count} selected sites</strong>.
                  <br />This will hide them from the sites list but preserve their data.
                </p>
                {itemToDelete?.items && (
                  <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '13px 14px', fontSize: 14, color: '#333', marginBottom: 16 }}>
                    {renderSummaryBox(itemToDelete)}
                  </div>
                )}
              </>
            )}
            {deleteType === 'bulk-clients' && (
              <p>
                You are about to delete <strong>{itemToDelete?.count} selected client-site assignments</strong>.
                <br />This action cannot be undone.
              </p>
            )}
            {deleteType === 'reactivate-site' && (
              <p>
                You are about to reactivate site "<strong>{itemToDelete?.name}</strong>".
                <br />This will make it visible in the active sites list.
              </p>
            )}

            {deleteType === 'bulk-reactivate-sites' && (
            <>
              <p>
                You are about to reactivate <strong>{itemToDelete?.count} selected sites</strong>.
                <br />This will make them visible in the active sites list.
              </p>
              {itemToDelete?.items && (
                <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '13px 14px', fontSize: 14, color: '#333', marginBottom: 16 }}>
                  {renderSummaryBox(itemToDelete)}
                </div>
              )}
            </>
          )}

            {deleteType === 'client-site' && (
              <p>
                You are about to deactivate client "<strong>{itemToDelete?.name}</strong>" assignment.
                <br />This will hide it from the active client-site assignments list but preserve its data.
              </p>
            )}
            {deleteType === 'reactivate-client-site' && (
              <p>
                You are about to reactivate client "<strong>{itemToDelete?.name}</strong>" assignment.
                <br />This will make it visible in the active client-site assignments list.
              </p>
            )}
            {deleteType === 'bulk-deactivate-client-sites' && (
              <>
                <p>
                  You are about to deactivate <strong>{itemToDelete?.count} selected client-site assignments</strong>.
                  <br />This will hide them from the active client-site assignments list but preserve their data.
                </p>
                {itemToDelete?.items && (
                  <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '13px 14px', fontSize: 14, color: '#333', marginBottom: 16 }}>
                    {renderSummaryBox(itemToDelete)}
                  </div>
                )}
              </>
            )}
              {deleteType === 'bulk-reactivate-client-sites' && (
                <>
                  <p>
                    You are about to reactivate <strong>{itemToDelete?.count} selected client-site assignments</strong>.
                    <br />This will make them visible in the active client-site assignments list.
                  </p>
                  {itemToDelete?.items && (
                    <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '13px 14px', fontSize: 14, color: '#333', marginBottom: 16 }}>
                      {renderSummaryBox(itemToDelete)}
                    </div>
                  )}
                </>
              )}
            
            <div className="confirmation-input" style={{ textAlign: "center" }}>
              <p style={{ textAlign: "center", marginBottom: "15px" }}>Type <strong>CONFIRM</strong> to proceed:</p>
              <input
                type="text"
                ref={deleteConfirmInputRef}
                value={deleteConfirmText}
                onChange={(e) => {
                  // Allow normal text input without forcing uppercase
                  const value = e.target.value;
                  // Only allow letters and spaces
                  const sanitized = value.replace(/[^A-Za-z\s]/g, '');
                  setDeleteConfirmText(sanitized);
                }}
                placeholder="CONFIRM"
                className="confirmation-input-field"
                maxLength={7}
                style={{ 
                  marginBottom: "20px",
                  textAlign: "center",
                  width: "120px"
                }}
              />
            </div>
            
            <div className="modal-actions" style={{ display: "flex", justifyContent: "space-between" }}>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }} 
                className="cancel-btn"
                style={{
                  flex: "1",
                  maxWidth: "45%",
                  margin: "0 5px",
                  fontSize: "15px",
                  textAlign: "center"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmedDelete} 
                className={deleteType.includes('reactivate') ? "save-btn" : "delete-btn"}
                disabled={deleteConfirmText !== 'CONFIRM'}
                style={{ 
                  border: "none",
                  flex: "1",
                  maxWidth: "45%",
                  margin: "0 5px",
                  fontSize: "15px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                {deleteType.includes('reactivate') ? (
                  <><FaPlusCircle style={{ marginRight: "5px" }} /> Reactivate</>
                ) : (
                  <><FaMinusCircle style={{ marginRight: "5px" }} /> Deactivate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSiteConfirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Add Site</h2>
            </div>
            <p>Are you sure you want to add site "{newSiteName}"?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => setShowAddSiteConfirmModal(false)}>No</button>
              <button
                className="save-btn"
                onClick={confirmAddSite}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

        {showAddClientSiteConfirmModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ width: '450px' }}>
              <div className="modal-header">
                <h2>Confirm Add Client to Site</h2>
              </div>
                <p>Are you sure you want to add:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                  <li><strong>Client:</strong> {clientSiteConfirmDetails.clientName || 'No client name found'}</li>
                  {clientSiteConfirmDetails.lobName && (
                    <li><strong>LOB:</strong> {clientSiteConfirmDetails.lobName}</li>
                  )}
                  {clientSiteConfirmDetails.subLobName && (
                    <li><strong>Sub LOB:</strong> {clientSiteConfirmDetails.subLobName}</li>
                  )}
                  <li><strong>To site:</strong> {selectedSite?.dSiteName}</li>
                </ul>
                {!clientSiteConfirmDetails.lobName && (
                  <p className="warning-text" style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '15px' }}>
                    <strong>Note:</strong> All available LOBs and Sub LOBs will be added to the site.
                  </p>
                )}
                {clientSiteConfirmDetails.lobName && !clientSiteConfirmDetails.subLobName && (
                  <p className="warning-text" style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '15px' }}>
                    <strong>Note:</strong> All available Sub LOBs will be added to the site.
                  </p>
                )}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="cancel-btn" onClick={() => setShowAddClientSiteConfirmModal(false)}>No</button>
                <button
                  className="save-btn"
                  onClick={confirmAddClient}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Success Message Modal */}
      {showSuccessModal && (
      <div className="modal-overlay">
        <div className="modal success-modal">
          <div className="modal-header">
            <h2>
              <span className="success-icon">✓</span>
              Operation Successful
            </h2>
          </div>
          <p>
            {successMessage}
          </p>
          <div className="modal-actions">
            <button
              className="save-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Error Message Modal */}
    {showErrorModal && (
      <div className="success-toast" style={{
        ...slideInOut, 
        backgroundColor: '#fff5f5',
        borderLeft: '4px solid #e53e3e'
      }}>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ 
            color: '#e53e3e', 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '14px',
            margin: 0
          }}>
            <span style={{ marginRight: '10px', fontSize: '18px' }}>⚠</span>
            {errorMessage}
          </p>
        </div>
      </div>
    )}

    {/* Duplicate Site Error Modal */}
      {showDuplicateSiteModal && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '400px' }}>
          <div className="modal-header">
            <h2>Site Already Exists</h2>
          </div>
            <p>The site "{duplicateSiteName}" has already been added to the database.</p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="save-btn"
              onClick={() => setShowDuplicateSiteModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Client Already Added Modal */}
    {showClientAlreadyAddedModal && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '450px' }}>
          <div className="modal-header">
            <h2>Client Already Added</h2>
          </div>
          <p>Client "{alreadyAddedClientName}" and all its contents have already been added to the site "{selectedSite?.dSiteName}".</p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="save-btn"
              onClick={() => setShowClientAlreadyAddedModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

        {/* Client Add Success Modal */}
        {showClientAddSuccessModal && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="modal-header">
              <h2>
                <span className="success-icon">✓</span>
                Client Added Successfully
              </h2>
            </div>
            <p>
              Client "<strong>{clientAddSuccessDetails.clientName}</strong>" has been successfully added to 
              site "<strong>{clientAddSuccessDetails.siteName}</strong>".
            </p>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>What was added:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', textAlign: 'left' }}>
                <li><strong>Client:</strong> {clientAddSuccessDetails.clientName}</li>
                
                {clientAddSuccessDetails.addedAllLobs ? (
                  <li><strong>LOBs:</strong> All available LOBs and their Sub LOBs</li>
                ) : (
                  <>
                    <li><strong>LOB:</strong> {clientAddSuccessDetails.lobName}</li>
                    {clientAddSuccessDetails.addedAllSubLobs ? (
                      <li><strong>Sub LOBs:</strong> All available Sub LOBs for "{clientAddSuccessDetails.lobName}"</li>
                    ) : (
                      <li><strong>Sub LOB:</strong> {clientAddSuccessDetails.subLobName}</li>
                    )}
                  </>
                )}
              </ul>
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="save-btn"
                onClick={() => setShowClientAddSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Edit Site Error Modal */}
    {showEditErrorModal && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '400px' }}>
          <div className="modal-header">
            <h2>Edit Unsuccessful</h2>
          </div>
          <p>The site "{siteBeingEdited?.name}" already exists in the database.</p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="save-btn"
              onClick={() => setShowEditErrorModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Site Success Modal */}
    {showEditSuccessModal && (
    <div className="modal-overlay">
      <div className="modal success-modal">
        <div className="modal-header">
          <h2>
            <span className="success-icon">✓</span>
            Site Updated Successfully
          </h2>
        </div>
        <p>
          Site has been successfully updated:
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '15px', textAlign: 'left' }}>
          <li><strong>Name:</strong> "{siteBeingEdited?.originalName}" → "{siteBeingEdited?.name}"</li>
          {siteBeingEdited?.newSiteId && siteBeingEdited?.newSiteId !== (siteBeingEdited?.id || siteBeingEdited?.dSite_ID) && (
            <li><strong>Site ID:</strong> "{siteBeingEdited?.id || siteBeingEdited?.dSite_ID}" → "{siteBeingEdited?.newSiteId}"</li>
          )}
        </ul>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="save-btn"
            onClick={() => {
              setShowEditSuccessModal(false);
              setEditModalOpen(false);
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )}

    {/* Site Deactivated Warning Modal */}
    {showSiteDeactivatedWarning && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '450px' }}>
          <div className="modal-header">
            <h2>Site is Deactivated</h2>
          </div>
          <p>
            {deactivatedSiteName ? 
              `Site "${deactivatedSiteName}" is currently deactivated. Reactivate Site first to select.` : 
              "The parent site is currently deactivated. You need to reactivate the site before reactivating client assignments."}
          </p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="save-btn"
              onClick={() => setShowSiteDeactivatedWarning(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default SiteManagement;