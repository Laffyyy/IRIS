const userService = require('../services/userService');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.fetchAllUsers();
    res.json(users);
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
    const userId = await userService.insertUser({
      employeeId,
      name,
      email,
      hashedPassword,
      role,
      status,
      createdBy
    });
    res.status(201).json({ id: userId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Database error' });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { employeeIds, emails } = req.body;
    const existing = await userService.findExistingEmployeeIdsEmailsOrNames(employeeIds, emails);
    res.json(existing);
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

    const insertedIds = await userService.insertUsersBulk(processedUsers);
    res.status(201).json({ message: 'Users added successfully', users: insertedIds });
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

    await userService.deleteUsers(userIds);
    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
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
    const result = await userService.updateUserDynamic(userId, updateData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made.' });
    }
    res.status(200).json({ message: 'User updated successfully' });
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