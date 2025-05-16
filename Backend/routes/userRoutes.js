const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.post('/bulk', userController.addUsersBulk);
router.post('/delete', userController.deleteUsers);
router.post('/check-duplicates', userController.checkDuplicates);

module.exports = router;
