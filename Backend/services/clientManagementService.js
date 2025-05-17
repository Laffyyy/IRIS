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
}

module.exports = ClientManagementService;