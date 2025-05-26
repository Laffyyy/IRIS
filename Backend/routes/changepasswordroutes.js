const express = require('express');
const router = express.Router();
const ChangePasswordController = require('../controllers/changepasswordcontroller');

const changepasswordController = new ChangePasswordController();

// Fixed: Changed loginController to changepasswordController
router.post('/fetchStatus', (req, res) => changepasswordController.checkUserStatus(req, res));
router.post('/verify', (req, res) => changepasswordController.verifyCredentials(req, res));
router.post('/', (req, res) => {
    const { operation } = req.body;
    
    switch (operation) {
        case 'firstLogin':
            changepasswordController.firstLogin(req, res);
            break;
            
        case 'changePassword':
            changepasswordController.changePassword(req, res);
            break;
            
        case 'changeSecurityQuestions':
            changepasswordController.changeSecurityQuestions(req, res);
            break;
            
        default:
            res.status(400).json({ 
                message: 'Invalid operation', 
                error: `Operation '${operation}' not supported` 
            });
    }
});

// GET endpoint for fetching security questions (doesn't need operation parameter)
router.get('/securityquestions', (req, res) => changepasswordController.getSecurityQuestions(req, res));

module.exports = router;