import React, { useState, useEffect, useRef } from 'react';
import './ClientManagement.css';
import { FaTrash, FaSearch, FaTimes, FaPencilAlt, FaBan, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

// Generalized CustomModal (already present, but add title prop and children support)
const CustomModal = ({ open, type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', children, requireConfirmation = false }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  // Reset confirmation text and error when modal is opened/closed
  useEffect(() => {
    if (!open) {
      setConfirmationText('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (requireConfirmation && confirmationText !== 'CONFIRM') {
      setError('Please type CONFIRM to proceed');
      return;
    }
    onConfirm();
  };

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal custom-alert-modal" style={{ width: '400px', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div className="modal-header" style={{ padding: '20px 24px 0 24px' }}>
          <h2 style={{ fontSize: 20, color: '#004D8D', fontWeight: 700, margin: 0 }}>{title || (type === 'confirm' ? 'Confirmation' : 'Notification')}</h2>
        </div>
        {/* Divider below the title */}
        <div style={{ borderTop: '1px solid #ececec', margin: '18px 0 0 0' }} />
        <div className="modal-body" style={{ padding: '18px 24px 0 24px', fontSize: 16, color: '#222' }}>
          {message || children}
          {requireConfirmation && (
            <div style={{ marginTop: '22px', marginBottom: 0 }}>
              <label style={{ marginBottom: 6, color: '#444', fontSize: 14, fontWeight: 500, display: 'block', letterSpacing: 0.2 }}>Type <span style={{ fontWeight: 700 }}>CONFIRM</span> to proceed:</label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: error ? '1.5px solid #e53e3e' : '1.5px solid #bdbdbd',
                  borderRadius: '6px',
                  marginBottom: error ? '2px' : '10px',
                  fontSize: 15,
                  outline: 'none',
                  background: '#fafbfc',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                placeholder="Type CONFIRM"
                onFocus={e => e.target.style.borderColor = '#3182ce'}
                onBlur={e => e.target.style.borderColor = error ? '#e53e3e' : '#bdbdbd'}
                autoComplete="off"
              />
              {error && <div style={{ color: '#e53e3e', fontSize: '13px', margin: '0 0 8px 2px', fontWeight: 400 }}>{error}</div>}
            </div>
          )}
        </div>
        {/* Single divider above the buttons */}
        <div style={{ borderTop: '1px solid #ececec', margin: '24px 0 0 0' }} />
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '18px 24px 18px 24px' }}>
          {type === 'confirm' && (
            <button onClick={onCancel} className="cancel-btn" style={{ minWidth: 110, fontWeight: 600, border: '1.5px solid #ddd', background: '#fff', color: '#222', borderRadius: 6, padding: '8px 0', fontSize: 15 }}>Cancel</button>
          )}
          <button 
            onClick={handleConfirm} 
            className="save-btn" 
            style={{ 
              background: '#004D8D', 
              color: '#fff',
              opacity: requireConfirmation && confirmationText !== 'CONFIRM' ? 0.5 : 1,
              minWidth: 120,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              padding: '8px 0',
              fontSize: 15,
              boxShadow: requireConfirmation && confirmationText === 'CONFIRM' ? '0 2px 8px rgba(0,77,141,0.08)' : 'none',
              cursor: requireConfirmation && confirmationText !== 'CONFIRM' ? 'not-allowed' : 'pointer'
            }}
            disabled={requireConfirmation && confirmationText !== 'CONFIRM'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast component for notifications
const Toast = ({ open, message, type = 'success' }) => {
  if (!open) return null;
  return (
    <div className={`custom-toast ${type}`}>
      <span className="toast-icon">{type === 'success' ? '✓' : '✗'}</span>
      <span>{message}</span>
    </div>
  );
};

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('addClient');
  const [clients, setClients] = useState([]);
  const [lobs, setLobs] = useState([]);
  const [subLobs, setSubLobs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add ref for client name input
  const clientNameInputRef = useRef(null);
  // Add ref for client search input in Add LOB tab
  const clientSearchInputRef = useRef(null);
  // Add ref for client search input in Add Sub LOB tab
  const subLobClientSearchInputRef = useRef(null);

  // Add useEffect to focus input when Add Client tab is opened
  useEffect(() => {
    if (activeTab === 'addClient' && clientNameInputRef.current) {
      clientNameInputRef.current.focus();
    }
  }, [activeTab]);

  // Add useEffect to focus client search input when Add LOB tab is opened
  useEffect(() => {
    if (activeTab === 'addLOB' && clientSearchInputRef.current) {
      clientSearchInputRef.current.focus();
      // Don't show dropdown on initial focus
      setIsClientDropdownOpen(false);
    }
  }, [activeTab]);

  // Add useEffect to focus client search input when Add Sub LOB tab is opened
  useEffect(() => {
    if (activeTab === 'addSubLOB' && subLobClientSearchInputRef.current) {
      subLobClientSearchInputRef.current.focus();
      // Don't show dropdown on initial focus
      setIsSubLobClientDropdownOpen(false);
    }
  }, [activeTab]);

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

  // Modal state for alerts/confirmations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('notification'); // 'notification' | 'confirm'
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmText, setModalConfirmText] = useState('OK');
  const [modalCancelText, setModalCancelText] = useState('Cancel');
  const [modalCallback, setModalCallback] = useState(() => () => {});
  const [modalCancelCallback, setModalCancelCallback] = useState(() => () => {});

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Add state for table sorting
  const [tableSort, setTableSort] = useState({ column: null, direction: null }); // direction: 'asc' | 'desc' | null

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  // Helper to show notification modal
  const showNotification = (message, onConfirm) => {
    setModalType('notification');
    setModalMessage(message);
    setModalConfirmText('OK');
    setModalCancelText('');
    setModalCallback(() => () => {
      setModalOpen(false);
      if (onConfirm) onConfirm();
    });
    setModalOpen(true);
  };

  // Helper to show confirmation modal
  const showConfirm = (message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No', requireConfirmation = false) => {
    setModalType('confirm');
    setModalMessage(message);
    setModalConfirmText(confirmText);
    setModalCancelText(cancelText);
    setModalCallback(() => () => {
      setModalOpen(false);
      if (onConfirm) onConfirm();
    });
    setModalCancelCallback(() => () => {
      setModalOpen(false);
      if (onCancel) onCancel();
    });
    setModalOpen(true);
    // Pass requireConfirmation to CustomModal via modalType and confirmText
    // (handled in the CustomModal render)
  };

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
  
  // Helper to format add client confirmation details
  const formatAddClientConfirmation = (clientName, lobCards) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 10, color: '#222' }}><strong>CLIENT:</strong> {clientName}</div>
      {lobCards.map((card, i) => (
        <div key={i} style={{ marginBottom: 8, marginLeft: 0 }}>
          <div style={{ fontWeight: 600, color: '#222', marginBottom: 2 }}>LOB: <span style={{ fontWeight: 500, color: '#222' }}>{card.lobName}</span></div>
          {card.subLobNames && card.subLobNames.filter(name => name.trim()).length > 0 && (
            <div style={{ marginLeft: 18 }}>
              {card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                <div key={j} style={{ fontWeight: 400, color: '#333', marginBottom: 2 }}>
                  Sub LOB: <span style={{ color: '#222' }}>{subLob}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
  
  // Add Client with confirmation
  const handleAddClient = async () => {
    if (clientName.trim() && lobCards.some(card => card.lobName.trim())) {
      showConfirm(
        <span>
          Are you sure you want to add the following:
          {formatAddClientConfirmation(clientName.trim(), lobCards.filter(card => card.lobName.trim()))}
        </span>,
        async () => {
          try {
            // Validate all input fields
            if (!isValidInput(clientName.trim())) {
              showToast('Invalid client name. Only letters, numbers, and single spaces between words are allowed.', 'error');
              return;
            }
            for (const card of lobCards) {
              if (card.lobName.trim() && !isValidInput(card.lobName.trim())) {
                showToast('Invalid LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
                return;
              }
              for (const subLobName of card.subLobNames) {
                if (subLobName.trim() && !isValidInput(subLobName.trim())) {
                  showToast('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
                  return;
                }
              }
            }

            // Check for duplicate LOB names (case-insensitive, trimmed)
            const lobNames = lobCards.map(card => card.lobName.trim().toLowerCase()).filter(name => name);
            const uniqueLobNames = new Set(lobNames);
            if (lobNames.length !== uniqueLobNames.size) {
              showToast('Error: Duplicate LOB names are not allowed.', 'error');
              return;
            }

            // Check for duplicate Sub LOBs across all cards (case-insensitive, trimmed)
            const allSubLobNames = lobCards.flatMap(card => card.subLobNames.map(name => name.trim().toLowerCase()).filter(name => name));
            const uniqueSubLobNames = new Set(allSubLobNames);
            if (allSubLobNames.length !== uniqueSubLobNames.size) {
              showToast('Error: Duplicate Sub LOB names are not allowed across all LOBs.', 'error');
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
              showToast('Error: Duplicate Sub LOB names are not allowed within the same LOB.', 'error');
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
            
            // Send data to API
            const response = await axios.post('http://localhost:3000/api/clients/add', clientData);
            // Refresh client data
            const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
            if (refreshResponse.data && refreshResponse.data.data) {
              // ... transformation logic ...
              // (reuse your transformation logic here)
              const transformedClients = [];
              const transformedLobs = [];
              const transformedSubLobs = [];
              const sitesMap = new Map();
              let lobId = 0;
              let subLobId = 0;
              refreshResponse.data.data.forEach((client) => {
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
              if (sitesMap.size > 0) {
                setSites(Array.from(sitesMap.values()));
              }
            }
            setClientName('');
            setLobCards([{ lobName: '', subLobNames: [''] }]);
            showToast('Client added successfully!');
          } catch (error) {
            console.error('Error adding client:', error);
            showToast(`Failed to add client: ${error.response?.data?.error || error.message}`, 'error');
          }
        },
        () => {} // onCancel
      );
    }
  };

  // Helper to format add LOB confirmation details
  const formatAddLobConfirmation = (clientName, siteName, lobCards) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#222' }}><strong>SITE:</strong> {siteName || 'None'}</div>
      <div style={{ marginBottom: 10, color: '#222' }}><strong>CLIENT:</strong> {clientName}</div>
      {lobCards.map((card, i) => (
        <div key={i} style={{ marginBottom: 8, marginLeft: 0 }}>
          <div style={{ fontWeight: 600, color: '#222', marginBottom: 2 }}>LOB: <span style={{ fontWeight: 500, color: '#222' }}>{card.lobName}</span></div>
          {card.subLobNames && card.subLobNames.filter(name => name.trim()).length > 0 && (
            <div style={{ marginLeft: 18 }}>
              {card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                <div key={j} style={{ fontWeight: 400, color: '#333', marginBottom: 2 }}>
                  Sub LOB: <span style={{ color: '#222' }}>{subLob}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Add LOB with confirmation
  const handleAddLob = async () => {
    if (selectedClientForLob && lobCardsForLob.some(card => card.lobName.trim())) {
      const client = clients.find(c => c.id === selectedClientForLob);
      const site = sites.find(s => s.id === selectedSiteForLob);
      showConfirm(
        <span>
          Are you sure you want to add the following:
          {formatAddLobConfirmation(
            client ? client.name : '',
            site ? site.name : (selectedSiteForLob ? '' : 'None'),
            lobCardsForLob.filter(card => card.lobName.trim())
          )}
        </span>,
        async () => {
          try {
            // ... validation logic ...
            for (const card of lobCardsForLob) {
              if (card.lobName.trim() && !isValidInput(card.lobName.trim())) {
                showToast('Invalid LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
                return;
              }
              for (const subLobName of card.subLobNames) {
                if (subLobName.trim() && !isValidInput(subLobName.trim())) {
                  showToast('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
                  return;
                }
              }
            }
            const hasValidSubLobs = lobCardsForLob.every(card => 
              card.lobName.trim() && card.subLobNames.some(name => name.trim())
            );
            if (!hasValidSubLobs) {
              showToast('Each LOB must have at least one SubLOB', 'error');
              return;
            }
            const lobNames = lobCardsForLob.map(card => card.lobName.trim().toLowerCase()).filter(name => name);
            const uniqueLobNames = new Set(lobNames);
            if (lobNames.length !== uniqueLobNames.size) {
              showToast('Error: Duplicate LOB names are not allowed.', 'error');
              return;
            }
            const allSubLobNames = lobCardsForLob.flatMap(card => card.subLobNames.map(name => name.trim().toLowerCase()).filter(name => name));
            const uniqueSubLobNames = new Set(allSubLobNames);
            if (allSubLobNames.length !== uniqueSubLobNames.size) {
              showToast('Error: Duplicate Sub LOB names are not allowed across all LOBs.', 'error');
              return;
            }
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
              showToast('Error: Duplicate Sub LOB names are not allowed within the same LOB.', 'error');
              return;
            }
            const client = clients.find(c => c.id === selectedClientForLob);
            if (!client) {
              showToast('Selected client not found', 'error');
              return;
            }
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
                showToast('Selected site is not valid for this client', 'error');
                return;
              }
            }
            for (const card of lobCardsForLob) {
              if (card.lobName.trim()) {
                const hasSubLobs = card.subLobNames.some(name => name.trim());
                const lobData = {
                  clientId: client.id,
                  clientName: client.name,
                  lobName: card.lobName.trim(),
                  ...(selectedSiteForLob && { siteId: selectedSiteForLob }),
                  ...(hasSubLobs && { subLOBName: card.subLobNames.find(name => name.trim()) })
                };
                const response = await axios.post('http://localhost:3000/api/clients/lob/add', lobData);
                if (card.subLobNames.length > 1) {
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
            const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
            if (refreshResponse.data && refreshResponse.data.data) {
              // ... transformation logic ...
              const transformedClients = [];
              const transformedLobs = [];
              const transformedSubLobs = [];
              const sitesMap = new Map();
              let lobId = 0;
              let subLobId = 0;
              refreshResponse.data.data.forEach((client) => {
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
              transformedClients.sort((a, b) => a.id - b.id);
              setClients(transformedClients);
              setLobs(transformedLobs);
              setSubLobs(transformedSubLobs);
              const transformedSites = Array.from(sitesMap.values());
              if (transformedSites.length > 0) {
                setSites(transformedSites);
              }
            }
            setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
            setSelectedClientForLob(null);
            setSelectedSiteForLob(null);
            setClientSearchTerm('');
            setSiteSearchTerm('');
            showToast('LOBs added successfully!');
          } catch (error) {
            console.error('Error adding LOB:', error);
            showToast(`Failed to add LOB: ${error.response?.data?.error || error.message}`, 'error');
          }
        },
        () => {} // onCancel
      );
    }
  };

  // Helper to format add Sub LOB confirmation details
  const formatAddSubLobConfirmation = (clientName, siteName, lobName, subLobNames) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#222' }}><strong>SITE:</strong> {siteName || 'None'}</div>
      <div style={{ marginBottom: 8, color: '#222' }}><strong>CLIENT:</strong> {clientName}</div>
      <div style={{ marginBottom: 8, color: '#222' }}><strong>LOB:</strong> {lobName}</div>
      {subLobNames && subLobNames.filter(name => name.trim()).length > 0 && (
        <div style={{ marginLeft: 18 }}>
          {subLobNames.filter(name => name.trim()).map((subLob, j) => (
            <div key={j} style={{ fontWeight: 400, color: '#333', marginBottom: 2 }}>
              Sub LOB: <span style={{ color: '#222' }}>{subLob}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Add Sub LOB with confirmation
  const handleAddSubLob = async () => {
    if (!selectedLobForSubLob) {
      showToast('Please select a LOB', 'error');
      return;
    }
    // Validate all subLobNames
    for (const name of subLobNames) {
      if (name.trim() && !isValidInput(name.trim())) {
        showToast('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
        return;
      }
    }
    const validSubLobs = subLobNames.filter(name => name.trim());
    if (validSubLobs.length === 0) {
      showToast('Please enter at least one valid Sub LOB name', 'error');
      return;
    }

    // Check for duplicate Sub LOB names
    const uniqueSubLobNames = new Set(validSubLobs.map(name => name.trim().toLowerCase()));
    if (uniqueSubLobNames.size !== validSubLobs.length) {
      showToast('Error: Duplicate Sub LOB names are not allowed.', 'error');
      return;
    }

    const lob = lobs.find(l => l.id === selectedLobForSubLob);
    const client = lob ? clients.find(c => c.id === lob.clientId) : null;
    const site = lob && lob.siteId ? sites.find(s => s.id === lob.siteId) : null;
    showConfirm(
      <span>
        Are you sure you want to add the following:
        {formatAddSubLobConfirmation(
          client ? client.name : '',
          site ? site.name : (filterSiteForSubLob ? '' : 'None'),
          lob ? lob.name : '',
          subLobNames
        )}
      </span>,
      async () => {
        try {
          // ... existing code ...
          for (const subLobName of subLobNames) {
            if (subLobName.trim()) {
              try {
                await axios.post('http://localhost:3000/api/clients/sublob/add', {
                  clientName: client.name,
                  lobName: lob.name,
                  subLOBName: subLobName.trim()
                });
              } catch (error) {
                showToast(`Failed to add Sub LOB "${subLobName.trim()}": ${error.response?.data?.error || error.message}`, 'error');
                return;
              }
            }
          }
          // Refresh client data to get updated SubLOBs
          try {
            const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
            if (refreshResponse.data && refreshResponse.data.data) {
              // ... transformation logic ...
              const transformedClients = [];
              const transformedLobs = [];
              const transformedSubLobs = [];
              const sitesMap = new Map();
              let lobId = 0;
              let subLobId = 0;
              refreshResponse.data.data.forEach((client) => {
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
              if (sitesMap.size > 0) {
                setSites(Array.from(sitesMap.values()));
              }
            }
            setSubLobNames(['']);
            setSelectedLobForSubLob(null);
            setFilterClientForSubLob(null);
            setFilterSiteForSubLob(null);
            setSubLobClientSearchTerm('');
            setSubLobSiteSearchTerm('');
            setSubLobLobSearchTerm('');
            showToast('Sub LOBs added successfully!');
          } catch (refreshError) {
            console.error('Error refreshing data:', refreshError);
          }
        } catch (error) {
          showToast(`Failed to add Sub LOB: ${error.response?.data?.error || error.message}`, 'error');
        }
      },
      () => {} // onCancel
    );
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
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to deactivate client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/deactivate', {
            clientName: client.name
          });
          if (response.data) {
            fetchClientData();
            showToast('Client deactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Deactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error deactivating client:', error);
      showToast('Failed to deactivate client: ' + error.message);
    }
  };

  const handleDeactivateLOB = async (type, id) => {
    try {
      const lob = lobs.find(l => l.id === id);
      if (!lob) {
        showNotification('LOB not found');
        return;
      }
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to deactivate LOB "${lob.name}" for client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/lob/deactivate', {
            clientName: client.name,
            lobName: lob.name
          });
          if (response.data) {
            fetchClientData();
            showToast('LOB deactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Deactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error deactivating LOB:', error);
      showToast('Failed to deactivate LOB: ' + error.message);
    }
  };

  const handleDeactivateSubLOB = async (type, id) => {
    try {
      const subLob = subLobs.find(s => s.id === id);
      if (!subLob) {
        showNotification('Sub LOB not found');
        return;
      }
      const lob = lobs.find(l => l.id === subLob.lobId);
      if (!lob) {
        showNotification('LOB not found');
        return;
      }
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to deactivate Sub LOB "${subLob.name}" from LOB "${lob.name}" for client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/sublob/deactivate', {
            clientName: client.name,
            lobName: lob.name,
            subLOBName: subLob.name
          });
          if (response.data) {
            fetchClientData();
            showToast('Sub LOB deactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Deactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error deactivating Sub LOB:', error);
      showToast('Failed to deactivate Sub LOB: ' + error.message);
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
      if (!client) {
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to reactivate client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/reactivate', {
            clientName: client.name
          });
          if (response.data) {
            fetchClientData('DEACTIVATED');
            showToast('Client reactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Reactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error reactivating client:', error);
      showToast('Failed to reactivate client: ' + error.message);
    }
  };

  const handleReactivateLOB = async (type, id) => {
    try {
      const lob = lobs.find(l => l.id === id);
      if (!lob) {
        showNotification('LOB not found');
        return;
      }
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to reactivate LOB "${lob.name}" for client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/lob/reactivate', {
            clientName: client.name,
            lobName: lob.name
          });
          if (response.data) {
            fetchClientData('DEACTIVATED');
            showToast('LOB reactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Reactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error reactivating LOB:', error);
      showToast('Failed to reactivate LOB: ' + error.message);
    }
  };

  const handleReactivateSubLOB = async (type, id) => {
    try {
      const subLob = subLobs.find(s => s.id === id);
      if (!subLob) {
        showNotification('Sub LOB not found');
        return;
      }
      const lob = lobs.find(l => l.id === subLob.lobId);
      if (!lob) {
        showNotification('LOB not found');
        return;
      }
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) {
        showNotification('Client not found');
        return;
      }
      showConfirm(
        `Are you sure you want to reactivate Sub LOB "${subLob.name}" from LOB "${lob.name}" for client "${client.name}"?`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/sublob/reactivate', {
            clientName: client.name,
            lobName: lob.name,
            subLOBName: subLob.name
          });
          if (response.data) {
            fetchClientData('DEACTIVATED');
            showToast('Sub LOB reactivated successfully!');
          }
        },
        () => {}, // onCancel
        'Reactivate',
        'Cancel',
        true // requireConfirmation
      );
    } catch (error) {
      console.error('Error reactivating Sub LOB:', error);
      showToast('Failed to reactivate Sub LOB: ' + error.message);
    }
  };

  // Helper to cycle sort direction
  const getNextSortDirection = (current) => {
    if (current === null) return 'asc';
    if (current === 'asc') return 'desc';
    return null;
  };

  // Helper to sort rows
  const sortRows = (rows, column, direction) => {
    if (!column || !direction) return rows;
    return [...rows].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];
      // For string comparison, ignore case
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
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
                  ref={clientNameInputRef}
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  style={{ 
                    outline: 'none',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    width: '100%',
                    transition: 'border-color 0.2s ease-in-out'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#004D8D';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ccc';
                  }}
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
                    ref={clientSearchInputRef}
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
                    onFocus={(e) => {
                      e.target.style.borderColor = '#004D8D';
                      // Only show dropdown if there's a search term or user explicitly clicked
                      if (clientSearchTerm) {
                        setIsClientDropdownOpen(true);
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ccc';
                    }}
                    onClick={() => {
                      // Show dropdown when user clicks the input
                      setIsClientDropdownOpen(true);
                    }}
                    placeholder="Search or select a client"
                    className="searchable-input"
                    style={{ 
                      paddingRight: '56px',
                      outline: 'none',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      width: '100%',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
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
                      ref={subLobClientSearchInputRef}
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
                      onFocus={(e) => {
                        e.target.style.borderColor = '#004D8D';
                        // Only show dropdown if there's a search term or user explicitly clicked
                        if (subLobClientSearchTerm) {
                          setIsSubLobClientDropdownOpen(true);
                        }
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#ccc';
                      }}
                      onClick={() => {
                        // Show dropdown when user clicks the input
                        setIsSubLobClientDropdownOpen(true);
                      }}
                      placeholder="Search or select a client"
                      className="searchable-input"
                      style={{ 
                        paddingRight: '56px',
                        outline: 'none',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        width: '100%',
                        transition: 'border-color 0.2s ease-in-out'
                      }}
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
                      {['clientId', 'name', 'lob', 'subLob', 'createdAt'].map((col, idx) => {
                        const colMap = {
                          clientId: 'Client ID',
                          name: 'Client Name',
                          lob: 'LOB',
                          subLob: 'Sub LOB',
                          createdAt: 'Created At',
                        };
                        // Show sort indicator
                        let indicator = '';
                        if (tableSort.column === col) {
                          indicator = tableSort.direction === 'asc' ? ' ▲' : tableSort.direction === 'desc' ? ' ▼' : '';
                        }
                        return (
                          <th
                            key={col}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => {
                              setTableSort(prev => {
                                const nextDir = prev.column === col ? getNextSortDirection(prev.direction) : 'asc';
                                return { column: nextDir ? col : null, direction: nextDir };
                              });
                            }}
                          >
                            {colMap[col]}{indicator}
                          </th>
                        );
                      })}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTableTab === 'clients' ? (
                      (() => {
                        // Build row data objects
                        let rowData = [];
                        filteredClients.forEach(client => {
                          const clientLobs = lobs.filter(lob => lob.clientId === client.id);
                          if (clientLobs.length === 0) {
                            rowData.push({
                              clientId: client.id,
                              name: client.name,
                              lob: '',
                              subLob: '',
                              createdAt: client.createdAt || '-',
                              jsx: (
                                <tr key={`client-${client.id}-no-lob`}>
                                  <td>{client.id}</td>
                                  <td>{client.name}</td>
                                  <td>-</td>
                                  <td>-</td>
                                  <td>{client.createdBy || '-'}</td>
                                  <td>{client.createdAt || '-'}</td>
                                  <td>
                                    <div className="action-buttons">
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
                                rowData.push({
                                  clientId: lob.clientRowId,
                                  name: client.name,
                                  lob: lob.name,
                                  subLob: '',
                                  createdAt: client.createdAt || '-',
                                  jsx: (
                                    <tr key={`client-${client.id}-lob-${lob.id}`}>
                                      <td>{lob.clientRowId}</td>
                                      <td>{client.name}</td>
                                      <td>{lob.name}</td>
                                      <td>-</td>
                                      <td>{client.createdBy || '-'}</td>
                                      <td>{client.createdAt || '-'}</td>
                                      <td>
                                        <div className="action-buttons">
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
                                  rowData.push({
                                    clientId: subLob.clientRowId,
                                    name: client.name,
                                    lob: lob.name,
                                    subLob: subLob.name,
                                    createdAt: client.createdAt || '-',
                                    jsx: (
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
                                                    handleDelete('lob', lob.id);
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
                        // Dynamic search for partial search
                        if (searchFilter && searchFilter.type === 'partial') {
                          const lower = searchFilter.value.toLowerCase();
                          rowData = rowData.filter(r =>
                            [r.name, r.lob, r.subLob].some(val =>
                              typeof val === 'string' && val.toLowerCase().includes(lower)
                            )
                          );
                        }
                        // Sort rowData if needed
                        if (tableSort.column && tableSort.direction) {
                          rowData = sortRows(rowData, tableSort.column, tableSort.direction);
                        }
                        return rowData.map(r => r.jsx);
                      })()
                    ) : activeTableTab === 'lobs' ? (
                      (() => {
                        // Build row data objects for LOBs
                        let rowData = lobs
                          .filter(lob => {
                            const client = clients.find(c => c.id === lob.clientId);
                            return client && 
                                  client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                  (!filterClient || lob.clientId === filterClient);
                          })
                          .sort((a, b) => b.clientRowId - a.clientRowId)
                          .flatMap(lob => {
                            const client = clients.find(c => c.id === lob.clientId);
                            const lobSubLobs = subLobs.filter(subLob => subLob.lobId === lob.id);
                            if (lobSubLobs.length === 0) {
                              return [{
                                clientId: lob.clientRowId,
                                name: client ? client.name : '-',
                                lob: lob.name,
                                subLob: '',
                                createdAt: client ? client.createdAt : '-',
                                jsx: (
                                  <tr key={`lob-view-${lob.id}`}>
                                    <td>{lob.clientRowId}</td>
                                    <td>{client ? client.name : '-'}</td>
                                    <td>{lob.name}</td>
                                    <td>-</td>
                                    <td>{client ? client.createdBy : '-'}</td>
                                    <td>{client ? client.createdAt : '-'}</td>
                                    <td>
                                      <div className="action-buttons">
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
                              }];
                            }
                            const sortedLobSubLobs = [...lobSubLobs].sort((a, b) => b.clientRowId - a.clientRowId);
                            return sortedLobSubLobs.map(subLob => ({
                              clientId: subLob.clientRowId,
                              name: client ? client.name : '-',
                              lob: lob.name,
                              subLob: subLob.name,
                              createdAt: client ? client.createdAt : '-',
                              jsx: (
                                <tr key={`lob-view-${lob.id}-sublob-${subLob.id}`}>
                                  <td>{subLob.clientRowId}</td>
                                  <td>{client ? client.name : '-'}</td>
                                  <td>{lob.name}</td>
                                  <td>{subLob.name}</td>
                                  <td>{client ? client.createdBy : '-'}</td>
                                  <td>{client ? client.createdAt : '-'}</td>
                                  <td>
                                    <div className="action-buttons">
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
                              )
                            }));
                          });
                        // Dynamic search for partial search
                        if (searchFilter && searchFilter.type === 'partial') {
                          const lower = searchFilter.value.toLowerCase();
                          rowData = rowData.filter(r =>
                            [r.name, r.lob, r.subLob].some(val =>
                              typeof val === 'string' && val.toLowerCase().includes(lower)
                            )
                          );
                        }
                        // Sort rowData if needed
                        if (tableSort.column && tableSort.direction) {
                          rowData = sortRows(rowData, tableSort.column, tableSort.direction);
                        }
                        return rowData.map(r => r.jsx);
                      })()
                    ) : (
                      (() => {
                        // Build row data objects for SubLOBs
                        let rowData = subLobs
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
                          .sort((a, b) => b.clientRowId - a.clientRowId)
                          .map(subLob => {
                            const lob = lobs.find(l => l.id === subLob.lobId);
                            const client = lob ? clients.find(c => c.id === lob.clientId) : null;
                            return {
                              clientId: subLob.clientRowId,
                              name: client ? client.name : '-',
                              lob: lob ? lob.name : '-',
                              subLob: subLob.name,
                              createdAt: client ? client.createdAt : '-',
                              jsx: (
                                <tr key={`sublob-${subLob.id}`}>
                                  <td>{subLob.clientRowId}</td>
                                  <td>{client ? client.name : '-'}</td>
                                  <td>{lob ? lob.name : '-'}</td>
                                  <td>{subLob.name}</td>
                                  <td>{client ? client.createdBy : '-'}</td>
                                  <td>{client ? client.createdAt : '-'}</td>
                                  <td>
                                    <div className="action-buttons">
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
                              )
                            };
                          });
                        // Dynamic search for partial search
                        if (searchFilter && searchFilter.type === 'partial') {
                          const lower = searchFilter.value.toLowerCase();
                          rowData = rowData.filter(r =>
                            [r.name, r.lob, r.subLob].some(val =>
                              typeof val === 'string' && val.toLowerCase().includes(lower)
                            )
                          );
                        }
                        // Sort rowData if needed
                        if (tableSort.column && tableSort.direction) {
                          rowData = sortRows(rowData, tableSort.column, tableSort.direction);
                        }
                        return rowData.map(r => r.jsx);
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <CustomModal
        open={modalOpen}
        type={modalType}
        title={modalType === 'confirm' ? 'Confirmation' : 'Notification'}
        message={modalMessage}
        onConfirm={modalCallback}
        onCancel={modalCancelCallback}
        confirmText={modalConfirmText}
        cancelText={modalCancelText}
        requireConfirmation={modalType === 'confirm' && (modalConfirmText === 'Deactivate' || modalConfirmText === 'Reactivate')}
      />
      <Toast open={toastOpen} message={toastMessage} type={toastType} />
    </div>
  );
};

export default ClientManagement;