const db = require('../config/db');

class SiteManagementService {
    async addSite(siteName, userID) {
      try {
          const timestamp = new Date();
          
          // Generate site ID: first 3 letters of site name (uppercase) + 3 random digits
          const prefix = siteName.substring(0, 3).toUpperCase();
          const randomNum = Math.floor(Math.random() * 900) + 100; // 3-digit number between 100-999
          const siteId = `${prefix}${randomNum}`;
          
          // Start transaction
          await db.query('START TRANSACTION');
          
          // Insert new site
          const [result] = await db.query(
              'INSERT INTO tbl_site (dSite_ID, dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, "ACTIVE", ?, ?)',
              [siteId, siteName, userID, timestamp]
          );
          
          // Insert log entry
          await db.query(
              'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "CREATED", "SYSTEM", ?)',
              [siteId, timestamp]
          );
          
          // Commit transaction
          await db.query('COMMIT');
          
          return { siteId };
      } catch (error) {
          // Rollback transaction on error
          await db.query('ROLLBACK');
          console.error('Error in addSite service:', error);
          throw error;
      }
    }

    async editSite(siteId, siteName, updateClientSiteTable = false) {
        try {
          // Start transaction
          await db.query('START TRANSACTION');
          
          // Update tbl_site
          const [result] = await db.query(
            'UPDATE tbl_site SET dSiteName = ? WHERE dSite_ID = ?',
            [siteName, siteId]
          );
          
          // Also update tbl_clientsite if flag is true
          if (updateClientSiteTable) {
            await db.query(
              'UPDATE tbl_clientsite SET dSiteName = ? WHERE dSite_ID = ?',
              [siteName, siteId]
            );
          }

          // Insert log entry
          const timestamp = new Date();
          await db.query(
            'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "MODIFIED", "SYSTEM", ?)',
            [siteId, timestamp]
          );
          
          // Commit transaction
          await db.query('COMMIT');
          
          return result;
        } catch (error) {
          // Rollback transaction on error
          await db.query('ROLLBACK');
          console.error('Error in SiteManagementService.editSite:', error);
          throw error;
        }
      }

      async deactivateSite(siteId) {
        try {
            // Start a transaction to ensure all operations succeed or fail together
            await db.query('START TRANSACTION');
            
            try {
                // 1. Update the site status to DEACTIVATED
                const [siteResult] = await db.query(
                    'UPDATE tbl_site SET dStatus = ? WHERE dSite_ID = ?',
                    ['DEACTIVATED', siteId]
                );
                
                // 2. Also deactivate all client-site associations for this site
                await db.query(
                    'UPDATE tbl_clientsite SET dStatus = ? WHERE dSite_ID = ?',
                    ['DEACTIVATED', siteId]
                );

                // 3. Insert log entry
                const timestamp = new Date();
                await db.query(
                    'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "DEACTIVATED", "SYSTEM", ?)',
                    [siteId, timestamp]
                );
                
                // Commit the transaction
                await db.query('COMMIT');
                
                return siteResult;
            } catch (error) {
                // Rollback on error
                await db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error in SiteManagementService.deactivateSite:', error);
            throw error;
        }
    }

    async getAllSites() {
      try {
          const [sites] = await db.query('SELECT * FROM tbl_site WHERE dStatus = ? ORDER BY dSite_ID', ['ACTIVE']);
          return sites;
      } catch (error) {
          console.error('Error in SiteManagementService.getAllSites:', error);
          throw error;
      }
  }

    async getAllClients() {
        try {
            // Get distinct client names from tbl_clientlob
            const [result] = await db.query(
                'SELECT MIN(dClientLOB_ID) as dClientLOB_ID, dClientName FROM tbl_clientlob GROUP BY dClientName ORDER BY dClientName ASC'
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
              'SELECT dClientName FROM tbl_clientlob WHERE dClientLOB_ID = ? LIMIT 1',
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
          let query = 'SELECT dClientLOB_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry FROM tbl_clientlob WHERE dClientName = ?';
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
                  'SELECT dClientSite_ID FROM tbl_clientsite WHERE dClientLOB_ID = ? AND dLOB = ? AND dSubLOB = ? AND dSite_ID = ?',
                  [instance.dClientLOB_ID, instance.dLOB, instance.dSubLOB, siteId]
              );
              
              // Only insert if this specific instance doesn't already exist for this site
              if (existingInstance.length === 0) {
                  // Generate a unique client site ID (6 characters)
                  // First 3 characters from client name + 3 random alphanumeric characters
                  const prefix = clientName.substring(0, 3).toUpperCase();
                  let clientSiteId;
                  let isUnique = false;
                  
                  // Keep generating until we get a unique ID
                  while (!isUnique) {
                      // Generate 3 random alphanumeric characters
                      let chars = '';
                      const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                      for (let i = 0; i < 3; i++) {
                          chars += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
                      }
                      
                      clientSiteId = `${prefix}${chars}`;
                      
                      // Check if this ID already exists
                      const [existingId] = await db.query(
                          'SELECT dClientSite_ID FROM tbl_clientsite WHERE dClientSite_ID = ?',
                          [clientSiteId]
                      );
                      
                      isUnique = existingId.length === 0;
                  }
                  
                  // Insert with our generated ID
                  const [insertResult] = await db.query(
                    'INSERT INTO tbl_clientsite (dClientSite_ID, dClientLOB_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry, dSite_ID, dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        clientSiteId,
                        instance.dClientLOB_ID,
                        instance.dClientName,
                        instance.dLOB,
                        instance.dSubLOB,
                        instance.dChannel,
                        instance.dIndustry,
                        siteId,
                        siteName,
                        'ACTIVE',  // Set default status to ACTIVE
                        userId,
                        currentDate
                    ]
                  );

                  // Insert log entry for each new client-site assignment
                  await db.query(
                    'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "CLIENT_SITE", "CREATED", "SYSTEM", ?)',
                    [clientSiteId, currentDate]
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

    async removeClientFromSite(clientSiteId) {
        try {
          // Use clientSiteId instead of clientId
          const [result] = await db.query(
            'DELETE FROM tbl_clientsite WHERE dClientSite_ID = ?',
            [clientSiteId]
          );
          
          return result;
        } catch (error) {
          console.error('Error in SiteManagementService.removeClientFromSite:', error);
          throw error;
        }
    }

    async updateClientSite(clientSiteId, clientId, siteId, lobName = null, subLobName = null) {
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
          
          // Get client name
          const [clientResult] = await db.query(
            'SELECT dClientName FROM tbl_clientlob WHERE dClientLOB_ID = ? LIMIT 1',
            [clientId]
          );
          
          if (clientResult.length === 0) {
            throw new Error('Client not found');
          }
          
          const clientName = clientResult[0].dClientName;
          
          // Update the client-site assignment
          let query = 'UPDATE tbl_clientsite SET dClientLOB_ID = ?, dClientName = ?, dSite_ID = ?, dSiteName = ?';
          let params = [clientId, clientName, siteId, siteName];
          
          // Add LOB and Sub LOB if provided
          if (lobName !== null) {
            query += ', dLOB = ?';
            params.push(lobName);
          }
          
          if (subLobName !== null) {
            query += ', dSubLOB = ?';
            params.push(subLobName);
          }
          
          query += ' WHERE dClientSite_ID = ?';
          params.push(clientSiteId);
          
          const [result] = await db.query(query, params);
          
          return result;
        } catch (error) {
          console.error('Error in SiteManagementService.updateClientSite:', error);
          throw error;
        }
      }

      async getSiteClients() {
        try {
          // First, update any rows that have dClientName but no dClient_ID
          await db.query(`
            UPDATE tbl_clientsite cs
            JOIN (
              SELECT DISTINCT dClientLOB_ID, dClientName 
              FROM tbl_clientlob 
              WHERE dClientLOB_ID IS NOT NULL
            ) cl ON cs.dClientName = cl.dClientName
            SET cs.dClientLOB_ID = cl.dClientLOB_ID
            WHERE cs.dClientLOB_ID IS NULL
          `);
          
          // Also update any rows with NULL dStatus to have 'ACTIVE'
          await db.query(`
            UPDATE tbl_clientsite 
            SET dStatus = 'ACTIVE' 
            WHERE dStatus IS NULL
          `);
          
          // Then retrieve all records with the updated data
          const [result] = await db.query(
            'SELECT DISTINCT dClientSite_ID, dClientLOB_ID, dClientName, dSite_ID, dSiteName, dLOB, dSubLOB, dStatus, dCreatedBy, tCreatedAt FROM tbl_clientsite WHERE dSite_ID IS NOT NULL AND dSiteName IS NOT NULL'
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

      async getClientLobs(clientId, siteId = null) {
        try {
            // First get the client name
            const [clientNameResult] = await db.query(
                'SELECT dClientName FROM tbl_clientlob WHERE dClientLOB_ID = ? LIMIT 1',
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
            
            // Get already assigned subLOBs for this client and site (if a site ID was provided)
            let assignedSubLobs = [];
            if (siteId) {
                const [assignments] = await db.query(
                    `SELECT DISTINCT dLOB, dSubLOB 
                    FROM tbl_clientsite 
                    WHERE dClientName = ? AND dSite_ID = ? AND dStatus = 'ACTIVE'`,
                    [clientName, siteId]
                );
                
                // Create a set of "LOB|SubLOB" combinations for easy lookup
                assignedSubLobs = assignments.map(a => `${a.dLOB}|${a.dSubLOB}`);
            }
            
            // Group Sub LOBs by LOB, filtering out already assigned ones
            const lobMap = new Map();
            allLobs.forEach(row => {
                // Skip this subLOB if it's already assigned to the site
                if (siteId && assignedSubLobs.includes(`${row.dLOB}|${row.dSubLOB}`)) {
                    return;
                }
                
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
            
            // Remove empty LOBs (where all subLOBs were filtered out)
            const filteredLobMap = new Map();
            for (const [lobName, lob] of lobMap.entries()) {
                if (lob.subLobs.length > 0) {
                    filteredLobMap.set(lobName, lob);
                }
            }
            
            return Array.from(filteredLobMap.values());
        } catch (error) {
            console.error('Error in SiteManagementService.getClientLobs:', error);
            return [];
        }
    }

    async bulkDeactivateSites(siteIds) {
      try {
          // Start a transaction to ensure all operations succeed or fail together
          await db.query('START TRANSACTION');
          
          try {
              // 1. Update the sites status to DEACTIVATED
              const [siteResult] = await db.query(
                  'UPDATE tbl_site SET dStatus = ? WHERE dSite_ID IN (?)',
                  ['DEACTIVATED', siteIds]
              );
              
              // 2. Also deactivate all client-site associations for these sites
              await db.query(
                  'UPDATE tbl_clientsite SET dStatus = ? WHERE dSite_ID IN (?)',
                  ['DEACTIVATED', siteIds]
              );

              // 3. Insert log entries for each site
              const timestamp = new Date();
              for (const siteId of siteIds) {
                  await db.query(
                      'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "DEACTIVATED", "SYSTEM", ?)',
                      [siteId, timestamp]
                  );
              }
              
              // Commit the transaction
              await db.query('COMMIT');
              
              return siteResult;
          } catch (error) {
              // Rollback on error
              await db.query('ROLLBACK');
              throw error;
          }
      } catch (error) {
          console.error('Error in SiteManagementService.bulkDeactivateSites:', error);
          throw error;
      }
  }
    
    async bulkDeleteClientSiteAssignments(clientSiteIds) {
      try {
        // Using a transaction to ensure all operations succeed or fail together
        await db.query('START TRANSACTION');

        try {
          const [result] = await db.query(
            'DELETE FROM tbl_clientsite WHERE dClientSite_ID IN (?)',
            [clientSiteIds]
          );

          await db.query('COMMIT');
          return { affectedRows: result.affectedRows };
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
      } catch (error) {
        console.error('Error in bulkDeleteClientSiteAssignments:', error);
        throw error;
      }
    }

    async isClientFullyAssigned(clientName, siteId) {
      try {
        // Get all LOBs and Sub LOBs for this client from tbl_clientlob
        const [allClientLobs] = await db.query(
          'SELECT DISTINCT dLOB, dSubLOB FROM tbl_clientlob WHERE dClientName = ?',
          [clientName]
        );

        if (allClientLobs.length === 0) {
          return false; // No LOBs found for client
        }

        // Get all assignments for this client at this site
        const [siteAssignments] = await db.query(
          'SELECT DISTINCT dLOB, dSubLOB FROM tbl_clientsite WHERE dClientName = ? AND dSite_ID = ?',
          [clientName, siteId]
        );

        // If no assignments found, client is not assigned
        if (siteAssignments.length === 0) {
          return false;
        }

        // Check if all LOBs and Sub LOBs are assigned
        for (const clientLob of allClientLobs) {
          const matchingAssignment = siteAssignments.find(
            assignment => 
              assignment.dLOB === clientLob.dLOB && 
              assignment.dSubLOB === clientLob.dSubLOB
          );

          if (!matchingAssignment) {
            return false; // Found an unassigned LOB/Sub LOB
          }
        }

        return true; // All LOBs and Sub LOBs are assigned
      } catch (error) {
        console.error('Error in isClientFullyAssigned:', error);
        return false;
      }
    }

    async getAvailableClients(siteId) {
      try {
        // Get distinct clients using MIN to handle ONLY_FULL_GROUP_BY mode
        const [allClients] = await db.query(
          'SELECT MIN(dClientLOB_ID) as dClientLOB_ID, dClientName FROM tbl_clientlob GROUP BY dClientName'
        );

        const availableClients = [];

        // Check each client
        for (const client of allClients) {
          const isFullyAssigned = await this.isClientFullyAssigned(client.dClientName, siteId);
          
          if (!isFullyAssigned) {
            // Get LOB and Sub LOB counts for this client
            const [counts] = await db.query(
              `SELECT 
                COUNT(DISTINCT dLOB) as lobCount,
                COUNT(DISTINCT dSubLOB) as subLobCount
              FROM tbl_clientlob 
              WHERE dClientName = ?`,
              [client.dClientName]
            );

            availableClients.push({
              id: client.dClientLOB_ID, // NOT client.dClient_ID
              name: client.dClientName,
              lobCount: counts[0].lobCount,
              subLobCount: counts[0].subLobCount
            });
          }
        }

        return availableClients;
      } catch (error) {
        console.error('Error in getAvailableClients:', error);
        return [];
      }
    }

    async getAllSitesByStatus(status) {
      try {
          const [sites] = await db.query('SELECT * FROM tbl_site WHERE dStatus = ? ORDER BY dSite_ID', [status]);
          return sites;
      } catch (error) {
          console.error(`Error in SiteManagementService.getAllSitesByStatus for status ${status}:`, error);
          throw error;
      }
  }

  async getClientSitesByStatus(status) {
    try {
      // First, update any rows that have dStatus = NULL to have dStatus = 'ACTIVE'
      await db.query(`
        UPDATE tbl_clientsite 
        SET dStatus = 'ACTIVE' 
        WHERE dStatus IS NULL
      `);
      
      // Then retrieve records with the specified status
      const [result] = await db.query(
        'SELECT * FROM tbl_clientsite WHERE dStatus = ? ORDER BY dClientSite_ID',
        [status]
      );
      
      return result;
    } catch (error) {
      console.error(`Error in SiteManagementService.getClientSitesByStatus for status ${status}:`, error);
      throw error;
    }
  }
  
  async deactivateClientSite(clientSiteId) {
    try {
      await db.query('START TRANSACTION');
      
      const [result] = await db.query(
        'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID = ?',
        ['DEACTIVATED', clientSiteId]
      );

      // Insert log entry
      const timestamp = new Date();
      await db.query(
        'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "CLIENT_SITE", "DEACTIVATED", "SYSTEM", ?)',
        [clientSiteId, timestamp]
      );
      
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error in SiteManagementService.deactivateClientSite:', error);
      throw error;
    }
  }
  
  async reactivateClientSite(clientSiteId) {
    try {

      const [siteCheck] = await db.query(
        `SELECT s.dStatus 
         FROM tbl_clientsite cs
         JOIN tbl_site s ON cs.dSite_ID = s.dSite_ID
         WHERE cs.dClientSite_ID = ?`,
        [clientSiteId]
      );

      if (siteCheck.length === 0 || siteCheck[0].dStatus !== 'ACTIVE') {
        throw new Error('Cannot reactivate client-site assignment for a deactivated site');
      }

      await db.query('START TRANSACTION');

      const [result] = await db.query(
        'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID = ?',
        ['ACTIVE', clientSiteId]
      );

      // Insert log entry
      const timestamp = new Date();
      await db.query(
        'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "CLIENT_SITE", "ACTIVATED", "SYSTEM", ?)',
        [clientSiteId, timestamp]
      );
      
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error in SiteManagementService.reactivateClientSite:', error);
      throw error;
    }
  }

    async reactivateSite(siteId) {
      try {
          // Start a transaction
          await db.query('START TRANSACTION');
          
          try {
              // 1. Update the site status from DEACTIVATED to ACTIVE
              const [siteResult] = await db.query(
                  'UPDATE tbl_site SET dStatus = ? WHERE dSite_ID = ?',
                  ['ACTIVE', siteId]
              );
              
              // 2. Also reactivate all client-site associations for this site
              await db.query(
                  'UPDATE tbl_clientsite SET dStatus = ? WHERE dSite_ID = ? AND dStatus = ?',
                  ['ACTIVE', siteId, 'DEACTIVATED']
              );

              // 3. Insert log entry
              const timestamp = new Date();
              await db.query(
                  'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "ACTIVATED", "SYSTEM", ?)',
                  [siteId, timestamp]
              );
              
              // Commit the transaction
              await db.query('COMMIT');
              
              return siteResult;
          } catch (error) {
              // Rollback on error
              await db.query('ROLLBACK');
              throw error;
          }
      } catch (error) {
          console.error('Error in SiteManagementService.reactivateSite:', error);
          throw error;
      }
  }
  
  async bulkDeactivateClientSites(clientSiteIds) {
    try {
      await db.query('START TRANSACTION');
  
      try {
        const [result] = await db.query(
          'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID IN (?)',
          ['DEACTIVATED', clientSiteIds]
        );

        // Insert log entries for each client-site
        const timestamp = new Date();
        for (const clientSiteId of clientSiteIds) {
            await db.query(
                'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "CLIENT_SITE", "DEACTIVATED", "SYSTEM", ?)',
                [clientSiteId, timestamp]
            );
        }
  
        await db.query('COMMIT');
        return { affectedRows: result.affectedRows };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in bulkDeactivateClientSites:', error);
      throw error;
    }
  }

    async bulkReactivateSites(siteIds) {
      try {
          // Start a transaction
          await db.query('START TRANSACTION');
          
          try {
              // 1. Reactivate the sites
              const [siteResult] = await db.query(
                  'UPDATE tbl_site SET dStatus = ? WHERE dSite_ID IN (?)',
                  ['ACTIVE', siteIds]
              );
              
              // 2. Also reactivate all client-site associations for these sites
              await db.query(
                  'UPDATE tbl_clientsite SET dStatus = ? WHERE dSite_ID IN (?) AND dStatus = ?',
                  ['ACTIVE', siteIds, 'DEACTIVATED']
              );

              // 3. Insert log entries for each site
              const timestamp = new Date();
              for (const siteId of siteIds) {
                  await db.query(
                      'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "SITE", "ACTIVATED", "SYSTEM", ?)',
                      [siteId, timestamp]
                  );
              }
              
              // Commit the transaction
              await db.query('COMMIT');
              
              return siteResult;
          } catch (error) {
              // Rollback on error
              await db.query('ROLLBACK');
              throw error;
          }
      } catch (error) {
          console.error('Error in SiteManagementService.bulkReactivateSites:', error);
          throw error;
      }
  }
  
  async bulkReactivateClientSites(clientSiteIds) {
    try {
      await db.query('START TRANSACTION');
  
      try {
        const [result] = await db.query(
          'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID IN (?)',
          ['ACTIVE', clientSiteIds]
        );

        // Insert log entries for each client-site
        const timestamp = new Date();
        for (const clientSiteId of clientSiteIds) {
            await db.query(
                'INSERT INTO tbl_logs_admin (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt) VALUES (?, "CLIENT_SITE", "ACTIVATED", "SYSTEM", ?)',
                [clientSiteId, timestamp]
            );
        }
  
        await db.query('COMMIT');
        return { affectedRows: result.affectedRows };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in bulkReactivateClientSites:', error);
      throw error;
    }
  }
}

module.exports = SiteManagementService;