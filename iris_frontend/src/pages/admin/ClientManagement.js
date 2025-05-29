import React, { useState, useEffect, useRef } from 'react';
import './ClientManagement.css';
import { FaTrash, FaSearch, FaTimes, FaPencilAlt, FaBan, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

// Generalized CustomModal (already present, but add title prop and children support)
const CustomModal = ({ open, type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', children, requireConfirmation = false }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmationText('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    const requiredWord = 'CONFIRM';
    if (requireConfirmation && confirmationText !== requiredWord) {
      setError(`Please type CONFIRM to proceed`);
      return;
    }
    onConfirm();
  };

  if (!open) return null;

  const isDeactivate = confirmText === 'Deactivate';
  const isReactivate = confirmText === 'Reactivate';
  const headerColor = isDeactivate ? '#e53e3e' : isReactivate ? '#3182ce' : '#004D8D';
  const icon = isDeactivate ? <FaBan size={22} color={headerColor} style={{ marginRight: 8, marginBottom: -3 }} /> : isReactivate ? <FaCheckCircle size={22} color={headerColor} style={{ marginRight: 8, marginBottom: -3 }} /> : null;
  const headerText = isDeactivate ? 'Confirm Deactivation' : isReactivate ? 'Confirm Reactivation' : (title || (type === 'confirm' ? 'Confirmation' : 'Notification'));
  const requiredWord = 'CONFIRM';
  const inputPlaceholder = 'CONFIRM';
  const actionButtonText = isDeactivate ? 'Deactivate' : isReactivate ? 'Reactivate' : confirmText;

  // Helper to render summary details in modal
  function renderSummaryBox(message, selectedCount) {
    // Bulk action: message is an object with type 'bulk' and items array
    if (message && typeof message === 'object' && message.type === 'bulk' && Array.isArray(message.items)) {
      return (
        <div style={{ lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Selected Items:</div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '33%' }} />
                <col style={{ width: '33%' }} />
                <col style={{ width: '34%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Client</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>LOB</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Sub LOB</th>
                </tr>
              </thead>
              <tbody>
                {message.items.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fafbfc' : '#fff' }}>
                    <td style={{ padding: '4px 8px', wordBreak: 'break-word' }}>{item.client || '-'}</td>
                    <td style={{ padding: '4px 8px', wordBreak: 'break-word' }}>{item.lob || '-'}</td>
                    <td style={{ padding: '4px 8px', wordBreak: 'break-word' }}>{item.subLob || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    // Bulk action: message contains 'selected item' or 'selected items'
    if (typeof message === 'string' && /selected item/i.test(message)) {
      return (
        <div style={{ lineHeight: 1.7 }}>
          <b>Selected Items:</b> {selectedCount}
        </div>
      );
    }
    // If message is a string with Client, LOB, Sub LOB, format it
    if (typeof message === 'string' && message.includes('Client:')) {
      const clientMatch = message.match(/Client:\s*"([^"]*)"/);
      const lobMatch = message.match(/LOB:\s*"([^"]*)"/);
      const subLobMatch = message.match(/Sub LOB:\s*"([^"]*)"/);
      return (
        <div style={{ lineHeight: 1.7 }}>
          <div><b>Client:</b> {clientMatch ? clientMatch[1] : ''}</div>
          <div><b>LOB:</b> {lobMatch ? lobMatch[1] : ''}</div>
          {subLobMatch && <div><b>Sub LOB:</b> {subLobMatch[1]}</div>}
        </div>
      );
    }
    return message;
  }

  // In CustomModal, add a prop or logic to get selectedCount for bulk actions
  // For now, infer from message
  const selectedCount = (typeof message === 'string' && message.match(/(\d+) selected item/)) ? Number(message.match(/(\d+) selected item/)[1]) : 1;

  return (
    <div className="modal-overlay">
      <div className="modal custom-alert-modal" style={{ width: '560px', minWidth: '520px', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 0 }}>
        {/* Header row: icon/title left, close right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon}
            <h2 style={{ fontSize: 20, color: headerColor, fontWeight: 700, margin: 0 }}>{headerText}</h2>
          </div>
          {/* Remove the X (close) button from the upper right corner */}
          {/* <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer', marginLeft: 8 }}><FaTimes /></button> */}
        </div>
        {/* Divider below the title */}
        <div style={{ borderTop: '1px solid #ececec', margin: '18px 0 0 0' }} />
        <div className="modal-body" style={{ padding: '18px 24px 0 24px', fontSize: 15, color: '#222', textAlign: 'left' }}>
          {/* Main message */}
          <div style={{ marginBottom: 14, color: '#222', fontSize: 15 }}>
            {/* Bulk action message */}
            {((isDeactivate || isReactivate) && typeof message === 'object' && message.type === 'bulk') ? (
              <span>You are about to {isDeactivate ? 'deactivate' : 'reactivate'} {message.count} item{message.count === 1 ? '' : 's'}. Type <b>CONFIRM</b> to proceed.</span>
            ) : ((isDeactivate || isReactivate) && typeof message === 'string' && /selected item/i.test(message)) ? (
              <span>You are about to {isDeactivate ? 'deactivate' : 'reactivate'} selected items. Type <b>CONFIRM</b> to proceed.</span>
            ) : isDeactivate ? (
              <span>You are about to deactivate 1 item. This action cannot be undone. Type <b>CONFIRM</b> to proceed.</span>
            ) : isReactivate ? (
              <span>You are about to reactivate 1 item. Type <b>CONFIRM</b> to proceed.</span>
            ) : (message || children)}
          </div>
          {/* Summary box */}
          {((isDeactivate || isReactivate) && message) && (
            <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '13px 14px', fontSize: 14, color: '#333', marginBottom: 16, whiteSpace: 'pre-line' }}>
              {renderSummaryBox(message, selectedCount)}
            </div>
          )}
          {/* Confirmation input */}
          {requireConfirmation && (
            <div style={{ marginTop: 0, marginBottom: 4 }}>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => {
                  // Only allow alphabetic characters, max 7 chars
                  let val = e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 7);
                  setConfirmationText(val);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: error ? '1.5px solid #e53e3e' : '1.5px solid #bdbdbd',
                  borderRadius: '6px',
                  marginBottom: error ? '2px' : '4px',
                  fontSize: 15,
                  outline: 'none',
                  background: '#fff',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                placeholder={inputPlaceholder}
                maxLength={7}
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
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '18px 24px 18px 24px' }}>
          <button onClick={onCancel} className="cancel-btn" style={{ flex: 1, fontWeight: 600, border: '1.5px solid #ddd', background: '#fff', color: '#222', borderRadius: 6, padding: '12px 0', fontSize: 15, minWidth: 0 }}>Cancel</button>
          <button 
            onClick={handleConfirm} 
            className="save-btn" 
            style={{ 
              background: headerColor, 
              color: '#fff',
              opacity: requireConfirmation && confirmationText !== requiredWord ? 0.5 : 1,
              flex: 1,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              padding: '12px 0',
              fontSize: 15,
              minWidth: 0,
              boxShadow: requireConfirmation && confirmationText === requiredWord ? '0 2px 8px rgba(0,77,141,0.08)' : 'none',
              cursor: requireConfirmation && confirmationText !== requiredWord ? 'not-allowed' : 'pointer'
            }}
            disabled={requireConfirmation && confirmationText !== requiredWord}
          >
            {actionButtonText}
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
  // Add ref for date input
  const dateInputRef = useRef(null);

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

  // Add new state for selected rows
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Add state for active and deactivated counts
  const [activeCount, setActiveCount] = useState(0);
  const [deactivatedCount, setDeactivatedCount] = useState(0);

  // Add state to track last selected row index
  const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState(null);

  // Add state for date input cursor
  const [dateInputCursor, setDateInputCursor] = useState('default');

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
      setSites(transformedSites.length > 0 ? transformedSites : []);
      
      // Calculate row count based on how they're displayed in the UI
      let rowCount = 0;
      
      transformedClients.forEach(client => {
        const clientLobs = transformedLobs.filter(lob => lob.clientId === client.id);
        if (clientLobs.length === 0) {
          // Client with no LOBs is just one row
          rowCount++;
        } else {
          // For each LOB, count either the LOB itself or all its SubLOBs
          clientLobs.forEach(lob => {
            const lobSubLobs = transformedSubLobs.filter(subLob => subLob.lobId === lob.id);
            if (lobSubLobs.length === 0) {
              // LOB with no SubLOBs is one row
              rowCount++;
            } else {
              // Each SubLOB is a separate row
              rowCount += lobSubLobs.length;
            }
          });
        }
      });
      
      // Update the appropriate count based on status
      if (status === 'ACTIVE') {
        setActiveCount(rowCount);
      } else if (status === 'DEACTIVATED') {
        setDeactivatedCount(rowCount);
      }
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

  // On mount, fetch both counts
  useEffect(() => {
    fetchClientData('ACTIVE');
    fetchClientData('DEACTIVATED');
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
  
  // Utility function to validate input (no emojis, no special chars, only alphanumeric and single spaces between words)
  const isValidInput = (str) => {
    // Regex: only alphanumeric and single spaces between words, no leading/trailing/multiple spaces, no emojis/special chars
    return /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/.test(str);
  };
  
  // Helper to format add client confirmation details
  const formatAddClientConfirmation = (clientName, lobCards) => {
    const darkBlue = '#636363';
    // LOBs with both a name and at least one sub LOB
    const validLobCards = lobCards.filter(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()));
    // LOBs that are incomplete: missing LOB name, missing Sub LOB, or both
    const ignoredLobCards = lobCards.filter(card => !card.lobName.trim() || !card.subLobNames.some(name => name.trim()));

    // Check if any ignored card has sub lobs but no lob name
    const hasNoLobWithSubLobs = ignoredLobCards.some(card => !card.lobName.trim() && card.subLobNames.some(name => name.trim()));

    return (
      <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '18px 20px', fontSize: 15 }}>
        <div style={{ marginBottom: 14, color: darkBlue, fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>
          CLIENT: <span style={{ fontWeight: 400, color: darkBlue }}>{clientName}</span>
        </div>
        {validLobCards.map((card, i) => (
          <div key={i} style={{ marginBottom: 12, marginLeft: 0, paddingLeft: 8, borderLeft: `3px solid ${darkBlue}`, background: '#fff', borderRadius: 4, boxShadow: '0 1px 4px rgba(25, 118, 210, 0.04)', paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ fontWeight: 700, color: darkBlue, marginBottom: 4, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: darkBlue, borderRadius: '50%' }}></span>
              LOB: <span style={{ fontWeight: 400, color: darkBlue, marginLeft: 4 }}>{card.lobName}</span>
            </div>
            {card.subLobNames && card.subLobNames.filter(name => name.trim()).length > 0 && (
              <ul style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, paddingLeft: 0, listStyle: 'disc', color: darkBlue }}>
                {card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                  <li key={j} style={{ fontWeight: 700, color: darkBlue, fontSize: 14, marginBottom: 2, marginLeft: 0 }}>
                    Sub LOB: <span style={{ fontWeight: 400, color: darkBlue }}>{subLob}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {ignoredLobCards.length > 0 && (
          <div style={{ marginTop: 18, color: '#b10000', background: '#fff3f3', padding: '12px 16px', borderRadius: 6, border: '1px solid #ffd6d6', fontSize: 14 }}>
            <strong>Note:</strong> The following {hasNoLobWithSubLobs ? 'Sub LOB(s)' : 'LOB(s)'} will <u>not</u> be added because they are incomplete:
            <ul style={{ margin: '8px 0 0 18px', color: '#b10000' }}>
              {ignoredLobCards.map((card, i) => {
                if (!card.lobName.trim() && card.subLobNames.some(name => name.trim())) {
                  // For each sub lob, show 'No LOB provided: [Sub LOB Name]'
                  return card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                    <li key={i + '-' + j}>(No LOB Name): {subLob}</li>
                  ));
                } else if (card.lobName.trim() && !card.subLobNames.some(name => name.trim())) {
                  // LOB name present but no Sub LOB
                  return <li key={i}>{card.lobName}: (No Sub LOB)</li>;
                } else if (!card.lobName.trim() && !card.subLobNames.some(name => name.trim())) {
                  // Both missing
                  return <li key={i}>(No LOB Name): (No Sub LOB)</li>;
                }
                return null;
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Add Client with confirmation
  const handleAddClient = async () => {
    const finalizedClientName = finalizeInput(clientName);
    const finalizedLobCards = lobCards.map(card => ({
      lobName: finalizeInput(card.lobName),
      subLobNames: card.subLobNames.map(name => finalizeInput(name)),
    }));
    if (finalizedClientName.trim() && finalizedLobCards.some(card => card.lobName.trim())) {
      showConfirm(
        <span>
          Are you sure you want to add the following:
          {formatAddClientConfirmation(finalizedClientName, finalizedLobCards)}
        </span>,
        async () => {
          try {
            // Validate all input fields
            if (!isValidInput(finalizedClientName)) {
              showToast('Invalid client name. Only letters, numbers, and single spaces between words are allowed.', 'error');
              return;
            }
            for (const card of finalizedLobCards) {
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

            // Check for duplicate client name (case/space insensitive)
            if (clients.some(c => normalizeName(c.name) === normalizeName(finalizedClientName))) {
              showToast('Error: Client name already exists.', 'error');
              return;
            }
            // Check for duplicate LOB names (case-insensitive, trimmed, space-insensitive)
            const lobNames = finalizedLobCards.map(card => normalizeName(card.lobName)).filter(name => name);
            const uniqueLobNames = new Set(lobNames);
            if (lobNames.length !== uniqueLobNames.size) {
              showToast('Error: Duplicate LOB names are not allowed.', 'error');
              return;
            }
            // Check for duplicate Sub LOBs across all cards (case-insensitive, trimmed, space-insensitive)
            const allSubLobNames = finalizedLobCards.flatMap(card => card.subLobNames.map(name => normalizeName(name)).filter(name => name));
            const uniqueSubLobNames = new Set(allSubLobNames);
            if (allSubLobNames.length !== uniqueSubLobNames.size) {
              showToast('Error: Duplicate Sub LOB names are not allowed across all LOBs.', 'error');
              return;
            }
            // Check for duplicate Sub LOBs within each LOB (already present)
            const hasDuplicateSubLobs = finalizedLobCards.some(card => {
              const uniqueSubLobs = new Set();
              return card.subLobNames.some(subLobName => {
                const norm = normalizeName(subLobName);
                if (norm && uniqueSubLobs.has(norm)) {
                  return true; // Found a duplicate
                }
                if (norm) {
                  uniqueSubLobs.add(norm);
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
              clientName: finalizedClientName,
              LOBs: []
            };
            
            // Add LOBs and SubLOBs
            finalizedLobCards.forEach(card => {
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
  const formatAddLobConfirmation = (clientName, siteName, lobCards) => {
    const darkBlue = '#636363';
    // LOBs with both a name and at least one sub LOB
    const validLobCards = lobCards.filter(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()));
    // LOBs that are incomplete: missing LOB name, missing Sub LOB, or both
    const ignoredLobCards = lobCards.filter(card => !card.lobName.trim() || !card.subLobNames.some(name => name.trim()));
    // Check if any ignored card has sub lobs but no lob name
    const hasNoLobWithSubLobs = ignoredLobCards.some(card => !card.lobName.trim() && card.subLobNames.some(name => name.trim()));

    return (
      <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '18px 20px', fontSize: 15 }}>
        <div style={{ marginBottom: 8, color: darkBlue, fontWeight: 700, fontSize: 15 }}>
          CLIENT: <span style={{ fontWeight: 400, color: darkBlue }}>{clientName}</span>
        </div>
        <div style={{ marginBottom: 14, color: darkBlue, fontWeight: 700, fontSize: 15 }}>
          SITE: <span style={{ fontWeight: 400, color: darkBlue }}>{siteName || 'None'}</span>
        </div>
        {validLobCards.map((card, i) => (
          <div key={i} style={{ marginBottom: 12, marginLeft: 0, paddingLeft: 8, borderLeft: `3px solid ${darkBlue}`, background: '#fff', borderRadius: 4, boxShadow: '0 1px 4px rgba(25, 118, 210, 0.04)', paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ fontWeight: 700, color: darkBlue, marginBottom: 4, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: darkBlue, borderRadius: '50%' }}></span>
              LOB: <span style={{ fontWeight: 400, color: darkBlue, marginLeft: 4 }}>{card.lobName}</span>
            </div>
            {card.subLobNames && card.subLobNames.filter(name => name.trim()).length > 0 && (
              <ul style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, paddingLeft: 0, listStyle: 'disc', color: darkBlue }}>
                {card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                  <li key={j} style={{ fontWeight: 700, color: darkBlue, fontSize: 14, marginBottom: 2, marginLeft: 0 }}>
                    Sub LOB: <span style={{ fontWeight: 400, color: darkBlue }}>{subLob}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {ignoredLobCards.length > 0 && (
          <div style={{ marginTop: 18, color: '#b10000', background: '#fff3f3', padding: '12px 16px', borderRadius: 6, border: '1px solid #ffd6d6', fontSize: 14 }}>
            <strong>Note:</strong> The following {hasNoLobWithSubLobs ? 'Sub LOB(s)' : 'LOB(s)'} will <u>not</u> be added because they are incomplete:
            <ul style={{ margin: '8px 0 0 18px', color: '#b10000' }}>
              {ignoredLobCards.map((card, i) => {
                if (!card.lobName.trim() && card.subLobNames.some(name => name.trim())) {
                  // For each sub lob, show 'No LOB provided: [Sub LOB Name]'
                  return card.subLobNames.filter(name => name.trim()).map((subLob, j) => (
                    <li key={i + '-' + j}>(No LOB Name): {subLob}</li>
                  ));
                } else if (card.lobName.trim() && !card.subLobNames.some(name => name.trim())) {
                  // LOB name present but no Sub LOB
                  return <li key={i}>{card.lobName}: (No Sub LOB)</li>;
                } else if (!card.lobName.trim() && !card.subLobNames.some(name => name.trim())) {
                  // Both missing
                  return <li key={i}>(No LOB Name): (No Sub LOB)</li>;
                }
                return null;
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Add LOB with confirmation
  const handleAddLob = async () => {
    const finalizedLobCardsForLob = lobCardsForLob.map(card => ({
      lobName: finalizeInput(card.lobName),
      subLobNames: card.subLobNames.map(name => finalizeInput(name)),
    }));
    try {
      if (!selectedClientForLob) {
        showToast('Please select a client', 'error');
                return;
              }

      if (finalizedLobCardsForLob.length === 0) {
        showToast('Please add at least one LOB', 'error');
                  return;
                }

      // Validate all LOB cards
      const validLobCards = finalizedLobCardsForLob.filter(card => {
        const lobName = card.lobName.trim();
        const subLobNames = card.subLobNames.filter(name => name.trim());
        return lobName && subLobNames.length > 0;
      });

      if (validLobCards.length === 0) {
        showToast('Please fill in all LOB and Sub LOB fields', 'error');
              return;
            }

      // Format confirmation message
      const confirmationMessage = formatAddLobConfirmation(
        clients.find(c => c.id === selectedClientForLob)?.name || '',
        selectedSiteForLob ? sites.find(s => s.id === selectedSiteForLob)?.name : 'No Site',
        validLobCards
      );

      // Show confirmation modal
      showConfirm(
        confirmationMessage,
        async () => {
          try {
            const client = clients.find(c => c.id === selectedClientForLob);
            if (!client) {
              showToast('Client not found', 'error');
              return;
            }

            const lobs = client.lobs || [];
            let allOperationsSuccessful = true;

            for (const card of validLobCards) {
              const lobName = card.lobName.trim();
              const subLobNames = card.subLobNames.filter(name => name.trim());
              const existingLob = lobs.find(lob => lob.clientId === client.id && lob.name === lobName);

              if (!existingLob) {
                if (subLobNames.length > 0) {
                  const lobData = {
                    clientName: client.name,
                    lobName: lobName,
                    siteId: selectedSiteForLob ? selectedSiteForLob : null,
                    subLOBName: subLobNames[0]
                  };

                  try {
                  await axios.post('http://localhost:3000/api/clients/lob/add', lobData);
                  } catch (error) {
                    showToast(error.response?.data?.error || 'Failed to add LOB', 'error');
                    allOperationsSuccessful = false;
                    break;
                  }

                  // Add remaining sub LOBs if any
                  for (let i = 1; i < subLobNames.length; i++) {
                    const subLobData = {
                      clientName: client.name,
                      lobName: lobName,
                      subLOBName: subLobNames[i]
                    };

                    try {
                    await axios.post('http://localhost:3000/api/clients/sublob/add', subLobData);
                    } catch (error) {
                      showToast(error.response?.data?.error || 'Failed to add Sub LOB', 'error');
                      allOperationsSuccessful = false;
                      break;
                    }
                  }
                }
              } else {
                // Add only new sub LOBs to existing LOB
                const existingSubLobs = existingLob.subLobs.map(sub => sub.name.toLowerCase());
                for (const subLobName of subLobNames) {
                  if (!existingSubLobs.includes(subLobName.trim().toLowerCase())) {
                    const subLobData = {
                      clientName: client.name,
                      lobName: lobName,
                      subLOBName: subLobName
                    };

                    try {
                    await axios.post('http://localhost:3000/api/clients/sublob/add', subLobData);
                    } catch (error) {
                      showToast(error.response?.data?.error || 'Failed to add Sub LOB', 'error');
                      allOperationsSuccessful = false;
                      break;
                    }
                  }
                }
              }
            }

            if (allOperationsSuccessful) {
              showToast('LOBs and Sub LOBs added successfully!');
            setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
            setSelectedClientForLob(null);
            setSelectedSiteForLob(null);
              fetchClientData();
            }
          } catch (error) {
            showToast(error.response?.data?.error || 'An error occurred', 'error');
          }
        }
      );
    } catch (error) {
      showToast(error.response?.data?.error || 'An error occurred', 'error');
    }
  };

  // Helper to format add Sub LOB confirmation details
  const formatAddSubLobConfirmation = (clientName, siteName, lobName, subLobNames) => {
    const darkBlue = '#636363';
    // Only include sub lobs with a name
    const validSubLobs = subLobNames.filter(name => name && name.trim());
    // Incomplete sub lobs (empty or whitespace)
    const ignoredSubLobs = subLobNames.filter(name => !name || !name.trim());

    return (
      <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '18px 20px', fontSize: 15 }}>
        <div style={{ marginBottom: 8, color: darkBlue, fontWeight: 700, fontSize: 15 }}>
          CLIENT: <span style={{ fontWeight: 400, color: darkBlue }}>{clientName}</span>
        </div>
        <div style={{ marginBottom: 8, color: darkBlue, fontWeight: 700, fontSize: 15 }}>
          SITE: <span style={{ fontWeight: 400, color: darkBlue }}>{siteName || 'None'}</span>
        </div>
        <div style={{ marginBottom: 14, color: darkBlue, fontWeight: 700, fontSize: 15 }}>
          LOB: <span style={{ fontWeight: 400, color: darkBlue }}>{lobName}</span>
        </div>
        {validSubLobs.length > 0 && (
          <div style={{ marginBottom: 0, marginLeft: 0, paddingLeft: 8, borderLeft: `3px solid ${darkBlue}`, background: '#fff', borderRadius: 4, boxShadow: '0 1px 4px rgba(25, 118, 210, 0.04)', paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ fontWeight: 700, color: darkBlue, marginBottom: 4, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: darkBlue, borderRadius: '50%' }}></span>
              Sub LOB(s):
            </div>
            <ul style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, paddingLeft: 0, listStyle: 'disc', color: darkBlue }}>
              {validSubLobs.map((subLob, j) => (
                <li key={j} style={{ fontWeight: 700, color: darkBlue, fontSize: 14, marginBottom: 2, marginLeft: 0 }}>
                  <span style={{ fontWeight: 400, color: darkBlue }}>{subLob}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {ignoredSubLobs.length > 0 && (
          <div style={{ marginTop: 18, color: '#b10000', background: '#fff3f3', padding: '12px 16px', borderRadius: 6, border: '1px solid #ffd6d6', fontSize: 14 }}>
            <strong>Note:</strong> The following Sub LOB(s) will <u>not</u> be added because they are incomplete:
            <ul style={{ margin: '8px 0 0 18px', color: '#b10000' }}>
              {ignoredSubLobs.map((subLob, i) => (
                <li key={i}>(No Sub LOB Name)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Add Sub LOB with confirmation
  const handleAddSubLob = async () => {
    const finalizedSubLobNames = subLobNames.map(name => finalizeInput(name));
    try {
    if (!selectedLobForSubLob) {
      showToast('Please select a LOB', 'error');
      return;
    }
    // Validate all subLobNames
    for (const name of finalizedSubLobNames) {
      if (name.trim() && !isValidInput(name.trim())) {
        showToast('Invalid Sub LOB name. Only letters, numbers, and single spaces between words are allowed.', 'error');
        return;
      }
    }
    const validSubLobs = finalizedSubLobNames.filter(name => name.trim());
    if (validSubLobs.length === 0) {
      showToast('Please enter at least one valid Sub LOB name', 'error');
      return;
    }

    // Check for duplicate Sub LOB names
      const uniqueSubLobNames = new Set(validSubLobs.map(name => normalizeName(name)));
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
          finalizedSubLobNames
        )}
      </span>,
      async () => {
        try {
          // ... existing code ...
          for (const subLobName of finalizedSubLobNames) {
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
    } catch (error) {
      showToast(error.response?.data?.error || 'An error occurred', 'error');
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

  const handleDeactivateRow = async (type, id) => {
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
        `Are you sure you want to deactivate the following: 
        Client: "${client.name}"
        LOB: "${lob.name}"
        Sub LOB: "${subLob.name}"`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/sublob/deactivate', {
            clientName: client.name,
            lobName: lob.name,
            subLOBName: subLob.name
          });
          if (response.data) {
            fetchClientData();
            showToast('Client, LOB, and Sub LOB deactivated successfully!');
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

  const handleReactivateRow = async (type, id) => {
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
        `Are you sure you want to deactivate the following: 
        Client: "${client.name}"
        LOB: "${lob.name}"
        Sub LOB: "${subLob.name}"`,
        async () => {
          const response = await axios.post('http://localhost:3000/api/clients/sublob/reactivate', {
            clientName: client.name,
            lobName: lob.name,
            subLOBName: subLob.name
          });
          if (response.data) {
            fetchClientData('DEACTIVATED');
            showToast('Client, LOB, and Sub LOB reactivated successfully!');
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

  // Add function to handle row selection
  const handleRowSelect = (rowKey, rowIndex, event) => {
    setSelectedRows(prev => {
      let newSelected = new Set(prev);
      if (event && event.shiftKey && lastSelectedRowIndex !== null) {
        // Shift-click: select range
        const rowKeys = getCurrentRowKeys();
        const start = Math.min(lastSelectedRowIndex, rowIndex);
        const end = Math.max(lastSelectedRowIndex, rowIndex);
        const shouldSelect = !rowKeys.slice(start, end + 1).every(k => newSelected.has(k));
        for (let i = start; i <= end; i++) {
          if (shouldSelect) {
            newSelected.add(rowKeys[i]);
          } else {
            newSelected.delete(rowKeys[i]);
          }
        }
      } else {
        if (newSelected.has(rowKey)) {
          newSelected.delete(rowKey);
        } else {
          newSelected.add(rowKey);
        }
      }
      // After toggling, if not all rows are selected, uncheck selectAll
      const allRowKeys = getCurrentRowKeys();
      if (newSelected.size !== allRowKeys.length) {
        setSelectAll(false);
      } else if (newSelected.size === allRowKeys.length && allRowKeys.length > 0) {
        setSelectAll(true);
      }
      return newSelected;
    });
    setLastSelectedRowIndex(rowIndex);
  };

  // Add function to handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allRowKeys = new Set();
      // Get all visible rows based on current table tab and filters
      if (activeTableTab === 'clients') {
        filteredClients.forEach(client => {
          const clientLobs = lobs.filter(lob => lob.clientId === client.id);
          if (clientLobs.length === 0) {
            allRowKeys.add(`client-${client.name}`);
          } else {
            clientLobs.forEach(lob => {
              const lobSubLobs = subLobs.filter(subLob => subLob.lobId === lob.id);
              if (lobSubLobs.length === 0) {
                allRowKeys.add(`lob-${client.name}-${lob.name}`);
              } else {
                lobSubLobs.forEach(subLob => {
                  allRowKeys.add(`sublob-${client.name}-${lob.name}-${subLob.name}`);
                });
              }
            });
          }
        });
      }
      setSelectedRows(allRowKeys);
    }
    setSelectAll(!selectAll);
  };

  // Add function to handle bulk deactivation
  const handleBulkDeactivate = async () => {
    if (selectedRows.size === 0) {
      showToast('Please select at least one item to deactivate', 'error');
      return;
    }

    // Build details for each selected row
    const selectedItemsArray = Array.from(selectedRows).map(rowKey => {
      const [type, ...parts] = rowKey.split('-');
      if (type === 'client') {
        const clientName = parts.join('-');
        return { client: clientName, lob: '', subLob: '' };
      } else if (type === 'lob') {
        const [clientName, lobName] = parts;
        return { client: clientName, lob: lobName, subLob: '' };
      } else if (type === 'sublob') {
        const [clientName, lobName, subLobName] = parts;
        return { client: clientName, lob: lobName, subLob: subLobName };
      }
      return { client: '', lob: '', subLob: '' };
    });

    showConfirm(
      {
        type: 'bulk',
        items: selectedItemsArray,
        count: selectedItemsArray.length
      },
      async () => {
        try {
          const deactivationPromises = [];
          selectedRows.forEach(rowKey => {
            const [type, ...parts] = rowKey.split('-');
            if (type === 'client') {
              const clientName = parts.join('-');
              deactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/deactivate', {
                  clientName: clientName
                })
              );
            } else if (type === 'lob') {
              const [clientName, lobName] = parts;
              deactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/lob/deactivate', {
                  clientName: clientName,
                  lobName: lobName
                })
              );
            } else if (type === 'sublob') {
              const [clientName, lobName, subLobName] = parts;
              deactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/sublob/deactivate', {
                  clientName: clientName,
                  lobName: lobName,
                  subLOBName: subLobName
                })
              );
            }
          });

          await Promise.all(deactivationPromises);
          fetchClientData();
          setSelectedRows(new Set());
          setSelectAll(false);
          showToast(`${selectedRows.size} item(s) deactivated successfully!`);
        } catch (error) {
          console.error('Error deactivating items:', error);
          showToast('Failed to deactivate some items: ' + error.message, 'error');
        }
      },
      () => {}, // onCancel
      'Deactivate',
      'Cancel',
      true // requireConfirmation
    );
  };

  // Add function to handle bulk reactivation
  const handleBulkReactivate = async () => {
    if (selectedRows.size === 0) {
      showToast('Please select at least one item to reactivate', 'error');
      return;
    }

    // Build details for each selected row
    const selectedItemsArray = Array.from(selectedRows).map(rowKey => {
      const [type, ...parts] = rowKey.split('-');
      if (type === 'client') {
        const clientName = parts.join('-');
        return { client: clientName, lob: '', subLob: '' };
      } else if (type === 'lob') {
        const [clientName, lobName] = parts;
        return { client: clientName, lob: lobName, subLob: '' };
      } else if (type === 'sublob') {
        const [clientName, lobName, subLobName] = parts;
        return { client: clientName, lob: lobName, subLob: subLobName };
      }
      return { client: '', lob: '', subLob: '' };
    });

    showConfirm(
      {
        type: 'bulk',
        items: selectedItemsArray,
        count: selectedItemsArray.length
      },
      async () => {
        try {
          const reactivationPromises = [];
          selectedRows.forEach(rowKey => {
            const [type, ...parts] = rowKey.split('-');
            if (type === 'client') {
              const clientName = parts.join('-');
              reactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/reactivate', {
                  clientName: clientName
                })
              );
            } else if (type === 'lob') {
              const [clientName, lobName] = parts;
              reactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/lob/reactivate', {
                  clientName: clientName,
                  lobName: lobName
                })
              );
            } else if (type === 'sublob') {
              const [clientName, lobName, subLobName] = parts;
              reactivationPromises.push(
                axios.post('http://localhost:3000/api/clients/sublob/reactivate', {
                  clientName: clientName,
                  lobName: lobName,
                  subLOBName: subLobName
                })
              );
            }
          });

          await Promise.all(reactivationPromises);
          fetchClientData('DEACTIVATED');
          setSelectedRows(new Set());
          setSelectAll(false);
          showToast(`${selectedRows.size} item(s) reactivated successfully!`);
        } catch (error) {
          console.error('Error reactivating items:', error);
          showToast('Failed to reactivate some items: ' + error.message, 'error');
        }
      },
      () => {}, // onCancel
      'Reactivate',
      'Cancel',
      true // requireConfirmation
    );
  };

  // Replace the sanitizeInput function with this updated version
  const sanitizeInput = (value, maxLength = null) => {
    // Allow only alphanumeric and spaces
    let sanitized = value.replace(/[^a-zA-Z0-9 ]/g, '');
    // Remove leading spaces and collapse multiple spaces (but allow trailing space for typing)
    sanitized = sanitized.replace(/^ +/, '').replace(/ {2,}/g, ' ');
    // Capitalize first letter of each word
    sanitized = sanitized.replace(/\b\w/g, (char) => char.toUpperCase());
    // If maxLength is set, apply it
    if (maxLength !== null) {
      sanitized = sanitized.slice(0, maxLength);
    }
    return sanitized;
  };

  // Add a function to finalize input on submit (trims trailing spaces, collapses spaces, capitalizes)
  const finalizeInput = (value) => {
    // Remove leading/trailing spaces and collapse multiple spaces
    let sanitized = value.replace(/[^a-zA-Z0-9 ]/g, '');
    sanitized = sanitized.replace(/ +/g, ' ').trim();
    // Capitalize first letter of each word
    sanitized = sanitized.replace(/\b\w/g, (char) => char.toUpperCase());
    return sanitized;
  };

  // Helper to normalize names for duplicate checks (case/space insensitive)
  const normalizeName = (str) => str.replace(/\s+/g, ' ').trim().toLowerCase();

  // ... existing code ...
  // Add a function to count rows for the current status and filters
  const countTableRows = (statusTab) => {
    let count = 0;
    if (activeTableTab === 'clients') {
      let filtered = clients;
      if (statusTab === 'ACTIVE' && itemStatusTab !== 'ACTIVE') return 0;
      if (statusTab === 'DEACTIVATED' && itemStatusTab !== 'DEACTIVATED') return 0;
      if (filterDate) {
        const filterDateString = new Date(filterDate).toLocaleDateString();
        filtered = filtered.filter(client => client.createdAt === filterDateString);
      }
      if (searchFilter && searchFilter.type === 'client') {
        filtered = filtered.filter(client => safeToLowerCase(client.name) === safeToLowerCase(searchFilter.value));
      }
      filtered = filtered.sort((a, b) => b.id - a.id);
      filtered.forEach(client => {
        const clientLobs = lobs.filter(lob => lob.clientId === client.id);
        if (clientLobs.length === 0) {
          count++;
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
              count++;
            } else {
              lobSubLobs.forEach(() => {
                count++;
              });
            }
          });
        }
      });
    } else if (activeTableTab === 'lobs') {
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
            return [{}];
          }
          return lobSubLobs;
        });
      count = rowData.length;
    } else if (activeTableTab === 'subLobs') {
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
        .sort((a, b) => b.clientRowId - a.clientRowId);
      count = rowData.length;
    }
    return count;
  };

  // Update the counts whenever the table data changes
  useEffect(() => {
    if (itemStatusTab === 'ACTIVE') {
      setActiveCount(countTableRows('ACTIVE'));
    } else if (itemStatusTab === 'DEACTIVATED') {
      setDeactivatedCount(countTableRows('DEACTIVATED'));
    }
    // eslint-disable-next-line
  }, [clients, lobs, subLobs, activeTableTab, searchTerm, searchFilter, filterDate, filterClient, itemStatusTab]);
  // ... existing code ...

  // Helper to get all row keys for current table view
  const getCurrentRowKeys = () => {
    let rowData = [];
    if (activeTableTab === 'clients') {
      filteredClients.forEach(client => {
        const clientLobs = lobs.filter(lob => lob.clientId === client.id);
        if (clientLobs.length === 0) {
          rowData.push({ rowKey: `client-${client.name}` });
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
              rowData.push({ rowKey: `lob-${client.name}-${lob.name}` });
            } else {
              lobSubLobs.forEach(subLob => {
                rowData.push({ rowKey: `sublob-${client.name}-${lob.name}-${subLob.name}` });
              });
            }
          });
        }
      });
    } else if (activeTableTab === 'lobs') {
      lobs
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
                        <button onClick={() => handleDeactivateRow('lob', lob.id)} className="deactivate-btn">
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
                      <button onClick={() => handleDeactivateRow('subLob', subLob.id)} className="delete-btn">
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
      return rowData.map((r, rowIndex) => {
        const rowKey = r.subLob 
          ? `sublob-${r.name}-${r.lob}-${r.subLob}`
          : `lob-${r.name}-${r.lob}`;
        
        return (
          <tr
            key={rowKey}
            onClick={e => {
              // Prevent toggling when clicking the checkbox itself or action buttons
              if (e.target.type === 'checkbox') return;
              if (e.target.closest && e.target.closest('.action-buttons')) return;
              handleRowSelect(rowKey, rowIndex, e);
            }}
            style={{ cursor: 'pointer', background: selectedRows.has(rowKey) ? '#e6f7ff' : undefined }}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedRows.has(rowKey)}
                onChange={e => handleRowSelect(rowKey, rowIndex, e)}
                style={{ cursor: 'pointer' }}
                onClick={e => e.stopPropagation()} // Prevent row click when clicking checkbox
              />
            </td>
            {r.jsx.props.children}
          </tr>
        );
      });
    } else if (activeTableTab === 'lobs') {
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
                          <button onClick={() => handleDeactivateRow('lob', lob.id)} className="deactivate-btn">
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
                        <button onClick={() => handleDeactivateRow('subLob', subLob.id)} className="delete-btn">
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
        return rowData.map((r, rowIndex) => {
          const rowKey = r.subLob 
            ? `sublob-${r.name}-${r.lob}-${r.subLob}`
            : `lob-${r.name}-${r.lob}`;
          
          return (
            <tr
              key={rowKey}
              onClick={e => {
                // Prevent toggling when clicking the checkbox itself or action buttons
                if (e.target.type === 'checkbox') return;
                if (e.target.closest && e.target.closest('.action-buttons')) return;
                handleRowSelect(rowKey, rowIndex, e);
              }}
              style={{ cursor: 'pointer', background: selectedRows.has(rowKey) ? '#e6f7ff' : undefined }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows.has(rowKey)}
                  onChange={e => handleRowSelect(rowKey, rowIndex, e)}
                  style={{ cursor: 'pointer' }}
                  onClick={e => e.stopPropagation()} // Prevent row click when clicking checkbox
                />
              </td>
              {r.jsx.props.children}
            </tr>
          );
        });
      })()
    } else if (activeTableTab === 'subLobs') {
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
        .sort((a, b) => b.clientRowId - a.clientRowId)
        .forEach(subLob => {
          const lob = lobs.find(l => l.id === subLob.lobId);
          const client = lob ? clients.find(c => c.id === lob.clientId) : null;
          rowData.push({ rowKey: `sublob-${client ? client.name : '-'}-${lob ? lob.name : '-'}-${subLob.name}` });
        });
    }
    return rowData.map(r => r.rowKey);
  };

  // Clear selectedRows and selectAll when switching between Active/Deactivated tabs
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [itemStatusTab]);

  // Add clearFormStates function
  const clearFormStates = (tab) => {
    // Clear Add Client tab states
    if (tab !== 'addClient') {
      setClientName('');
      setLobCards([{ lobName: '', subLobNames: [''] }]);
    }

    // Clear Add LOB tab states
    if (tab !== 'addLOB') {
      setSelectedClientForLob(null);
      setSelectedSiteForLob(null);
      setClientSearchTerm('');
      setSiteSearchTerm('');
      setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
      setIsClientDropdownOpen(false);
      setIsSiteDropdownOpen(false);
    }

    // Clear Add Sub LOB tab states
    if (tab !== 'addSubLOB') {
      setSubLobNames(['']);
      setSelectedLobForSubLob(null);
      setFilterClientForSubLob(null);
      setFilterSiteForSubLob(null);
      setSubLobClientSearchTerm('');
      setSubLobSiteSearchTerm('');
      setSubLobLobSearchTerm('');
      setIsSubLobClientDropdownOpen(false);
      setIsSubLobSiteDropdownOpen(false);
      setIsSubLobLobDropdownOpen(false);
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
            <div 
              className={`tab ${activeTab === 'addClient' ? 'active' : ''}`} 
              onClick={() => {
                clearFormStates('addClient');
                setActiveTab('addClient');
              }}
            >
              Add Client
            </div>
            <div 
              className={`tab ${activeTab === 'addLOB' ? 'active' : ''}`} 
              onClick={() => {
                clearFormStates('addLOB');
                setActiveTab('addLOB');
              }}
            >
              Add LOB
            </div>
            <div 
              className={`tab ${activeTab === 'addSubLOB' ? 'active' : ''}`} 
              onClick={() => {
                clearFormStates('addSubLOB');
                setActiveTab('addSubLOB');
              }}
            >
              Add Sub LOB
            </div>
          </div>
          {/* Tab Contents */}
          <div className="tab-contents-wrapper">
            <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
              <div className="client-name-container">
                <label>Client Name <span style={{ color: 'red' }}>*</span></label>
                <input
                  ref={clientNameInputRef}
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(sanitizeInput(e.target.value, 50))}
                  placeholder="Enter client name"
                  maxLength={50}
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
                      <label>
                        LOB Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={card.lobName}
                        onChange={(e) => handleLobNameChange(lobCardIndex, sanitizeInput(e.target.value, 30))}
                        maxLength={30}
                      />
                    </div>

                    <div className="sub-lobs-container">
                      {card.subLobNames.map((subLobName, subLobIndex) => (
                        <React.Fragment key={`sub-lob-${lobCardIndex}-${subLobIndex}`}>
                          <div className="form-group sub-lob-group inline-form-group">
                            <label>
                              {`Sub LOB ${subLobIndex + 1}`}
                              {subLobIndex === 0 && <span style={{ color: 'red' }}>*</span>}
                            </label>
                            <div className="sub-lob-input-container">
                              <input
                                type="text"
                                value={subLobName}
                                onChange={(e) => handleSubLobNameChange(lobCardIndex, subLobIndex, sanitizeInput(e.target.value, 30))}
                                maxLength={30}
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
                          {subLobIndex === 0 && (
                            <div style={{ color: '#888', fontSize: 12, marginBottom: 2, marginTop: 2 }}>
                              (Insert at least 1 Sub LOB)
                            </div>
                          )}
                        </React.Fragment>
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
                      disabled={!lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()))}
                      title={!lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim())) ? 
                        "Please fill in at least one LOB and Sub LOB before adding another" : 
                        "Add another LOB"}
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
                  !lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()))
                }
              >
                Submit LOB(s)
              </button>
            </div>
            <div className={`tab-content ${activeTab === 'addLOB' ? 'active' : ''}`}>
              <div className="client-name-container">
                <label>Select Client <span style={{ color: 'red' }}>*</span></label>
                <div className={`searchable-dropdown ${isClientDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                  <input
                    ref={clientSearchInputRef}
                    type="text"
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(sanitizeInput(e.target.value, 50));
                      setIsClientDropdownOpen(true);
                      // Clear selected client if search term doesn't match
                      const matchingClient = clients.find(c => c.name === sanitizeInput(e.target.value, 50));
                      if (!matchingClient) {
                        setSelectedClientForLob(null);
                        setSelectedSiteForLob(null);
                        setSiteSearchTerm('');
                      }
                    }}
                    maxLength={50}
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
                      paddingRight: '80px', // increased padding
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
                      style={{
                        position: 'absolute',
                        right: 44, // move left to avoid overlap
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2
                      }}
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
                    <div className="dropdown-list" style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {(clientSearchTerm
                        ? filteredClientOptions()
                        : Array.from(uniqueClientNames.entries())
                      ).map(([name, id]) => (
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
                      setSiteSearchTerm(sanitizeInput(e.target.value, 30));
                      setIsSiteDropdownOpen(true);
                    }}
                    maxLength={30}
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
                        <div className="dropdown-item no-results">No sites available</div>
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
                      <label>
                        LOB Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={card.lobName}
                        onChange={(e) => handleLobNameChangeForLob(lobCardIndex, sanitizeInput(e.target.value, 30))}
                        maxLength={30}
                        disabled={!validateClientSelection()}
                      />
                    </div>

                    <div className="sub-lobs-container">
                      {card.subLobNames.map((subLobName, subLobIndex) => (
                        <React.Fragment key={`sub-lob-${lobCardIndex}-${subLobIndex}`}>
                          <div className="form-group sub-lob-group inline-form-group">
                            <label>
                              {`Sub LOB ${subLobIndex + 1}`}
                              {subLobIndex === 0 && <span style={{ color: 'red' }}>*</span>}
                            </label>
                            <div className="sub-lob-input-container">
                              <input
                                type="text"
                                value={subLobName}
                                onChange={(e) => handleSubLobNameChangeForLob(lobCardIndex, subLobIndex, sanitizeInput(e.target.value, 30))}
                                maxLength={30}
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
                          {subLobIndex === 0 && (
                            <div style={{ color: '#888', fontSize: 12, marginBottom: 2, marginTop: 2 }}>
                              (Insert at least 1 Sub LOB)
                            </div>
                          )}
                        </React.Fragment>
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
                      disabled={!lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()))}
                      title={!lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim())) ? 
                        "Please fill in at least one LOB and Sub LOB before adding another" : 
                        "Add another LOB"}
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
                  !lobCardsForLob.some(card => card.lobName.trim() && card.subLobNames.some(name => name.trim()))
                }
              >
                Submit LOB(s)
              </button>
            </div>
            <div className={`tab-content ${activeTab === 'addSubLOB' ? 'active' : ''}`}>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Client <span style={{ color: 'red' }}>*</span></label>
                  <div className={`sublob-client-searchable-dropdown ${isSubLobClientDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <input
                      ref={subLobClientSearchInputRef}
                      type="text"
                      value={subLobClientSearchTerm}
                      onChange={(e) => {
                        setSubLobClientSearchTerm(sanitizeInput(e.target.value, 50));
                        setIsSubLobClientDropdownOpen(true);
                        // Clear selected client if search term doesn't match
                        const matchingClient = clients.find(c => c.name === sanitizeInput(e.target.value, 50));
                        if (!matchingClient) {
                          setFilterClientForSubLob(null);
                          setFilterSiteForSubLob(null);
                          setSubLobSiteSearchTerm('');
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }
                      }}
                      maxLength={50}
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
                        paddingRight: '80px', // increased padding
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
                        style={{
                          position: 'absolute',
                          right: 44, // move left to avoid overlap
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 2
                        }}
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
                        setSubLobSiteSearchTerm(sanitizeInput(e.target.value, 30));
                        setIsSubLobSiteDropdownOpen(true);
                        // Clear site filter if input is empty
                        if (!e.target.value) {
                          setFilterSiteForSubLob(null);
                          setSelectedLobForSubLob(null);
                          setSubLobLobSearchTerm('');
                        }
                      }}
                      maxLength={30}
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
                          <div className="dropdown-item no-results">No sites available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Select LOB <span style={{ color: 'red' }}>*</span></label>
                  <div className={`sublob-lob-searchable-dropdown ${isSubLobLobDropdownOpen ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={subLobLobSearchTerm}
                      onChange={(e) => {
                        setSubLobLobSearchTerm(sanitizeInput(e.target.value, 30));
                        setIsSubLobLobDropdownOpen(true);
                      }}
                      maxLength={30}
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
                        <label>
                          {`Sub LOB Name${idx > 0 ? ` ${idx + 1}` : ''}`}
                          {idx === 0 && <span style={{ color: 'red' }}>*</span>}
                        </label>
                        {idx === 0 && (
                          <div style={{ color: '#888', fontSize: 12, marginBottom: 2, marginTop: -2 }}>
                            (Insert at least 1 Sub LOB)
                          </div>
                        )}
                        <div className="sub-lob-input-container" style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleSubLobNameChange2(idx, sanitizeInput(e.target.value, 30))}
                            maxLength={30}
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
                      disabled={!selectedLobForSubLob || !subLobNames[0] || !subLobNames[0].trim()}
                      title="Add another Sub LOB"
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

              {/* Add selection controls */}
              <div className="selection-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                {selectedRows.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="selected-count" style={{ color: '#666' }}>
                      {selectedRows.size} item(s) selected
                    </div>
                    {itemStatusTab === 'DEACTIVATED' ? (
                      <button
                        onClick={handleBulkReactivate}
                        className="bulk-reactivate-btn"
                        style={{
                          background: '#3182ce',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaCheckCircle size={14} /> Reactivate Selected
                      </button>
                    ) : (
                      <button
                        onClick={handleBulkDeactivate}
                        className="bulk-deactivate-btn"
                        style={{
                          background: '#e53e3e',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaBan size={12} /> Deactivate Selected
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs and controls in one flex row */}
              <div className="item-status-and-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Tab switcher for Active/Deactivated */}
                <div className="item-status-tabs" style={{ display: 'flex', gap: 16 }}>
                  <div
                    className={`item-status-tab${itemStatusTab === 'ACTIVE' ? ' active' : ''}`}
                    style={{
                      cursor: 'pointer',
                      fontWeight: itemStatusTab === 'ACTIVE' ? 'bold' : 'normal',
                      color: itemStatusTab === 'ACTIVE' ? '#004D8D' : '#666',
                      borderBottom: itemStatusTab === 'ACTIVE' ? '2px solid #004D8D' : '2px solid transparent',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onClick={() => setItemStatusTab('ACTIVE')}
                  >
                    Active
                    <span
                      style={{
                        background: itemStatusTab === 'ACTIVE' ? '#004D8D' : '#e2e8f0',
                        color: itemStatusTab === 'ACTIVE' ? '#fff' : '#666',
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontWeight: 700,
                        fontSize: 14,
                        marginLeft: 4,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: itemStatusTab === 'ACTIVE' ? '0 2px 8px rgba(0,77,141,0.08)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <FaCheckCircle style={{ marginRight: 4 }} />
                      {activeCount}
                    </span>
                  </div>
                  <div
                    className={`item-status-tab${itemStatusTab === 'DEACTIVATED' ? ' active' : ''}`}
                    style={{
                      cursor: 'pointer',
                      fontWeight: itemStatusTab === 'DEACTIVATED' ? 'bold' : 'normal',
                      color: itemStatusTab === 'DEACTIVATED' ? '#b10000' : '#666',
                      borderBottom: itemStatusTab === 'DEACTIVATED' ? '2px solid #b10000' : '2px solid transparent',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onClick={() => setItemStatusTab('DEACTIVATED')}
                  >
                    Deactivated
                    <span
                      style={{
                        background: itemStatusTab === 'DEACTIVATED' ? '#b10000' : '#e2e8f0',
                        color: itemStatusTab === 'DEACTIVATED' ? '#fff' : '#666',
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontWeight: 700,
                        fontSize: 14,
                        marginLeft: 4,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: itemStatusTab === 'DEACTIVATED' ? '0 2px 8px rgba(177,0,0,0.08)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <FaBan style={{ marginRight: 4 }} />
                      {deactivatedCount}
                    </span>
                  </div>
                </div>
                {/* Search and filter controls (existing code) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
                  <div className="search-box" style={{ position: 'relative', width: 320 }}>
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by Client, LOB, or Sub LOB"
                      value={searchTerm}
                      onChange={(e) => {
                        const value = sanitizeInput(e.target.value, 50);
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
                      maxLength={50}
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
                      style={{ paddingRight: searchTerm ? '36px' : '10px', width: '100%' }}
                    />
                    {/* Clear button */}
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
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          zIndex: 2
                        }}
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                    {searchDropdownVisible && searchDropdown.length > 0 && (
                      <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, width: '100%', background: '#fff', border: '1px solid #ccc', zIndex: 10, maxHeight: 200, overflowY: 'auto', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: 0 }}>
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
                      ref={dateInputRef}
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      style={{ minWidth: 150, height: 32, cursor: dateInputCursor }}
                      onClick={() => {
                        if (dateInputRef.current && dateInputRef.current.showPicker) {
                          dateInputRef.current.showPicker();
                        }
                      }}
                      onMouseEnter={() => setDateInputCursor('pointer')}
                      onMouseLeave={() => setDateInputCursor('default')}
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
                      <th style={{ width: '120px', textAlign: 'left', paddingLeft: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                          <span style={{ fontSize: '13px', color: '#2d3748' }}>Select All</span>
                        </div>
                      </th>
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
                                        <button onClick={() => handleDeactivateRow('client', client.id)} className="deactivate-btn">
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
                                            <button onClick={() => handleDeactivateRow('lob', lob.id)} className="deactivate-btn">
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
                                                onClick={() => handleReactivateRow('subLob', subLob.id)} 
                                                className="reactivate-btn"
                                              >
                                                <FaCheckCircle size={14} color="#3182ce" /> Reactivate
                                              </button>
                                            ) : (
                                              <button onClick={() => handleDeactivateRow('subLob', subLob.id)} className="delete-btn">
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
                        if (rowData.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', color: '#888', fontSize: 16, padding: '32px 0' }}>
                                No Available Records
                              </td>
                            </tr>
                          );
                        }
                        return rowData.map((r, rowIndex) => {
                          const rowKey = r.subLob 
                            ? `sublob-${r.name}-${r.lob}-${r.subLob}`
                            : r.lob 
                              ? `lob-${r.name}-${r.lob}`
                              : `client-${r.name}`;
                          return (
                            <tr
                              key={rowKey}
                              onClick={e => {
                                // Prevent toggling when clicking the checkbox itself or action buttons
                                if (e.target.type === 'checkbox') return;
                                if (e.target.closest && e.target.closest('.action-buttons')) return;
                                handleRowSelect(rowKey, rowIndex, e);
                              }}
                              style={{ cursor: 'pointer', background: selectedRows.has(rowKey) ? '#e6f7ff' : undefined }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(rowKey)}
                                  onChange={e => handleRowSelect(rowKey, rowIndex, e)}
                                  style={{ cursor: 'pointer' }}
                                  onClick={e => e.stopPropagation()} // Prevent row click when clicking checkbox
                                />
                              </td>
                              {r.jsx.props.children}
                            </tr>
                          );
                        });
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
                                          <button onClick={() => handleDeactivateRow('lob', lob.id)} className="deactivate-btn">
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
                                        <button onClick={() => handleDeactivateRow('subLob', subLob.id)} className="delete-btn">
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
                        if (rowData.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', color: '#888', fontSize: 16, padding: '32px 0' }}>
                                No Available Records
                              </td>
                            </tr>
                          );
                        }
                        return rowData.map((r, rowIndex) => {
                          const rowKey = r.subLob 
                            ? `sublob-${r.name}-${r.lob}-${r.subLob}`
                            : `lob-${r.name}-${r.lob}`;
                          return (
                            <tr
                              key={rowKey}
                              onClick={e => {
                                // Prevent toggling when clicking the checkbox itself or action buttons
                                if (e.target.type === 'checkbox') return;
                                if (e.target.closest && e.target.closest('.action-buttons')) return;
                                handleRowSelect(rowKey, rowIndex, e);
                              }}
                              style={{ cursor: 'pointer', background: selectedRows.has(rowKey) ? '#e6f7ff' : undefined }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(rowKey)}
                                  onChange={e => handleRowSelect(rowKey, rowIndex, e)}
                                  style={{ cursor: 'pointer' }}
                                  onClick={e => e.stopPropagation()} // Prevent row click when clicking checkbox
                                />
                              </td>
                              {r.jsx.props.children}
                            </tr>
                          );
                        });
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
                                        <button onClick={() => handleDeactivateRow('subLob', subLob.id)} className="delete-btn">
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
                        if (rowData.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', color: '#888', fontSize: 16, padding: '32px 0' }}>
                                No Available Records
                              </td>
                            </tr>
                          );
                        }
                        return rowData.map((r, rowIndex) => {
                          const rowKey = `sublob-${r.name}-${r.lob}-${r.subLob}`;
                          return (
                            <tr
                              key={rowKey}
                              onClick={e => {
                                // Prevent toggling when clicking the checkbox itself or action buttons
                                if (e.target.type === 'checkbox') return;
                                if (e.target.closest && e.target.closest('.action-buttons')) return;
                                handleRowSelect(rowKey, rowIndex, e);
                              }}
                              style={{ cursor: 'pointer', background: selectedRows.has(rowKey) ? '#e6f7ff' : undefined }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(rowKey)}
                                  onChange={e => handleRowSelect(rowKey, rowIndex, e)}
                                  style={{ cursor: 'pointer' }}
                                  onClick={e => e.stopPropagation()} // Prevent row click when clicking checkbox
                                />
                              </td>
                              {r.jsx.props.children}
                            </tr>
                          );
                        });
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