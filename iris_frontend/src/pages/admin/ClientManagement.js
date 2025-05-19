import React, { useState, useEffect } from 'react';
import './ClientManagement.css';
import { FaTrash, FaSearch, FaTimes, FaPencilAlt } from 'react-icons/fa';
import axios from 'axios';

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('addClient');
  const [clients, setClients] = useState([]);
  const [lobs, setLobs] = useState([]);
  const [subLobs, setSubLobs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for Add Client tab
  const [clientName, setClientName] = useState('');
  const [lobCards, setLobCards] = useState([
    { lobName: '', subLobNames: [''] }
  ]);

  // Form states for Add LOB tab
  const [selectedClientForLob, setSelectedClientForLob] = useState(null);
  const [selectedSiteForLob, setSelectedSiteForLob] = useState(null);
  const [lobCardsForLob, setLobCardsForLob] = useState([
    { lobName: '', subLobNames: [''] }
  ]);

  // Form states for Add Sub LOB tab
  const [subLobNames, setSubLobNames] = useState(['']);
  const [selectedLobForSubLob, setSelectedLobForSubLob] = useState(null);
  const [filterClientForSubLob, setFilterClientForSubLob] = useState(null);
  const [filterSiteForSubLob, setFilterSiteForSubLob] = useState(null);
  const [filteredLobs, setFilteredLobs] = useState([]);

  // Table view states
  const [activeTableTab, setActiveTableTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  // Filter LOBs based on selected client and site
  useEffect(() => {
    let filtered = [...lobs];
    
    if (filterClientForSubLob) {
      filtered = filtered.filter(lob => lob.clientId === filterClientForSubLob);
    }
    if (filterSiteForSubLob) {
      filtered = filtered.filter(lob => lob.siteId === filterSiteForSubLob);
    }
    setFilteredLobs(filtered);
    
    if (selectedLobForSubLob && !filtered.find(lob => lob.id === selectedLobForSubLob)) {
      setSelectedLobForSubLob(null);
    }
  }, [filterClientForSubLob, filterSiteForSubLob, lobs, selectedLobForSubLob]);

  // Add this useEffect to filter sites based on selected client
  useEffect(() => {
    if (!filterClientForSubLob) {
      return;
    }
    
    const clientLobs = lobs.filter(lob => lob.clientId === filterClientForSubLob);
    const clientSiteIds = new Set();
    
    clientLobs.forEach(lob => {
      if (lob.sites && lob.sites.length > 0) {
        lob.sites.forEach(site => {
          if (site.siteId) {
            clientSiteIds.add(site.siteId);
          }
        });
      } else if (lob.siteId) {
        clientSiteIds.add(lob.siteId);
      }
  });
  
  if (filterSiteForSubLob && !clientSiteIds.has(filterSiteForSubLob)) {
    setFilterSiteForSubLob(null);
  }
}, [filterClientForSubLob, lobs]);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/clients/getAll');
        
        if (response.data && response.data.data) {
          console.log('Client data from API:', response.data.data);
          
          const transformedClients = [];
          const transformedLobs = [];
          const transformedSubLobs = [];
          const sitesMap = new Map();
          let lobId = 0;
          let subLobId = 0;
          
          response.data.data.forEach((client, clientIndex) => {
            const clientId = client.clientId; 
            transformedClients.push({
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
            
            if (client.LOBs && Array.isArray(client.LOBs)) {
              client.LOBs.forEach(lob => {
                lobId++;
                
                // Extract site info from LOB
                if (lob.sites && Array.isArray(lob.sites)) {
                  // Handle multiple sites per LOB
                  lob.sites.forEach(site => {
                    if (site.siteId && site.siteName) {
                      sitesMap.set(site.siteId, {
                        id: site.siteId,
                        name: site.siteName
                      });
                    }
                  });
                } else if (lob.siteId && lob.siteName) {
                  // Backward compatibility for single site
                  sitesMap.set(lob.siteId, {
                    id: lob.siteId,
                    name: lob.siteName
                  });
                }
                
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId,
                  siteId: lob.siteId || null,
                  siteName: lob.siteName || null,
                  sites: lob.sites || [] // Store all sites for this LOB
                });
                
                if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                  lob.subLOBs.forEach(subLobName => {
                    subLobId++;
                    transformedSubLobs.push({
                      id: subLobId,
                      name: subLobName,
                      lobId: lobId
                    });
                  });
                }
              });
            }
          });
          
          setClients(transformedClients);
          setLobs(transformedLobs);
          setSubLobs(transformedSubLobs);
          
          // Set sites from collected site data
          const transformedSites = Array.from(sitesMap.values());
          setSites(transformedSites.length > 0 ? transformedSites : [
            { id: 1, name: 'Site A' },
            { id: 2, name: 'Site B' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
  }, []);

  const renderLobOptions = () => {
    const options = [];
    
    // Add default option
    options.push(<option key="default" value="">Select a LOB</option>);
    
    // Filter lobs based on selected client and site
    let filteredLobOptions = [...lobs];
    
    if (filterClientForSubLob) {
      filteredLobOptions = filteredLobOptions.filter(lob => lob.clientId === filterClientForSubLob);
    }
    
    // Create a map to track unique LOB-site combinations
    const uniqueOptions = new Map();
    
    // For each LOB, create options that include site information
    filteredLobOptions.forEach(lob => {
      // Check if the LOB has multiple sites
      if (lob.sites && lob.sites.length > 0) {
        // If a site filter is applied, only show options for that site
        if (filterSiteForSubLob) {
          // Filter sites to only include the selected site
          const matchingSites = lob.sites.filter(site => site.siteId === filterSiteForSubLob);
          
          // If this LOB has the selected site, create an option for it
          if (matchingSites.length > 0) {
            // Only add one option per LOB-site combination
            const site = matchingSites[0]; // Take the first matching site
            const key = `${lob.id}-${site.siteId}`;
            
            if (!uniqueOptions.has(key)) {
              uniqueOptions.set(key, {
                key: key,
                value: lob.id,
                label: `${lob.name} (Client: ${clients.find(c => c.id === lob.clientId)?.name}, Site: ${site.siteName})`
              });
            }
          }
        } else {
          // No site filter, show all sites for this LOB
          lob.sites.forEach(site => {
            const key = `${lob.id}-${site.siteId}`;
            
            if (!uniqueOptions.has(key)) {
              uniqueOptions.set(key, {
                key: key,
                value: lob.id,
                label: `${lob.name} (Client: ${clients.find(c => c.id === lob.clientId)?.name}, Site: ${site.siteName})`
              });
            }
          });
        }
      } else if (!filterSiteForSubLob || lob.siteId === filterSiteForSubLob) {
        // Fallback for LOBs without sites array or with empty sites array
        // Only show if no site filter or if the LOB's siteId matches the filter
        const key = `${lob.id}-single`;
        
        if (!uniqueOptions.has(key)) {
          uniqueOptions.set(key, {
            key: key,
            value: lob.id,
            label: `${lob.name} (Client: ${clients.find(c => c.id === lob.clientId)?.name}${lob.siteName ? `, Site: ${lob.siteName}` : ''})`
          });
        }
      }
    });
    
    // Convert the map values to option elements
    uniqueOptions.forEach(option => {
      options.push(
        <option key={option.key} value={option.value}>
          {option.label}
        </option>
      );
    });
    
    return options;
  };
  
  // Handle adding a new client
  const handleAddClient = async () => {
    if (clientName.trim() && lobCards.some(card => card.lobName.trim())) {
      try {
        // Prepare data for API
        const clientData = {
          clientName: clientName.trim(),
          LOBs: []
        };
        
        // Add LOBs and SubLOBs
        lobCards.forEach(card => {
          if (card.lobName.trim()) {
            const lob = {
              name: card.lobName.trim(),
              subLOBs: []
            };
            
            // Add SubLOBs
            card.subLobNames.forEach(subLobName => {
              if (subLobName.trim()) {
                lob.subLOBs.push(subLobName.trim());
              }
            });
            
            // Only add LOB if it has at least one SubLOB
            if (lob.subLOBs.length > 0) {
              clientData.LOBs.push(lob);
            }
          }
        });
        
        console.log('Sending client data:', clientData);
        
        // Send data to API
        const response = await axios.post('http://localhost:3000/api/clients/add', clientData);
        console.log('Client added:', response.data);
        
        // Refresh client data
        const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
        
        // Update state with new data using the same transformation logic
        // (you could extract this to a reusable function)
        if (refreshResponse.data && refreshResponse.data.data) {
          // Same transformation logic as in the useEffect
          const transformedClients = [];
          const transformedLobs = [];
          const transformedSubLobs = [];
          const sitesMap = new Map();
          let lobId = 0;
          let subLobId = 0;
          
          refreshResponse.data.data.forEach((client) => {
            // Use the actual client ID from the database
            const clientId = client.clientId; 
            
            transformedClients.push({
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
            
            if (client.LOBs && Array.isArray(client.LOBs)) {
              client.LOBs.forEach(lob => {
                lobId++;
                
                // Extract site info if available
                if (lob.sites && Array.isArray(lob.sites)) {
                  lob.sites.forEach(site => {
                    if (site.siteId && site.siteName) {
                      sitesMap.set(site.siteId, {
                        id: site.siteId,
                        name: site.siteName
                      });
                    }
                  });
                }
                
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId,
                  siteId: lob.siteId || 1,
                  sites: lob.sites || []
                });
                
                if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                  lob.subLOBs.forEach(subLobName => {
                    subLobId++;
                    transformedSubLobs.push({
                      id: subLobId,
                      name: subLobName,
                      lobId: lobId
                    });
                  });
                }
              });
            }
          });
          
          setClients(transformedClients);
          setLobs(transformedLobs);
          setSubLobs(transformedSubLobs);
          
          // Update sites if available
          if (sitesMap.size > 0) {
            setSites(Array.from(sitesMap.values()));
          }
        }
        
        // Reset form
        setClientName('');
        setLobCards([{ lobName: '', subLobNames: [''] }]);
        
        // Show success message
        alert('Client added successfully!');
      } catch (error) {
        console.error('Error adding client:', error);
        alert(`Failed to add client: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleAddLob = async () => {
    if (selectedClientForLob && lobCardsForLob.some(card => card.lobName.trim())) {
      try {
        // Get the client name from the selected client ID
        const client = clients.find(c => c.id === selectedClientForLob);
        if (!client) {
          alert('Selected client not found');
          return;
        }
  
        // Process each LOB card
        for (const card of lobCardsForLob) {
          if (card.lobName.trim()) {
            // Check if there's at least one SubLOB name
            const hasSubLobs = card.subLobNames.some(name => name.trim());
            
            // Prepare data for API
            const lobData = {
              clientName: client.name,
              lobName: card.lobName.trim(),
              // Only include siteId if a site is selected
              ...(selectedSiteForLob && { siteId: selectedSiteForLob }),
              // Include the first SubLOB name if available
              ...(hasSubLobs && { subLOBName: card.subLobNames.find(name => name.trim()) })
            };
            
            console.log('Sending LOB data:', lobData);
            
            // Send data to API
            const response = await axios.post('http://localhost:3000/api/clients/lob/add', lobData);
            console.log('LOB added:', response.data);
            
            // If the LOB has additional Sub LOBs (beyond the first one), add them
            if (card.subLobNames.length > 1) {
              // Skip the first SubLOB since it was already added with the LOB
              const additionalSubLobs = card.subLobNames.slice(1);
              
              for (const subLobName of additionalSubLobs) {
                if (subLobName.trim()) {
                  const subLobData = {
                    clientName: client.name,
                    lobName: card.lobName.trim(),
                    subLOBName: subLobName.trim()
                  };
                  
                  await axios.post('http://localhost:3000/api/clients/sublob/add', subLobData);
                }
              }
            }
          }
        }
        
        // Refresh client data
        const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
        
        // Update state with new data
        if (refreshResponse.data && refreshResponse.data.data) {
          // Transform API data (same as in useEffect)
          const transformedClients = [];
          const transformedLobs = [];
          const transformedSubLobs = [];
          const sitesMap = new Map(); // Add this to collect site data
          let lobId = 0;
          let subLobId = 0;
          
          refreshResponse.data.data.forEach((client, clientIndex) => {
            const clientId = client.clientId; // Use clientId from API response
            transformedClients.push({
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
            
            if (client.LOBs && Array.isArray(client.LOBs)) {
              client.LOBs.forEach(lob => {
                lobId++;
                
                // Extract site info from LOB
                if (lob.sites && Array.isArray(lob.sites)) {
                  // Handle multiple sites per LOB
                  lob.sites.forEach(site => {
                    if (site.siteId && site.siteName) {
                      sitesMap.set(site.siteId, {
                        id: site.siteId,
                        name: site.siteName
                      });
                    }
                  });
                } else if (lob.siteId && lob.siteName) {
                  // Backward compatibility for single site
                  sitesMap.set(lob.siteId, {
                    id: lob.siteId,
                    name: lob.siteName
                  });
                }
                
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId,
                  siteId: lob.siteId || null,
                  siteName: lob.siteName || null,
                  sites: lob.sites || [] // Store all sites for this LOB
                });
                
                if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                  lob.subLOBs.forEach(subLobName => {
                    subLobId++;
                    transformedSubLobs.push({
                      id: subLobId,
                      name: subLobName,
                      lobId: lobId
                    });
                  });
                }
              });
            }
          });
          
          setClients(transformedClients);
          setLobs(transformedLobs);
          setSubLobs(transformedSubLobs);
          
          // Update sites if new ones were found
          const transformedSites = Array.from(sitesMap.values());
          if (transformedSites.length > 0) {
            setSites(transformedSites);
          }
        }
        
        // Reset form
        setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
        setSelectedClientForLob(null);
        setSelectedSiteForLob(null);
        
        alert('LOBs added successfully!');
      } catch (error) {
        console.error('Error adding LOB:', error);
        alert(`Failed to add LOB: ${error.response?.data?.error || error.message}`);
      }
    } else {
      // Validation feedback
      if (!selectedClientForLob) {
        alert('Please select a client');
      } else {
        alert('Please enter at least one LOB name');
      }
    }
  };
    
    // Handle adding a new Sub LOB
const handleAddSubLob = async () => {
  if (!selectedLobForSubLob) {
    alert('Please select a LOB');
    return;
  }
  
  const validSubLobs = subLobNames.filter(name => name.trim());
  
  if (validSubLobs.length === 0) {
    alert('Please enter at least one valid Sub LOB name');
    return;
  }
  
  try {
    // Get the LOB and client objects by ID
    const lob = lobs.find(l => l.id === selectedLobForSubLob);
    if (!lob) {
      alert('Selected LOB not found');
      return;
    }
    
    const client = clients.find(c => c.id === lob.clientId);
    if (!client) {
      alert('Client for selected LOB not found');
      return;
    }
    
    // Process each Sub LOB name
    for (const subLobName of subLobNames) {
      if (subLobName.trim()) {
        try {
          // Call API to add Sub LOB
          const response = await axios.post('http://localhost:3000/api/clients/sublob/add', {
            clientName: client.name,
            lobName: lob.name,
            subLOBName: subLobName.trim()
          });
          console.log('Sub LOB added:', response.data);
        } catch (error) {
          console.error('Error adding Sub LOB:', error);
          alert(`Failed to add Sub LOB "${subLobName.trim()}": ${error.response?.data?.error || error.message}`);
        }
      }
    }
    
    // Refresh client data to get updated SubLOBs
    try {
      const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
      if (refreshResponse.data && refreshResponse.data.data) {
        // Transform API data (same as in useEffect)
        const transformedClients = [];
        const transformedLobs = [];
        const transformedSubLobs = [];
        const sitesMap = new Map();
        let lobId = 0;
        let subLobId = 0;
        
        refreshResponse.data.data.forEach((client) => {
          // Use the actual client ID from the database
          const clientId = client.clientId;
          
          transformedClients.push({
            id: clientId,
            name: client.clientName,
            createdBy: client.createdBy || '-',
            createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
          });
          
          if (client.LOBs && Array.isArray(client.LOBs)) {
            client.LOBs.forEach(lob => {
              lobId++;
              
              // Extract site info if available
              if (lob.sites && Array.isArray(lob.sites)) {
                lob.sites.forEach(site => {
                  if (site.siteId && site.siteName) {
                    sitesMap.set(site.siteId, {
                      id: site.siteId,
                      name: site.siteName
                    });
                  }
                });
              }
              
              transformedLobs.push({
                id: lobId,
                name: lob.name,
                clientId: clientId,
                siteId: lob.siteId || 1,
                sites: lob.sites || []
              });
              
              if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                lob.subLOBs.forEach(subLobName => {
                  subLobId++;
                  transformedSubLobs.push({
                    id: subLobId,
                    name: subLobName,
                    lobId: lobId
                  });
                });
              }
            });
          }
        });
        
        // Sort clients by ID in ascending order
        transformedClients.sort((a, b) => a.id - b.id);
        
        setClients(transformedClients);
        setLobs(transformedLobs);
        setSubLobs(transformedSubLobs);
        
        // Update sites if available
        if (sitesMap.size > 0) {
          setSites(Array.from(sitesMap.values()));
        }
      }
      
      // Reset Sub LOB form after successful addition
      setSubLobNames(['']);
      setSelectedLobForSubLob(null);
      
      // Show success message
      alert('Sub LOBs added successfully!');
    } catch (refreshError) {
      console.error('Error refreshing data:', refreshError);
    }
  } catch (error) {
    console.error('Error adding Sub LOB:', error);
    alert(`Failed to add Sub LOB: ${error.response?.data?.error || error.message}`);
  }
};

// Updated handleEditRow function to properly store original names
const handleEditRow = (type, data) => {
  if (type === 'client') {
    // For clients, use your existing currentClient state and modal
    const clientLobs = lobs.filter(lob => lob.clientId === data.id);
    const clientSubLobs = subLobs.filter(subLob => 
      clientLobs.some(lob => lob.id === subLob.lobId)
    );
    
    setCurrentClient({
      ...data,
      lobs: clientLobs.map(lob => ({...lob, originalName: lob.name})),
      subLobs: clientSubLobs.map(subLob => ({...subLob, originalName: subLob.name})),
      type: 'client',
      originalName: data.name
    });
  } else if (type === 'lob') {
    // For LOBs, create a minimal client object with just this LOB
    const client = clients.find(c => c.id === data.clientId);
    if (!client) return;
    
    const lobSubLobs = subLobs.filter(subLob => subLob.lobId === data.id);
    
    setCurrentClient({
      id: client.id,
      name: client.name,
      originalName: client.name, // Add this line
      createdBy: client.createdBy || '',
      createdAt: client.createdAt || '',
      lobs: [{ ...data, originalName: data.name }],
      subLobs: lobSubLobs.map(subLob => ({ ...subLob, originalName: subLob.name })),
      type: 'lob',
      targetId: data.id
    });
  } else if (type === 'sublob') {
    // For sublobs, find the client and LOB that own this sublob
    const lob = lobs.find(l => l.id === data.lobId);
    if (!lob) return;
    
    const client = clients.find(c => c.id === lob.clientId);
    if (!client) return;
    
    setCurrentClient({
      id: client.id,
      name: client.name,
      originalName: client.name, // Make sure this is set
      createdBy: client.createdBy || '',
      createdAt: client.createdAt || '',
      lobs: [{ ...lob, originalName: lob.name }],
      subLobs: [{ ...data, originalName: data.name }],
      type: 'sublob',
      targetId: data.id
    });
  }
  
  setEditModalOpen(true);
};

// Fixed handleSave function to properly use the original LOB names
const handleSave = async (updatedClient) => {
  try {
    if (updatedClient.type === 'client') {
      // Update client name if changed
      if (updatedClient.originalName !== updatedClient.name) {
        await axios.post('http://localhost:3000/api/clients/update', {
          oldClientName: updatedClient.originalName,
          newClientName: updatedClient.name
        });
      }
      
      // Update client basic info in local state
      setClients(clients.map(client => 
        client.id === updatedClient.id ? {
          ...client,
          name: updatedClient.name,
          createdBy: updatedClient.createdBy,
          createdAt: updatedClient.createdAt
        } : client
      ));
      
      // Update LOBs
      for (const lob of updatedClient.lobs) {
        if (lob.originalName !== lob.name) {
          await axios.post('http://localhost:3000/api/clients/lob/update', {
            clientName: updatedClient.name,
            oldLOBName: lob.originalName,
            newLOBName: lob.name
          });
        }
      }
      
      // Update LOBs in local state
      setLobs(lobs.map(l => {
        const updatedLob = updatedClient.lobs.find(ul => ul.id === l.id);
        return updatedLob ? { ...l, name: updatedLob.name } : l;
      }));
      
      // Update SubLOBs
      for (const subLob of updatedClient.subLobs) {
        if (subLob.originalName !== subLob.name) {
          const parentLob = updatedClient.lobs.find(l => l.id === subLob.lobId) || 
                           lobs.find(l => l.id === subLob.lobId);
          if (parentLob) {
            await axios.post('http://localhost:3000/api/clients/sublob/update', {
              clientName: updatedClient.name,
              lobName: parentLob.name,
              oldSubLOBName: subLob.originalName,
              newSubLOBName: subLob.name
            });
          }
        }
      }
      
      // Update SubLOBs in local state
      setSubLobs(subLobs.map(s => {
        const updatedSubLob = updatedClient.subLobs.find(us => us.id === s.id);
        return updatedSubLob ? { ...s, name: updatedSubLob.name } : s;
      }));
    } 
    else if (updatedClient.type === 'lob') {
      // We're editing a single LOB
      const lob = updatedClient.lobs[0];
      
      // Check if LOB name changed
      if (lob.originalName !== lob.name) {
        await axios.post('http://localhost:3000/api/clients/lob/update', {
          clientName: updatedClient.name,
          oldLOBName: lob.originalName,
          newLOBName: lob.name
        });
        
        // Update in local state
        setLobs(lobs.map(l => l.id === lob.id ? { ...l, name: lob.name } : l));
      }
      
      // Update SubLOBs
      for (const subLob of updatedClient.subLobs) {
        if (subLob.originalName !== subLob.name) {
          await axios.post('http://localhost:3000/api/clients/sublob/update', {
            clientName: updatedClient.name,
            lobName: lob.name, // Use the updated LOB name
            oldSubLOBName: subLob.originalName,
            newSubLOBName: subLob.name
          });
          
          // Update in local state
          setSubLobs(subLobs.map(s => 
            s.id === subLob.id ? { ...s, name: subLob.name } : s
          ));
        }
      }
    } 
    else if (updatedClient.type === 'sublob') {
      // We're editing a single SubLOB
      const lob = updatedClient.lobs[0];
      const subLob = updatedClient.subLobs[0];
      
      // Check if client name changed
      if (updatedClient.originalName && updatedClient.originalName !== updatedClient.name) {
        await axios.post('http://localhost:3000/api/clients/update', {
          oldClientName: updatedClient.originalName,
          newClientName: updatedClient.name
        });
        
        // Update in local state
        setClients(clients.map(c => 
          c.id === updatedClient.id ? { ...c, name: updatedClient.name } : c
        ));
      }
      
      // Check if LOB name changed
      if (lob.originalName !== lob.name) {
        await axios.post('http://localhost:3000/api/clients/lob/update', {
          clientName: updatedClient.name,
          oldLOBName: lob.originalName,
          newLOBName: lob.name
        });
        
        // Update in local state
        setLobs(lobs.map(l => 
          l.id === lob.id ? { ...l, name: lob.name } : l
        ));
      }
      
      // Check if SubLOB name changed
      if (subLob.originalName !== subLob.name) {
        await axios.post('http://localhost:3000/api/clients/sublob/update', {
          clientName: updatedClient.name,
          lobName: lob.name, // Use the updated LOB name
          oldSubLOBName: subLob.originalName,
          newSubLOBName: subLob.name
        });
        
        // Update in local state
        setSubLobs(subLobs.map(s => 
          s.id === subLob.id ? { ...s, name: subLob.name } : s
        ));
      }
    }
    
    setEditModalOpen(false);
    setCurrentClient(null);
    
    // Show success message
    alert('Changes saved successfully!');
  } catch (error) {
    console.error('Error saving changes:', error);
    alert(`Failed to save changes: ${error.response?.data?.error || error.message}`);
  }
};



  const handleAddAnotherLobCard = () => {
    if (lobCards.length < 4) {
      setLobCards([...lobCards, { lobName: '', subLobNames: [''] }]);
    }
  };

  const handleRemoveLobCard = (index) => {
    if (lobCards.length > 1) {
      const updatedLobCards = [...lobCards];
      updatedLobCards.splice(index, 1);
      setLobCards(updatedLobCards);
    }
  };

  const handleLobNameChange = (index, value) => {
    const updatedLobCards = [...lobCards];
    updatedLobCards[index].lobName = value;
    setLobCards(updatedLobCards);
  };

  const handleAddAnotherSubLob = (lobCardIndex) => {
    if (lobCards[lobCardIndex].subLobNames.length < 4) {
      const updatedLobCards = [...lobCards];
      updatedLobCards[lobCardIndex].subLobNames.push('');
      setLobCards(updatedLobCards);
    }
  };

  const handleRemoveSubLobField = (lobCardIndex, subLobIndex) => {
    if (lobCards[lobCardIndex].subLobNames.length > 1) {
      const updatedLobCards = [...lobCards];
      updatedLobCards[lobCardIndex].subLobNames.splice(subLobIndex, 1);
      setLobCards(updatedLobCards);
    }
  };

  // Correct implementation
  const handleSubLobNameChange = (lobCardIndex, subLobIndex, value) => {
    const updatedLobCards = [...lobCards];
    updatedLobCards[lobCardIndex].subLobNames[subLobIndex] = value;
    setLobCards(updatedLobCards);
  };

  // Replace your current handleSubLobNameChange function with this:
  const handleSubLobNameChange2 = (index, value) => {
    const updatedSubLobNames = [...subLobNames];
    updatedSubLobNames[index] = value;
    setSubLobNames(updatedSubLobNames);
  };

  const handleAddAnotherLobCardForLob = () => {
    if (lobCardsForLob.length < 4) {
      setLobCardsForLob([...lobCardsForLob, { lobName: '', subLobNames: [''] }]);
    }
  };

  const handleRemoveLobCardForLob = (index) => {
    if (lobCardsForLob.length > 1) {
      const updatedLobCards = [...lobCardsForLob];
      updatedLobCards.splice(index, 1);
      setLobCardsForLob(updatedLobCards);
    }
  };

  const handleLobNameChangeForLob = (index, value) => {
    const updatedLobCards = [...lobCardsForLob];
    updatedLobCards[index].lobName = value;
    setLobCardsForLob(updatedLobCards);
  };

  const handleAddAnotherSubLobForLob = (lobCardIndex) => {
    if (lobCardsForLob[lobCardIndex].subLobNames.length < 4) {
      const updatedLobCards = [...lobCardsForLob];
      updatedLobCards[lobCardIndex].subLobNames.push('');
      setLobCardsForLob(updatedLobCards);
    }
  };

  const handleRemoveSubLobFieldForLob = (lobCardIndex, subLobIndex) => {
    if (lobCardsForLob[lobCardIndex].subLobNames.length > 1) {
      const updatedLobCards = [...lobCardsForLob];
      updatedLobCards[lobCardIndex].subLobNames.splice(subLobIndex, 1);
      setLobCardsForLob(updatedLobCards);
    }
  };

  const handleSubLobNameChangeForLob = (lobCardIndex, subLobIndex, value) => {
    const updatedLobCards = [...lobCardsForLob];
    updatedLobCards[lobCardIndex].subLobNames[subLobIndex] = value;
    setLobCardsForLob(updatedLobCards);
  };

  const handleAddAnotherSubLobField = () => {
    if (subLobNames.length < 4) {
      setSubLobNames([...subLobNames, '']);
    }
  };

  const handleDeleteClient = (type, id) => {
    console.log('handleDelete called with:', type, id);
    
    if (type === 'client' && activeTab === 'addClient') {
      // Call delete client function directly
      try {
        console.log('Attempting to delete client:', id);
        // Get the client to delete
        const clientToDelete = clients.find(client => client.id === id);
        if (!clientToDelete) {
          console.error('Client not found:', id);
          return;
        }
  
        // Confirm deletion
        if (!window.confirm(`Are you sure you want to delete client "${clientToDelete.name}"?`)) {
          return;
        }
  
       // Make direct API call here instead of using handleDeleteClient
        axios.delete('http://localhost:3000/api/clients/delete', {
          data: { clientName: clientToDelete.name }  // Use 'data' property to send request body in DELETE
        })
        .then((response) => {
          console.log('Delete response:', response);
          // Update local state
          setClients(clients.filter(client => client.id !== id));
          
          // Also remove associated LOBs and SubLOBs
          const lobIdsToRemove = lobs.filter(lob => lob.clientId === id).map(lob => lob.id);
          setLobs(lobs.filter(lob => lob.clientId !== id));
          setSubLobs(subLobs.filter(subLob => !lobIdsToRemove.includes(subLob.lobId)));
          
          alert(`Client "${clientToDelete.name}" deleted successfully`);
        })
        .catch((error) => {
          console.error('Delete error:', error);
          alert(`Failed to delete client: ${error.response?.data?.error || error.message}`);
        });
      } catch (err) {
        console.error('Error in delete process:', err);
        alert(`Error: ${err.message}`);
      }
    } else if (type === 'lob') {
      setLobs(lobs.filter(lob => lob.id !== id));
      setSubLobs(subLobs.filter(subLob => subLob.lobId !== id));
    } else if (type === 'subLob') {
      setSubLobs(subLobs.filter(subLob => subLob.id !== id));
    }
  };

  const handleDeleteLob = (type, id) => {
    console.log('handleDeleteLob called with:', type, id);
    
    if (type === 'lob' && activeTab === 'addLOB') {
      // Call delete LOB function directly
      try {
        console.log('Attempting to delete LOB:', id);
        // Get the LOB to delete
        const lobToDelete = lobs.find(lob => lob.id === id);
        if (!lobToDelete) {
          console.error('LOB not found:', id);
          return;
        }
        
        // Get the client name associated with this LOB
        const clientForLob = clients.find(client => client.id === lobToDelete.clientId);
        if (!clientForLob) {
          console.error('Client not found for LOB:', id);
          return;
        }
  
        // Confirm deletion
        if (!window.confirm(`Are you sure you want to delete LOB "${lobToDelete.name}" for client "${clientForLob.name}"?`)) {
          return;
        }
  
        // Make direct API call here
        axios.delete('http://localhost:3000/api/clients/lob/delete', {
          data: { 
            clientName: clientForLob.name,
            lobName: lobToDelete.name
          }
        })
        .then((response) => {
          console.log('Delete response:', response);
          // Update local state
          setLobs(lobs.filter(lob => lob.id !== id));
          
          // Also remove associated SubLOBs
          setSubLobs(subLobs.filter(subLob => subLob.lobId !== id));
          
          alert(`LOB "${lobToDelete.name}" deleted successfully`);
        })
        .catch((error) => {
          console.error('Delete error:', error);
          alert(`Failed to delete LOB: ${error.response?.data?.error || error.message}`);
        });
      } catch (err) {
        console.error('Error in delete process:', err);
        alert(`Error: ${err.message}`);
      }
    } else if (type === 'subLob') {
      setSubLobs(subLobs.filter(subLob => subLob.id !== id));
    } else if (type === 'lob' && activeTab !== 'addLob') {
      // If trying to delete a LOB but not in the Add LOB tab, show a message
      alert('LOB deletion is only available in the Add LOB tab.');
    }
  };

  const handleDeleteSubLob = (type, id) => {
    console.log('handleDeleteSubLob called with:', type, id);
    
    if (type === 'subLob' && activeTab === 'addSubLOB') {
      // Call delete SubLOB function directly
      try {
        console.log('Attempting to delete SubLOB:', id);
        // Get the SubLOB to delete
        const subLobToDelete = subLobs.find(subLob => subLob.id === id);
        if (!subLobToDelete) {
          console.error('SubLOB not found:', id);
          return;
        }
        
        // Get the LOB and client associated with this SubLOB
        const lobForSubLob = lobs.find(lob => lob.id === subLobToDelete.lobId);
        if (!lobForSubLob) {
          console.error('LOB not found for SubLOB:', id);
          return;
        }
        
        const clientForLob = clients.find(client => client.id === lobForSubLob.clientId);
        if (!clientForLob) {
          console.error('Client not found for LOB:', lobForSubLob.id);
          return;
        }
  
        // Confirm deletion
        if (!window.confirm(`Are you sure you want to delete SubLOB "${subLobToDelete.name}" from LOB "${lobForSubLob.name}" for client "${clientForLob.name}"?`)) {
          return;
        }
  
        // Make direct API call here
        axios.delete('http://localhost:3000/api/clients/sublob/delete', {
          data: { 
            clientName: clientForLob.name,
            lobName: lobForSubLob.name,
            subLOBName: subLobToDelete.name  // Changed from subLobName to subLOBName
          }
        })
        .then((response) => {
          console.log('Delete response:', response);
          // Update local state
          setSubLobs(subLobs.filter(subLob => subLob.id !== id));
          
          alert(`SubLOB "${subLobToDelete.name}" deleted successfully`);
        })
        .catch((error) => {
          console.error('Delete error:', error);
          alert(`Failed to delete SubLOB: ${error.response?.data?.error || error.message}`);
        });
      } catch (err) {
        console.error('Error in delete process:', err);
        alert(`Error: ${err.message}`);
      }
    } else if (type === 'subLob' && activeTab !== 'addSubLOB') {
      // If trying to delete a SubLOB but not in the Add SubLOB tab, show a message
      alert('SubLOB deletion is only available in the Add SubLOB tab.');
    }
  };

  const handleDelete = (type, id) => {
    console.log('handleDelete called with:', type, id);
  };
  
// Filtered data for table
const filteredClients = clients
  .filter(client => {
    // Search in client name
    const matchesClientSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Also search in associated LOBs
    const clientLobs = lobs.filter(lob => lob.clientId === client.id);
    const matchesLobSearch = clientLobs.some(lob => 
      lob.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // And search in associated SubLOBs
    const clientLobIds = clientLobs.map(lob => lob.id);
    const clientSubLobs = subLobs.filter(subLob => clientLobIds.includes(subLob.lobId));
    const matchesSubLobSearch = clientSubLobs.some(subLob => 
      subLob.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Return true if any level matches the search term
    const matchesSearch = matchesClientSearch || matchesLobSearch || matchesSubLobSearch;
    const matchesFilter = filterClient ? client.id === filterClient : true;
    
    return matchesSearch && matchesFilter;
  })
  .sort((a, b) => b.id - a.id);

  return (
    <div className="client-management-container">
      <div className="white-card">
        <div className="client-management-header">
          <h1>Client Management</h1>
          <p className="subtitle">Manage clients, LOBs, and Sub LOBs</p>
        </div>

        <div className="tab-container">
          <div className={`tab ${activeTab === 'addClient' ? 'active' : ''}`} onClick={() => setActiveTab('addClient')}>
            Add Client
          </div>
          <div className={`tab ${activeTab === 'addLOB' ? 'active' : ''}`} onClick={() => setActiveTab('addLOB')}>
            Add LOB
          </div>
          <div className={`tab ${activeTab === 'addSubLOB' ? 'active' : ''}`} onClick={() => setActiveTab('addSubLOB')}>
            Add Sub LOB
          </div>
        </div>

        {/* Add Client Tab */}
        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <div className="client-name-container">
            <label>Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>

          <div className="lob-cards-container">
            {lobCards.map((card, lobCardIndex) => (
              <div key={`lob-card-${lobCardIndex}`} className="lob-card">
                {lobCardIndex > 0 && (
                  <button className="remove-lob-card-btn" onClick={() => handleRemoveLobCard(lobCardIndex)}>
                    <FaTimes size={10} className="times-icon" />
                  </button>
                )}
                
                <div className="form-group inline-form-group">
                  <label>LOB Name:</label>
                  <input
                    type="text"
                    value={card.lobName}
                    onChange={(e) => handleLobNameChange(lobCardIndex, e.target.value)}
                  />
                </div>

                <div className="sub-lobs-container">
                  {card.subLobNames.map((subLobName, subLobIndex) => (
                    <div key={`sub-lob-${lobCardIndex}-${subLobIndex}`} className="form-group sub-lob-group inline-form-group">
                      <label>Sub LOB {subLobIndex + 1}:</label>
                      <div className="sub-lob-input-container">
                        <input
                          type="text"
                          value={subLobName}
                          onChange={(e) => handleSubLobNameChange(lobCardIndex, subLobIndex, e.target.value)}
                        />
                        {subLobIndex > 0 && (
                          <button 
                            className="remove-sub-lob-field-btn"
                            onClick={() => handleRemoveSubLobField(lobCardIndex, subLobIndex)}
                          >
                            <FaTimes size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {card.subLobNames.length < 4 && (
                  <button 
                    onClick={() => handleAddAnotherSubLob(lobCardIndex)} 
                    className="add-another-button"
                  >
                    + Add Sub LOB
                  </button>
                )}
              </div>
            ))}
            
            {lobCards.length < 4 && (
              <div className="add-lob-card-container">
                <button onClick={handleAddAnotherLobCard} className="add-lob-card-button">
                  + Add LOB Card
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleAddClient} 
            className="submit-button"
            disabled={!clientName.trim() || !lobCards.some(card => card.lobName.trim())}
          >
            Submit Client
          </button>
        </div>

        {/* Add LOB Tab */}
        <div className={`tab-content ${activeTab === 'addLOB' ? 'active' : ''}`}>
          <div className="client-name-container">
            <label>Select Client</label>
            <select
              value={selectedClientForLob || ''}
              onChange={(e) => {
                const clientId = e.target.value ? Number(e.target.value) : null;
                setSelectedClientForLob(clientId);
                setSelectedSiteForLob(null);
              }}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="client-name-container">
            <label>Select Site</label>
            <select
              value={selectedSiteForLob || ''}
              onChange={(e) => setSelectedSiteForLob(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedClientForLob}
            >
              <option value="">All Sites</option>
              {sites
                .filter(site => {
                  if (!selectedClientForLob) {
                    return false; // Don't show sites if no client is selected
                  }
                  
                  const clientLobs = lobs.filter(lob => lob.clientId === selectedClientForLob);
                  
                  return clientLobs.some(lob => {
                    if (lob.sites && lob.sites.length > 0) {
                      return lob.sites.some(lobSite => lobSite.siteId === site.id);
                    }
                    return lob.siteId === site.id;
                  });
                })
                .map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))
              }
            </select>
          </div>

          <div className="lob-cards-container">
            {lobCardsForLob.map((card, lobCardIndex) => (
              <div key={`lob-card-${lobCardIndex}`} className="lob-card">
                {lobCardIndex > 0 && (
                  <button className="remove-lob-card-btn" onClick={() => handleRemoveLobCardForLob(lobCardIndex)}>
                    <FaTimes size={10} className="times-icon" />
                  </button>
                )}
                
                <div className="form-group inline-form-group">
                  <label>LOB Name:</label>
                  <input
                    type="text"
                    value={card.lobName}
                    onChange={(e) => handleLobNameChangeForLob(lobCardIndex, e.target.value)}
                    disabled={!selectedClientForLob}
                  />
                </div>

                <div className="sub-lobs-container">
                  {card.subLobNames.map((subLobName, subLobIndex) => (
                    <div key={`sub-lob-${lobCardIndex}-${subLobIndex}`} className="form-group sub-lob-group inline-form-group">
                      <label>Sub LOB {subLobIndex + 1}:</label>
                      <div className="sub-lob-input-container">
                        <input
                          type="text"
                          value={subLobName}
                          onChange={(e) => handleSubLobNameChangeForLob(lobCardIndex, subLobIndex, e.target.value)}
                          disabled={!selectedClientForLob}
                        />
                        {subLobIndex > 0 && (
                          <button 
                            className="remove-sub-lob-field-btn"
                            onClick={() => handleRemoveSubLobFieldForLob(lobCardIndex, subLobIndex)}
                          >
                            <FaTimes size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {card.subLobNames.length < 4 && (
                  <button 
                    onClick={() => handleAddAnotherSubLobForLob(lobCardIndex)} 
                    className="add-another-button"
                    disabled={!selectedClientForLob}
                  >
                    + Add Sub LOB
                  </button>
                )}
              </div>
            ))}
            
            {lobCardsForLob.length < 4 && (
              <div className="add-lob-card-container">
                <button 
                  onClick={handleAddAnotherLobCardForLob} 
                  className="add-lob-card-button"
                  disabled={!selectedClientForLob}
                >
                  + Add LOB Card
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleAddLob} 
            className="submit-button"
            disabled={!selectedClientForLob || !lobCardsForLob.some(card => card.lobName.trim())}
          >
            Submit LOB(s)
          </button>
        </div>

        {/* Add Sub LOB Tab */}
        <div className={`tab-content ${activeTab === 'addSubLOB' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Select Client</label>
              <select
                value={filterClientForSubLob || ''}
                onChange={(e) => setFilterClientForSubLob(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
              <div className="form-group">
                <label>Select Site</label>
                <select
                  value={filterSiteForSubLob || ''}
                  onChange={(e) => setFilterSiteForSubLob(e.target.value ? Number(e.target.value) : null)}
                  disabled={!filterClientForSubLob}
                >
                  <option value="">All Sites</option>
                  {sites
                    .filter(site => {
                      if (!filterClientForSubLob) {
                        return true;
                      }
                      
                      const clientLobs = lobs.filter(lob => lob.clientId === filterClientForSubLob);
                      
                      return clientLobs.some(lob => {
                        if (lob.sites && lob.sites.length > 0) {
                          return lob.sites.some(lobSite => lobSite.siteId === site.id);
                        }
                        return lob.siteId === site.id;
                      });
                    })
                    .map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))
                  }
                </select>
              </div>
            <div className="form-group">
              <label>Select LOB</label>
              <select
                value={selectedLobForSubLob || ''}
                onChange={(e) => setSelectedLobForSubLob(e.target.value ? Number(e.target.value) : null)}
                disabled={!filterClientForSubLob}
              >
                {renderLobOptions()}
              </select>
            </div>
          </div>
          <div className="sub-lob-name-fields-container">
            <div className="sub-lob-name-fields-row">
              {/* Sub LOB Name 1 */}
              <div className="sub-lob-name-field">
                <div className="form-group">
                  <label>Sub LOB Name</label>
                  <div className="sub-lob-input-container">
                    <input
                      type="text"
                      value={subLobNames[0]}
                      onChange={(e) => handleSubLobNameChange2(0, e.target.value)}
                      disabled={!selectedLobForSubLob}
                    />
                  </div>
                </div>
              </div>
              
              {/* Sub LOB Name 2 */}
              {subLobNames.length > 1 && (
                <div className="sub-lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 1)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 2</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[1]}
                        onChange={(e) => handleSubLobNameChange2(1, e.target.value)}
                        disabled={!selectedLobForSubLob}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sub-lob-name-fields-row">
              {/* Sub LOB Name 3 */}
              {subLobNames.length > 2 && (
                <div className="sub-lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 2)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 3</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[2]}
                        onChange={(e) => handleSubLobNameChange2(2, e.target.value)}
                        disabled={!selectedLobForSubLob}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sub LOB Name 4 */}
              {subLobNames.length > 3 && (
                <div className="sub-lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 3)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 4</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[3]}
                        onChange={(e) => handleSubLobNameChange2(3, e.target.value)}
                        disabled={!selectedLobForSubLob}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lob-actions">
            {subLobNames.length < 4 && (
              <button 
                onClick={handleAddAnotherSubLobField} 
                className="add-another-button"
                disabled={!selectedLobForSubLob}
              >
                + Add Another Sub LOB
              </button>
            )}
            <button 
              onClick={handleAddSubLob} 
              className="add-button"
              disabled={!subLobNames.some(name => name && name.length > 0) || !selectedLobForSubLob}
            >
              + Add Sub LOB(s)
            </button>
          </div>
        </div>

        <div className="existing-items">
          <h2>Existing Items</h2>
          
          <div className="table-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Filter by Client:</label>
              <select
                value={filterClient || ''}
                onChange={(e) => setFilterClient(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-tabs-container">
            <div className={`table-tab ${activeTableTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTableTab('clients')}>
              Clients
            </div>
            <div className={`table-tab ${activeTableTab === 'lobs' ? 'active' : ''}`} onClick={() => setActiveTableTab('lobs')}>
              LOBs
            </div>
            <div className={`table-tab ${activeTableTab === 'subLobs' ? 'active' : ''}`} onClick={() => setActiveTableTab('subLobs')}>
              Sub LOBs
            </div>
          </div>

          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>LOB</th>
                  <th>Sub LOB</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTableTab === 'clients' ? (
                  // Client view - show each Client-LOB-SubLOB combination in separate rows
                  filteredClients.flatMap(client => {
                    const clientLobs = lobs.filter(lob => lob.clientId === client.id);
                    
                    // If no LOBs, just show the client
                    if (clientLobs.length === 0) {
                      return [(
                        <tr key={`client-${client.id}`}>
                          <td>{client.id}</td>
                          <td>{client.name}</td>
                          <td>-</td>
                          <td>-</td>
                          <td>{client.createdBy || '-'}</td>
                          <td>{client.createdAt || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditRow('client', client)} className="edit-btn">
                                <FaPencilAlt size={12} /> Edit
                              </button>
                              <button onClick={() => handleDelete('client', client.id)} className="delete-btn">
                                <FaTrash size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )];
                    }
                    
                    // Create rows for each LOB-SubLOB combination
                    return clientLobs.flatMap(lob => {
                      const lobSubLobs = subLobs.filter(subLob => subLob.lobId === lob.id);
                      
                      // If no SubLOBs, show just the LOB
                      if (lobSubLobs.length === 0) {
                        return [(
                          <tr key={`client-${client.id}-lob-${lob.id}`}>
                            <td>{client.id}</td>
                            <td>{client.name}</td>
                            <td>{lob.name}</td>
                            <td>-</td>
                            <td>{client.createdBy || '-'}</td>
                            <td>{client.createdAt || '-'}</td>
                            <td>
                              <div className="action-buttons">
                                <button onClick={() => handleEditRow('lob', lob)} className="edit-btn">
                                  <FaPencilAlt size={12} /> Edit
                                </button>
                                <button onClick={() => handleDelete('lob', lob.id)} className="delete-btn">
                                  <FaTrash size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )];
                      }
                      
                      //CLIENT FOR DELETION
                      return lobSubLobs.map(subLob => (
                        <tr key={`client-${client.id}-lob-${lob.id}-sublob-${subLob.id}`}>
                          <td>{client.id}</td>
                          <td>{client.name}</td>
                          <td>{lob.name}</td>
                          <td>{subLob.name}</td>
                          <td>{client.createdBy || '-'}</td>
                          <td>{client.createdAt || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditRow('sublob', subLob)} className="edit-btn">
                                <FaPencilAlt size={12} /> Edit
                              </button>
                              <button 
                                onClick={() => {
                                  // Check the main active tab first
                                  if (activeTab === 'addClient') {
                                    // In Add Client tab, use table tab to determine what to delete
                                    if (activeTableTab === 'clients') {
                                      // Delete client
                                      handleDeleteClient('client', client.id);
                                    } else if (activeTableTab === 'lobs') {
                                      // Delete LOB
                                      handleDeleteLob('lob', lob.id);
                                    } else if (activeTableTab === 'subLobs') {
                                      // Delete SubLOB
                                      handleDelete('subLob', subLob.id);
                                    }
                                  } else if (activeTab === 'addLOB') {
                                    // In Add LOB tab, use LOB-specific delete handler
                                    handleDeleteLob('lob', lob.id);
                                  } else if (activeTab === 'addSubLOB') {
                                    // In Add SubLOB tab, use SubLOB-specific delete handler
                                    handleDeleteSubLob('subLob', subLob.id);
                                  } else {
                                    // In other tabs, use the regular handleDelete
                                    if (activeTableTab === 'clients') {
                                      handleDelete('client', client.id);
                                    } else if (activeTableTab === 'lobs') {
                                      handleDelete('lob', lob.id);
                                    } else if (activeTableTab === 'subLobs') {
                                      handleDelete('subLob', subLob.id);
                                    }
                                  }
                                }} 
                                className="delete-btn"
                              >
                                <FaTrash size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    });
                  })
                ) : activeTableTab === 'lobs' ? (
                  // LOB view - show each LOB-SubLOB combination in separate rows
                  lobs
                    .filter(lob => {
                      const client = clients.find(c => c.id === lob.clientId);
                      return client && 
                            client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                            (!filterClient || lob.clientId === filterClient);
                    })
                    .flatMap(lob => {
                      const client = clients.find(c => c.id === lob.clientId);
                      const lobSubLobs = subLobs.filter(subLob => subLob.lobId === lob.id);
                      
                      // If no SubLOBs, show just the LOB
                      if (lobSubLobs.length === 0) {
                        return [(
                          <tr key={`lob-view-${lob.id}`}>
                            <td>{client ? client.id.toString().padStart(3, '0') : '-'}</td>
                            <td>{client ? client.name : '-'}</td>
                            <td>{lob.name}</td>
                            <td>-</td>
                            <td>{client ? client.createdBy : '-'}</td>
                            <td>{client ? client.createdAt : '-'}</td>
                            <td>
                              <div className="action-buttons">
                                <button onClick={() => handleEditRow('lob', lob)} className="edit-btn">
                                  <FaPencilAlt size={12} /> Edit
                                </button>
                                <button onClick={() => handleDelete('lob', lob.id)} className="delete-btn">
                                  <FaTrash size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )];
                      }
                      
                      // Otherwise create one row for each SubLOB
                      return lobSubLobs.map(subLob => (
                        <tr key={`lob-view-${lob.id}-sublob-${subLob.id}`}>
                          <td>{client ? client.id.toString().padStart(3, '0') : '-'}</td>
                          <td>{client ? client.name : '-'}</td>
                          <td>{lob.name}</td>
                          <td>{subLob.name}</td>
                          <td>{client ? client.createdBy : '-'}</td>
                          <td>{client ? client.createdAt : '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditRow('sublob', subLob)} className="edit-btn">
                                <FaPencilAlt size={12} /> Edit
                              </button>
                              <button onClick={() => handleDelete('sublob', subLob.id)} className="delete-btn">
                                <FaTrash size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })
                ) : (
                  // SubLOB view - already shows individual rows for each SubLOB
                  subLobs
                    .filter(subLob => {
                      const lob = lobs.find(l => l.id === subLob.lobId);
                      const client = lob ? clients.find(c => c.id === lob.clientId) : null;
                      
                      return (
                        client && 
                        (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lob.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        subLob.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (!filterClient || (lob && lob.clientId === filterClient))
                      );
                    })
                    .map(subLob => {
                      const lob = lobs.find(l => l.id === subLob.lobId);
                      const client = lob ? clients.find(c => c.id === lob.clientId) : null;
                      
                      return (
                        <tr key={`sublob-${subLob.id}`}>
                          <td>{client ? client.id.toString().padStart(3, '0') : '-'}</td>
                          <td>{client ? client.name : '-'}</td>
                          <td>{lob ? lob.name : '-'}</td>
                          <td>{subLob.name}</td>
                          <td>{client ? client.createdBy : '-'}</td>
                          <td>{client ? client.createdAt : '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => handleEditRow('sublob', subLob)} className="edit-btn">
                                <FaPencilAlt size={12} /> Edit
                              </button>
                              <button onClick={() => handleDelete('sublob', subLob.id)} className="delete-btn">
                                <FaTrash size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {/* Edit Client Modal */}
{editModalOpen && currentClient && (
  <div className="modal-overlay">
    <div className="modal edit-client-modal">
      <div className="modal-header">
        <h2>Edit Client</h2>
        <button onClick={() => setEditModalOpen(false)} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Client ID</label>
          <input
            type="text"
            value={`C${currentClient.id}`}
            disabled
            className="disabled-input"
          />
        </div>
        <div className="form-group">
          <label>Client Name</label>
          <input
            type="text"
            value={currentClient.name}
            onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})}
            required
            disabled={activeTab === 'addLOB' || activeTab === 'addSubLOB'}
            className={activeTab === 'addLOB' || activeTab === 'addSubLOB' ? 'disabled-input' : ''}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>LOBs and Sub LOBs</h3>
        {currentClient.lobs.map((lob, index) => (
          <div key={lob.id} className="lob-edit-section">
            <div className="form-row">
              <div className="form-group">
                <label>LOB Name</label>
                <input
                  type="text"
                  value={lob.name}
                  onChange={(e) => {
                    const updatedLobs = [...currentClient.lobs];
                    updatedLobs[index] = {...lob, name: e.target.value};
                    setCurrentClient({...currentClient, lobs: updatedLobs});
                  }}
                  disabled={activeTab === 'addClient' || activeTab === 'addSubLOB'}
                  className={activeTab === 'addClient' || activeTab === 'addSubLOB' ? 'disabled-input' : ''}
                />
              </div>
            </div>
            <div className="sub-lobs-container">
              {currentClient.subLobs
                .filter(subLob => subLob.lobId === lob.id)
                .map((subLob, subIndex) => (
                  <div key={subLob.id} className="form-row">
                    <div className="form-group">
                      <label>Sub LOB Name</label>
                      <input
                        type="text"
                        value={subLob.name}
                        onChange={(e) => {
                          const updatedSubLobs = [...currentClient.subLobs];
                          const globalSubIndex = updatedSubLobs.findIndex(sl => sl.id === subLob.id);
                          updatedSubLobs[globalSubIndex] = {...subLob, name: e.target.value};
                          setCurrentClient({...currentClient, subLobs: updatedSubLobs});
                        }}
                        disabled={activeTab === 'addClient' || activeTab === 'addLOB'}
                        className={activeTab === 'addClient' || activeTab === 'addLOB' ? 'disabled-input' : ''}
                      />
                    </div>
                  </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Created By</label>
          <input
            type="text"
            value={currentClient.createdBy || ''}
            onChange={(e) => setCurrentClient({...currentClient, createdBy: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Created At</label>
          <input
            type="text"
            value={currentClient.createdAt || ''}
            onChange={(e) => setCurrentClient({...currentClient, createdAt: e.target.value})}
          />
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
        <button 
          onClick={() => handleSave(currentClient)} 
          className="save-btn"
          disabled={!currentClient.name.trim()}
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

export default ClientManagement;