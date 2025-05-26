const db = require('../config/db');

// Utility function to generate the next dClientLOB_ID
async function getNextClientLOBId() {
    const [rows] = await db.query("SELECT dClientLOB_ID FROM tbl_clientlob ORDER BY dClientLOBEntry_ID DESC LIMIT 1");
    if (rows.length === 0 || !rows[0].dClientLOB_ID) {
        return 'CLB1';
    }
    const lastId = rows[0].dClientLOB_ID;
    const match = lastId.match(/CLB(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    return `CLB${nextNum}`;
}

class ClientManagementService {
    async logAdminAction({ dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt }) {
        await db.query(
            'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, ?, ?, ?, ?)',
            [dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt]
        );
    }

    async addClient(clientData, userId) {
        try {
            const { clientName, LOBs } = clientData;
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
            
            // Check if client already exists
            const [clientExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            if (clientExists[0].count > 0) {
                throw new Error(`Client "${clientName}" already exists`);
            }
            
            // Create current timestamp
            const currentDate = new Date();
            
            // Insert records for each LOB and Sub LOB
            const results = [];
            
            for (const lob of LOBs) {
                for (const subLOB of lob.subLOBs) {
                    const dClientLOB_ID = await getNextClientLOBId();
                    const [result] = await db.query(
                        'INSERT INTO tbl_clientlob (dClientLOB_ID, dClientName, dLOB, dSubLOB, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [dClientLOB_ID, clientName, lob.name, subLOB, 'ACTIVE', createdBy, currentDate]
                    );
                    results.push({ entryId: result.insertId, dClientLOB_ID });
                    await this.logAdminAction({
                        dActionLocation_ID: dClientLOB_ID,
                        dActionLocation: 'CLIENT',
                        dActionType: 'CREATED',
                        dActionBy: createdBy,
                        tActionAt: currentDate
                    });
                }
            }
            
            // Get the client ID that was generated
            const [newClient] = await db.query(
                'SELECT dClientLOBEntry_ID FROM tbl_clientlob WHERE dClientName = ? LIMIT 1',
                [clientName]
            );
            
            const clientId = newClient.length > 0 ? newClient[0].dClientLOBEntry_ID : null;
            
            return { clientId, clientName, insertedIds: results, createdBy };
        } catch (error) {
            console.error('Error in ClientManagementService.addClient:', error);
            throw error;
        }
    }
    
    async getClients(status = 'ACTIVE') {
        try {
            const [rows] = await db.query(`
                SELECT 
                    cl.dClientLOBEntry_ID,
                    cl.dClientLOB_ID,
                    cl.dClientName,
                    cl.dLOB,
                    cl.dSubLOB,
                    cl.dCreatedBy,
                    cl.tCreatedAt,
                    cl.dStatus,
                    cs.dSite_ID,
                    cs.dSiteName
                FROM tbl_clientlob cl
                LEFT JOIN tbl_clientsite cs ON 
                    cl.dClientName = cs.dClientName AND 
                    cl.dLOB = cs.dLOB AND 
                    cl.dSubLOB = cs.dSubLOB
                WHERE cl.dStatus = ?
                ORDER BY cl.dClientLOBEntry_ID DESC
            `, [status]);
            
            // Get site information with LOB associations
            const [lobSiteRows] = await db.query(
                'SELECT cs.dClientName, cs.dLOB, s.dSite_ID, s.dSiteName ' +
                'FROM tbl_clientsite cs ' +
                'JOIN tbl_site s ON cs.dSite_ID = s.dSite_ID ' +
                'ORDER BY cs.dClientName, cs.dLOB, s.dSiteName'
            );
            
            // Create a map to store LOB-site relationships (multiple sites per LOB)
            const lobSiteMap = new Map();
            
            // Populate the LOB-site map with arrays of sites
            lobSiteRows.forEach(row => {
                const key = `${row.dClientName}-${row.dLOB}`;
                if (!lobSiteMap.has(key)) {
                    lobSiteMap.set(key, []);
                }
                
                // Add this site to the array for this client-LOB
                lobSiteMap.get(key).push({
                    siteId: row.dSite_ID,
                    siteName: row.dSiteName
                });
            });
            
            // Create a map of sites by client name
            const clientSitesMap = new Map();
            lobSiteRows.forEach(row => {
                if (!clientSitesMap.has(row.dClientName)) {
                    clientSitesMap.set(row.dClientName, new Map());
                }
                
                clientSitesMap.get(row.dClientName).set(row.dSite_ID, {
                    siteId: row.dSite_ID,
                    siteName: row.dSiteName
                });
            });
            
            // Group by client and organize the data
            const clientsMap = new Map();
            
            rows.forEach(row => {
                const clientId = row.dClientLOBEntry_ID;
                const clientName = row.dClientName;
                const lob = row.dLOB;
                const subLOB = row.dSubLOB;
                const createdAt = row.tCreatedAt;
                
                if (!clientsMap.has(clientName)) {
                    clientsMap.set(clientName, {
                        clientId,
                        clientName,
                        LOBs: new Map(),
                        sites: clientSitesMap.get(clientName) ? 
                            Array.from(clientSitesMap.get(clientName).values()) : [],
                        createdBy: row.dCreatedBy,
                        createdAt: row.tCreatedAt
                    });
                }
                
                const client = clientsMap.get(clientName);
                
                if (!client.LOBs.has(lob)) {
                    // Find the sites associated with this LOB
                    const lobSiteKey = `${clientName}-${lob}`;
                    const sitesInfo = lobSiteMap.get(lobSiteKey) || [];
                    
                    client.LOBs.set(lob, {
                        name: lob,
                        subLOBs: [],
                        clientRowId: row.dClientLOBEntry_ID,
                        siteId: sitesInfo.length > 0 ? sitesInfo[0].siteId : null,
                        siteName: sitesInfo.length > 0 ? sitesInfo[0].siteName : null,
                        sites: sitesInfo,
                        createdAt: row.tCreatedAt
                    });
                }
                
                // Add SubLOB if it's not empty and not already in the list
                if (subLOB) {
                    // Check if this SubLOB already exists in the array
                    const existingSubLob = client.LOBs.get(lob).subLOBs.find(sl => 
                        typeof sl === 'object' ? sl.name === subLOB : sl === subLOB
                    );
                    
                    if (!existingSubLob) {
                        // Store SubLOB as an object with its own unique clientRowId and createdAt
                        client.LOBs.get(lob).subLOBs.push({
                            name: subLOB,
                            clientRowId: row.dClientLOBEntry_ID,
                            createdAt: row.tCreatedAt
                        });
                    }
                }
            });
            
            // Convert map to array for response
            const clients = [];
            
            clientsMap.forEach(client => {
                // Convert LOB Map to Array
                const lobsArray = Array.from(client.LOBs.values());
                
                clients.push({
                    clientId: client.clientId,
                    clientName: client.clientName,
                    LOBs: lobsArray,
                    sites: client.sites,
                    createdBy: client.createdBy,
                    createdAt: client.createdAt
                });
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
            
            if (!oldClientName || !newClientName) {
                throw new Error('Both old and new client names are required');
            }
            
            // Check if the client exists
            const [clientExists] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ?',
                [oldClientName]
            );
            
            if (clientExists[0].count === 0) {
                throw new Error(`Client "${oldClientName}" does not exist`);
            }
            
            // Check if the new client name already exists (if different from old name)
            if (oldClientName !== newClientName) {
                const [newClientExists] = await db.query(
                    'SELECT COUNT(*) as count FROM tbl_clientlob WHERE dClientName = ?',
                    [newClientName]
                );
                
                if (newClientExists[0].count > 0) {
                    throw new Error(`Client "${newClientName}" already exists`);
                }
            }
            
            // Check if this client has site associations
            const [siteAssociations] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientsite WHERE dClientName = ?',
                [oldClientName]
            );
            
            const hasSiteAssociations = siteAssociations[0].count > 0;
            
            // Update the client name in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dClientName = ?, dCreatedBy = ? WHERE dClientName = ?',
                [newClientName, userId, oldClientName]
            );
            
            // If the client has site associations, update tbl_clientsite as well
            if (hasSiteAssociations) {
                await db.query(
                    'UPDATE tbl_clientsite SET dClientName = ? WHERE dClientName = ?',
                    [newClientName, oldClientName]
                );
                
                return { 
                    message: 'Client updated successfully in both client and site tables',
                    oldClientName,
                    newClientName,
                    affectedRows: result.affectedRows,
                    updatedBy: userId,
                    siteAssociationsUpdated: true
                };
            }
            
            return { 
                message: 'Client updated successfully',
                oldClientName,
                newClientName,
                affectedRows: result.affectedRows,
                updatedBy: userId,
                siteAssociationsUpdated: false
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
            
            // Delete all records for the client from tbl_clientlob
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            // Also delete from tbl_clientsite if it exists
            await db.query(
                'DELETE FROM tbl_clientsite WHERE dClientName = ?',
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

    async addLOB(clientName, lobName, siteId, userId, subLOBName = null) {
        try {
            console.log("addLOB service called with:", {clientName, lobName, siteId, userId, subLOBName});
            
            if (!clientName || !lobName) {
                throw new Error('Client name and LOB name are required');
            }
            
            // Check if the client exists and get its ID
            const [clientExists] = await db.query(
                'SELECT dClientLOBEntry_ID FROM tbl_clientlob WHERE dClientName = ? LIMIT 1',
                [clientName]
            );
            
            if (clientExists.length === 0) {
                throw new Error(`Client "${clientName}" does not exist`);
            }
            
            const clientEntryId = clientExists[0].dClientLOBEntry_ID;
            
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
            
            // Use the provided subLOBName or a placeholder if none is provided
            const actualSubLOB = subLOBName && subLOBName.trim() ? subLOBName.trim() : "__temp_placeholder__";
            
            // Add the LOB with the SubLOB
            const dClientLOB_ID = await getNextClientLOBId();
            const [result] = await db.query(
                'INSERT INTO tbl_clientlob (dClientLOB_ID, dClientName, dLOB, dSubLOB, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [dClientLOB_ID, clientName, lobName, actualSubLOB, 'ACTIVE', userId, currentDate]
            );
            await this.logAdminAction({
                dActionLocation_ID: dClientLOB_ID,
                dActionLocation: siteId ? 'CLIENT_SITE' : 'CLIENT',
                dActionType: 'CREATED',
                dActionBy: userId,
                tActionAt: currentDate
            });
            
            // If a site ID is provided, associate the LOB with the site
            if (siteId) {
                // Check if the site exists and get its name
                const [siteData] = await db.query(
                    'SELECT dSiteName FROM tbl_site WHERE dSite_ID = ?',
                    [siteId]
                );
                
                if (siteData.length === 0) {
                    throw new Error(`Site with ID ${siteId} does not exist`);
                }
                
                const siteName = siteData[0].dSiteName;
                
                // Associate the LOB with the site, including the SubLOB, site name, and client ID
                const [siteInsertResult] = await db.query(
                    'INSERT INTO tbl_clientsite (dClientSite_ID, dClientLOB_ID, dClientName, dLOB, dSubLOB, dSite_ID, dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [null, dClientLOB_ID, clientName, lobName, actualSubLOB, siteId, siteName, 'ACTIVE', userId, currentDate]
                );
                await this.logAdminAction({
                    dActionLocation_ID: dClientLOB_ID,
                    dActionLocation: 'CLIENT_SITE',
                    dActionType: 'CREATED',
                    dActionBy: userId,
                    tActionAt: currentDate
                });
                
                return {
                    clientEntryId,
                    clientName,
                    lobName,
                    subLOBName: actualSubLOB,
                    siteId,
                    siteName,
                    dClientLOB_ID,
                    message: 'LOB added successfully with site association'
                };
            }
            
            return {
                clientEntryId,
                clientName,
                lobName,
                subLOBName: actualSubLOB,
                dClientLOB_ID,
                message: 'LOB added successfully without site association'
            };
        } catch (error) {
            console.error('Error in addLOB service:', error);
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
            
            // Check if this LOB has site associations
            const [siteAssociations] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ?',
                [clientName, oldLOBName]
            );
            
            const hasSiteAssociations = siteAssociations[0].count > 0;
            
            // Update the LOB name in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dLOB = ?, dCreatedBy = ? WHERE dClientName = ? AND dLOB = ?',
                [newLOBName, userId, clientName, oldLOBName]
            );
            
            // If the LOB has site associations, update tbl_clientsite as well
            if (hasSiteAssociations) {
                await db.query(
                    'UPDATE tbl_clientsite SET dLOB = ? WHERE dClientName = ? AND dLOB = ?',
                    [newLOBName, clientName, oldLOBName]
                );
                
                return { 
                    message: 'LOB updated successfully in both client and site tables',
                    clientName,
                    oldLOBName,
                    newLOBName,
                    affectedRows: result.affectedRows,
                    updatedBy: userId,
                    siteAssociationsUpdated: true
                };
            }
            
            return { 
                message: 'LOB updated successfully',
                clientName,
                oldLOBName,
                newLOBName,
                affectedRows: result.affectedRows,
                updatedBy: userId,
                siteAssociationsUpdated: false
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
            const [distinctLobs] = await db.query(
                'SELECT COUNT(DISTINCT dLOB) as count FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
            );
            
            if (distinctLobs[0].count === 1) {
                throw new Error(`Cannot delete the only LOB for client "${clientName}". A client must have at least one LOB.`);
            }
            
            // Check if this LOB has site associations
            const [siteAssociations] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            const hasSiteAssociations = siteAssociations[0].count > 0;
            
            // Delete all records for this LOB from tbl_clientlob
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
                [clientName, lobName]
            );
            
            // If the LOB has site associations, delete from tbl_clientsite as well
            if (hasSiteAssociations) {
                await db.query(
                    'DELETE FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ?',
                    [clientName, lobName]
                );
                
                return { 
                    message: 'LOB deleted successfully from both client and site tables',
                    clientName,
                    lobName,
                    affectedRows: result.affectedRows,
                    deletedBy: userId,
                    siteAssociationsDeleted: true
                };
            }
            
            return { 
                message: 'LOB deleted successfully',
                clientName,
                lobName,
                affectedRows: result.affectedRows,
                deletedBy: userId,
                siteAssociationsDeleted: false
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deleteLOB:', error);
            throw error;
        }
    }

    async addSubLOB(clientName, lobName, subLOBName, userId) {
        try {
            if (!clientName || !lobName || !subLOBName) {
                throw new Error('Client name, LOB name, and Sub LOB name are required');
            }
            
            // Check if the client and LOB exist and get client ID
            const [clientLobData] = await db.query(
                'SELECT dClientLOBEntry_ID FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? LIMIT 1',
                [clientName, lobName]
            );
            
            if (clientLobData.length === 0) {
                throw new Error(`LOB "${lobName}" does not exist for client "${clientName}"`);
            }
            
            const clientEntryId = clientLobData[0].dClientLOBEntry_ID;
            
            // Check if the placeholder entry exists and delete it
            await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, "__temp_placeholder__"]
            );
            
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
            const dClientLOB_ID = await getNextClientLOBId();
            const [result] = await db.query(
                'INSERT INTO tbl_clientlob (dClientLOB_ID, dClientName, dLOB, dSubLOB, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [dClientLOB_ID, clientName, lobName, subLOBName, 'ACTIVE', userId, currentDate]
            );
            await this.logAdminAction({
                dActionLocation_ID: dClientLOB_ID,
                dActionLocation: 'CLIENT',
                dActionType: 'CREATED',
                dActionBy: userId,
                tActionAt: currentDate
            });
            
            // Check if this LOB has site associations
            const [siteAssociations] = await db.query(
                'SELECT dSite_ID, dSiteName FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ? GROUP BY dSite_ID, dSiteName',
                [clientName, lobName]
            );
            
            const hasSiteAssociations = siteAssociations.length > 0;
            
            // If the LOB has site associations, add the new Sub LOB to tbl_clientsite as well
            if (hasSiteAssociations) {
                for (const site of siteAssociations) {
                    // Ensure we have the site name
                    if (!site.dSiteName) {
                        // If site name is missing, fetch it from tbl_site
                        const [siteData] = await db.query(
                            'SELECT dSiteName FROM tbl_site WHERE dSite_ID = ?',
                            [site.dSite_ID]
                        );
                        
                        if (siteData.length > 0) {
                            site.dSiteName = siteData[0].dSiteName;
                        }
                    }
                    
                    const [siteInsertResult] = await db.query(
                        'INSERT INTO tbl_clientsite (dClientSite_ID, dClientLOB_ID, dClientName, dLOB, dSubLOB, dSite_ID, dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [null, dClientLOB_ID, clientName, lobName, subLOBName, site.dSite_ID, site.dSiteName, 'ACTIVE', userId, currentDate]
                    );
                    await this.logAdminAction({
                        dActionLocation_ID: dClientLOB_ID,
                        dActionLocation: 'CLIENT_SITE',
                        dActionType: 'CREATED',
                        dActionBy: userId,
                        tActionAt: currentDate
                    });
                }
                
                return { 
                    clientEntryId,
                    clientName, 
                    lobName, 
                    subLOBName,
                    dClientLOB_ID,
                    insertId: result.insertId, 
                    createdBy: userId,
                    siteAssociationsUpdated: true,
                    message: 'Sub LOB added successfully with site associations'
                };
            }
            
            return { 
                clientEntryId,
                clientName, 
                lobName, 
                subLOBName,
                dClientLOB_ID,
                insertId: result.insertId, 
                createdBy: userId,
                siteAssociationsUpdated: false,
                message: 'Sub LOB added successfully without site associations'
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
            
            // Check if this Sub LOB has site associations
            const [siteAssociations] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, oldSubLOBName]
            );
            
            const hasSiteAssociations = siteAssociations[0].count > 0;
            
            // Update the Sub LOB name in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dSubLOB = ?, dCreatedBy = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [newSubLOBName, userId, clientName, lobName, oldSubLOBName]
            );
            
            // If the Sub LOB has site associations, update tbl_clientsite as well
            if (hasSiteAssociations) {
                await db.query(
                    'UPDATE tbl_clientsite SET dSubLOB = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                    [newSubLOBName, clientName, lobName, oldSubLOBName]
                );
                
                return { 
                    message: 'Sub LOB updated successfully in both client and site tables',
                    clientName,
                    lobName,
                    oldSubLOBName,
                    newSubLOBName,
                    affectedRows: result.affectedRows,
                    updatedBy: userId,
                    siteAssociationsUpdated: true
                };
            }
            
            return { 
                message: 'Sub LOB updated successfully',
                clientName,
                lobName,
                oldSubLOBName,
                newSubLOBName,
                affectedRows: result.affectedRows,
                updatedBy: userId,
                siteAssociationsUpdated: false
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
            
            // Check if this Sub LOB has site associations
            const [siteAssociations] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, subLOBName]
            );
            
            const hasSiteAssociations = siteAssociations[0].count > 0;
            
            // Delete the Sub LOB from tbl_clientlob
            const [result] = await db.query(
                'DELETE FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                [clientName, lobName, subLOBName]
            );
            
            // If the Sub LOB has site associations, delete from tbl_clientsite as well
            if (hasSiteAssociations) {
                await db.query(
                    'DELETE FROM tbl_clientsite WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                    [clientName, lobName, subLOBName]
                );
                
                return { 
                    message: 'Sub LOB deleted successfully from both client and site tables',
                    clientName,
                    lobName,
                    subLOBName,
                    affectedRows: result.affectedRows,
                    deletedBy: userId,
                    siteAssociationsDeleted: true
                };
            }
            
            return { 
                message: 'Sub LOB deleted successfully',
                clientName,
                lobName,
                subLOBName,
                affectedRows: result.affectedRows,
                deletedBy: userId,
                siteAssociationsDeleted: false
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deleteSubLOB:', error);
            throw error;
        }
    }

    async deactivateClient(clientName, userId) {
        try {
            if (!clientName) {
                throw new Error('Client name is required');
            }
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ?',
                ['DEACTIVATED', clientName]
            );
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ?', [clientName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ?',
                ['DEACTIVATED', clientName]
            );
            return {
                message: 'Client deactivated successfully',
                clientName,
                affectedRows: result.affectedRows,
                deactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deactivateClient:', error);
            throw error;
        }
    }

    async deactivateLOB(clientName, lobName, userId) {
        try {
            if (!clientName || !lobName) {
                throw new Error('Client name and LOB name are required');
            }

            // Update dStatus in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ? AND dLOB = ?',
                ['DEACTIVATED', clientName, lobName]
            );

            // Log for each affected row
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?', [clientName, lobName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }

            // Update dStatus in tbl_clientsite
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ? AND dLOB = ?',
                ['DEACTIVATED', clientName, lobName]
            );

            return {
                message: 'LOB deactivated successfully',
                clientName,
                lobName,
                affectedRows: result.affectedRows,
                deactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deactivateLOB:', error);
            throw error;
        }
    }

    async deactivateSubLOB(clientName, lobName, subLOBName, userId) {
        try {
            if (!clientName || !lobName || !subLOBName) {
                throw new Error('Client name, LOB name, and Sub LOB name are required');
            }

            // Update dStatus in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                ['DEACTIVATED', clientName, lobName, subLOBName]
            );

            // Log for each affected row
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?', [clientName, lobName, subLOBName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }

            // Update dStatus in tbl_clientsite
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                ['DEACTIVATED', clientName, lobName, subLOBName]
            );

            return {
                message: 'Sub LOB deactivated successfully',
                clientName,
                lobName,
                subLOBName,
                affectedRows: result.affectedRows,
                deactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.deactivateSubLOB:', error);
            throw error;
        }
    }

    async reactivateClient(clientName, userId) {
        try {
            if (!clientName) {
                throw new Error('Client name is required');
            }
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ?',
                ['ACTIVE', clientName]
            );
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ?', [clientName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ?',
                ['ACTIVE', clientName]
            );
            return {
                message: 'Client reactivated successfully',
                clientName,
                affectedRows: result.affectedRows,
                reactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.reactivateClient:', error);
            throw error;
        }
    }

    async reactivateLOB(clientName, lobName, userId) {
        try {
            if (!clientName || !lobName) {
                throw new Error('Client name and LOB name are required');
            }
            // Update dStatus in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ? AND dLOB = ?',
                ['ACTIVE', clientName, lobName]
            );
            // Log for each affected row
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?', [clientName, lobName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }
            // Update dStatus in tbl_clientsite
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ? AND dLOB = ?',
                ['ACTIVE', clientName, lobName]
            );
            return {
                message: 'LOB reactivated successfully',
                clientName,
                lobName,
                affectedRows: result.affectedRows,
                reactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.reactivateLOB:', error);
            throw error;
        }
    }

    async reactivateSubLOB(clientName, lobName, subLOBName, userId) {
        try {
            if (!clientName || !lobName || !subLOBName) {
                throw new Error('Client name, LOB name, and Sub LOB name are required');
            }
            // Update dStatus in tbl_clientlob
            const [result] = await db.query(
                'UPDATE tbl_clientlob SET dStatus = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                ['ACTIVE', clientName, lobName, subLOBName]
            );
            // Log for each affected row
            const [affectedRows] = await db.query('SELECT dClientLOB_ID FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?', [clientName, lobName, subLOBName]);
            for (const row of affectedRows) {
                await this.logAdminAction({
                    dActionLocation_ID: row.dClientLOB_ID,
                    dActionLocation: 'CLIENT',
                    dActionType: 'MODIFIED',
                    dActionBy: userId,
                    tActionAt: new Date()
                });
            }
            // Update dStatus in tbl_clientsite
            await db.query(
                'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientName = ? AND dLOB = ? AND dSubLOB = ?',
                ['ACTIVE', clientName, lobName, subLOBName]
            );
            return {
                message: 'Sub LOB reactivated successfully',
                clientName,
                lobName,
                subLOBName,
                affectedRows: result.affectedRows,
                reactivatedBy: userId
            };
        } catch (error) {
            console.error('Error in ClientManagementService.reactivateSubLOB:', error);
            throw error;
        }
    }
}

module.exports = ClientManagementService;