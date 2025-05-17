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
}

module.exports = SiteManagementService;