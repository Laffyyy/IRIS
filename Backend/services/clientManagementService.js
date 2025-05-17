// services/clientManagementService.js
const db = require('../config/db');
const Client = require('../models/client');

class ClientManagementService {
    async addClient(clientData, userId) {
        try {
            const { clientName, LOBs } = clientData;
            // Now we use the userId parameter instead of clientData.createdBy
            const createdBy = userId;
            
            // Validate if at least one LOB with one Sub LOB is provided
            if (!LOBs || LOBs.length === 0) {
                throw new Error('At least one LOB is required');
            }
            
            // Check if each LOB has at least one Sub LOB
            for (const lob of LOBs) {
                if (!lob.subLOBs || lob.subLOBs.length === 0) {
                    throw new Error(`LOB "${lob.name}" must have at least one Sub LOB`);
                }
            }
            
            // Create current timestamp
            const currentDate = new Date();
            
            // Insert records for each LOB and Sub LOB
            const results = [];
            
            for (const lob of LOBs) {
                for (const subLOB of lob.subLOBs) {
                    const [result] = await db.query(
                        'INSERT INTO tbl_clientlob (dClientName, dLOB, dSubLOB, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?)',
                        [clientName, lob.name, subLOB, createdBy, currentDate]
                    );
                    
                    results.push(result.insertId);
                }
            }
            
            return { clientName, insertedIds: results, createdBy };
        } catch (error) {
            console.error('Error in ClientManagementService.addClient:', error);
            throw error;
        }
    }
    
    async getClients() {
        try {
            // Get all unique clients with their LOBs and Sub LOBs
            const [rows] = await db.query(
                'SELECT * FROM tbl_clientlob ORDER BY dClientName, dLOB, dSubLOB'
            );
            
            // Format the results to organize by client, LOB, and Sub LOB
            const clientsMap = new Map();
            
            rows.forEach(row => {
                const clientName = row.dClientName;
                const lob = row.dLOB;
                const subLOB = row.dSubLOB;
                const createdBy = row.dCreatedBy;
                const createdAt = row.tCreatedAt;
                
                if (!clientsMap.has(clientName)) {
                    clientsMap.set(clientName, {
                        lobsMap: new Map(),
                        createdBy,
                        createdAt
                    });
                }
                
                const clientData = clientsMap.get(clientName);
                const lobsMap = clientData.lobsMap;
                
                if (!lobsMap.has(lob)) {
                    lobsMap.set(lob, []);
                }
                
                lobsMap.get(lob).push(subLOB);
            });
            
            // Convert map to the desired response format
            const clients = [];
            
            clientsMap.forEach((clientData, clientName) => {
                const client = {
                    clientName: clientName,
                    LOBs: [],
                    createdBy: clientData.createdBy,
                    createdAt: clientData.createdAt
                };
                
                clientData.lobsMap.forEach((subLOBs, lobName) => {
                    client.LOBs.push({
                        name: lobName,
                        subLOBs: subLOBs
                    });
                });
                
                clients.push(client);
            });
            
            return clients;
        } catch (error) {
            console.error('Error in ClientManagementService.getClients:', error);
            throw error;
        }
    }
    
    async updateClient(clientData, userId) {
        try {
            const { oldClientName, newClientName } = clientData;
            // Use the passed userId instead of clientData.createdBy
            
            if (!oldClientName || !newClientName) {
                throw new Error('Both old and new client names are required');
            }
            
            // Update the client name
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dClientName = ?, dCreatedBy = ? WHERE dClientName = ?',
                [newClientName, userId, oldClientName]
            );
            
            return { 
                message: 'Client updated successfully',
                affectedRows: result.affectedRows,
                updatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.updateClient:', error);
            throw error;
        }
    }
    
    async deleteClient(clientName, userId) {
        try {
            if (!clientName) {
                throw new Error('Client name is required');
            }
            
            // Log who deleted the client for audit purposes if needed
            console.log(`Client "${clientName}" deleted by user ID: ${userId}`);
            
            // Delete all records for the client
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            return { 
                message: 'Client deleted successfully',
                affectedRows: result.affectedRows,
                deletedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deleteClient:', error);
            throw error;
        }
    }

    async addLOB(clientName, lobName, siteId, userId) {
        try {
            console.log("addLOB service called with:", {clientName, lobName, siteId, userId});
            
            if (!clientName || !lobName) {
                throw new Error('Client name and LOB name are required');
            }
            
            // Check if the client exists
            const [clientExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            if (clientExists[0].count === 0) {
                throw new Error(`Client "${clientName}" does not exist`);
            }
            
            // Check if the LOB already exists for this client
            const [lobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            if (lobExists[0].count > 0) {
                throw new Error(`LOB "${lobName}" already exists for client "${clientName}"`);
            }
            
            // Create current timestamp
            const currentDate = new Date();
            
            // We need to add at least one Sub LOB when creating a LOB
            // For now, we'll add a placeholder Sub LOB that can be updated later
            const initialSubLOB = 'Default Sub LOB';
            
            const [result] = await db.query(
                'INSERT INTO tbl_clientlob (dClientName, dLOB, dSubLOB, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?)',
                [clientName, lobName, initialSubLOB, userId, currentDate]
            );
            
            return { 
                clientName, 
                lobName, 
                siteId,
                insertId: result.insertId, 
                createdBy: userId,
                initialSubLOB
            };
        } catch (error) {
            console.error('Error in ClientManagementService.addLOB:', error);
            throw error;
        }
    }

    async updateLOB(clientName, oldLOBName, newLOBName, userId) {
        try {
            if (!clientName || !oldLOBName || !newLOBName) {
                throw new Error('Client name, old LOB name, and new LOB name are required');
            }
            
            // Check if the client and old LOB exist
            const [lobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, oldLOBName]
            );
            
            if (lobExists[0].count === 0) {
                throw new Error(`LOB "${oldLOBName}" does not exist for client "${clientName}"`);
            }
            
            // Check if the new LOB name already exists for this client (if different from old name)
            if (oldLOBName !== newLOBName) {
                const [newLobExists] = await db.query(
                    'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                    [clientName, newLOBName]
                );
                
                if (newLobExists[0].count > 0) {
                    throw new Error(`LOB "${newLOBName}" already exists for client "${clientName}"`);
                }
            }
            
            // Update the LOB name
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dLOB = ?, dCreatedBy = ? WHERE dClientName = ? AND dLOB = ?',
                [newLOBName, userId, clientName, oldLOBName]
            );
            
            return { 
                message: 'LOB updated successfully',
                clientName,
                oldLOBName,
                newLOBName,
                affectedRows: result.affectedRows,
                updatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.updateLOB:', error);
            throw error;
        }
    }

    async deleteLOB(clientName, lobName, userId) {
        try {
            if (!clientName || !lobName) {
                throw new Error('Client name and LOB name are required');
            }
            
            // Check if the client and LOB exist
            const [lobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            if (lobExists[0].count === 0) {
                throw new Error(`LOB "${lobName}" does not exist for client "${clientName}"`);
            }
            
            // Check if this is the only LOB for the client
            const [lobCount] = await db.query(
                'SELECT COUNT(DISTINCT dLOB) as count FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            if (lobCount[0].count === 1) {
                throw new Error(`Cannot delete the only LOB for client "${clientName}". A client must have at least one LOB.`);
            }
            
            // Delete all records for this LOB
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            return { 
                message: 'LOB deleted successfully',
                clientName,
                lobName,
                affectedRows: result.affectedRows,
                deletedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deleteLOB:', error);
            throw error;
        }
    }

    // New methods for Sub LOB management
    async addSubLOB(clientName, lobName, subLOBName, userId) {
        try {
            if (!clientName || !lobName || !subLOBName) {
                throw new Error('Client name, LOB name, and Sub LOB name are required');
            }
            
            // Check if the client and LOB exist
            const [lobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            if (lobExists[0].count === 0) {
                throw new Error(`LOB "${lobName}" does not exist for client "${clientName}"`);
            }
            
            // Check if the Sub LOB already exists for this client and LOB
            const [subLobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, subLOBName]
            );
            
            if (subLobExists[0].count > 0) {
                throw new Error(`Sub LOB "${subLOBName}" already exists for LOB "${lobName}" of client "${clientName}"`);
            }
            
            // Create current timestamp
            const currentDate = new Date();
            
            // Insert the new Sub LOB
            const [result] = await db.query(
                'INSERT INTO tbl_clientlob (dClientName, dLOB, dSubLOB, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?)',
                [clientName, lobName, subLOBName, userId, currentDate]
            );
            
            return { 
                clientName, 
                lobName, 
                subLOBName,
                insertId: result.insertId, 
                createdBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.addSubLOB:', error);
            throw error;
        }
    }

    async updateSubLOB(clientName, lobName, oldSubLOBName, newSubLOBName, userId) {
        try {
            if (!clientName || !lobName || !oldSubLOBName || !newSubLOBName) {
                throw new Error('Client name, LOB name, old Sub LOB name, and new Sub LOB name are required');
            }
            
            // Check if the client, LOB, and old Sub LOB exist
            const [subLobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, oldSubLOBName]
            );
            
            if (subLobExists[0].count === 0) {
                throw new Error(`Sub LOB "${oldSubLOBName}" does not exist for LOB "${lobName}" of client "${clientName}"`);
            }
            
            // Check if the new Sub LOB name already exists for this client and LOB (if different from old name)
            if (oldSubLOBName !== newSubLOBName) {
                const [newSubLobExists] = await db.query(
                    'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                    [clientName, lobName, newSubLOBName]
                );
                
                if (newSubLobExists[0].count > 0) {
                    throw new Error(`Sub LOB "${newSubLOBName}" already exists for LOB "${lobName}" of client "${clientName}"`);
                }
            }
            
            // Update the Sub LOB name
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dSubLOB = ?, dCreatedBy = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [newSubLOBName, userId, clientName, lobName, oldSubLOBName]
            );
            
            return { 
                message: 'Sub LOB updated successfully',
                clientName,
                lobName,
                oldSubLOBName,
                newSubLOBName,
                affectedRows: result.affectedRows,
                updatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.updateSubLOB:', error);
            throw error;
        }
    }

    async deleteSubLOB(clientName, lobName, subLOBName, userId) {
        try {
            if (!clientName || !lobName || !subLOBName) {
                throw new Error('Client name, LOB name, and Sub LOB name are required');
            }
            
            // Check if the client, LOB, and Sub LOB exist
            const [subLobExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, subLOBName]
            );
            
            if (subLobExists[0].count === 0) {
                throw new Error(`Sub LOB "${subLOBName}" does not exist for LOB "${lobName}" of client "${clientName}"`);
            }
            
            // Check if this is the only Sub LOB for this LOB
            const [subLobCount] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            if (subLobCount[0].count === 1) {
                throw new Error(`Cannot delete the only Sub LOB for LOB "${lobName}". A LOB must have at least one Sub LOB.`);
            }
            
            // Delete the Sub LOB
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, subLOBName]
            );
            
            return { 
                message: 'Sub LOB deleted successfully',
                clientName,
                lobName,
                subLOBName,
                affectedRows: result.affectedRows,
                deletedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deleteSubLOB:', error);
            throw error;
        }
    }
}

module.exports = ClientManagementService;