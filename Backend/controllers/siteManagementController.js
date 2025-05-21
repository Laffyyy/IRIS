const SiteManagementService = require('../services/siteManagementService');

class SiteManagementController {
    constructor() {
        this.SiteManagementService = new SiteManagementService();
    }

    async addSite(req, res) {
        try {
            const { siteName, userID } = req.body;
            
            // Validate input
            if (!siteName || !userID) {
                return res.status(400).json({ 
                    message: 'Site name and user ID are required' 
                });
            }
            
            // Call the service to add the site
            const result = await this.SiteManagementService.addSite(siteName, userID);
            
            // Return success response
            res.status(200).json({ 
                message: 'Site added successfully', 
                siteId: result.insertId 
            });
        } catch (error) {
            console.error('Error adding site:', error);
            res.status(500).json({ 
                message: 'Failed to add site', 
                error: error.message 
            });
        }
    }

    async editSite(req, res) {
        try {
            const { siteId, siteName, updateClientSiteTable } = req.body;
            
            // Validate input
            if (!siteId || !siteName) {
                return res.status(400).json({ 
                    message: 'Site ID and site name are required' 
                });
            }
            
            // Call the service to edit the site
            const result = await this.SiteManagementService.editSite(
                siteId, 
                siteName, 
                updateClientSiteTable
            );
            
            // Return success response
            res.status(200).json({ 
                message: 'Site updated successfully',
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error editing site:', error);
            res.status(500).json({ 
                message: 'Failed to update site', 
                error: error.message 
            });
        }
    }

    async deactivateSite(req, res) {
      try {
          const { siteId } = req.body;
          
          // Validate input
          if (!siteId) {
              return res.status(400).json({ 
                  message: 'Site ID is required' 
              });
          }
          
          // Call the service to deactivate the site
          const result = await this.SiteManagementService.deactivateSite(siteId);
          
          // Return success response
          res.status(200).json({ 
              message: 'Site deactivated successfully',
              affectedRows: result.affectedRows
          });
      } catch (error) {
          console.error('Error deactivating site:', error);
          res.status(500).json({ 
              message: 'Failed to deactivate site', 
              error: error.message 
          });
      }
  }

    async getAllSites(req, res) {
        try {
            // Call the service to get all sites
            const result = await this.SiteManagementService.getAllSites();
            
            // Return success response
            res.status(200).json({ 
                message: 'Sites retrieved successfully',
                sites: result
            });
        } catch (error) {
            console.error('Error retrieving sites:', error);
            res.status(500).json({ 
                message: 'Failed to retrieve sites', 
                error: error.message 
            });
        }
    }

    async getAllClients(req, res) {
        try {
            // Call the service to get all clients
            const result = await this.SiteManagementService.getAllClients();
            
            // Return success response
            res.status(200).json({ 
                message: 'Clients retrieved successfully',
                clients: result
            });
        } catch (error) {
            console.error('Error retrieving clients:', error);
            res.status(500).json({ 
                message: 'Failed to retrieve clients', 
                error: error.message 
            });
        }
    }

    // In siteManagementController.js - update the addClientToSite method
    async addClientToSite(req, res) {
        try {
            const { clientId, siteId, lobName, subLobName } = req.body;

            // Validate required input
            if (!clientId || !siteId) {
                return res.status(400).json({ 
                    message: 'Client ID and Site ID are required' 
                });
            }
            
            // Call the service to update the client's site
            const result = await this.SiteManagementService.addClientToSite(clientId, siteId, lobName, subLobName);
            
            // Return success response
            res.status(200).json({ 
                message: 'Client assigned to site successfully',
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error assigning client to site:', error);
            res.status(500).json({ 
                message: 'Failed to assign client to site', 
                error: error.message 
            });
        }
    }

    async removeClientFromSite(req, res) {
        try {
            const { clientSiteId } = req.body; // Change from clientId to clientSiteId
            
            // Validate input
            if (!clientSiteId) {
                return res.status(400).json({ 
                    message: 'Client Site ID is required' 
                });
            }
            
            // Call the service to remove the client's site assignment
            const result = await this.SiteManagementService.removeClientFromSite(clientSiteId);
            
            // Return success response
            res.status(200).json({ 
                message: 'Client removed from site successfully',
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error removing client from site:', error);
            res.status(500).json({ 
                message: 'Failed to remove client from site', 
                error: error.message 
            });
        }
    }

    async updateClientSite(req, res) {
        try {
          const { clientSiteId, clientId, siteId, lobName, subLobName } = req.body;
          
          if (!clientSiteId || !siteId) {
            return res.status(400).json({ 
              message: 'Client Site ID and Site ID are required' 
            });
          }
          
          const result = await this.SiteManagementService.updateClientSite(
            clientSiteId, clientId, siteId, lobName, subLobName
          );
          
          res.status(200).json({ 
            message: 'Client-site assignment updated successfully',
            affectedRows: result.affectedRows
          });
        } catch (error) {
          console.error('Error updating client-site assignment:', error);
          res.status(500).json({ 
            message: 'Failed to update client-site assignment', 
            error: error.message 
          });
        }
      }

    async getSiteClients(req, res) {
        try {
          const result = await this.SiteManagementService.getSiteClients();
          
          res.status(200).json({ 
            message: 'Site-client relationships retrieved successfully',
            siteClients: result
          });
        } catch (error) {
          console.error('Error retrieving site-client relationships:', error);
          res.status(500).json({ 
            message: 'Failed to retrieve site-client relationships', 
            error: error.message 
          });
        }
    }

    // Add to your SiteManagementController.js
    async getClientLobs(req, res) {
        try {
        const { clientId } = req.body;
        
        if (!clientId) {
            return res.status(400).json({ message: 'Client ID is required' });
        }
        
        const lobs = await this.SiteManagementService.getClientLobs(clientId);
        
        return res.status(200).json({
            message: 'Client LOBs retrieved successfully',
            lobs
        });
        } catch (error) {
        console.error('Error in getClientLobs:', error);
        return res.status(500).json({
            message: 'Failed to retrieve client LOBs',
            error: error.message
        });
        }
    }

    async getExistingAssignments(req, res) {
        try {
            const { siteId } = req.body;
    
            if (!siteId) {
                return res.status(400).json({ message: 'Site ID is required' });
            }
    
            const assignments = await this.SiteManagementService.getExistingAssignments(siteId);
            res.status(200).json({ assignments });
        } catch (error) {
            console.error('Error in getExistingAssignments:', error);
            res.status(500).json({ message: 'Failed to fetch existing assignments', error: error.message });
        }
    }

      async bulkDeactivateSites(req, res) {
        try {
            const { siteIds } = req.body;
            
            if (!siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
                return res.status(400).json({ 
                    message: 'Valid site IDs array is required' 
                });
            }
            
            const result = await this.SiteManagementService.bulkDeactivateSites(siteIds);
            
            res.status(200).json({ 
                message: `${result.affectedRows} sites deactivated successfully`,
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error in bulk deactivating sites:', error);
            res.status(500).json({ 
                message: 'Failed to deactivate sites', 
                error: error.message 
            });
        }
      }
      
      async bulkDeleteClientSiteAssignments(req, res) {
        try {
          const { clientSiteIds } = req.body;
          
          if (!clientSiteIds || !Array.isArray(clientSiteIds) || clientSiteIds.length === 0) {
            return res.status(400).json({ 
              message: 'Valid client site IDs array is required' 
            });
          }
          
          const result = await this.SiteManagementService.bulkDeleteClientSiteAssignments(clientSiteIds);
          
          res.status(200).json({ 
            message: `${result.affectedRows} client-site assignments deleted successfully`,
            affectedRows: result.affectedRows
          });
        } catch (error) {
          console.error('Error in bulk deleting client-site assignments:', error);
          res.status(500).json({ 
            message: 'Failed to delete client-site assignments', 
            error: error.message 
          });
        }
      }

    async bulkAddClientsToSite(req, res) {
      try {
        const { siteId, assignments } = req.body;
        
        if (!siteId || !assignments || !Array.isArray(assignments) || assignments.length === 0) {
          return res.status(400).json({ 
            message: 'Site ID and valid assignments array are required' 
          });
        }

        // Validate each assignment
        for (const assignment of assignments) {
          if (!assignment.clientId || !assignment.clientName || !assignment.lobName) {
            return res.status(400).json({ 
              message: 'Each assignment must have clientId, clientName, and lobName' 
            });
          }
        }
        
        const result = await this.SiteManagementService.bulkAddClientsToSite(siteId, assignments);
        
        res.status(200).json({ 
          message: `${result.affectedRows} client-site assignments added successfully`,
          affectedRows: result.affectedRows
        });
      } catch (error) {
        console.error('Error in bulk adding clients to site:', error);
        res.status(500).json({ 
          message: 'Failed to add clients to site', 
          error: error.message 
        });
      }
    }

    async getAvailableClients(req, res) {
        try {
            const { siteId } = req.body;
            
            if (!siteId) {
                return res.status(400).json({ 
                    message: 'Site ID is required' 
                });
            }
            
            const clients = await this.SiteManagementService.getAvailableClients(siteId);
            
            res.status(200).json({ 
                message: 'Available clients retrieved successfully',
                clients
            });
        } catch (error) {
            console.error('Error in getAvailableClients:', error);
            res.status(500).json({ 
                message: 'Failed to get available clients', 
                error: error.message 
            });
        }
    }

    async getAllSitesByStatus(req, res) {
      try {
          const { status } = req.body;
          
          // Validate input
          if (!status) {
              return res.status(400).json({ 
                  message: 'Status is required' 
              });
          }
          
          // Call the service to get sites by status
          const result = await this.SiteManagementService.getAllSitesByStatus(status);
          
          // Return success response
          res.status(200).json({ 
              message: 'Sites retrieved successfully',
              sites: result
          });
      } catch (error) {
          console.error('Error retrieving sites by status:', error);
          res.status(500).json({ 
              message: 'Failed to retrieve sites', 
              error: error.message 
          });
      }
  }

  async getClientSitesByStatus(req, res) {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ 
          message: 'Status is required' 
        });
      }
      
      const result = await this.SiteManagementService.getClientSitesByStatus(status);
      
      res.status(200).json({
        message: `Client-site assignments with status ${status} retrieved successfully`,
        siteClients: result
      });
    } catch (error) {
      console.error('Error retrieving client-site assignments by status:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve client-site assignments', 
        error: error.message 
      });
    }
  }
  
  async deactivateClientSite(req, res) {
    try {
      const { clientSiteId } = req.body;
      
      if (!clientSiteId) {
        return res.status(400).json({ 
          message: 'Client-Site ID is required' 
        });
      }
      
      const result = await this.SiteManagementService.deactivateClientSite(clientSiteId);
      
      res.status(200).json({
        message: 'Client-site assignment deactivated successfully',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error deactivating client-site assignment:', error);
      res.status(500).json({ 
        message: 'Failed to deactivate client-site assignment', 
        error: error.message 
      });
    }
  }

  async reactivateSite(req, res) {
    try {
      const { siteId } = req.body;
      
      // Validate input
      if (!siteId) {
        return res.status(400).json({ 
          message: 'Site ID is required' 
        });
      }
      
      // Call the service to reactivate the site
      const result = await this.SiteManagementService.reactivateSite(siteId);
      
      // Return success response
      res.status(200).json({ 
        message: 'Site reactivated successfully',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error reactivating site:', error);
      res.status(500).json({ 
        message: 'Failed to reactivate site', 
        error: error.message 
      });
    }
  }

  async bulkReactivateSites(req, res) {
    try {
      const { siteIds } = req.body;
      
      if (!siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
        return res.status(400).json({ 
          message: 'Valid site IDs array is required' 
        });
      }
      
      const result = await this.SiteManagementService.bulkReactivateSites(siteIds);
      
      res.status(200).json({ 
        message: `${result.affectedRows} sites reactivated successfully`,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error in bulk reactivating sites:', error);
      res.status(500).json({ 
        message: 'Failed to reactivate sites', 
        error: error.message 
      });
    }
  }
  
  async reactivateClientSite(req, res) {
    try {
      const { clientSiteId } = req.body;
      
      if (!clientSiteId) {
        return res.status(400).json({ 
          message: 'Client-Site ID is required' 
        });
      }
      
      const result = await this.SiteManagementService.reactivateClientSite(clientSiteId);
      
      res.status(200).json({
        message: 'Client-site assignment reactivated successfully',
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error reactivating client-site assignment:', error);
      res.status(500).json({ 
        message: 'Failed to reactivate client-site assignment', 
        error: error.message 
      });
    }
  }
  
  async bulkDeactivateClientSites(req, res) {
    try {
      const { clientSiteIds } = req.body;
      
      if (!clientSiteIds || !Array.isArray(clientSiteIds) || clientSiteIds.length === 0) {
        return res.status(400).json({ 
          message: 'Valid client-site IDs array is required' 
        });
      }
      
      const result = await this.SiteManagementService.bulkDeactivateClientSites(clientSiteIds);
      
      res.status(200).json({ 
        message: `${result.affectedRows} client-site assignments deactivated successfully`,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error in bulk deactivating client-site assignments:', error);
      res.status(500).json({ 
        message: 'Failed to deactivate client-site assignments', 
        error: error.message 
      });
    }
  }
  
  async bulkReactivateClientSites(req, res) {
    try {
      const { clientSiteIds } = req.body;
      
      if (!clientSiteIds || !Array.isArray(clientSiteIds) || clientSiteIds.length === 0) {
        return res.status(400).json({ 
          message: 'Valid client-site IDs array is required' 
        });
      }
      
      const result = await this.SiteManagementService.bulkReactivateClientSites(clientSiteIds);
      
      res.status(200).json({ 
        message: `${result.affectedRows} client-site assignments reactivated successfully`,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error in bulk reactivating client-site assignments:', error);
      res.status(500).json({ 
        message: 'Failed to reactivate client-site assignments', 
        error: error.message 
      });
    }
  }

}

module.exports = SiteManagementController;