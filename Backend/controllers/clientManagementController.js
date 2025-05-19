// controllers/clientManagementController.js
const ClientManagementService = require('../services/clientManagementService');

class ClientManagementController {
    constructor() {
        this.clientManagementService = new ClientManagementService();
    }

    async addClient(req, res) {
        try {
            const clientData = req.body;
            
            // Validate input
            if (!clientData.clientName) {
                return res.status(400).json({ 
                    message: 'Client name is required' 
                });
            }
            
            if (!clientData.LOBs || !Array.isArray(clientData.LOBs) || clientData.LOBs.length === 0) {
                return res.status(400).json({ 
                    message: 'At least one LOB is required' 
                });
            }
            
            // Check if each LOB has at least one Sub LOB
            for (const lob of clientData.LOBs) {
                if (!lob.name) {
                    return res.status(400).json({ 
                        message: 'Each LOB must have a name' 
                    });
                }
                
                if (!lob.subLOBs || !Array.isArray(lob.subLOBs) || lob.subLOBs.length === 0) {
                    return res.status(400).json({ 
                        message: `LOB "${lob.name}" must have at least one Sub LOB` 
                    });
                }
            }
            
            // Get the user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.addClient(clientData, userId);
            
            res.status(201).json({ 
                message: 'Client added successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error adding client:', error);
            res.status(500).json({ 
                message: 'Failed to add client', 
                error: error.message 
            });
        }
    }
    
    async getClients(req, res) {
        try {
            const clients = await this.clientManagementService.getClients();
            
            res.status(200).json({ 
                message: 'Clients retrieved successfully', 
                data: clients 
            });
        } catch (error) {
            console.error('Error retrieving clients:', error);
            res.status(500).json({ 
                message: 'Failed to retrieve clients', 
                error: error.message 
            });
        }
    }
    
    async updateClient(req, res) {
        try {
            const clientData = req.body;
            
            // Validate input
            if (!clientData.oldClientName || !clientData.newClientName) {
                return res.status(400).json({ 
                    message: 'Both old and new client names are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.updateClient(clientData, userId);
            
            res.status(200).json({ 
                message: 'Client updated successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({ 
                message: 'Failed to update client', 
                error: error.message 
            });
        }
    }
    
    async deleteClient(req, res) {
        try {
            const { clientName } = req.body;
            
            // Validate input
            if (!clientName) {
                return res.status(400).json({ 
                    message: 'Client name is required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.deleteClient(clientName, userId);
            
            res.status(200).json({ 
                message: 'Client deleted successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error deleting client:', error);
            res.status(500).json({ 
                message: 'Failed to delete client', 
                error: error.message 
            });
        }
    }

    // New methods for LOB management
    async addLOB(req, res) {
        try {
            console.log("addLOB endpoint called", req.body);
            const { clientName, lobName, siteId, subLOBName } = req.body;
            
            // Validate input
            if (!clientName || !lobName) {
                return res.status(400).json({ 
                    error: 'Client name and LOB name are required'
                });
            }
            
            const userId = getUserIdFromRequest(req);
            
            // Call service method with the subLOBName parameter
            const result = await this.clientManagementService.addLOB(
                clientName, 
                lobName, 
                siteId ? parseInt(siteId) : null, 
                userId,
                subLOBName
            );
            
            res.status(201).json({
                message: 'LOB added successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in addLOB controller:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateLOB(req, res) {
        try {
            const { clientName, oldLOBName, newLOBName } = req.body;
            
            // Validate input
            if (!clientName || !oldLOBName || !newLOBName) {
                return res.status(400).json({ 
                    message: 'Client name, old LOB name, and new LOB name are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.updateLOB(clientName, oldLOBName, newLOBName, userId);
            
            res.status(200).json({ 
                message: 'LOB updated successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error updating LOB:', error);
            res.status(500).json({ 
                message: 'Failed to update LOB', 
                error: error.message 
            });
        }
    }

    async deleteLOB(req, res) {
        try {
            const { clientName, lobName } = req.body;
            
            // Validate input
            if (!clientName || !lobName) {
                return res.status(400).json({ 
                    message: 'Client name and LOB name are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.deleteLOB(clientName, lobName, userId);
            
            res.status(200).json({ 
                message: 'LOB deleted successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error deleting LOB:', error);
            res.status(500).json({ 
                message: 'Failed to delete LOB', 
                error: error.message 
            });
        }
    }

    // New methods for Sub LOB management
    async addSubLOB(req, res) {
        try {
            const { clientName, lobName, subLOBName } = req.body;
            
            // Validate input
            if (!clientName || !lobName || !subLOBName) {
                return res.status(400).json({ 
                    message: 'Client name, LOB name, and Sub LOB name are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.addSubLOB(clientName, lobName, subLOBName, userId);
            
            res.status(201).json({ 
                message: 'Sub LOB added successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error adding Sub LOB:', error);
            res.status(500).json({ 
                message: 'Failed to add Sub LOB', 
                error: error.message 
            });
        }
    }

    async updateSubLOB(req, res) {
        try {
            const { clientName, lobName, oldSubLOBName, newSubLOBName } = req.body;
            
            // Validate input
            if (!clientName || !lobName || !oldSubLOBName || !newSubLOBName) {
                return res.status(400).json({ 
                    message: 'Client name, LOB name, old Sub LOB name, and new Sub LOB name are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.updateSubLOB(
                clientName, lobName, oldSubLOBName, newSubLOBName, userId
            );
            
            res.status(200).json({ 
                message: 'Sub LOB updated successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error updating Sub LOB:', error);
            res.status(500).json({ 
                message: 'Failed to update Sub LOB', 
                error: error.message 
            });
        }
    }

    async deleteSubLOB(req, res) {
        try {
            const { clientName, lobName, subLOBName } = req.body;
            
            // Validate input
            if (!clientName || !lobName || !subLOBName) {
                return res.status(400).json({ 
                    message: 'Client name, LOB name, and Sub LOB name are required' 
                });
            }
            
            // Get user ID from the authenticated user
            const userId = getUserIdFromRequest(req);
            
            const result = await this.clientManagementService.deleteSubLOB(clientName, lobName, subLOBName, userId);
            
            res.status(200).json({ 
                message: 'Sub LOB deleted successfully', 
                data: result 
            });
        } catch (error) {
            console.error('Error deleting Sub LOB:', error);
            res.status(500).json({ 
                message: 'Failed to delete Sub LOB', 
                error: error.message 
            });
        }
    }
}

// Helper function to extract user ID from the request
function getUserIdFromRequest(req) {
    // TESTING ONLY: Return a fixed user ID for testing purposes
    return '2505120003';
    
    // The code below is commented out during testing phase but can be uncommented later
    /*
    // If using JWT with middleware that decodes token and puts user info in req.user
    if (req.user && req.user.id) {
        return req.user.id;
    }
    
    // If using sessions
    if (req.session && req.session.userId) {
        return req.session.userId;
    }
    
    // If using custom header for user ID (not recommended for production)
    if (req.headers['x-user-id']) {
        return req.headers['x-user-id'];
    }
    
    // Fallback for development/testing
    return 'system';
    */
}

module.exports = ClientManagementController;