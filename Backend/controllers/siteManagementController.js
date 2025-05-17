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
            const { siteId, siteName } = req.body;
            
            // Validate input
            if (!siteId || !siteName) {
                return res.status(400).json({ 
                    message: 'Site ID and site name are required' 
                });
            }
            
            // Call the service to edit the site
            const result = await this.SiteManagementService.editSite(siteId, siteName);
            
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

    async deleteSite(req, res) {
        try {
            console.log('DELETE REQUEST BODY:', req.body);
            console.log('DELETE REQUEST HEADERS:', req.headers);
            const { siteId } = req.body;
            
            // Validate input
            if (!siteId) {
                return res.status(400).json({ 
                    message: 'Site ID is required' 
                });
            }
            
            // Call the service to delete the site
            const result = await this.SiteManagementService.deleteSite(siteId);
            
            // Return success response
            res.status(200).json({ 
                message: 'Site deleted successfully',
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error deleting site:', error);
            res.status(500).json({ 
                message: 'Failed to delete site', 
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

    async addClientToSite(req, res) {
        try {
            console.log("Received in controller:", req.body);
            const { clientId, siteId } = req.body;
            
            console.log("Extracted values:", { clientId, siteId });

            // Validate input
            if (!clientId || !siteId) {
                return res.status(400).json({ 
                    message: 'Client ID and Site ID are required' 
                });
            }
            
            // Call the service to update the client's site
            const result = await this.SiteManagementService.addClientToSite(clientId, siteId);
            
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

    // In SiteManagementController.js, add this new method:
    async getClientSiteMappings(req, res) {
        try {
            // Call the service to get all client-site mappings
            const result = await this.SiteManagementService.getClientSiteMappings();
            
            // Return success response
            res.status(200).json({ 
                message: 'Client-site mappings retrieved successfully',
                mappings: result
            });
        } catch (error) {
            console.error('Error retrieving client-site mappings:', error);
            res.status(500).json({ 
                message: 'Failed to retrieve client-site mappings', 
                error: error.message 
            });
        }
    }

    async removeClientFromSite(req, res) {
        try {
            const { clientId } = req.body;
            
            // Validate input
            if (!clientId) {
                return res.status(400).json({ 
                    message: 'Client ID is required' 
                });
            }
            
            // Call the service to remove the client's site assignment
            const result = await this.SiteManagementService.removeClientFromSite(clientId);
            
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
    
}

module.exports = SiteManagementController;