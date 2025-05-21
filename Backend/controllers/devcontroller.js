const Devservices = require('../services/devservices');

class DevController {
    constructor() {
        this.devservices = new Devservices();
    }

    async createAdminUser(req, res) {
        try {
            const result = await this.devservices.createAdminUser(req.body);
            res.status(201).json({ message: 'Admin user created successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
    


}


module.exports = DevController;