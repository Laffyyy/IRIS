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
  const [lobNames, setLobNames] = useState(['']);
  const [selectedClientForLob, setSelectedClientForLob] = useState(null);
  const [selectedSiteForLob, setSelectedSiteForLob] = useState(null);

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

  // Fetch all client data from backend
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/clients/getAll');
        
        if (response.data && response.data.data) {
          console.log('Client data from API:', response.data.data);
          
          // Transform API data to match frontend structure
          const transformedClients = [];
          const transformedLobs = [];
          const transformedSubLobs = [];
          let lobId = 0;
          let subLobId = 0;
          
          response.data.data.forEach((client, clientIndex) => {
            // Add client
            const clientId = clientIndex + 1;
            transformedClients.push({
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
            
            // Add LOBs and SubLOBs
            if (client.LOBs && Array.isArray(client.LOBs)) {
              client.LOBs.forEach(lob => {
                lobId++;
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId,
                  siteId: 1 // Default site ID since API doesn't provide it
                });
                
                // Add SubLOBs
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
          
          // Fetch sites as well if needed
          // For now, setting default sites
          setSites([
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
          let lobId = 0;
          let subLobId = 0;
          
          refreshResponse.data.data.forEach((client, clientIndex) => {
            const clientId = clientIndex + 1;
            transformedClients.push({
              id: clientId,
              name: client.clientName,
              createdBy: client.createdBy || '-',
              createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
            });
            
            if (client.LOBs && Array.isArray(client.LOBs)) {
              client.LOBs.forEach(lob => {
                lobId++;
                transformedLobs.push({
                  id: lobId,
                  name: lob.name,
                  clientId: clientId,
                  siteId: 1
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

    // Add LOB tab functions
    const handleAddLob = async () => {
      if (selectedClientForLob && selectedSiteForLob && lobNames.some(name => name.trim())) {
        const client = clients.find(c => c.id === selectedClientForLob);
        if (!client) return;
        
        // Process each LOB name
        for (const lobName of lobNames) {
          if (lobName.trim()) {
            try {
              // Call API to add LOB
              const response = await axios.post('http://localhost:3000/api/clients/lob/add', {
                clientName: client.name,
                lobName: lobName.trim(),
                siteId: selectedSiteForLob
              });
              console.log('LOB added:', response.data);
            } catch (error) {
              console.error('Error adding LOB:', error);
              alert(`Failed to add LOB "${lobName.trim()}": ${error.response?.data?.error || error.message}`);
            }
          }
        }
        
        // Refresh client data to get updated LOBs and SubLOBs
        try {
          const refreshResponse = await axios.get('http://localhost:3000/api/clients/getAll');
          if (refreshResponse.data && refreshResponse.data.data) {
            // Transform API data (same as in useEffect)
            const transformedClients = [];
            const transformedLobs = [];
            const transformedSubLobs = [];
            let lobId = 0;
            let subLobId = 0;
            
            refreshResponse.data.data.forEach((client, clientIndex) => {
              const clientId = clientIndex + 1;
              transformedClients.push({
                id: clientId,
                name: client.clientName,
                createdBy: client.createdBy || '-',
                createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
              });
              
              if (client.LOBs && Array.isArray(client.LOBs)) {
                client.LOBs.forEach(lob => {
                  lobId++;
                  transformedLobs.push({
                    id: lobId,
                    name: lob.name,
                    clientId: clientId,
                    siteId: selectedSiteForLob
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
          }
        } catch (err) {
          console.error('Error refreshing client data:', err);
        }
        
        // Reset form
        setLobNames(['']);
        setSelectedClientForLob(null);
        setSelectedSiteForLob(null);
        
        alert('LOBs added successfully!');
      }
    };
  
    // Add Sub LOB tab functions
    const handleAddSubLob = async () => {
      if (selectedLobForSubLob && subLobNames.some(name => name.trim())) {
        const lob = lobs.find(l => l.id === selectedLobForSubLob);
        if (!lob) return;
        
        const client = clients.find(c => c.id === lob.clientId);
        if (!client) return;
        
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
            let lobId = 0;
            let subLobId = 0;
            
            refreshResponse.data.data.forEach((client, clientIndex) => {
              const clientId = clientIndex + 1;
              transformedClients.push({
                id: clientId,
                name: client.clientName,
                createdBy: client.createdBy || '-',
                createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'
              });
              
              if (client.LOBs && Array.isArray(client.LOBs)) {
                client.LOBs.forEach(lob => {
                  lobId++;
                  transformedLobs.push({
                    id: lobId,
                    name: lob.name,
                    clientId: clientId,
                    siteId: 1
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
          }
        } catch (err) {
          console.error('Error refreshing client data:', err);
        }
        
        // Reset form
        setSubLobNames(['']);
        setSelectedLobForSubLob(null);
        setFilterClientForSubLob(null);
        setFilterSiteForSubLob(null);
        
        alert('Sub LOBs added successfully!');
      }
    };

  // Handle deleting a client, LOB, or SubLOB
  const handleDelete = async (id, type) => {
    try {
      if (type === 'client') {
        const clientToDelete = clients.find(c => c.id === id);
        if (!clientToDelete) return;
        
        // Call API to delete client
        await axios.delete('http://localhost:3000/api/clients/delete', { 
          data: { clientName: clientToDelete.name } 
        });
        
        // UPDATE state
        setClients(clients.filter(client => client.id !== id));
        setLobs(lobs.filter(lob => lob.clientId !== id));
        
        // Remove any SubLOBs that belong to deleted LOBs
        const remainingLobIds = lobs.filter(lob => lob.clientId !== id).map(lob => lob.id);
        setSubLobs(subLobs.filter(subLob => remainingLobIds.includes(subLob.lobId)));
        
        alert('Client deleted successfully!');
      } else if (type === 'lob') {
        // Get the LOB to delete
        const lobToDelete = lobs.find(lob => lob.id === id);
        if (!lobToDelete) return;
        
        // Get the client name for this LOB
        const client = clients.find(c => c.id === lobToDelete.clientId);
        if (!client) return;
        
        try {
          // Call API to delete LOB
          await axios.delete('http://localhost:3000/api/clients/lob/delete', {
            data: { 
              clientName: client.name,
              lobName: lobToDelete.name 
            }
          });
          
          // Update state
          setLobs(lobs.filter(lob => lob.id !== id));
          setSubLobs(subLobs.filter(subLob => subLob.lobId !== id));
          
          alert('LOB deleted successfully!');
        } catch (error) {
          console.error('Error deleting LOB:', error);
          alert(`Failed to delete LOB: ${error.response?.data?.error || error.message}`);
          return;
        }
      } else if (type === 'subLob') {
        // Get the SubLOB to delete
        const subLobToDelete = subLobs.find(subLob => subLob.id === id);
        if (!subLobToDelete) return;
        
        // Get the LOB for this SubLOB
        const lob = lobs.find(l => l.id === subLobToDelete.lobId);
        if (!lob) return;
        
        // Get the client for this LOB
        const client = clients.find(c => c.id === lob.clientId);
        if (!client) return;
        
        try {
          // Call API to delete SubLOB
          await axios.delete('http://localhost:3000/api/clients/sublob/delete', {
            data: { 
              clientName: client.name,
              lobName: lob.name,
              subLOBName: subLobToDelete.name 
            }
          });
          
          // Update state
          setSubLobs(subLobs.filter(subLob => subLob.id !== id));
          
          alert('Sub LOB deleted successfully!');
        } catch (error) {
          console.error('Error deleting Sub LOB:', error);
          alert(`Failed to delete Sub LOB: ${error.response?.data?.error || error.message}`);
          return;
        }
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle editing a client
  const handleEdit = async (client) => {
    const newName = prompt('Enter new client name:', client.name);
    if (newName && newName.trim() !== client.name) {
      try {
        // Call API to update client
        await axios.put('http://localhost:3000/api/clients/update', { 
          oldClientName: client.name,
          newClientName: newName.trim() 
        });
        
        // Update state
        setClients(clients.map(c => c.id === client.id ? {...c, name: newName.trim()} : c));
        alert('Client updated successfully!');
      } catch (error) {
        console.error('Error updating client:', error);
        alert(`Failed to update client: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Handle editing a LOB
  const handleEditLob = async (lob) => {
    const newName = prompt('Enter new LOB name:', lob.name);
    if (newName && newName.trim() !== lob.name) {
      // Get the client for this LOB
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) return;
      
      try {
        // Call API to update LOB
        await axios.put('http://localhost:3000/api/clients/lob/update', { 
          clientName: client.name,
          oldLOBName: lob.name,
          newLOBName: newName.trim() 
        });
        
        // Update state
        setLobs(lobs.map(l => l.id === lob.id ? {...l, name: newName.trim()} : l));
        alert('LOB updated successfully!');
      } catch (error) {
        console.error('Error updating LOB:', error);
        alert(`Failed to update LOB: ${error.response?.data?.error || error.message}`);
      }
    }
  };
  
  // Handle editing a SubLOB
  const handleEditSubLob = async (subLob) => {
    const newName = prompt('Enter new Sub LOB name:', subLob.name);
    if (newName && newName.trim() !== subLob.name) {
      // Get the LOB for this SubLOB
      const lob = lobs.find(l => l.id === subLob.lobId);
      if (!lob) return;
      
      // Get the client for this LOB
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) return;
      
      try {
        // Call API to update SubLOB
        await axios.put('http://localhost:3000/api/clients/sublob/update', { 
          clientName: client.name,
          lobName: lob.name,
          oldSubLOBName: subLob.name,
          newSubLOBName: newName.trim() 
        });
        
        // Update state
        setSubLobs(subLobs.map(sl => sl.id === subLob.id ? {...sl, name: newName.trim()} : sl));
        alert('Sub LOB updated successfully!');
      } catch (error) {
        console.error('Error updating Sub LOB:', error);
        alert(`Failed to update Sub LOB: ${error.response?.data?.error || error.message}`);
      }
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

  const handleRemoveSubLobField = (index) => {
    if (subLobNames.length > 1) {
      const updatedSubLobNames = [...subLobNames];
      updatedSubLobNames.splice(index, 1);
      setSubLobNames(updatedSubLobNames);
    }
  };

  const handleSubLobNameChange = (lobCardIndex, subLobIndex, value) => {
    const updatedLobCards = [...lobCards];
    updatedLobCards[lobCardIndex].subLobNames[subLobIndex] = value;
    setLobCards(updatedLobCards);
  };

  const handleAddAnotherLob = () => {
    if (lobNames.length < 4) {
      setLobNames([...lobNames, '']);
    }
  };

  const handleRemoveLobField = (index) => {
    if (lobNames.length > 1) {
      const updatedLobNames = [...lobNames];
      updatedLobNames.splice(index, 1);
      setLobNames(updatedLobNames);
    }
  };

  const handleLobNameChangeInTab = (index, value) => {
    const updatedLobNames = [...lobNames];
    updatedLobNames[index] = value;
    setLobNames(updatedLobNames);
  };

  const handleAddAnotherSubLobField = () => {
    if (subLobNames.length < 4) {
      setSubLobNames([...subLobNames, '']);
    }
  };

  // Filtered data for table
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterClient ? client.id === filterClient : true;
    return matchesSearch && matchesFilter;
  });

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
                            onClick={() => handleRemoveSubLobField(subLobIndex)}
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
          <div className="form-row">
            <div className="form-group">
              <label>Select Client</label>
              <select
                value={selectedClientForLob || ''}
                onChange={(e) => setSelectedClientForLob(Number(e.target.value))}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Site</label>
              <select
                value={selectedSiteForLob || ''}
                onChange={(e) => setSelectedSiteForLob(Number(e.target.value))}
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lob-name-fields-container">
            <div className="lob-name-fields-row">
              {/* LOB Name 1 */}
              <div className="lob-name-field">
                <div className="form-group">
                  <label>LOB Name</label>
                  <div className="lob-input-container">
                    <input
                      type="text"
                      value={lobNames[0]}
                      onChange={(e) => handleLobNameChangeInTab(0, e.target.value)}
                      disabled={!selectedClientForLob || !selectedSiteForLob}
                    />
                  </div>
                </div>
              </div>
              
              {/* LOB Name 2 */}
              {lobNames.length > 1 && (
                <div className="lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveLobField(1)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>LOB Name 2</label>
                    <div className="lob-input-container">
                      <input
                        type="text"
                        value={lobNames[1]}
                        onChange={(e) => handleLobNameChangeInTab(1, e.target.value)}
                        disabled={!selectedClientForLob || !selectedSiteForLob}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lob-name-fields-row">
              {/* LOB Name 3 */}
              {lobNames.length > 2 && (
                <div className="lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveLobField(2)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>LOB Name 3</label>
                    <div className="lob-input-container">
                      <input
                        type="text"
                        value={lobNames[2]}
                        onChange={(e) => handleLobNameChangeInTab(2, e.target.value)}
                        disabled={!selectedClientForLob || !selectedSiteForLob}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* LOB Name 4 */}
              {lobNames.length > 3 && (
                <div className="lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveLobField(3)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>LOB Name 4</label>
                    <div className="lob-input-container">
                      <input
                        type="text"
                        value={lobNames[3]}
                        onChange={(e) => handleLobNameChangeInTab(3, e.target.value)}
                        disabled={!selectedClientForLob || !selectedSiteForLob}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lob-actions">
            <button 
              onClick={handleAddLob} 
              className="add-button"
              disabled={!lobNames.some(name => name.trim()) || !selectedClientForLob || !selectedSiteForLob}
            >
              + Add LOB(s)
            </button>
            {lobNames.length < 4 && (
              <button 
                onClick={handleAddAnotherLob} 
                className="add-another-button"
                disabled={!selectedClientForLob || !selectedSiteForLob}
              >
                + Add Another LOB
              </button>
            )}
          </div>
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
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select LOB</label>
              <select
                value={selectedLobForSubLob || ''}
                onChange={(e) => setSelectedLobForSubLob(Number(e.target.value))}
                disabled={filteredLobs.length === 0}
              >
                <option value="">{filteredLobs.length === 0 ? 'No LOBs match your filters' : 'Select a LOB'}</option>
                {filteredLobs.map(lob => (
                  <option key={lob.id} value={lob.id}>
                    {lob.name} (Client: {clients.find(c => c.id === lob.clientId)?.name || 'Unknown'}, 
                    Site: {sites.find(s => s.id === lob.siteId)?.name || 'Unknown'})
                  </option>
                ))}
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
                      onChange={(e) => handleSubLobNameChange(0, e.target.value)}
                      disabled={!selectedLobForSubLob}
                    />
                  </div>
                </div>
              </div>
              
              {/* Sub LOB Name 2 */}
              {subLobNames.length > 1 && (
                <div className="sub-lob-name-field">
                  <div className="form-group">
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(1)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 2</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[1]}
                        onChange={(e) => handleSubLobNameChange(1, e.target.value)}
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
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(2)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 3</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[2]}
                        onChange={(e) => handleSubLobNameChange(2, e.target.value)}
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
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(3)}>
                      <FaTimes className="times-icon" />
                    </button>
                    <label>Sub LOB Name 4</label>
                    <div className="sub-lob-input-container">
                      <input
                        type="text"
                        value={subLobNames[3]}
                        onChange={(e) => handleSubLobNameChange(3, e.target.value)}
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
              disabled={!subLobNames.some(name => name.trim()) || !selectedLobForSubLob}
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
                placeholder="Search clients..."
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
                {filteredClients.map(client => {
                  const clientLobs = lobs.filter(lob => lob.clientId === client.id);
                  const clientSubLobs = subLobs.filter(subLob => 
                    clientLobs.some(lob => lob.id === subLob.lobId)
                  );
                  
                  return (
                    <tr key={client.id}>
                      <td>C{client.id}</td>
                      <td>{client.name}</td>
                      <td>{clientLobs.map(lob => lob.name).join(', ') || '-'}</td>
                      <td>{clientSubLobs.map(subLob => subLob.name).join(', ') || '-'}</td>
                      <td>{client.createdBy || '-'}</td>
                      <td>{client.createdAt || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(client)} className="edit-btn">
                            <FaPencilAlt size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(client.id, 'client')} className="delete-btn">
                            <FaTrash size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;