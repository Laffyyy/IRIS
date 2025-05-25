const express = require('express');
const router = express.Router();
const PasswordExpirationController = require('../controllers/passwordExpirationController');

const passwordExpirationController = new PasswordExpirationController();

router.post('/manage', (req, res) => {
  const { operation } = req.body;
  
  switch (operation) {
    case 'check':
      return passwordExpirationController.checkPasswordExpiration(req, res);
    case 'extend':
      return passwordExpirationController.extendPasswordExpiration(req, res);
    case 'reset':
      return passwordExpirationController.resetPasswordExpiration(req, res);
    default:
      return res.status(400).json({ 
        message: 'Invalid operation type. Valid operations include "check", "extend", and "reset"' 
      });
  }
});

module.exports = router;