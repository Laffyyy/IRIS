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

  // Add LOB tab functions
  const handleAddLob = () => {
    if (selectedClientForLob && selectedSiteForLob) {
      const newLobs = lobNames
        .filter(name => name.trim())
        .map((name, index) => ({
          id: lobs.length + index + 1,
          name: name.trim(),
          clientId: selectedClientForLob,
          siteId: selectedSiteForLob
        }));

      if (newLobs.length > 0) {
        setLobs([...lobs, ...newLobs]);
        setLobNames(['']);
        setSelectedClientForLob(null);
        setSelectedSiteForLob(null);
      }
    }
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
    console.log('Edit client:', client);
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