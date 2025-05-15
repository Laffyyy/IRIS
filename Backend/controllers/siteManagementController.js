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
}

module.exports = SiteManagementController;