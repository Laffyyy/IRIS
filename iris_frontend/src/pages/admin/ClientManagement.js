// ClientManagement.js
import React, { useState } from 'react';
import './ClientManagement.css';

const ClientManagement = () => {
  const [activeTab, setActiveTab] = useState('addClient');
  const [clients, setClients] = useState([
    { id: 1, name: 'Client A' },
    { id: 2, name: 'Client B' }
  ]);
  const [lobs, setLobs] = useState([
    { id: 1, name: 'LOB X', clientId: 1 },
    { id: 2, name: 'LOB Y', clientId: 2 }
  ]);
  const [subLobs, setSubLobs] = useState([
    { id: 1, name: 'Sub LOB 1', lobId: 1 },
    { id: 2, name: 'Sub LOB 2', lobId: 2 }
  ]);
  const [sites, setSites] = useState([
    { id: 1, name: 'Site A' },
    { id: 2, name: 'Site B' }
  ]);

  // Form states
  const [clientName, setClientName] = useState('');
  const [lobName, setLobName] = useState('');
  const [selectedClientForLob, setSelectedClientForLob] = useState(null);
  const [selectedSiteForLob, setSelectedSiteForLob] = useState(null);
  const [subLobName, setSubLobName] = useState('');
  const [selectedLobForSubLob, setSelectedLobForSubLob] = useState(null);

  const handleAddClient = () => {
    if (clientName.trim()) {
      const newClient = {
        id: clients.length + 1,
        name: clientName
      };
      setClients([...clients, newClient]);
      setClientName('');
    }
  };

  const handleAddLob = () => {
    if (lobName.trim() && selectedClientForLob && selectedSiteForLob) {
      const newLob = {
        id: lobs.length + 1,
        name: lobName,
        clientId: selectedClientForLob,
        siteId: selectedSiteForLob
      };
      setLobs([...lobs, newLob]);
      setLobName('');
      setSelectedClientForLob(null);
      setSelectedSiteForLob(null);
    }
  };

  const handleAddSubLob = () => {
    if (subLobName.trim() && selectedLobForSubLob) {
      const newSubLob = {
        id: subLobs.length + 1,
        name: subLobName,
        lobId: selectedLobForSubLob
      };
      setSubLobs([...subLobs, newSubLob]);
      setSubLobName('');
      setSelectedLobForSubLob(null);
    }
  };

  return (
    <div className="client-management-container">
      <div className="white-card">
        <div className="client-management-header">
          <h1>Client Management</h1>
          <p className="subtitle">Manage clients, LOBs, and Sub LOBs</p>
        </div>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'addClient' ? 'active' : ''}`}
            onClick={() => setActiveTab('addClient')}
          >
            Add Client
          </div>
          <div 
            className={`tab ${activeTab === 'addLOB' ? 'active' : ''}`}
            onClick={() => setActiveTab('addLOB')}
          >
            Add LOB
          </div>
          <div 
            className={`tab ${activeTab === 'addSubLOB' ? 'active' : ''}`}
            onClick={() => setActiveTab('addSubLOB')}
          >
            Add Sub LOB
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addClient' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>
          <button onClick={handleAddClient} className="add-button">
            + Add Client
          </button>
        </div>

        <div className={`tab-content ${activeTab === 'addLOB' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>LOB Name</label>
              <input
                type="text"
                value={lobName}
                onChange={(e) => setLobName(e.target.value)}
                placeholder="Enter LOB name"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Select Client</label>
              <select
                value={selectedClientForLob || ''}
                onChange={(e) => setSelectedClientForLob(Number(e.target.value))}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
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
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={handleAddLob} 
            className="add-button"
            disabled={!lobName.trim() || !selectedClientForLob || !selectedSiteForLob}
          >
            + Add LOB
          </button>
        </div>

        <div className={`tab-content ${activeTab === 'addSubLOB' ? 'active' : ''}`}>
          <div className="form-row">
            <div className="form-group">
              <label>Sub LOB Name</label>
              <input
                type="text"
                value={subLobName}
                onChange={(e) => setSubLobName(e.target.value)}
                placeholder="Enter Sub LOB name"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Select LOB</label>
              <select
                value={selectedLobForSubLob || ''}
                onChange={(e) => setSelectedLobForSubLob(Number(e.target.value))}
              >
                <option value="">Select a LOB</option>
                {lobs.map(lob => (
                  <option key={lob.id} value={lob.id}>
                    {lob.name} (Client: {clients.find(c => c.id === lob.clientId)?.name || 'Unknown'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={handleAddSubLob} 
            className="add-button"
            disabled={!subLobName.trim() || !selectedLobForSubLob}
          >
            + Add Sub LOB
          </button>
        </div>

        <div className="existing-items">
          <h2>Existing Items</h2>
          <div className="tables-container">
            <div className="table-section">
              <h3>Clients</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td>{client.id}</td>
                      <td>{client.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-section">
              <h3>LOBs</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Client</th>
                    <th>Site</th>
                  </tr>
                </thead>
                <tbody>
                  {lobs.map(lob => (
                    <tr key={lob.id}>
                      <td>{lob.id}</td>
                      <td>{lob.name}</td>
                      <td>{clients.find(c => c.id === lob.clientId)?.name || 'Unknown'}</td>
                      <td>{sites.find(s => s.id === lob.siteId)?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-section">
              <h3>Sub LOBs</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Parent LOB</th>
                  </tr>
                </thead>
                <tbody>
                  {subLobs.map(subLob => (
                    <tr key={subLob.id}>
                      <td>{subLob.id}</td>
                      <td>{subLob.name}</td>
                      <td>{lobs.find(l => l.id === subLob.lobId)?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;