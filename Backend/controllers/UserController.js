const userService = require('../services/userService');
const bcrypt = require('bcrypt');
const { broadcastUserUpdate } = require('../websocket');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.fetchAllUsers();
    const admins = await userService.fetchAllAdmins();
    // Add a marker so frontend can distinguish
    const adminUsers = admins.map(a => ({
      ...a,
      dUser_Type: 'ADMIN', // Ensure this field is set for filtering
      isAdminTable: true
    }));
    const allUsers = [...users, ...adminUsers];
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  const { employeeId, email, name, password, role } = req.body;
  const status = 'FIRST-TIME';
  const createdBy = 'admin'; // Assuming the creator is 'admin'

  if (!email || !name || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    let userId;
      if (role && role.toUpperCase() === 'ADMIN') {
        userId = await userService.insertAdminUser({
          employeeId,
          name,
          email,
          hashedPassword,
          status,
          createdBy
        });
      } else {
        userId = await userService.insertUser({
          employeeId,
          name,
          email,
          hashedPassword,
          role,
          status,
          createdBy
        });
      }
    res.status(201).json({ id: userId, message: 'User created successfully' });
    broadcastUserUpdate();
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Database error' });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { employeeIds, emails, adminEmployeeIds, adminEmails, admin } = req.body;
    let existing = await userService.findExistingEmployeeIdsEmailsOrNames(employeeIds || [], emails || []);
    // If admin check is requested, also check tbl_admin
    let adminExisting = [];
    if (admin || (adminEmployeeIds && adminEmployeeIds.length > 0) || (adminEmails && adminEmails.length > 0)) {
      adminExisting = await userService.findExistingAdminEmployeeIdsEmails(
        (adminEmployeeIds && adminEmployeeIds.length > 0) ? adminEmployeeIds : (admin ? employeeIds : []),
        (adminEmails && adminEmails.length > 0) ? adminEmails : (admin ? emails : [])
      );
    }
    // Merge results (avoid duplicates)
    const allExisting = [...existing];
    adminExisting.forEach(adminUser => {
      if (!allExisting.some(u => u.dUser_ID === adminUser.dUser_ID && u.dEmail === adminUser.dEmail)) {
        allExisting.push(adminUser);
      }
    });
    res.json(allExisting);
  } catch (err) {
    res.status(500).json({ message: err.sqlMessage || err.message || 'Internal Server Error' });
  }
};

exports.addUsersBulk = async (req, res) => {
  try {
    const users = req.body.users;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users to add' });
    }

    // 1. Check for duplicates in the upload file
    const seenIds = new Set();
    const seenEmails = new Set();
    for (const user of users) {
      if (seenIds.has(user.employeeId)) {
        return res.status(400).json({ message: `Duplicate employee ID in upload: ${user.employeeId}` });
      }
      if (seenEmails.has(user.email)) {
        return res.status(400).json({ message: `Duplicate email in upload: ${user.email}` });
      }
      seenIds.add(user.employeeId);
      seenEmails.add(user.email);
    }

    // 2. Check for duplicates in the database
    const existing = await userService.findExistingEmployeeIdsEmailsOrNames(
      users.map(u => u.employeeId),
      users.map(u => u.email)
    );
    if (existing.length > 0) {
      const existingIds = users.map(u => u.employeeId).filter(id => existing.some(e => e.dUser_ID === id));
      const existingEmails = users.map(u => u.email).filter(email => existing.some(e => e.dEmail === email));
      return res.status(400).json({
        message: `Duplicate(s) found in database. Employee IDs: [${existingIds.join(', ')}], Emails: [${existingEmails.join(', ')}]`
      });
    }

    // If we get here, there are no duplicates in the upload or DB
    const processedUsers = await Promise.all(users.map(async user => ({
      ...user,
      hashedPassword: await bcrypt.hash(user.password, 10)
    })));

    const adminUsers = processedUsers.filter(u => u.role && u.role.toUpperCase() === 'ADMIN');
    const normalUsers = processedUsers.filter(u => !u.role || u.role.toUpperCase() !== 'ADMIN');

    let insertedIds = [];
    if (normalUsers.length > 0) {
      insertedIds = insertedIds.concat(await userService.insertUsersBulk(normalUsers));
    }
    if (adminUsers.length > 0) {
      insertedIds = insertedIds.concat(await userService.insertAdminUsersBulk(adminUsers));
    }
    res.status(201).json({ message: 'Users added successfully', users: insertedIds });
    broadcastUserUpdate();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.sqlMessage || err.message || 'Internal Server Error' });
  }
};

exports.deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected for deletion' });
    }

    await userService.deactivateUsers(userIds);
    res.status(200).json({ message: 'Users deactivated successfully' });
    broadcastUserUpdate();
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.restoreUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected for restoration' });
    }

    await userService.restoreUsers(userIds);
    res.status(200).json({ message: 'Users restored successfully' });
    broadcastUserUpdate();
  } catch (error) {
    console.error('Error restoring users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const allowedFields = ['employeeId', 'name', 'email', 'role', 'status', 'password', 'securityQuestions'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }
    // Check if user exists
    const user = await userService.getUserByLoginId(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // If password is present, hash it
    if (updateData.password) {
      const bcrypt = require('bcrypt');
      updateData.hashedPassword = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    // If securityQuestions is present and is an array of empty questions/answers, clear them
    if (Array.isArray(updateData.securityQuestions)) {
      const allEmpty = updateData.securityQuestions.every(q => !q.question && !q.answer);
      if (allEmpty) {
        // Clear security questions in DB
        await userService.updateUserSecurityQuestions(userId, [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]);
        updateData.status = 'RESET-DONE';
        // Always set password to '1234' (hashed)
        const bcrypt = require('bcrypt');
        updateData.hashedPassword = await bcrypt.hash('1234', 10);
        delete updateData.password;
        delete updateData.securityQuestions;
      }
    }
    const result = await userService.updateUserDynamic(userId, updateData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made.' });
    }
    res.status(200).json({ message: 'User updated successfully' });
    broadcastUserUpdate();
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

exports.updateUserSecurityQuestions = async (req, res) => {
  try {
    const loginId = req.params.id;
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required.' });
    }
    await userService.updateUserSecurityQuestions(loginId, questions);
    res.json({ message: 'Security questions updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update security questions.' });
  }
};