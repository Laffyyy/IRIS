const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const db = require('../config/db');

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
router.post('/lock', userController.lockUsers);
router.post('/unlock', userController.unlockUsers);
router.post('/delete-permanent', userController.deleteUsersPermanently);
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // First try tbl_Admin
    let [adminDetails] = await db.query(
      'SELECT dUser_ID, dName, dEmail FROM tbl_Admin WHERE dUser_ID = ?',
      [employeeId]
    );

    if (adminDetails) {
      // For admin users, set type as ADMIN
      return res.json({
        employeeId: adminDetails.dUser_ID,
        name: adminDetails.dName,
        email: adminDetails.dEmail,
        type: 'ADMIN',
        status: adminDetails.dStatus
      });
    }

    // If not found in tbl_Admin, try tbl_Login
    [adminDetails] = await db.query(
      'SELECT dUser_ID, dName, dEmail, dUser_Type, dStatus FROM tbl_Login WHERE dUser_ID = ?',
      [employeeId]
    );

    if (!adminDetails) {
      return res.status(404).json({ 
        message: 'User not found in either Admin or Login tables' 
      });
    }

    // Return response for regular users
    res.json({
      employeeId: adminDetails.dUser_ID,
      name: adminDetails.dName,
      email: adminDetails.dEmail,
      type: adminDetails.dUser_Type,
      status: adminDetails.dStatus
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Error fetching user details',
      error: error.message 
    });
  }
});


module.exports = router;
