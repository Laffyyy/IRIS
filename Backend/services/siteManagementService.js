const db = require('../config/db');

class SiteManagementService {
    async addSite(siteName, userID) {
      try {
          // Create current timestamp
          const currentDate = new Date();
          
          // Insert the site into the database with ACTIVE status
          const [result] = await db.query(
              'INSERT INTO tbl_site (dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?)',
              [
                  siteName,
                  'ACTIVE',
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
          
          return result;
        } catch (error) {
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
                      'INSERT INTO tbl_clientsite (dClient_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry, dSite_ID, dSiteName, dStatus, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                          instance.dClient_ID,
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
            'SELECT dClientName FROM tbl_clientlob WHERE dClient_ID = ? LIMIT 1',
            [clientId]
          );
          
          if (clientResult.length === 0) {
            throw new Error('Client not found');
          }
          
          const clientName = clientResult[0].dClientName;
          
          // Update the client-site assignment
          let query = 'UPDATE tbl_clientsite SET dClient_ID = ?, dClientName = ?, dSite_ID = ?, dSiteName = ?';
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
              SELECT DISTINCT dClient_ID, dClientName 
              FROM tbl_clientlob 
              WHERE dClient_ID IS NOT NULL
            ) cl ON cs.dClientName = cl.dClientName
            SET cs.dClient_ID = cl.dClient_ID
            WHERE cs.dClient_ID IS NULL
          `);
          
          // Also update any rows with NULL dStatus to have 'ACTIVE'
          await db.query(`
            UPDATE tbl_clientsite 
            SET dStatus = 'ACTIVE' 
            WHERE dStatus IS NULL
          `);
          
          // Then retrieve all records with the updated data
          const [result] = await db.query(
            'SELECT DISTINCT dClientSite_ID, dClient_ID, dClientName, dSite_ID, dSiteName, dLOB, dSubLOB, dStatus, dCreatedBy, tCreatedAt FROM tbl_clientsite WHERE dSite_ID IS NOT NULL AND dSiteName IS NOT NULL'
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

    async bulkAddClientsToSite(siteId, assignments) {
      try {
        // Start a transaction
        await db.query('START TRANSACTION');

        try {
          let affectedRows = 0;

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

          // Process each assignment
          for (const assignment of assignments) {
            // First get the client name
            const [clientNameResult] = await db.query(
              'SELECT dClientName FROM tbl_clientlob WHERE dClient_ID = ? LIMIT 1',
              [assignment.clientId]
            );
            
            if (clientNameResult.length === 0) {
              throw new Error(`Client not found for ID ${assignment.clientId}`);
            }
            
            const clientName = clientNameResult[0].dClientName;

            // Get ALL client details from tbl_clientlob that match the client name and LOB
            const [clientDetails] = await db.query(
              'SELECT dClient_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry FROM tbl_clientlob WHERE dClientName = ? AND dLOB = ?',
              [clientName, assignment.lobName]
            );

            if (clientDetails.length === 0) {
              console.error(`No matching records found for client: ${clientName}, LOB: ${assignment.lobName}`);
              // Get all LOBs for this client for debugging
              const [allLobs] = await db.query(
                'SELECT DISTINCT dLOB FROM tbl_clientlob WHERE dClientName = ?',
                [clientName]
              );
              console.error(`Available LOBs for client ${clientName}:`, allLobs.map(l => l.dLOB));
              throw new Error(`Client details not found for client ${clientName} and LOB ${assignment.lobName}`);
            }

            // Process each matching client detail
            for (const client of clientDetails) {
              // Check if this specific instance already exists for this site
              const [existingInstance] = await db.query(
                'SELECT dClientSite_ID FROM tbl_clientsite WHERE dClient_ID = ? AND dLOB = ? AND dSubLOB = ? AND dSite_ID = ?',
                [client.dClient_ID, client.dLOB, client.dSubLOB, siteId]
              );

              // Only insert if this specific instance doesn't already exist for this site
              if (existingInstance.length === 0) {
                const [result] = await db.query(
                  'INSERT INTO tbl_clientsite (dClient_ID, dClientName, dLOB, dSubLOB, dChannel, dIndustry, dSite_ID, dSiteName, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                    client.dClient_ID,
                    client.dClientName,
                    client.dLOB,
                    client.dSubLOB,
                    client.dChannel,
                    client.dIndustry,
                    siteId,
                    siteName,
                    userId,
                    currentDate
                  ]
                );

                affectedRows += result.affectedRows;
              }
            }
          }

          // Commit the transaction
          await db.query('COMMIT');

          return { affectedRows };
        } catch (error) {
          // Rollback the transaction in case of error
          await db.query('ROLLBACK');
          throw error;
        }
      } catch (error) {
        console.error('Error in bulkAddClientsToSite:', error);
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
          'SELECT MIN(dClient_ID) as dClient_ID, dClientName FROM tbl_clientlob GROUP BY dClientName'
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
              id: client.dClient_ID,
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
      const [result] = await db.query(
        'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID = ?',
        ['DEACTIVATED', clientSiteId]
      );
      
      return result;
    } catch (error) {
      console.error('Error in SiteManagementService.deactivateClientSite:', error);
      throw error;
    }
  }
  
  async reactivateClientSite(clientSiteId) {
    try {
      const [result] = await db.query(
        'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID = ?',
        ['ACTIVE', clientSiteId]
      );
      
      return result;
    } catch (error) {
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
      // Using a transaction to ensure all operations succeed or fail together
      await db.query('START TRANSACTION');
  
      try {
        const [result] = await db.query(
          'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID IN (?)',
          ['DEACTIVATED', clientSiteIds]
        );
  
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
      // Using a transaction to ensure all operations succeed or fail together
      await db.query('START TRANSACTION');
  
      try {
        const [result] = await db.query(
          'UPDATE tbl_clientsite SET dStatus = ? WHERE dClientSite_ID IN (?)',
          ['ACTIVE', clientSiteIds]
        );
  
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