import React, { useState, useEffect } from 'react';
import './ClientManagement.css';
import { FaTrash, FaSearch, FaTimes, FaPencilAlt, FaBan, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('addClient');
  const [clients, setClients] = useState([]);
  const [lobs, setLobs] = useState([]);
  const [subLobs, setSubLobs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add state for client searchable dropdown
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Add state for site searchable dropdown
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);

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
  const [searchDropdown, setSearchDropdown] = useState([]);
  const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [searchFilter, setSearchFilter] = useState(null); // { type: 'client'|'lob'|'sublob', value: string }
  const [filterClient, setFilterClient] = useState(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  const [uniqueClientNames, setUniqueClientNames] = useState(new Map());

  // Add new state variables for Sub LOB tab dropdowns
  const [subLobClientSearchTerm, setSubLobClientSearchTerm] = useState('');
  const [isSubLobClientDropdownOpen, setIsSubLobClientDropdownOpen] = useState(false);
  const [subLobSiteSearchTerm, setSubLobSiteSearchTerm] = useState('');
  const [isSubLobSiteDropdownOpen, setIsSubLobSiteDropdownOpen] = useState(false);

  // Add new state variables for LOB searchable dropdown
  const [subLobLobSearchTerm, setSubLobLobSearchTerm] = useState('');
  const [isSubLobLobDropdownOpen, setIsSubLobLobDropdownOpen] = useState(false);

  // Add state for date filter
  const [filterDate, setFilterDate] = useState('');

  const [itemStatusTab, setItemStatusTab] = useState('ACTIVE'); // 'ACTIVE' or 'DEACTIVATED'

  // Add filtered client options function
  const filteredClientOptions = () => {
    if (!clientSearchTerm) {
      return Array.from(uniqueClientNames.entries());
    }
    const searchLower = clientSearchTerm.toLowerCase();
    return Array.from(uniqueClientNames.entries()).filter(([name]) => 
      name.toLowerCase().includes(searchLower)
    );
  };

  // Add filtered site options function
  const filteredSiteOptions = () => {
    if (!selectedClientForLob) return [];
    
    const clientLobs = lobs.filter(lob => lob.clientId === selectedClientForLob);
    const availableSites = sites.filter(site => {
      return clientLobs.some(lob => {
        if (lob.sites && lob.sites.length > 0) {
          return lob.sites.some(lobSite => lobSite.siteId === site.id);
        }
        return lob.siteId === site.id;
      });
    });

    if (!siteSearchTerm) {
      return availableSites;
    }

    const searchLower = siteSearchTerm.toLowerCase();
    return availableSites.filter(site => 
      site.name.toLowerCase().includes(searchLower)
    );
  };

  // Add filtered options functions for Sub LOB tab
  const filteredSubLobClientOptions = () => {
    if (!subLobClientSearchTerm) {
      return Array.from(uniqueClientNames.entries());
    }
    const searchLower = subLobClientSearchTerm.toLowerCase();
    return Array.from(uniqueClientNames.entries()).filter(([name]) => 
      name.toLowerCase().includes(searchLower)
    );
  };

  const filteredSubLobSiteOptions = () => {
    if (!filterClientForSubLob) return [];
    
    const clientLobs = lobs.filter(lob => lob.clientId === filterClientForSubLob);
    const availableSites = sites.filter(site => {
      return clientLobs.some(lob => {
        if (lob.sites && lob.sites.length > 0) {
          return lob.sites.some(lobSite => lobSite.siteId === site.id);
        }
        return lob.siteId === site.id;
      });
    });

    if (!subLobSiteSearchTerm) {
      return availableSites;
    }

    const searchLower = subLobSiteSearchTerm.toLowerCase();
    return availableSites.filter(site => 
      site.name.toLowerCase().includes(searchLower)
    );
  };

  // Add filtered LOB options function for Sub LOB tab
  const filteredSubLobLobOptions = () => {
    if (!validateSubLobClientSelection()) return [];

    let filteredLobOptions = lobs.filter(lob => lob.clientId === filterClientForSubLob);

    // If a site is selected, only include LOBs that have that site
    if (filterSiteForSubLob) {
      filteredLobOptions = filteredLobOptions.filter(lob => {
        if (lob.sites && lob.sites.length > 0) {
          return lob.sites.some(site => site.siteId === filterSiteForSubLob);
        }
        return lob.siteId === filterSiteForSubLob;
      });
    }

    // Build array of { lob, site } pairs
    let result = [];
    filteredLobOptions.forEach(lob => {
      if (lob.sites && lob.sites.length > 0) {
        lob.sites.forEach(site => {
          // If a site is selected, only include that site
          if (!filterSiteForSubLob || site.siteId === filterSiteForSubLob) {
            result.push({ lob, site });
          }
        });
      } else if (!filterSiteForSubLob || lob.siteId === filterSiteForSubLob) {
        result.push({ lob, site: lob.siteId ? { siteId: lob.siteId, siteName: lob.siteName } : null });
      }
    });

    // Filter by search term
    if (subLobLobSearchTerm) {
      const searchLower = subLobLobSearchTerm.toLowerCase();
      result = result.filter(({ lob }) => lob.name.toLowerCase().includes(searchLower));
    }

    // Deduplicate by lob name + site name
    const seen = new Set();
    const deduped = result.filter(({ lob, site }) => {
      const key = lob.name + '|' + (site ? site.siteName : '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped;
  };

  // Add click outside handler for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clientDropdown = document.querySelector('.searchable-dropdown');
      const siteDropdown = document.querySelector('.site-searchable-dropdown');
      const subLobClientDropdown = document.querySelector('.sublob-client-searchable-dropdown');
      const subLobSiteDropdown = document.querySelector('.sublob-site-searchable-dropdown');
      const subLobLobDropdown = document.querySelector('.sublob-lob-searchable-dropdown');
      
      if (clientDropdown && !clientDropdown.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
      if (siteDropdown && !siteDropdown.contains(event.target)) {
        setIsSiteDropdownOpen(false);
      }
      if (subLobClientDropdown && !subLobClientDropdown.contains(event.target)) {
        setIsSubLobClientDropdownOpen(false);
      }
      if (subLobSiteDropdown && !subLobSiteDropdown.contains(event.target)) {
        setIsSubLobSiteDropdownOpen(false);
      }
      if (subLobLobDropdown && !subLobLobDropdown.contains(event.target)) {
        setIsSubLobLobDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const safeToLowerCase = (value) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return ''; // Return empty string for non-string values
  };

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

  // Then add this useEffect to keep the map updated (after your existing useEffects)
  useEffect(() => {
    const newUniqueClientNames = new Map();
    clients.forEach(client => {
      newUniqueClientNames.set(client.name, client.id);
    });
    setUniqueClientNames(newUniqueClientNames);
  }, [clients]);

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

  // Add fetchClientData function here, before useEffect
  const fetchClientData = async (status = itemStatusTab) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/clients/getAll?status=${status}`);
      
      if (response.data && response.data.data) {
        console.log('Client data from API:', response.data.data);
        
        const transformedClients = [];
        const transformedLobs = [];
        const transformedSubLobs = [];
        const sitesMap = new Map();
        let lobId = 0;
        let subLobId = 0;
        
        // First, create a map of unique clients
        const uniqueClients = new Map();
        
        response.data.data.forEach((client) => {
          const clientId = client.clientId;
          // Only add each client once, using their unique ID
          if (!uniqueClients.has(clientId)) {
            uniqueClients.set(clientId, {
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
          }
        });
        
        // Convert unique clients map to array
        transformedClients.push(...uniqueClients.values());
        
        // Now process LOBs and SubLOBs
        response.data.data.forEach((client) => {
          const clientId = client.clientId;
          
          if (client.LOBs && Array.isArray(client.LOBs)) {
            client.LOBs.forEach(lob => {
              lobId++;
              
              // Extract site info from LOB
              if (lob.sites && Array.isArray(lob.sites)) {
                lob.sites.forEach(site => {
                  if (site.siteId && site.siteName) {
                    sitesMap.set(site.siteId, {
                      id: site.siteId,
                      name: site.siteName
                    });
                  }
                });
              } else if (lob.siteId && lob.siteName) {
                sitesMap.set(lob.siteId, {
                  id: lob.siteId,
                  name: lob.siteName
                });
              }
              
              transformedLobs.push({
                id: lobId,
                name: lob.name,
                clientId: clientId,
                clientRowId: lob.clientRowId || clientId, // Store the unique row-specific clientId
                siteId: lob.siteId || null,
                siteName: lob.siteName || null,
                sites: lob.sites || []
              });
              
              if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                lob.subLOBs.forEach(subLobName => {
                  subLobId++;
                  transformedSubLobs.push({
                    id: subLobId,
                    name: typeof subLobName === 'object' ? subLobName.name : subLobName,
                    lobId: lobId,
                    clientRowId: typeof subLobName === 'object' && subLobName.clientRowId ? subLobName.clientRowId : lob.clientRowId || clientId
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

  useEffect(() => {
    fetchClientData(itemStatusTab);
  }, [itemStatusTab]);

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
  
  // Utility function to validate input (no emojis, no special chars, only alphanumeric and single spaces between words)
  const isValidInput = (str) => {
    // Regex: only alphanumeric and single spaces between words, no leading/trailing/multiple spaces, no emojis/special chars
    return /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/.test(str);
  };
  
  // Handle adding a new client
  const handleAddClient = async () => {
    if (clientName.trim() && lobCards.some(card => card.lobName.trim())) {
      try {
        // Validate all input fields
        if (!isValidInput(clientName.trim())) {
          alert('Invalid client name. Only letters, numbers, and single spaces between words are allowed.');
          return;
        }
        for (const card of lobCards) {
          if (card.lobName.trim() && !isValidInput(card.lobName.trim())) {
            alert('Invalid LOB name. Only letters, numbers, and single spaces between words are allowed.');
            return;
          }
          for (const subLobName of card.subLobNames) {
            if (subLobName.trim() && !isValidInput(subLobName.trim())) {
              alert('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.');
              return;
            }
          }
        }

        // Check for duplicate LOB names (case-insensitive, trimmed)
        const lobNames = lobCards.map(card => card.lobName.trim().toLowerCase()).filter(name => name);
        const uniqueLobNames = new Set(lobNames);
        if (lobNames.length !== uniqueLobNames.size) {
          alert('Error: Duplicate LOB names are not allowed.');
          return;
        }

        // Check for duplicate Sub LOBs across all cards (case-insensitive, trimmed)
        const allSubLobNames = lobCards.flatMap(card => card.subLobNames.map(name => name.trim().toLowerCase()).filter(name => name));
        const uniqueSubLobNames = new Set(allSubLobNames);
        if (allSubLobNames.length !== uniqueSubLobNames.size) {
          alert('Error: Duplicate Sub LOB names are not allowed across all LOBs.');
          return;
        }

        // Check for duplicate Sub LOBs within each LOB (already present)
        const hasDuplicateSubLobs = lobCards.some(card => {
          const uniqueSubLobs = new Set();
          return card.subLobNames.some(subLobName => {
            const trimmedName = subLobName.trim();
            if (trimmedName && uniqueSubLobs.has(trimmedName)) {
              return true; // Found a duplicate
            }
            if (trimmedName) {
              uniqueSubLobs.add(trimmedName);
            }
            return false;
          });
        });
        if (hasDuplicateSubLobs) {
          alert('Error: Duplicate Sub LOB names are not allowed within the same LOB.');
          return;
        }

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
                      name: typeof subLobName === 'object' ? subLobName.name : subLobName,
                      lobId: lobId,
                      clientRowId: typeof subLobName === 'object' && subLobName.clientRowId ? subLobName.clientRowId : lob.clientRowId || clientId
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
        // Validate all input fields
        for (const card of lobCardsForLob) {
          if (card.lobName.trim() && !isValidInput(card.lobName.trim())) {
            alert('Invalid LOB name. Only letters, numbers, and single spaces between words are allowed.');
            return;
          }
          for (const subLobName of card.subLobNames) {
            if (subLobName.trim() && !isValidInput(subLobName.trim())) {
              alert('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.');
              return;
            }
          }
        }

        // Validate that each LOB has at least one SubLOB
        const hasValidSubLobs = lobCardsForLob.every(card => 
          card.lobName.trim() && card.subLobNames.some(name => name.trim())
        );

        if (!hasValidSubLobs) {
          alert('Each LOB must have at least one SubLOB');
          return;
        }

        // Check for duplicate LOB names (case-insensitive, trimmed)
        const lobNames = lobCardsForLob.map(card => card.lobName.trim().toLowerCase()).filter(name => name);
        const uniqueLobNames = new Set(lobNames);
        if (lobNames.length !== uniqueLobNames.size) {
          alert('Error: Duplicate LOB names are not allowed.');
          return;
        }

        // Check for duplicate Sub LOBs across all cards (case-insensitive, trimmed)
        const allSubLobNames = lobCardsForLob.flatMap(card => card.subLobNames.map(name => name.trim().toLowerCase()).filter(name => name));
        const uniqueSubLobNames = new Set(allSubLobNames);
        if (allSubLobNames.length !== uniqueSubLobNames.size) {
          alert('Error: Duplicate Sub LOB names are not allowed across all LOBs.');
          return;
        }

        // Check for duplicate Sub LOBs within each LOB card (case-insensitive, trimmed)
        const hasDuplicateSubLobs = lobCardsForLob.some(card => {
          const uniqueSubLobs = new Set();
          return card.subLobNames.some(subLobName => {
            const trimmedName = subLobName.trim().toLowerCase();
            if (trimmedName && uniqueSubLobs.has(trimmedName)) {
              return true; // Found a duplicate
            }
            if (trimmedName) {
              uniqueSubLobs.add(trimmedName);
            }
            return false;
          });
        });
        if (hasDuplicateSubLobs) {
          alert('Error: Duplicate Sub LOB names are not allowed within the same LOB.');
          return;
        }

        // Get the client name from the selected client ID
        const client = clients.find(c => c.id === selectedClientForLob);
        if (!client) {
          alert('Selected client not found');
          return;
        }

        // Validate site selection if a site is selected
        if (selectedSiteForLob) {
          const clientLobs = lobs.filter(lob => lob.clientId === selectedClientForLob);
          const siteExists = sites.some(site => {
            if (site.id === selectedSiteForLob) {
              return clientLobs.some(lob => {
                if (lob.sites && lob.sites.length > 0) {
                  return lob.sites.some(lobSite => lobSite.siteId === site.id);
                }
                return lob.siteId === site.id;
              });
            }
            return false;
          });

          if (!siteExists) {
            alert('Selected site is not valid for this client');
            return;
          }
        }
    
        // Process each LOB card
        for (const card of lobCardsForLob) {
          if (card.lobName.trim()) {
            // Check if there's at least one SubLOB name
            const hasSubLobs = card.subLobNames.some(name => name.trim());
            
            // Prepare data for API
            const lobData = {
              clientId: client.id,
              clientName: client.name,
              lobName: card.lobName.trim(),
              ...(selectedSiteForLob && { siteId: selectedSiteForLob }),
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
                    clientId: client.id,
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
                
                // Extract site info from LOB
                if (lob.sites && Array.isArray(lob.sites)) {
                  lob.sites.forEach(site => {
                    if (site.siteId && site.siteName) {
                      sitesMap.set(site.siteId, {
                        id: site.siteId,
                        name: site.siteName
                      });
                    }
                  });
                } else if (lob.siteId && lob.siteName) {
                  sitesMap.set(lob.siteId, {
                    id: lob.siteId,
                    name: lob.siteName
                  });
                }
                
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId, // Ensure we're using the correct client ID
                  siteId: lob.siteId || null,
                  siteName: lob.siteName || null,
                  sites: lob.sites || []
                });
                
                if (lob.subLOBs && Array.isArray(lob.subLOBs)) {
                  lob.subLOBs.forEach(subLobName => {
                    subLobId++;
                    transformedSubLobs.push({
                      id: subLobId,
                      name: typeof subLobName === 'object' ? subLobName.name : subLobName,
                      lobId: lobId,
                      clientRowId: typeof subLobName === 'object' && subLobName.clientRowId ? subLobName.clientRowId : lob.clientRowId || clientId
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
        setClientSearchTerm('');
        setSiteSearchTerm('');
        
        alert('LOBs added successfully!');
      } catch (error) {
        console.error('Error adding LOB:', error);
        alert(`Failed to add LOB: ${error.response?.data?.error || error.message}`);
      }
    } else {
      // Validation feedback
      if (!selectedClientForLob) {
        alert('Please select a client');
      } else if (!lobCardsForLob.some(card => card.lobName.trim())) {
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
  
  // Validate all subLobNames
  for (const name of subLobNames) {
    if (name.trim() && !isValidInput(name.trim())) {
      alert('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.');
      return;
    }
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
                    name: typeof subLobName === 'object' ? subLobName.name : subLobName,
                    lobId: lobId,
                    clientRowId: typeof subLobName === 'object' && subLobName.clientRowId ? subLobName.clientRowId : lob.clientRowId || clientId
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
      setFilterClientForSubLob(null);
      setFilterSiteForSubLob(null);
      setSubLobClientSearchTerm('');
      setSubLobSiteSearchTerm('');
      setSubLobLobSearchTerm('');
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
    // Validate all updated fields
    if (updatedClient.name && !isValidInput(updatedClient.name.trim())) {
      alert('Invalid client name. Only letters, numbers, and single spaces between words are allowed.');
      return;
    }
    if (updatedClient.lobs) {
      for (const lob of updatedClient.lobs) {
        if (lob.name && !isValidInput(lob.name.trim())) {
          alert('Invalid LOB name. Only letters, numbers, and single spaces between words are allowed.');
          return;
        }
      }
    }
    if (updatedClient.subLobs) {
      for (const subLob of updatedClient.subLobs) {
        if (subLob.name && !isValidInput(subLob.name.trim())) {
          alert('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.');
          return;
        }
      }
    }

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
let filteredClients = clients;
if (filterDate) {
  const filterDateString = new Date(filterDate).toLocaleDateString();
  filteredClients = filteredClients.filter(client => client.createdAt === filterDateString);
}
// Apply client name filter if searchFilter is set to client
if (searchFilter && searchFilter.type === 'client') {
  filteredClients = filteredClients.filter(client => safeToLowerCase(client.name) === safeToLowerCase(searchFilter.value));
}
filteredClients = filteredClients.sort((a, b) => b.id - a.id);

  // Add this function to validate client selection
  const validateClientSelection = () => {
    if (!selectedClientForLob || !clientSearchTerm) return false;
    const selectedClient = clients.find(c => c.id === selectedClientForLob);
    return selectedClient && selectedClient.name === clientSearchTerm;
  };

  // Add validation function for Sub LOB client selection
  const validateSubLobClientSelection = () => {
    if (!filterClientForSubLob || !subLobClientSearchTerm) return false;
    const selectedClient = clients.find(c => c.id === filterClientForSubLob);
    return selectedClient && selectedClient.name === subLobClientSearchTerm;
  };

  // Add this handler for removing subLobNames in Add Sub LOB tab
  const handleRemoveSubLobNameField = (index) => {
    if (subLobNames.length > 1) {
      const updated = [...subLobNames];
      updated.splice(index, 1);
      setSubLobNames(updated);
    }
  };

  const handleDeactivateClient = async (type, id) => {
    try {
      const client = clients.find(c => c.id === id);
      if (!client) {
        throw new Error('Client not found');
      }

      // Confirmation dialog
      if (!window.confirm(`Are you sure you want to deactivate client "${client.name}"?`)) {
        return;
      }

      const response = await axios.post('http://localhost:3000/api/clients/deactivate', {
        clientName: client.name
      });

      if (response.data) {
        // Refresh the data
        fetchClientData();
        alert('Client deactivated successfully!');
      }
    } catch (error) {
      console.error('Error deactivating client:', error);
      alert('Failed to deactivate client: ' + error.message);
    }
  };

  const handleDeactivateLOB = async (type, id) => {
    try {
      const lob = lobs.find(l => l.id === id);
      if (!lob) {
        throw new Error('LOB not found');
      }

      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Confirmation dialog
      if (!window.confirm(`Are you sure you want to deactivate LOB "${lob.name}" for client "${client.name}"?`)) {
        return;
      }

      const response = await axios.post('http://localhost:3000/api/clients/lob/deactivate', {
        clientName: client.name,
        lobName: lob.name
      });

      if (response.data) {
        // Refresh the data
        fetchClientData();
        alert('LOB deactivated successfully!');
      }
    } catch (error) {
      console.error('Error deactivating LOB:', error);
      alert('Failed to deactivate LOB: ' + error.message);
    }
  };

  const handleDeactivateSubLOB = async (type, id) => {
    try {
      const subLob = subLobs.find(s => s.id === id);
      if (!subLob) {
        throw new Error('Sub LOB not found');
      }

      const lob = lobs.find(l => l.id === subLob.lobId);
      if (!lob) {
        throw new Error('LOB not found');
      }

      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Confirmation dialog
      if (!window.confirm(`Are you sure you want to deactivate Sub LOB "${subLob.name}" from LOB "${lob.name}" for client "${client.name}"?`)) {
        return;
      }

      const response = await axios.post('http://localhost:3000/api/clients/sublob/deactivate', {
        clientName: client.name,
        lobName: lob.name,
        subLOBName: subLob.name
      });

      if (response.data) {
        // Refresh the data
        fetchClientData();
        alert('Sub LOB deactivated successfully!');
      }
    } catch (error) {
      console.error('Error deactivating Sub LOB:', error);
      alert('Failed to deactivate Sub LOB: ' + error.message);
    }
  };

  const handleDeactivate = (type, id) => {
    if (type === 'client') {
      handleDeactivateClient(type, id);
    } else if (type === 'lob') {
      handleDeactivateLOB(type, id);
    } else if (type === 'sublob') {
      handleDeactivateSubLOB(type, id);
    }
  };

  // Reactivate handlers
  const handleReactivateClient = async (type, id) => {
    try {
      const client = clients.find(c => c.id === id);
      if (!client) throw new Error('Client not found');
      if (!window.confirm(`Are you sure you want to reactivate client "${client.name}"?`)) return;
      const response = await axios.post('http://localhost:3000/api/clients/reactivate', {
        clientName: client.name
      });
      if (response.data) {
        fetchClientData('DEACTIVATED');
        alert('Client reactivated successfully!');
      }
    } catch (error) {
      console.error('Error reactivating client:', error);
      alert('Failed to reactivate client: ' + error.message);
    }
  };

  const handleReactivateLOB = async (type, id) => {
    try {
      const lob = lobs.find(l => l.id === id);
      if (!lob) throw new Error('LOB not found');
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) throw new Error('Client not found');
      if (!window.confirm(`Are you sure you want to reactivate LOB "${lob.name}" for client "${client.name}"?`)) return;
      const response = await axios.post('http://localhost:3000/api/clients/lob/reactivate', {
        clientName: client.name,
        lobName: lob.name
      });
      if (response.data) {
        fetchClientData('DEACTIVATED');
        alert('LOB reactivated successfully!');
      }
    } catch (error) {
      console.error('Error reactivating LOB:', error);
      alert('Failed to reactivate LOB: ' + error.message);
    }
  };

  const handleReactivateSubLOB = async (type, id) => {
    try {
      const subLob = subLobs.find(s => s.id === id);
      if (!subLob) throw new Error('Sub LOB not found');
      const lob = lobs.find(l => l.id === subLob.lobId);
      if (!lob) throw new Error('LOB not found');
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) throw new Error('Client not found');
      if (!window.confirm(`Are you sure you want to reactivate Sub LOB "${subLob.name}" from LOB "${lob.name}" for client "${client.name}"?`)) return;
      const response = await axios.post('http://localhost:3000/api/clients/sublob/reactivate', {
        clientName: client.name,
        lobName: lob.name,
        subLOBName: subLob.name
      });
      if (response.data) {
        fetchClientData('DEACTIVATED');
        alert('Sub LOB reactivated successfully!');
      }
    } catch (error) {
      console.error('Error reactivating Sub LOB:', error);
      alert('Failed to reactivate Sub LOB: ' + error.message);
    }
  };

  return (
    <div className="client-management-container">
      <div className="client-management-flex">
        {/* Sidebar: Tabs and Tab Content */}
        <div className="client-management-sidebar">
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
          {/* Tab Contents */}
          <div className="tab-contents-wrapper">
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
                    <button 
                      onClick={handleAddAnotherLobCard} 
                      className="add-lob-card-button"
                      title="Add another LOB"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddClient} 
                className="submit-button"
                disabled={
                  !clientName.trim() || 
                  !lobCards.some(card => card.lobName.trim()) ||
                  !lobCards.some(card => card.subLobNames.some(name => name.trim()))
                }
              >
                Submit Client
              </button>
            </div>
            <div className={`tab-content ${activeTab === 'addLOB' ? 'active' : ''}`}>
              <div className="client-name-container">
                <label>Select Client</label>
                <div className={`searchable-dropdown ${isClientDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setIsClientDropdownOpen(true);
                      // Clear selected client if search term doesn't match
                      const matchingClient = clients.find(c => c.name === e.target.value);
                      if (!matchingClient) {
                        setSelectedClientForLob(null);
                        setSelectedSiteForLob(null);
                        setSiteSearchTerm('');
                      }
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    placeholder="Search or select a client"
                    className="searchable-input"
                    style={{ paddingRight: '56px' }}
                  />
                  {/* Clear button */}
                  {clientSearchTerm && (
                    <button
                      type="button"
                      className="clear-select-btn"
                      onClick={() => {
                        setClientSearchTerm('');
                        setSelectedClientForLob(null);
                        setSelectedSiteForLob(null);
                        setSiteSearchTerm('');
                      }}
                      tabIndex={-1}
                      aria-label="Clear client selection"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {/* Divider */}
                  <span style={{
                    position: 'absolute',
                    right: 36,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: 24,
                    width: 1,
                    background: '#ddd',
                    zIndex: 1
                  }} />
                  {/* Dropdown icon */}
                  <span style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#004D8D',
                    fontSize: 20,
                    zIndex: 1
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 8L10 13L15 8" stroke="#004D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {isClientDropdownOpen && (
                    <div className="dropdown-list">
                      {filteredClientOptions().map(([name, id]) => (
                        <div
                          key={id}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedClientForLob(id);
                            setClientSearchTerm(name);
                            setIsClientDropdownOpen(false);
                            setSelectedSiteForLob(null);
                            setSiteSearchTerm(''); // Clear site search when client changes
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="client-name-container">
                <label>Select Site</label>
                <div className={`site-searchable-dropdown ${isSiteDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={siteSearchTerm}
                    onChange={(e) => {
                      setSiteSearchTerm(e.target.value);
                      setIsSiteDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (validateClientSelection()) {
                        setIsSiteDropdownOpen(true);
                      }
                    }}
                    placeholder="Search or select a site"
                    className="searchable-input"
                    disabled={!validateClientSelection()}
                    style={{ paddingRight: '56px' }}
                  />
                  {/* Clear button */}
                  {siteSearchTerm && (
                    <button
                      type="button"
                      className="clear-select-btn"
                      onClick={() => {
                        setSiteSearchTerm('');
                        setSelectedSiteForLob(null);
                      }}
                      tabIndex={-1}
                      aria-label="Clear site selection"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {/* Divider */}
                  <span style={{
                    position: 'absolute',
                    right: 36,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: 24,
                    width: 1,
                    background: '#ddd',
                    zIndex: 1
                  }} />
                  {/* Dropdown icon */}
                  <span style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#004D8D',
                    fontSize: 20,
                    zIndex: 1
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 8L10 13L15 8" stroke="#004D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {isSiteDropdownOpen && validateClientSelection() && (
                    <div className="dropdown-list">
                      {filteredSiteOptions().length > 0 ? (
                        filteredSiteOptions().map(site => (
                          <div
                            key={site.id}
                            className="dropdown-item"
                            onClick={() => {
                              setSelectedSiteForLob(site.id);
                              setSiteSearchTerm(site.name);
                              setIsSiteDropdownOpen(false);
                            }}
                          >
                            {site.name}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item no-results">No sites found</div>
                      )}
                    </div>
                  )}
                </div>
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
                        disabled={!validateClientSelection()}
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
                              disabled={!validateClientSelection()}
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
                        disabled={!validateClientSelection()}
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
                      disabled={!validateClientSelection()}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddLob} 
                className="submit-button"
                disabled={
                  !validateClientSelection() || 
                  !lobCardsForLob.some(card => card.lobName.trim()) ||
                  !lobCardsForLob.every(card => 
                    card.lobName.trim() && card.subLobNames.some(name => name.trim())
                  )
                }
              >
                Submit LOB(s)
              </button>
            </div>
            <div className={`tab-content ${activeTab === 'addSubLOB' ? 'active' : ''}`}>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Client</label>
                  <div className={`sublob-client-searchable-dropdown ${isSubLobClientDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={subLobClientSearchTerm}
                      onChange={(e) => {
                        setSubLobClientSearchTerm(e.target.value);
                        setIsSubLobClientDropdownOpen(true);
                        // Clear selected client if search term doesn't match
                        const matchingClient = clients.find(c => c.name === e.target.value);
                        if (!matchingClient) {
                          setFilterClientForSubLob(null);
                          setFilterSiteForSubLob(null);
                          setSubLobSiteSearchTerm('');
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }
                      }}
                      onFocus={() => setIsSubLobClientDropdownOpen(true)}
                      placeholder="Search or select a client"
                      className="searchable-input"
                      style={{ paddingRight: '56px' }}
                    />
                    {/* Clear button */}
                    {subLobClientSearchTerm && (
                      <button
                        type="button"
                        className="clear-select-btn"
                        onClick={() => {
                          setSubLobClientSearchTerm('');
                          setFilterClientForSubLob(null);
                          setFilterSiteForSubLob(null);
                          setSubLobSiteSearchTerm('');
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }}
                        tabIndex={-1}
                        aria-label="Clear client selection"
                      >
                        <FaTimes />
                      </button>
                    )}
                    {/* Divider */}
                    <span style={{
                      position: 'absolute',
                      right: 36,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: 24,
                      width: 1,
                      background: '#ddd',
                      zIndex: 1
                    }} />
                    {/* Dropdown icon */}
                    <span style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#004D8D',
                      fontSize: 20,
                      zIndex: 1
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 8L10 13L15 8" stroke="#004D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {isSubLobClientDropdownOpen && (
                      <div className="dropdown-list">
                        {filteredSubLobClientOptions().map(([name, id]) => (
                          <div
                            key={id}
                            className="dropdown-item"
                            onClick={() => {
                              setFilterClientForSubLob(id);
                              setSubLobClientSearchTerm(name);
                              setIsSubLobClientDropdownOpen(false);
                              // Clear site and LOB selections when client changes
                              setFilterSiteForSubLob(null);
                              setSubLobSiteSearchTerm('');
                              setSelectedLobForSubLob(null);
                              setSubLobLobSearchTerm('');
                            }}
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Select Site</label>
                  <div className={`sublob-site-searchable-dropdown ${isSubLobSiteDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={subLobSiteSearchTerm}
                      onChange={(e) => {
                        setSubLobSiteSearchTerm(e.target.value);
                        setIsSubLobSiteDropdownOpen(true);
                        // Clear site filter if input is empty
                        if (!e.target.value) {
                          setFilterSiteForSubLob(null);
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }
                      }}
                      onFocus={() => {
                        if (validateSubLobClientSelection()) {
                          setIsSubLobSiteDropdownOpen(true);
                        }
                      }}
                      placeholder="Search or select a site"
                      className="searchable-input"
                      disabled={!validateSubLobClientSelection()}
                      style={{ paddingRight: '56px' }}
                    />
                    {/* Clear button */}
                    {subLobSiteSearchTerm && (
                      <button
                        type="button"
                        className="clear-select-btn"
                        onClick={() => {
                          setSubLobSiteSearchTerm('');
                          setFilterSiteForSubLob(null);
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }}
                        tabIndex={-1}
                        aria-label="Clear site selection"
                      >
                        <FaTimes />
                      </button>
                    )}
                    {/* Divider */}
                    <span style={{
                      position: 'absolute',
                      right: 36,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: 24,
                      width: 1,
                      background: '#ddd',
                      zIndex: 1
                    }} />
                    {/* Dropdown icon */}
                    <span style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#004D8D',
                      fontSize: 20,
                      zIndex: 1
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 8L10 13L15 8" stroke="#004D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {isSubLobSiteDropdownOpen && validateSubLobClientSelection() && (
                      <div className="dropdown-list">
                        {filteredSubLobSiteOptions().length > 0 ? (
                          filteredSubLobSiteOptions().map(site => (
                            <div
                              key={site.id}
                              className="dropdown-item"
                              onClick={() => {
                                setFilterSiteForSubLob(site.id);
                                setSubLobSiteSearchTerm(site.name);
                                setIsSubLobSiteDropdownOpen(false);
                                // Clear LOB selection when site changes
                                setSelectedLobForSubLob(null);
                                setSubLobLobSearchTerm('');
                              }}
                            >
                              {site.name}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-item no-results">No sites found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Select LOB</label>
                  <div className={`sublob-lob-searchable-dropdown ${isSubLobLobDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={subLobLobSearchTerm}
                      onChange={(e) => {
                        setSubLobLobSearchTerm(e.target.value);
                        setIsSubLobLobDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (validateSubLobClientSelection()) {
                          setIsSubLobLobDropdownOpen(true);
                        }
                      }}
                      placeholder="Search or select a LOB"
                      className="searchable-input"
                      disabled={!validateSubLobClientSelection()}
                      style={{ paddingRight: '56px' }}
                    />
                    {/* Clear button */}
                    {subLobLobSearchTerm && (
                      <button
                        type="button"
                        className="clear-select-btn"
                        onClick={() => {
                          setSubLobLobSearchTerm('');
                          setSelectedLobForSubLob(null);
                        }}
                        tabIndex={-1}
                        aria-label="Clear LOB selection"
                      >
                        <FaTimes />
                      </button>
                    )}
                    {/* Divider */}
                    <span style={{
                      position: 'absolute',
                      right: 36,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: 24,
                      width: 1,
                      background: '#ddd',
                      zIndex: 1
                    }} />
                    {/* Dropdown icon */}
                    <span style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#004D8D',
                      fontSize: 20,
                      zIndex: 1
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 8L10 13L15 8" stroke="#004D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {isSubLobLobDropdownOpen && validateSubLobClientSelection() && (
                      <div className="dropdown-list">
                        {filteredSubLobLobOptions().length > 0 ? (
                          filteredSubLobLobOptions().map(({ lob, site }, idx) => (
                            <div
                              key={lob.id + '-' + (site ? site.siteId : 'none') + '-' + idx}
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedLobForSubLob(lob.id);
                                setSubLobLobSearchTerm(`${lob.name} (Site: ${site ? site.siteName : 'None'})`);
                                setIsSubLobLobDropdownOpen(false);
                              }}
                            >
                              {`${lob.name} (Site: ${site ? site.siteName : 'None'})`}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-item no-results">No LOBs found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="sub-lob-name-fields-container">
                {subLobNames.map((name, idx) => (
                  <div className="sub-lob-name-fields-row" key={idx}>
                    <div className="sub-lob-name-field">
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label>{`Sub LOB Name${idx > 0 ? ` ${idx + 1}` : ''}`}</label>
                        <div className="sub-lob-input-container" style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleSubLobNameChange2(idx, e.target.value)}
                            disabled={!selectedLobForSubLob}
                            style={idx > 0 ? { paddingRight: '10px', width: '100%', maxWidth: '330px' } : {}}
                          />
                          {idx > 0 && (
                            <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobNameField(idx)}
                              style={{
                                marginLeft: 4,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'red',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%'
                              }}
                              title="Remove Sub LOB"
                            >
                              <FaTimes className="times-icon" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {subLobNames.length < 4 && (
                  <div className="add-lob-card-container">
                    <button 
                      onClick={handleAddAnotherSubLobField} 
                      className="add-lob-card-button"
                      disabled={!selectedLobForSubLob}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
              <div className="lob-actions">
                <button 
                  onClick={handleAddSubLob} 
                  className="add-button"
                  disabled={!subLobNames.some(name => name && name.length > 0) || !selectedLobForSubLob}
                >
                  + Add Sub LOB(s)
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content: Table */}
        <div className="client-management-table-area">
          <div className="white-card table-card">
            <div className="existing-items">
              <h2>Existing Items</h2>

              {/* Tabs and controls in one flex row */}
              <div className="item-status-and-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Tab switcher for Active/Deactivated */}
                <div className="item-status-tabs" style={{ display: 'flex', gap: 16 }}>
                  <div
                    className={`item-status-tab${itemStatusTab === 'ACTIVE' ? ' active' : ''}`}
                    style={{ cursor: 'pointer', fontWeight: itemStatusTab === 'ACTIVE' ? 'bold' : 'normal', color: itemStatusTab === 'ACTIVE' ? '#004D8D' : '#666', borderBottom: itemStatusTab === 'ACTIVE' ? '2px solid #004D8D' : '2px solid transparent', padding: '8px 16px' }}
                    onClick={() => setItemStatusTab('ACTIVE')}
                  >
                    Active
                  </div>
                  <div
                    className={`item-status-tab${itemStatusTab === 'DEACTIVATED' ? ' active' : ''}`}
                    style={{ cursor: 'pointer', fontWeight: itemStatusTab === 'DEACTIVATED' ? 'bold' : 'normal', color: itemStatusTab === 'DEACTIVATED' ? '#004D8D' : '#666', borderBottom: itemStatusTab === 'DEACTIVATED' ? '2px solid #004D8D' : '2px solid transparent', padding: '8px 16px' }}
                    onClick={() => setItemStatusTab('DEACTIVATED')}
                  >
                    Deactivated
                  </div>
                </div>
                {/* Search and filter controls (existing code) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="search-box" style={{ position: 'relative' }}>
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        // Rebuild dropdown suggestions as user types
                        if (value.trim().length === 0) {
                          setSearchFilter(null);
                          setSearchDropdown([]);
                          setSearchDropdownVisible(false);
                          return;
                        }
                        // Gather all matches
                        const lower = value.toLowerCase();
                        const clientMatches = clients
                          .filter(c => c.name && c.name.toLowerCase().includes(lower))
                          .map(c => ({ type: 'client', value: c.name }));
                        const lobMatches = lobs
                          .filter(l => l.name && l.name.toLowerCase().includes(lower))
                          .map(l => ({ type: 'lob', value: l.name }));
                        const subLobMatches = subLobs
                          .filter(s => s.name && s.name.toLowerCase().includes(lower))
                          .map(s => ({ type: 'sublob', value: s.name }));
                        // Remove duplicates by type+value
                        const seen = new Set();
                        const allMatches = [...clientMatches, ...lobMatches, ...subLobMatches].filter(item => {
                          const key = item.type + ':' + item.value.toLowerCase();
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        });
                        setSearchDropdown(allMatches);
                        setSearchDropdownVisible(allMatches.length > 0);
                        // Set filter immediately for dynamic search
                        setSearchFilter({ type: 'partial', value });
                      }}
                      onFocus={() => {
                        if (searchDropdown.length > 0) setSearchDropdownVisible(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setSearchDropdownVisible(false), 150); // Delay to allow click
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim().length > 0 && !searchFilter) {
                          setSearchFilter({ type: 'partial', value: searchTerm });
                          setSearchDropdownVisible(false);
                        }
                      }}
                      style={{ paddingRight: searchTerm ? '30px' : '10px' }}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="clear-select-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setSearchFilter(null);
                          setSearchDropdown([]);
                          setSearchDropdownVisible(false);
                        }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666'
                        }}
                      >
                        <FaTimes size={14} />
                      </button>
                    )}
                    {searchDropdownVisible && searchDropdown.length > 0 && (
                      <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                        {searchDropdown.map((item, idx) => (
                          <div
                            key={item.type + '-' + item.value + '-' + idx}
                            className="search-dropdown-item"
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                            onMouseDown={() => {
                              setSearchTerm(item.value);
                              setSearchFilter({ type: item.type, value: item.value });
                              setSearchDropdownVisible(false);
                            }}
                          >
                            {item.value} {item.type === 'client' ? '(Client)' : item.type === 'lob' ? '(LOB)' : '(Sub LOB)'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
                    <label style={{ marginRight: 8 }}>Filter by Date:</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      style={{ minWidth: 150, height: 32 }}
                    />
                    {filterDate && (
                      <button
                        type="button"
                        onClick={() => setFilterDate('')}
                        style={{ marginLeft: 4, height: 24, width: 24, minWidth: 24, minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', border: '1px solid #ccc', borderRadius: '50%', cursor: 'pointer', padding: 0 }}
                        title="Clear date filter"
                      >
                        <FaTimes size={14} color="red" />
                      </button>
                    )}
                  </div>
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
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTableTab === 'clients' ? (
                      // Flatten all rows into a single array, then sort by Client ID (descending)
                      (() => {
                        let rows = [];
                        filteredClients.forEach(client => {
                          const clientLobs = lobs.filter(lob => lob.clientId === client.id);
                          if (clientLobs.length === 0) {
                            rows.push({
                              clientId: client.id,
                              row: (
                                <tr key={`client-${client.id}-no-lob`}>
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
                                      {itemStatusTab === 'DEACTIVATED' ? (
                                        <button onClick={() => handleReactivateClient('client', client.id)} className="reactivate-btn">
                                          <FaCheckCircle size={14} color="#38a169" /> Reactivate
                                        </button>
                                      ) : (
                                        <button onClick={() => handleDeactivate('client', client.id)} className="deactivate-btn">
                                          <FaBan size={12} /> Deactivate
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            });
                          } else {
                            let filteredLobs = clientLobs;
                            let filteredSubLobs = subLobs;
                            if (searchFilter && searchFilter.type === 'lob') {
                              filteredLobs = clientLobs.filter(lob => safeToLowerCase(lob.name) === safeToLowerCase(searchFilter.value));
                            }
                            if (searchFilter && searchFilter.type === 'sublob') {
                              filteredSubLobs = subLobs.filter(subLob => safeToLowerCase(subLob.name) === safeToLowerCase(searchFilter.value));
                              const allowedLobIds = new Set(filteredSubLobs.map(sl => sl.lobId));
                              filteredLobs = clientLobs.filter(lob => allowedLobIds.has(lob.id));
                            }
                            filteredLobs.forEach(lob => {
                              const lobSubLobs = filteredSubLobs.filter(subLob => subLob.lobId === lob.id);
                              if (lobSubLobs.length === 0 && (!searchFilter || searchFilter.type !== 'sublob')) {
                                rows.push({
                                  clientId: lob.clientRowId,
                                  row: (
                                    <tr key={`client-${client.id}-lob-${lob.id}`}>
                                      <td>{lob.clientRowId}</td>
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
                                          {itemStatusTab === 'DEACTIVATED' ? (
                                            <button onClick={() => handleReactivateLOB('lob', lob.id)} className="reactivate-btn">
                                              <FaCheckCircle size={14} color="#38a169" /> Reactivate
                                            </button>
                                          ) : (
                                            <button onClick={() => handleDeactivate('lob', lob.id)} className="deactivate-btn">
                                              <FaBan size={12} /> Deactivate
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                });
                              } else {
                                lobSubLobs.forEach(subLob => {
                                  rows.push({
                                    clientId: subLob.clientRowId,
                                    row: (
                                      <tr key={`client-${client.id}-lob-${lob.id}-sublob-${subLob.id}`}>
                                        <td>{subLob.clientRowId}</td>
                                        <td>{client.name}</td>
                                        <td>{lob.name}</td>
                                        <td>{subLob.name}</td>
                                        <td>{client.createdAt || '-'}</td>
                                        <td>
                                          <div className="action-buttons">
                                            
                                            {itemStatusTab === 'DEACTIVATED' ? (
                                              <button
                                                onClick={() => {
                                                  if (activeTab === 'addClient') {
                                                    if (activeTableTab === 'clients') {
                                                      handleReactivateClient('client', client.id);
                                                    } else if (activeTableTab === 'lobs') {
                                                      handleReactivateLOB('lob', lob.id);
                                                    } else if (activeTableTab === 'subLobs') {
                                                      handleReactivateSubLOB('subLob', subLob.id);
                                                    }
                                                  } else if (activeTab === 'addLOB') {
                                                    handleReactivateLOB('lob', lob.id);
                                                  } else if (activeTab === 'addSubLOB') {
                                                    handleReactivateSubLOB('subLob', subLob.id);
                                                  } else {
                                                    if (activeTableTab === 'clients') {
                                                      handleReactivateClient('client', client.id);
                                                    } else if (activeTableTab === 'lobs') {
                                                      handleReactivateLOB('lob', lob.id);
                                                    } else if (activeTableTab === 'subLobs') {
                                                      handleReactivateSubLOB('subLob', subLob.id);
                                                    }
                                                  }
                                                }}
                                                className="reactivate-btn"
                                              >
                                                <FaCheckCircle size={14} color="#3182ce" /> Reactivate
                                              </button>
                                            ) : (
                                              <button 
                                              onClick={() => {
                                                if (activeTab === 'addClient') {
                                                  if (activeTableTab === 'clients') {
                                                    handleDeactivateClient('client', client.id);
                                                  } else if (activeTableTab === 'lobs') {
                                                    handleDeleteLob('lob', lob.id);
                                                  } else if (activeTableTab === 'subLobs') {
                                                    handleDelete('subLob', subLob.id);
                                                  }
                                                } else if (activeTab === 'addLOB') {
                                                  handleDeactivateLOB('lob', lob.id);
                                                } else if (activeTab === 'addSubLOB') {
                                                  handleDeactivateSubLOB('subLob', subLob.id);
                                                } else {
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
                                              <FaBan size={12} /> Deactivate
                                            </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  });
                                });
                              }
                            });
                          }
                        });
                        // If partial search, filter the rows themselves for the search term
                        if (searchFilter && searchFilter.type === 'partial') {
                          const lower = searchFilter.value.toLowerCase();
                          rows = rows.filter(({ row }) => {
                            // row.props.children is an array of <td> elements
                            const tds = row.props.children;
                            // Only check the columns for client, lob, sublob name
                            // Client name: tds[1], LOB: tds[2], Sub LOB: tds[3]
                            return [tds[1], tds[2], tds[3]].some(td => {
                              if (!td || !td.props || typeof td.props.children !== 'string') return false;
                              return td.props.children.toLowerCase().includes(lower);
                            });
                          });
                        }
                        // Sort all rows by clientId descending
                        return rows.sort((a, b) => b.clientId - a.clientId).map(r => r.row);
                      })()
                    ) : activeTableTab === 'lobs' ? (
                      // LOB view - show each LOB-SubLOB combination in separate rows
                      lobs
                        .filter(lob => {
                          const client = clients.find(c => c.id === lob.clientId);
                          return client && 
                                client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                (!filterClient || lob.clientId === filterClient);
                        })
                        .sort((a, b) => b.clientRowId - a.clientRowId) // Sort by clientRowId descending
                        .flatMap(lob => {
                          const client = clients.find(c => c.id === lob.clientId);
                          const lobSubLobs = subLobs.filter(subLob => subLob.lobId === lob.id);
                          
                          // If no SubLOBs, show just the LOB
                          if (lobSubLobs.length === 0) {
                            return [(
                              <tr key={`lob-view-${lob.id}`}>
                                <td>{lob.clientRowId}</td> {/* Use just the LOB's clientRowId */}
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
                                    {itemStatusTab === 'DEACTIVATED' ? (
                                      <button onClick={() => handleReactivateLOB('lob', lob.id)} className="reactivate-btn">
                                        <FaCheckCircle size={14} color="#38a169" /> Reactivate
                                      </button>
                                    ) : (
                                      <button onClick={() => handleDeactivate('lob', lob.id)} className="deactivate-btn">
                                        <FaBan size={12} /> Deactivate
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )];
                          }
                          
                          // Otherwise create one row for each SubLOB
                          // Sort lobSubLobs by clientRowId descending
                          const sortedLobSubLobs = [...lobSubLobs].sort((a, b) => b.clientRowId - a.clientRowId);
                          return sortedLobSubLobs.map(subLob => (
                            <tr key={`lob-view-${lob.id}-sublob-${subLob.id}`}>
                              <td>{subLob.clientRowId}</td> {/* Use just the SubLOB's clientRowId */}
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
                                  {itemStatusTab === 'DEACTIVATED' ? (
                                    <button onClick={() => handleReactivateSubLOB('subLob', subLob.id)} className="reactivate-btn">
                                      <FaCheckCircle size={14} color="#38a169" /> Reactivate
                                    </button>
                                  ) : (
                                    <button onClick={() => handleDeactivate('sublob', subLob.id)} className="deactivate-btn">
                                      <FaBan size={12} /> Deactivate
                                    </button>
                                  )}
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
                            (safeToLowerCase(client.name).includes(safeToLowerCase(searchTerm)) ||
                             safeToLowerCase(lob.name).includes(safeToLowerCase(searchTerm)) ||
                             safeToLowerCase(subLob.name).includes(safeToLowerCase(searchTerm))) &&
                            (!filterClient || (lob && lob.clientId === filterClient))
                          );
                        })
                        .sort((a, b) => b.clientRowId - a.clientRowId) // Sort by clientRowId descending
                        .map(subLob => {
                          const lob = lobs.find(l => l.id === subLob.lobId);
                          const client = lob ? clients.find(c => c.id === lob.clientId) : null;
                          
                          return (
                            <tr key={`sublob-${subLob.id}`}>
                              <td>{subLob.clientRowId}</td> {/* Use just the SubLOB's clientRowId */}
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
                                  {itemStatusTab === 'DEACTIVATED' ? (
                                    <button onClick={() => handleReactivateSubLOB('subLob', subLob.id)} className="reactivate-btn">
                                      <FaCheckCircle size={14} color="#38a169" /> Reactivate
                                    </button>
                                  ) : (
                                    <button onClick={() => handleDeactivate('sublob', subLob.id)} className="deactivate-btn">
                                      <FaBan size={12} /> Deactivate
                                    </button>
                                  )}
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
        </div>
      </div>
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
                  value={currentClient.id}
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