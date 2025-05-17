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

  // Fetch all client data from backend
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  // Add these new state variables at the top with your other states
  const [editRow, setEditRow] = useState({ type: null, data: null });

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
            // First add the LOB
            const lobResponse = await axios.post('http://localhost:3000/api/clients/lob/add', {
              clientName: client.name,
              lobName: card.lobName.trim(),
              // No site ID is passed now
            });
            
            console.log('LOB added:', lobResponse.data);
            
            // Now add all SubLOBs for this LOB
            for (const subLobName of card.subLobNames) {
              if (subLobName.trim()) {
                try {
                  const subLobResponse = await axios.post('http://localhost:3000/api/clients/sublob/add', {
                    clientName: client.name,
                    lobName: card.lobName.trim(),
                    subLOBName: subLobName.trim()
                  });
                  
                  console.log('SubLOB added:', subLobResponse.data);
                } catch (subLobError) {
                  console.error('Error adding SubLOB:', subLobError);
                  alert(`Failed to add SubLOB "${subLobName.trim()}": ${subLobError.response?.data?.error || subLobError.message}`);
                }
              }
            }
          }
        }
        
        // Refresh client data to show the new LOBs and SubLOBs
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
                    // Default site ID since we don't require it now
                    siteId: null
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
          alert('LOBs were added, but we had trouble refreshing the display. Please reload the page.');
        }
        
        // Reset form
        setLobCardsForLob([{ lobName: '', subLobNames: [''] }]);
        setSelectedClientForLob(null);
        // No need to reset site selection since we don't use it
        
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

// Update the handleEditRow function but keep your modal interface
const handleEditRow = (type, data) => {
  if (type === 'client') {
    // For clients, use your existing currentClient state and modal
    const clientLobs = lobs.filter(lob => lob.clientId === data.id);
    const clientSubLobs = subLobs.filter(subLob => 
      clientLobs.some(lob => lob.id === subLob.lobId)
    );
    
    setCurrentClient({
      ...data,
      lobs: clientLobs,
      subLobs: clientSubLobs
    });
  } else if (type === 'lob') {
    // For LOBs, create a minimal client object with just this LOB
    const client = clients.find(c => c.id === data.clientId);
    if (!client) return;
    
    const lobSubLobs = subLobs.filter(subLob => subLob.lobId === data.id);
    
    setCurrentClient({
      id: client.id,
      name: client.name,
      createdBy: client.createdBy || '',
      createdAt: client.createdAt || '',
      lobs: [data], // Just this one LOB
      subLobs: lobSubLobs // Just the SubLOBs for this LOB
    });
  } else if (type === 'sublob') {
    // For SubLOBs, create a minimal client object with just the parent LOB and this SubLOB
    const lob = lobs.find(l => l.id === data.lobId);
    if (!lob) return;
    
    const client = clients.find(c => c.id === lob.clientId);
    if (!client) return;
    
    setCurrentClient({
      id: client.id,
      name: client.name,
      createdBy: client.createdBy || '',
      createdAt: client.createdAt || '',
      lobs: [lob], // Just the parent LOB
      subLobs: [data] // Just this one SubLOB
    });
  }
  
  setEditModalOpen(true);
};

const handleSaveRow = async () => {
  try {
    const { type, data } = editRow;
    
    if (type === 'client') {
      // Update client
      await axios.post('http://localhost:3000/api/clients/update', {
        oldClientName: data.originalName || data.name,
        newClientName: data.name
      });
      
      // Update in local state
      setClients(clients.map(c => 
        c.id === data.id ? { ...c, name: data.name } : c
      ));
    } 
    else if (type === 'lob') {
      // Update LOB
      const client = clients.find(c => c.id === data.clientId);
      if (client) {
        await axios.post('http://localhost:3000/api/clients/lob/update', {
          clientName: client.name,
          oldLOBName: data.originalName || data.name,
          newLOBName: data.name
        });
        
        // Update in local state
        setLobs(lobs.map(l => 
          l.id === data.id ? { ...l, name: data.name } : l
        ));
      }
    }
    else if (type === 'sublob') {
      // Update SubLOB
      const lob = lobs.find(l => l.id === data.lobId);
      const client = lob ? clients.find(c => c.id === lob.clientId) : null;
      
      if (client && lob) {
        await axios.post('http://localhost:3000/api/clients/sublob/update', {
          clientName: client.name,
          lobName: lob.name,
          oldSubLOBName: data.originalName || data.name,
          newSubLOBName: data.name
        });
        
        // Update in local state
        setSubLobs(subLobs.map(s => 
          s.id === data.id ? { ...s, name: data.name } : s
        ));
      }
    }
    
    setEditModalOpen(false);
    setEditRow({ type: null, data: null });
    
    // Success message
    alert('Update successful!');
  } catch (error) {
    console.error('Error updating item:', error);
    alert(`Update failed: ${error.response?.data?.error || error.message}`);
  }
};

const handleDeleteRow = async (type, id) => {
  try {
    if (type === 'client') {
      const client = clients.find(c => c.id === id);
      if (!client) return;
      
      // Ask for confirmation before deleting client
      if (!window.confirm(`Are you sure you want to delete client "${client.name}"? This will also delete all its LOBs and Sub LOBs.`)) {
        return; // User cancelled the operation
      }
      
      // Delete client from backend
      await axios.delete(`http://localhost:3000/api/clients/delete`, {
        data: { clientName: client.name }
      });
      
      // Update local state
      setClients(clients.filter(c => c.id !== id));
      const clientLobs = lobs.filter(l => l.clientId === id);
      setLobs(lobs.filter(l => l.clientId !== id));
      const lobIds = clientLobs.map(l => l.id);
      setSubLobs(subLobs.filter(s => !lobIds.includes(s.lobId)));
    }
    else if (type === 'lob') {
      const lob = lobs.find(l => l.id === id);
      if (!lob) return;
      
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) return;
      
      // Check if this is the only LOB for this client
      const clientLobs = lobs.filter(l => l.clientId === client.id);
      
      if (clientLobs.length <= 1) {
        // This is the only LOB, ask if they want to delete the client too
        const confirmDeleteClient = window.confirm(
          `"${lob.name}" is the last LOB for client "${client.name}". ` +
          `Deleting this LOB will also delete the client. ` +
          `Do you want to proceed?`
        );
        
        if (!confirmDeleteClient) {
          return; // User cancelled the operation
        }
        
        // Delete the client instead (this will cascade delete LOBs and SubLOBs)
        await axios.delete(`http://localhost:3000/api/clients/delete`, {
          data: { clientName: client.name }
        });
        
        // Update local state
        setClients(clients.filter(c => c.id !== client.id));
        setLobs(lobs.filter(l => l.clientId !== client.id));
        setSubLobs(subLobs.filter(s => !clientLobs.some(cl => cl.id === s.lobId)));
        
        alert(`Client "${client.name}" and all its LOBs have been deleted.`);
        return;
      } else {
        // Not the last LOB, just confirm deletion of this LOB
        if (!window.confirm(`Are you sure you want to delete LOB "${lob.name}"? This will also delete all its Sub LOBs.`)) {
          return; // User cancelled the operation
        }
        
        // Delete LOB from backend
        await axios.delete(`http://localhost:3000/api/clients/lob/delete`, {
          data: { clientName: client.name, lobName: lob.name }
        });
        
        // Update local state
        setLobs(lobs.filter(l => l.id !== id));
        setSubLobs(subLobs.filter(s => s.lobId !== id));
      }
    }
    else if (type === 'sublob') {
      const sublob = subLobs.find(s => s.id === id);
      if (!sublob) return;
      
      const lob = lobs.find(l => l.id === sublob.lobId);
      if (!lob) return;
      
      const client = clients.find(c => c.id === lob.clientId);
      if (!client) return;
      
      // Check if this is the only SubLOB for this LOB
      const lobSubLobs = subLobs.filter(s => s.lobId === lob.id);
      
      if (lobSubLobs.length <= 1) {
        // This is the only SubLOB, check if this LOB is the last one for the client
        const clientLobs = lobs.filter(l => l.clientId === client.id);
        
        if (clientLobs.length <= 1) {
          // This is also the last LOB, ask if they want to delete the client
          const confirmDeleteClient = window.confirm(
            `"${sublob.name}" is the last Sub LOB of the last LOB for client "${client.name}". ` +
            `Deleting this Sub LOB will also delete the LOB and the client. ` +
            `Do you want to proceed?`
          );
          
          if (!confirmDeleteClient) {
            return; // User cancelled the operation
          }
          
          // Delete the client (this will cascade delete LOBs and SubLOBs)
          await axios.delete(`http://localhost:3000/api/clients/delete`, {
            data: { clientName: client.name }
          });
          
          // Update local state
          setClients(clients.filter(c => c.id !== client.id));
          setLobs(lobs.filter(l => l.clientId !== client.id));
          setSubLobs(subLobs.filter(s => !clientLobs.some(cl => cl.id === s.lobId)));
          
          alert(`Client "${client.name}" and all its LOBs have been deleted.`);
          return;
        } else {
          // Not the last LOB, but last SubLOB of this LOB
          const confirmDeleteLob = window.confirm(
            `"${sublob.name}" is the last Sub LOB for LOB "${lob.name}". ` +
            `Deleting this Sub LOB will also delete the LOB. ` +
            `Do you want to proceed?`
          );
          
          if (!confirmDeleteLob) {
            return; // User cancelled the operation
          }
          
          // Delete the LOB (this will cascade delete the SubLOB)
          await axios.delete(`http://localhost:3000/api/clients/lob/delete`, {
            data: { clientName: client.name, lobName: lob.name }
          });
          
          // Update local state
          setLobs(lobs.filter(l => l.id !== lob.id));
          setSubLobs(subLobs.filter(s => s.lobId !== lob.id));
          
          alert(`LOB "${lob.name}" has been deleted.`);
          return;
        }
      } else {
        // Not the last SubLOB, just confirm deletion
        if (!window.confirm(`Are you sure you want to delete Sub LOB "${sublob.name}"?`)) {
          return; // User cancelled the operation
        }
        
        // Delete just this SubLOB
        await axios.delete(`http://localhost:3000/api/clients/sublob/delete`, {
          data: { clientName: client.name, lobName: lob.name, subLOBName: sublob.name }
        });
        
        // Update local state
        setSubLobs(subLobs.filter(s => s.id !== id));
      }
    }
    
    alert('Item deleted successfully');
  } catch (error) {
    console.error('Error deleting item:', error);
    alert(`Deletion failed: ${error.response?.data?.error || error.message}`);
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
                          <td>{client.id.toString().padStart(3, '0')}</td>
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
                              <button onClick={() => handleDeleteRow('client', client.id)} className="delete-btn">
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
                            <td>{client.id.toString().padStart(3, '0')}</td>
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
                                <button onClick={() => handleDeleteRow('lob', lob.id)} className="delete-btn">
                                  <FaTrash size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )];
                      }
                      
                      // Otherwise create one row for each SubLOB
                      return lobSubLobs.map(subLob => (
                        <tr key={`client-${client.id}-lob-${lob.id}-sublob-${subLob.id}`}>
                          <td>{client.id.toString().padStart(3, '0')}</td>
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
                              <button onClick={() => handleDeleteRow('sublob', subLob.id)} className="delete-btn">
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
                                <button onClick={() => handleDeleteRow('lob', lob.id)} className="delete-btn">
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
                              <button onClick={() => handleDeleteRow('sublob', subLob.id)} className="delete-btn">
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
                              <button onClick={() => handleDeleteRow('sublob', subLob.id)} className="delete-btn">
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