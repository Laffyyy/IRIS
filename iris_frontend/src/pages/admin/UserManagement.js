import React, { useState } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'HR',
    deactivationReason: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEdit = (user) => {
    setCurrentUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleSave = (updatedUser) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setEditModalOpen(false);
  };

  const handleAdd = () => {
    const userToAdd = {
      ...newUser,
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1
    };
    setUsers([...users, userToAdd]);
    setAddModalOpen(false);
    setNewUser({
      name: '',
      email: '',
      role: 'HR',
      deactivationReason: ''
    });
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="user-management-container">
      <div className="white-card">
        <div className="user-management-header">
          <h1>User Management</h1>
          <p className="subtitle">Add, modify, or delete users and manage their roles and access.</p>
        </div>
        
        <div className="controls">
          {users.length > 0 && (
            <>
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-container">
                <label>Filter by Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Reports POC">Reports POC</option>
                  <option value="C&B">C&B</option>
                </select>
              </div>
            </>
          )}
          
          <button className="add-user-btn" onClick={() => setAddModalOpen(true)}>
            <FaPlus /> Add User
          </button>
        </div>
        
        {users.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="name-col">Name</th>
                  <th className="email-col">Email</th>
                  <th className="role-col">Role</th>
                  <th className="reason-col">Reason for Deactivation</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="name-col">{user.name}</td>
                    <td className="email-col">{user.email}</td>
                    <td className="role-col">{user.role}</td>
                    <td className="reason-col">{user.deactivationReason}</td>
                    <td className="actions-col">
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(user)} className="edit-btn">
                          <FaEdit size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="delete-btn">
                          <FaTrash size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No users added yet. Click "Add User" to get started.</p>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button onClick={() => setAddModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleNewUserChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Role:</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
              >
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Reports POC">Reports POC</option>
                <option value="C&B">C&B</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setAddModalOpen(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAdd} className="save-btn">Add User</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editModalOpen && (
        <UserModal
          title="Edit User"
          user={currentUser}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const UserModal = ({ title, user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState({ ...user });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>
        
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={editedUser.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={editedUser.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Role:</label>
          <select
            name="role"
            value={editedUser.role}
            onChange={handleChange}
          >
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Reports POC">Reports POC</option>
            <option value="C&B">C&B</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Reason for Deactivation:</label>
          <textarea
            name="deactivationReason"
            value={editedUser.deactivationReason}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={() => onSave(editedUser)} className="save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;