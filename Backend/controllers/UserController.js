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

exports.addUsersBulk = async (req, res) => {
  try {
    const users = req.body.users; // ⬅ This is key
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users to add' });
    }

    const processedUsers = await Promise.all(users.map(async user => ({
      ...user,
      hashedPassword: await bcrypt.hash(user.password, 10)
    })));

    const insertedIds = await userService.insertUsersBulk(processedUsers);

    res.status(201).json({ message: 'Users added successfully', users: insertedIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
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