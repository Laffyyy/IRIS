import React, { useState, useEffect } from 'react';
import './ClientManagement.css';
import { FaTrash, FaSearch, FaTimes, FaPencilAlt } from 'react-icons/fa';

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('addClient');
  const [clients, setClients] = useState([
    { 
      id: 1, 
      name: 'Client A',
      channel: 'Channel 1',
      industry: 'Industry A',
      createdBy: 'John Doe',
      createdAt: '2024-03-20'
    },
    { 
      id: 2, 
      name: 'Client B',
      channel: 'Channel 2',
      industry: 'Industry B',
      createdBy: 'Jane Smith',
      createdAt: '2024-03-21'
    }
  ]);
  const [lobs, setLobs] = useState([
    { id: 1, name: 'LOB X', clientId: 1, siteId: 1 },
    { id: 2, name: 'LOB Y', clientId: 2, siteId: 2 }
  ]);
  const [subLobs, setSubLobs] = useState([
    { id: 1, name: 'Sub LOB 1', lobId: 1 },
    { id: 2, name: 'Sub LOB 2', lobId: 2 }
  ]);
  const [sites] = useState([
    { id: 1, name: 'Site A' },
    { id: 2, name: 'Site B' }
  ]);

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

  useEffect(() => {
    let filtered = lobs;
    if (filterClientForSubLob) {
      filtered = filtered.filter(lob => lob.clientId === filterClientForSubLob);
    }
    if (filterSiteForSubLob) {
      filtered = filtered.filter(lob => lob.siteId === filterSiteForSubLob);
    }
    setFilteredLobs(filtered);
    
    if (selectedLobForSubLob && !filtered.some(lob => lob.id === selectedLobForSubLob)) {
      setSelectedLobForSubLob(null);
    }
  }, [filterClientForSubLob, filterSiteForSubLob, lobs, selectedLobForSubLob]);

  // Add Client tab functions
  const handleAddClient = () => {
    if (clientName.trim() && lobCards.some(card => card.lobName.trim())) {
      const newClientId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
      
      const newClient = {
        id: newClientId,
        name: clientName.trim()
      };
      
      let newLobId = lobs.length > 0 ? Math.max(...lobs.map(l => l.id)) : 0;
      let newSubLobId = subLobs.length > 0 ? Math.max(...subLobs.map(s => s.id)) : 0;
      
      const newLobs = [];
      const newSubLobs = [];
      
      lobCards.forEach(card => {
        if (card.lobName.trim()) {
          newLobId++;
          newLobs.push({
            id: newLobId,
            name: card.lobName.trim(),
            clientId: newClientId,
            siteId: 1
          });
          
          card.subLobNames.forEach(subLobName => {
            if (subLobName.trim()) {
              newSubLobId++;
              newSubLobs.push({
                id: newSubLobId,
                name: subLobName.trim(),
                lobId: newLobId
              });
            }
          });
        }
      });

      setClients([...clients, newClient]);
      if (newLobs.length > 0) setLobs([...lobs, ...newLobs]);
      if (newSubLobs.length > 0) setSubLobs([...subLobs, ...newSubLobs]);
      
      setClientName('');
      setLobCards([{ lobName: '', subLobNames: [''] }]);
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

  const handleSubLobNameChange = (lobCardIndex, subLobIndex, value) => {
    const updatedLobCards = [...lobCards];
    updatedLobCards[lobCardIndex].subLobNames[subLobIndex] = value;
    setLobCards(updatedLobCards);
  };

  // Add LOB tab functions
  const handleAddLob = () => {
    if (selectedClientForLob && selectedSiteForLob && lobCardsForLob.some(card => card.lobName.trim())) {
      let newLobId = lobs.length > 0 ? Math.max(...lobs.map(l => l.id)) : 0;
      let newSubLobId = subLobs.length > 0 ? Math.max(...subLobs.map(s => s.id)) : 0;
      
      const newLobs = [];
      const newSubLobs = [];
      
      lobCardsForLob.forEach(card => {
        if (card.lobName.trim()) {
          newLobId++;
          newLobs.push({
            id: newLobId,
            name: card.lobName.trim(),
            clientId: selectedClientForLob,
            siteId: selectedSiteForLob
          });
          
          card.subLobNames.forEach(subLobName => {
            if (subLobName.trim()) {
              newSubLobId++;
              newSubLobs.push({
                id: newSubLobId,
                name: subLobName.trim(),
                lobId: newLobId
              });
            }
          });
        }
      });

      if (newLobs.length > 0) {
        setLobs([...lobs, ...newLobs]);
        if (newSubLobs.length > 0) {
          setSubLobs([...subLobs, ...newSubLobs]);
        }
        setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
        setSelectedClientForLob(null);
        setSelectedSiteForLob(null);
      }
    }
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

  // Add Sub LOB tab functions
  const handleAddSubLob = () => {
    if (selectedLobForSubLob && subLobNames.some(name => name.trim())) {
      const newSubLobs = subLobNames
        .filter(name => name.trim())
        .map((name, index) => ({
          id: subLobs.length + index + 1,
          name: name.trim(),
          lobId: selectedLobForSubLob
        }));

      if (newSubLobs.length > 0) {
        setSubLobs([...subLobs, ...newSubLobs]);
        setSubLobNames(['']);
        setSelectedLobForSubLob(null);
        setFilterClientForSubLob(null);
        setFilterSiteForSubLob(null);
      }
    }
  };

  const handleAddAnotherSubLobField = () => {
    if (subLobNames.length < 4) {
      setSubLobNames([...subLobNames, '']);
    }
  };

  // Common functions
  const handleDelete = (id, type) => {
    if (type === 'client') {
      setClients(clients.filter(client => client.id !== id));
      const lobIdsToRemove = lobs.filter(lob => lob.clientId === id).map(lob => lob.id);
      setLobs(lobs.filter(lob => lob.clientId !== id));
      setSubLobs(subLobs.filter(subLob => !lobIdsToRemove.includes(subLob.lobId)));
    } else if (type === 'lob') {
      setLobs(lobs.filter(lob => lob.id !== id));
      setSubLobs(subLobs.filter(subLob => subLob.lobId !== id));
    } else if (type === 'subLob') {
      setSubLobs(subLobs.filter(subLob => subLob.id !== id));
    }
  };

  const handleEdit = (client) => {
    // Get the client's LOBs and Sub LOBs
    const clientLobs = lobs.filter(lob => lob.clientId === client.id);
    const clientSubLobs = subLobs.filter(subLob => 
      clientLobs.some(lob => lob.id === subLob.lobId)
    );
    
    setCurrentClient({
      ...client,
      lobs: clientLobs,
      subLobs: clientSubLobs
    });
    setEditModalOpen(true);
  };

  const handleSave = (updatedClient) => {
    // Update client basic info
    setClients(clients.map(client => 
      client.id === updatedClient.id ? {
        ...client,
        name: updatedClient.name,
        createdBy: updatedClient.createdBy,
        createdAt: updatedClient.createdAt
      } : client
    ));

    // Update LOBs
    const updatedLobs = [...lobs];
    updatedClient.lobs.forEach(lob => {
      const index = updatedLobs.findIndex(l => l.id === lob.id);
      if (index !== -1) {
        updatedLobs[index] = lob;
      }
    });
    setLobs(updatedLobs);

    // Update Sub LOBs
    const updatedSubLobs = [...subLobs];
    updatedClient.subLobs.forEach(subLob => {
      const index = updatedSubLobs.findIndex(sl => sl.id === subLob.id);
      if (index !== -1) {
        updatedSubLobs[index] = subLob;
      }
    });
    setSubLobs(updatedSubLobs);

    setEditModalOpen(false);
    setCurrentClient(null);
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
              onChange={(e) => setSelectedClientForLob(Number(e.target.value))}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
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
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 1)}>
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
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 2)}>
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
                    <button className="remove-lob-field-btn" onClick={() => handleRemoveSubLobField(0, 3)}>
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