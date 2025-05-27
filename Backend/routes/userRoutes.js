const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.post('/bulk', userController.addUsersBulk);
router.post('/delete', userController.deleteUsers);
router.post('/restore', userController.restoreUsers);
router.post('/check-duplicates', userController.checkDuplicates);
router.put('/:id', userController.updateUser);
router.put('/:id/security-questions', userController.updateUserSecurityQuestions);
router.post('/delete-one', userController.deleteOneUser);
router.post('/delete-batch', userController.deleteBatchUsers);

module.exports = router;
