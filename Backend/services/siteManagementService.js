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

    async editSite(siteId, siteName) {
        try {
            // Update the site name in the database
            const [result] = await db.query(
                'UPDATE tbl_site SET dSiteName = ? WHERE dSite_ID = ?',
                [
                    siteName,
                    siteId
                ]
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.editSite:', error);
            throw error;
        }
    }

    async deleteSite(siteId) {
        try {
            // Delete the site from the database
            const [result] = await db.query(
                'DELETE FROM tbl_site WHERE dSite_ID = ?',
                [siteId]
            );
            
            return result;
        } catch (error) {
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
            // Get distinct clients from the database
            const [result] = await db.query(
                'SELECT DISTINCT dClient_ID, dClientName FROM tbl_clientsite ORDER BY dClientName ASC'
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.getAllClients:', error);
            throw error;
        }
    }

    async addClientToSite(clientId, siteId) {
        try {
            // First, get the site name for the selected site ID
            const [siteResult] = await db.query(
                'SELECT dSiteName FROM tbl_site WHERE dSite_ID = ?',
                [siteId]
            );
            
            if (siteResult.length === 0) {
                throw new Error('Site not found');
            }
            
            const siteName = siteResult[0].dSiteName;
            
            // Update all records for this client with the new site info
            const [result] = await db.query(
                'UPDATE tbl_clientsite SET dSite_ID = ?, dSiteName = ? WHERE dClient_ID = ?',
                [
                    siteId,
                    siteName,
                    clientId
                ]
            );
            
            return result;
        } catch (error) {
            console.error('Error in SiteManagementService.addClientToSite:', error);
            throw error;
        }
    }
    
    // In SiteManagementService.js, add this method:
    async getClientSiteMappings() {
    try {
        // Get all client-site mappings
        const [result] = await db.query(
            'SELECT DISTINCT dClient_ID, dClientName, dSite_ID, dSiteName FROM tbl_clientsite ORDER BY dClientName ASC'
        );
        
        return result;
    } catch (error) {
        console.error('Error in SiteManagementService.getClientSiteMappings:', error);
        throw error;
    }
}
}

module.exports = SiteManagementService;