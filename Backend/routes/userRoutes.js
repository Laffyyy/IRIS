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
    const [adminRows] = await db.query(
      'SELECT dUser_ID, dName, dEmail, tLast_Login FROM tbl_Admin WHERE dUser_ID = ?',
      [employeeId]
    );
    const adminDetails = adminRows[0];

    if (adminDetails) {
      return res.json({
        employeeId: adminDetails.dUser_ID,
        name: adminDetails.dName,
        email: adminDetails.dEmail,
        lastLogin: adminDetails.tLast_Login,
        type: 'ADMIN',
        status: 'ACTIVE' // or set from another source if you have it
      });
    }

    // If not found in tbl_Admin, try tbl_Login
    const [loginRows] = await db.query(
      'SELECT dUser_ID, dName, dEmail, dUser_Type, dStatus FROM tbl_Login WHERE dUser_ID = ?',
      [employeeId]
    );
    const loginDetails = loginRows[0];

    if (!loginDetails) {
      return res.status(404).json({
        message: 'User not found in either Admin or Login tables'
      });
    }

    res.json({
      employeeId: loginDetails.dUser_ID,
      name: loginDetails.dName,
      email: loginDetails.dEmail,
      type: loginDetails.dUser_Type,
      status: loginDetails.dStatus
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
