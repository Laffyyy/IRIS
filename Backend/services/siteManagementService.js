const db = require('../config/db');

class SiteManagementService {
    async addSite(siteName, userID) {
        try {
            // Create current timestamp
            const currentDate = new Date();
            
            // Insert the site into the database
            const [result] = await db.query(
                'INSERT INTO tbl_site (dSiteName, dCreatedBy, tCreatedAt) VALUES (?, ?, ?)',
                [
                    siteName,
                    userID,
                    currentDate
                ]
            );
            
            return result;
        } catch (error) {
            console.error('Error in AddSiteService.addSite:', error);
            throw error;
        }
    }

    async editSite(siteId, siteName, updateClientSiteTable = false) {
        try {
            // Update the site name in tbl_site
            const [result] = await db.query(
                'UPDATE tbl_site SET dSiteName = ? WHERE dSite_ID = ?',
                [siteName, siteId]
            );
            
            // If flag is true, also update site name in tbl_clientsite
            if (updateClientSiteTable) {
                await db.query(
                    'UPDATE tbl_clientsite SET dSiteName = ? WHERE dSite_ID = ?',
                    [siteName, siteId]
                );
            }
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.editSite:', error);
            throw error;
        }
    }

    async deleteSite(siteId) {
        try {
            // Using a transaction to ensure all operations succeed or fail together
            await db.query('START TRANSACTION');
            
            // First, remove any client-site relationships for this site
            await db.query(
                'DELETE FROM tbl_clientsite WHERE dSite_ID = ?',
                [siteId]
            );
            
            // Then delete the site from the database
            const [result] = await db.query(
                'DELETE FROM tbl_site WHERE dSite_ID = ?',
                [siteId]
            );
            
            await db.query('COMMIT');
            
            return result;
        } catch (error) {
            // Rollback the transaction if there was an error
            await db.query('ROLLBACK');
            console.error('Error in SiteManagementService.deleteSite:', error);
            throw error;
        }
    }

    async getAllSites() {
        try {
            // Get all sites from the database
            const [result] = await db.query(
                'SELECT * FROM tbl_site ORDER BY dSite_ID ASC'
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.getAllSites:', error);
            throw error;
        }
    }

    async getAllClients() {
        try {
            // Get distinct client names from tbl_clientlob
            const [result] = await db.query(
                'SELECT MIN(dClient_ID) as dClient_ID, dClientName FROM tbl_clientlob GROUP BY dClientName ORDER BY dClientName ASC'
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.getAllClients:', error);
            throw error;
        }
    }

    async addClientToSite(clientId, siteId, lobName = null, subLobName = null, movingExisting = false) {
        try {
            // Get the site name for the selected site ID
            const [siteResult] = await db.query(
                'SELECT dSiteName FROM tbl_site WHERE dSite_ID = ?',
                [siteId]
            );
            
            if (siteResult.length === 0) {
                throw new Error('Site not found');
            }
            
            const siteName = siteResult[0].dSiteName;
            const userId = 'SYSTEM';
            const currentDate = new Date();
            
            // First get the client name
            const [clientNameResult] = await db.query(
                'SELECT dClientName FROM tbl_clientlob WHERE dClient_ID = ? LIMIT 1',
                [clientId]
            );
            
            if (clientNameResult.length === 0) {
                throw new Error('Client not found in tbl_clientlob');
            }
            
            const clientName = clientNameResult[0].dClientName;
            
            // If we're moving existing assignments, first remove them from their current site
            if (movingExisting) {
                let deleteQuery = 'DELETE FROM tbl_clientsite WHERE dClientName = ?';
                let deleteParams = [clientName];
                
                if (lobName && subLobName) {
                    deleteQuery += ' AND dLOB = ? AND dSubLOB = ?';
                    deleteParams.push(lobName, subLobName);
                } else if (lobName) {
                    deleteQuery += ' AND dLOB = ?';
                    deleteParams.push(lobName);
                }
                
                await db.query(deleteQuery, deleteParams);
            }
            
            // Build the query based on what's selected
            let query = 'SELECT dClient_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry FROM tbl_clientlob WHERE dClientName = ?';
            let params = [clientName];
            
            // Case 1: LOB & Sub LOB provided - most specific
            if (lobName && subLobName) {
                query += ' AND dLOB = ? AND dSubLOB = ?';
                params.push(lobName, subLobName);
            } 
            // Case 2: Only LOB provided - medium specificity
            else if (lobName) {
                query += ' AND dLOB = ?';
                params.push(lobName);
            }
            
            // Get the client instances based on the constructed query
            const [clientInstances] = await db.query(query, params);
            
            if (clientInstances.length === 0) {
                throw new Error('No instances of client found in tbl_clientlob matching the specified criteria');
            }
            
            // Using a transaction to ensure all operations succeed or fail together
            await db.query('START TRANSACTION');
            
            // Insert all instances with the new site information
            for (const instance of clientInstances) {
                // Check if this specific instance already exists for this site
                const [existingInstance] = await db.query(
                    'SELECT dClientSite_ID FROM tbl_clientsite WHERE dClient_ID = ? AND dLOB = ? AND dSubLOB = ? AND dSite_ID = ?',
                    [instance.dClient_ID, instance.dLOB, instance.dSubLOB, siteId]
                );
                
                // Only insert if this specific instance doesn't already exist for this site
                if (existingInstance.length === 0) {
                    await db.query(
                        'INSERT INTO tbl_clientsite (dClient_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry, dSite_ID, dSiteName, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            instance.dClient_ID,
                            instance.dClientName,
                            instance.dLOB,
                            instance.dSubLOB,
                            instance.dChannel,
                            instance.dIndustry,
                            siteId,
                            siteName,
                            userId,
                            currentDate
                        ]
                    );
                }
            }
            
            await db.query('COMMIT');
            
            return { affectedRows: clientInstances.length };
        } catch (error) {
            // Rollback the transaction if there was an error
            await db.query('ROLLBACK');
            console.error('Error in SiteManagementService.addClientToSite:', error);
            throw error;
        }
    }

    async removeClientFromSite(clientId) {
        try {
            // Delete the client from tbl_clientsite instead of just setting fields to null
            const [result] = await db.query(
                'DELETE FROM tbl_clientsite WHERE dClient_ID = ?',
                [clientId]
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.removeClientFromSite:', error);
            throw error;
        }
    }

    async updateClientSite(clientId, clientName, siteId) {
        try {
            // First, get the site name for the selected site
            const [siteResult] = await db.query(
                'SELECT dSiteName FROM tbl_site WHERE dSite_ID = ?',
                [siteId]
            );
            
            if (siteResult.length === 0) {
                throw new Error('Site not found');
            }
            
            const siteName = siteResult[0].dSiteName;
            
            // Update the client name and site assignment
            const [result] = await db.query(
                'UPDATE tbl_clientsite SET dClientName = ?, dSite_ID = ?, dSiteName = ? WHERE dClient_ID = ?',
                [clientName, siteId, siteName, clientId]
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.updateClientSite:', error);
            throw error;
        }
    }

    async getSiteClients() {
        try {
          // Include LOB and SubLOB data
          const [result] = await db.query(
            'SELECT DISTINCT dClient_ID, dClientName, dSite_ID, dSiteName, dLOB, dSubLOB FROM tbl_clientsite WHERE dSite_ID IS NOT NULL'
          );
          
          return result;
        } catch (error) {
          console.error('Error in SiteManagementService.getSiteClients:', error);
          throw error;
        }
      }

    async getExistingAssignments(siteId) {
        try {
            const [assignments] = await db.query(
                `SELECT DISTINCT dClientName, dLOB, dSubLOB 
                FROM tbl_clientsite 
                WHERE dSite_ID = ?`,
                [siteId]
            );
            return assignments;
        } catch (error) {
            console.error('Error in SiteManagementService.getExistingAssignments:', error);
            return [];
        }
    }

    async getClientLobs(clientId) {
        try {
            // First get the client name
            const [clientNameResult] = await db.query(
                'SELECT dClientName FROM tbl_clientlob WHERE dClient_ID = ? LIMIT 1',
                [clientId]
            );
            
            if (clientNameResult.length === 0) {
                return [];
            }
            
            const clientName = clientNameResult[0].dClientName;
            
            // Get all LOBs and Sub LOBs for this client
            const [allLobs] = await db.query(
                `SELECT DISTINCT dLOB, dSubLOB
                FROM tbl_clientlob
                WHERE dClientName = ?
                AND dSubLOB IS NOT NULL 
                AND dSubLOB != ""
                ORDER BY dLOB, dSubLOB`,
                [clientName]
            );
            
            // Group Sub LOBs by LOB
            const lobMap = new Map();
            allLobs.forEach(row => {
                if (!lobMap.has(row.dLOB)) {
                    lobMap.set(row.dLOB, {
                        id: `lob_${lobMap.size + 1}`,
                        name: row.dLOB,
                        subLobs: []
                    });
                }
                
                const lob = lobMap.get(row.dLOB);
                lob.subLobs.push({
                    id: `sublob_${lob.id}_${lob.subLobs.length + 1}`,
                    name: row.dSubLOB,
                    lobId: lob.id
                });
            });
            
            return Array.from(lobMap.values());
        } catch (error) {
            console.error('Error in SiteManagementService.getClientLobs:', error);
            return [];
        }
    }
}

module.exports = SiteManagementService;