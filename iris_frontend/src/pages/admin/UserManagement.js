import React, { useState, useCallback, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaFileDownload, FaTimesCircle, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaKey, FaShieldAlt, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
  // State declarations
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securityQuestionsData, setSecurityQuestionsData] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  
  // Add user modal state
  const [newUser, setNewUser] = useState({
    employeeId: '',
    email: '',
    name: '',
    role: 'HR'
  });

  // Bulk upload state
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkUsers, setBulkUsers] = useState([]);
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Security question options
  const securityQuestionOptions = [
    "What was your first pet's name?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What was your childhood nickname?"
  ];

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.dUser_ID && user.dUser_ID.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.dName && user.dName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.dEmail && user.dEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'All' || (user.dUser_Type && user.dUser_Type === roleFilter);

    return matchesSearch && matchesRole;
  });

  // File drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // File processing (mock implementation)
  const handleFile = (file) => {
    setFile(file);
    // Mock processing - replace with actual file processing
    const mockValidUsers = [
      { employeeId: 'E001', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', valid: true },
      { employeeId: 'E002', name: 'Jane Smith', email: 'jane@example.com', role: 'HR', status: 'Active', valid: true }
    ];
    const mockInvalidUsers = [
      { employeeId: 'E003', name: 'Invalid User', email: 'invalid', role: '', status: '', valid: false, reason: 'Missing required fields' }
    ];
    setBulkUsers(mockValidUsers);
    setInvalidUsers(mockInvalidUsers);
  };

  // Remove uploaded file
  const removeFile = () => {
    setFile(null);
    setBulkUsers([]);
    setInvalidUsers([]);
  };

  // Generate CSV template for bulk upload
  const generateTemplate = () => {
    const csvContent = "Employee ID,Name,Email,Role,Status\nE001,John Doe,john@example.com,Admin,Active";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'user_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add user to preview list
  const handleAddToList = () => {
    if (newUser.employeeId && newUser.email && newUser.name && newUser.role) {
      setIndividualPreview(prev => [...prev, { ...newUser, status: 'FIRST-TIME' }]);
      setNewUser({ employeeId: '', email: '', name: '', role: 'HR' });
    }
  };

  // Submit individual users
  const handleAddIndividual = async () => {
    if (individualPreview.length > 0) {
      try {
        const response = await fetch('http://localhost:5000/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            users: individualPreview.map(user => ({
              ...user,
              password: 'defaultPass123',
              createdBy: 'admin'
            }))
          })
        });

        if (!response.ok) throw new Error('Failed to add users');
        
        const result = await response.json();
        setUsers(prev => [...prev, ...individualPreview]);
        setAddModalOpen(false);
        setIndividualPreview([]);
      } catch (error) {
        console.error('Error adding users:', error);
      }
    }
  };

  // Submit bulk users
  const handleBulkUpload = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: bulkUsers.map(user => ({
            ...user,
            password: 'defaultPassword123',
            createdBy: 'admin'
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to bulk add users');
      
      const result = await response.json();
      setUsers(prev => [...prev, ...bulkUsers]);
      setAddModalOpen(false);
      setBulkUsers([]);
      setFile(null);
    } catch (error) {
      console.error('Bulk upload error:', error);
    }
  };

  // Delete selected users
  const handleDeleteUsers = async () => {
    if (deleteConfirmText === 'CONFIRM' && selectedUsers.length > 0) {
      try {
        const response = await fetch('http://localhost:5000/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUsers })
        });

        if (!response.ok) throw new Error('Failed to delete users');
        
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.dUser_ID)));
        setSelectedUsers([]);
        setShowDeleteModal(false);
        setDeleteConfirmText('');
      } catch (error) {
        console.error('Error deleting users:', error);
      }
    }
  };

  // Edit user handler
  const handleEdit = (user) => {
    setCurrentUser(user);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSecurityQuestionsData(user.securityQuestions || [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ]);
    setShowPasswordFields(false);
    setShowSecurityQuestions(false);
    setEditModalOpen(true);
  };

  // Handle new user input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle security question changes
  const handleSecurityQuestionChange = (index, field, value) => {
    const updatedQuestions = [...securityQuestionsData];
    updatedQuestions[index][field] = value;
    setSecurityQuestionsData(updatedQuestions);
  };

  // Remove user from preview list
  const handleRemoveFromPreview = (employeeIdToRemove) => {
    setIndividualPreview(prev =>
      prev.filter(user => user.employeeId !== employeeIdToRemove)
    );
  };

  // Save user changes
  const handleSave = async (updatedUser) => {
    try {
      // Only update password if fields are filled and match
      if (showPasswordFields && passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
        updatedUser.password = passwordData.newPassword;
      }

      // Update security questions if modified
      if (showSecurityQuestions) {
        updatedUser.securityQuestions = securityQuestionsData;
      }

      const response = await fetch(`http://localhost:5000/api/users/${updatedUser.dUser_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });

      if (!response.ok) throw new Error('Failed to update user');

      setUsers(users.map(user => user.dUser_ID === updatedUser.dUser_ID ? updatedUser : user));
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <div className="user-management-container">
      <div className="white-card">
        <div className="user-management-header">
          <h1>User Management</h1>
          <p className="subtitle">Add, modify, or delete users and manage their roles and access.</p>
        </div>

        <div className="controls">
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
              <option value="REPORTS">REPORTS</option>
              <option value="CNB">CNB</option>
            </select>
          </div>

          <button className="add-user-btn" onClick={() => setAddModalOpen(true)}>
            <FaPlus /> Add User
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="employee-id-col">Employee ID</th>
                <th className="name-col">Name</th>
                <th className="email-col">Email</th>
                <th className="role-col">Role</th>
                <th className="status-col">Status</th>
                <th className="actions-col">
                  <div className="actions-header">
                    Actions
                    <div className="select-all-container">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map(user => user.dUser_ID));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                      <span className="selected-count">
                        {selectedUsers.length > 0 ? `${selectedUsers.length}` : ''}
                      </span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const isSelected = selectedUsers.includes(user.dUser_ID);
                return (
                  <tr
                    key={user.dUser_ID}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={(e) => {
                      if (e.target.tagName !== 'BUTTON' && 
                          e.target.tagName !== 'svg' && 
                          e.target.tagName !== 'path' && 
                          e.target.type !== 'checkbox') {
                        if (e.shiftKey && lastSelectedIndex !== null) {
                          const start = Math.min(lastSelectedIndex, index);
                          const end = Math.max(lastSelectedIndex, index);
                          const newSelectedUsers = [...selectedUsers];
                          
                          filteredUsers.slice(start, end + 1).forEach(rangeUser => {
                            const userId = rangeUser.dUser_ID;
                            if (isSelected) {
                              const i = newSelectedUsers.indexOf(userId);
                              if (i > -1) newSelectedUsers.splice(i, 1);
                            } else if (!newSelectedUsers.includes(userId)) {
                              newSelectedUsers.push(userId);
                            }
                          });
                          
                          setSelectedUsers(newSelectedUsers);
                        } else {
                          setSelectedUsers(prev => 
                            isSelected 
                              ? prev.filter(id => id !== user.dUser_ID) 
                              : [...prev, user.dUser_ID]
                          );
                          setLastSelectedIndex(index);
                        }
                      }
                    }}
                  >
                    <td>{user.dUser_ID}</td>
                    <td>{user.dName}</td>
                    <td>{user.dEmail}</td>
                    <td>{user.dUser_Type}</td>
                    <td>{user.dStatus}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(user)} className="edit-btn">
                          <FaEdit size={12} /> Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUsers([user.dUser_ID]);
                            setShowDeleteModal(true);
                          }}
                          className="delete-btn"
                        >
                          <FaTrash size={12} /> Delete
                        </button>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedUsers(prev => 
                              e.target.checked 
                                ? [...prev, user.dUser_ID] 
                                : prev.filter(id => id !== user.dUser_ID)
                            );
                            setLastSelectedIndex(index);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {selectedUsers.length > 0 && (
            <div className="bulk-actions-container">
              <button
                className="bulk-delete-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                <FaTrash /> Delete Selected ({selectedUsers.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '700px' }}>
            <div className="modal-header">
              <h2>Add User</h2>
              <button onClick={() => setAddModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <p className="modal-subtitle">Enter the details for the new user.</p>

            <div className="upload-method-tabs">
              <button
                className={`tab-btn ${uploadMethod === 'individual' ? 'active' : ''}`}
                onClick={() => setUploadMethod('individual')}
              >
                Individual Upload
              </button>
              <button
                className={`tab-btn ${uploadMethod === 'bulk' ? 'active' : ''}`}
                onClick={() => setUploadMethod('bulk')}
              >
                Bulk Upload
              </button>
            </div>

            {uploadMethod === 'individual' ? (
              <div className="individual-upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={newUser.employeeId}
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employee Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newUser.name}
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department/Role</label>
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleNewUserChange}
                    >
                      <option value="Admin">Admin</option>
                      <option value="HR">HR</option>
                      <option value="REPORTS">REPORTS</option>
                      <option value="CNB">CNB</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <button
                    className="add-to-list-btn"
                    onClick={handleAddToList}
                  >
                    Add to List
                  </button>
                </div>

                {individualPreview.length > 0 && (
                  <div className="individual-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {individualPreview.map((user, index) => (
                          <tr key={`individual-preview-${index}`}>
                            <td>{user.employeeId}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                              <button
                                className="remove-btn"
                                onClick={() => handleRemoveFromPreview(user.employeeId)}
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="modal-actions">
                  <button onClick={() => setAddModalOpen(false)} className="cancel-btn">Cancel</button>
                  <button
                    onClick={handleAddIndividual}
                    className="save-btn"
                    disabled={individualPreview.length === 0}
                  >
                    Add User
                  </button>
                </div>
              </div>
            ) : (
              <div className="bulk-upload-form">
                <div className="bulk-upload-actions">
                  <h3><FaUpload /> Upload Users</h3>
                  <button onClick={generateTemplate} className="generate-template-btn">
                    <FaFileDownload /> Generate Template
                  </button>
                </div>

                <div
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="drop-zone-content">
                    <p>Drag and drop your file here or</p>
                    <p>CSV or Excel files only (max 5MB)</p>
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="browse-files-btn">
                      Browse Files
                    </label>
                  </div>
                </div>

                {file && (
                  <div className="file-preview">
                    <span>📄 {file.name}</span>
                    <button onClick={removeFile} className="remove-file-btn">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}

                {(bulkUsers.length > 0 || invalidUsers.length > 0) && (
                  <div className="upload-preview">
                    <div className="preview-tabs">
                      <button
                        className={`preview-tab ${previewTab === 'valid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('valid')}
                        disabled={bulkUsers.length === 0}
                      >
                        Valid ({bulkUsers.length})
                      </button>
                      <button
                        className={`preview-tab ${previewTab === 'invalid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('invalid')}
                        disabled={invalidUsers.length === 0}
                      >
                        Invalid ({invalidUsers.length})
                      </button>
                    </div>

                    <div className="preview-content">
                      {previewTab === 'valid' && bulkUsers.length > 0 && (
                        <div className="valid-users-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkUsers.map((user, index) => (
                                <tr key={`valid-${index}`}>
                                  <td>{user.employeeId}</td>
                                  <td>{user.name}</td>
                                  <td>{user.email}</td>
                                  <td>{user.role}</td>
                                  <td>{user.status}</td>
                                  <td>
                                    <button
                                      className="remove-btn"
                                      onClick={() => setBulkUsers(bulkUsers.filter((_, i) => i !== index))}
                                    >
                                      <FaTimes />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {previewTab === 'invalid' && invalidUsers.length > 0 && (
                        <div className="invalid-users-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Reason</th>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invalidUsers.map((user, index) => (
                                <tr key={`invalid-${index}`}>
                                  <td className="reason-cell">{user.reason}</td>
                                  <td>{user.employeeId}</td>
                                  <td>{user.name}</td>
                                  <td>{user.email}</td>
                                  <td>{user.role}</td>
                                  <td>{user.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button onClick={() => setAddModalOpen(false)} className="cancel-btn">Cancel</button>
                  <button
                    onClick={handleBulkUpload}
                    className="save-btn"
                    disabled={bulkUsers.length === 0}
                  >
                    Submit Users {bulkUsers.length > 0 && `(${bulkUsers.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-confirmation-modal">
            <h3>
              <FaTrash /> Confirm Deletion
            </h3>
            <p>
              You are about to delete {selectedUsers.length} user(s). 
              This action cannot be undone. Type <strong>CONFIRM</strong> to proceed.
            </p>
            
            {selectedUsers.length > 0 && (
              <ul>
                {users
                  .filter(user => selectedUsers.includes(user.dUser_ID))
                  .map(user => (
                    <li key={user.dUser_ID}>
                      <span>{user.dName}</span>
                      <span className="user-id">{user.dUser_ID}</span>
                    </li>
                  ))}
              </ul>
            )}
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type CONFIRM to delete"
            />
            
            <div className="delete-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-btn"
                disabled={deleteConfirmText !== 'CONFIRM'}
                onClick={handleDeleteUsers}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && currentUser && (
        <div className="modal-overlay">
          <div className="modal edit-user-modal">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => setEditModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Employee ID:</label>
                <input
                  type="text"
                  name="employeeId"
                  value={currentUser.dUser_ID}
                  onChange={(e) => setCurrentUser({...currentUser, dUser_ID: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={currentUser.dName}
                  onChange={(e) => setCurrentUser({...currentUser, dName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={currentUser.dEmail}
                  onChange={(e) => setCurrentUser({...currentUser, dEmail: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role:</label>
                <select
                  name="role"
                  value={currentUser.dUser_Type}
                  onChange={(e) => setCurrentUser({...currentUser, dUser_Type: e.target.value})}
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="REPORTS">REPORTS</option>
                  <option value="CNB">CNB</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status:</label>
                <select
                  name="status"
                  value={currentUser.dStatus}
                  onChange={(e) => setCurrentUser({...currentUser, dStatus: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="password-security-container">
              <div className="password-change-section">
                <h3 className="section-header">
                  <FaKey size={14} /> Password
                </h3>

                <button
                  className="visibility-toggle"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                >
                  {showPasswordFields ? <FaChevronDown /> : <FaChevronRight />}
                  {showPasswordFields ? 'Hide Password Change' : 'Change Password'}
                </button>

                {showPasswordFields && (
                  <div className="password-fields">
                    <div className="form-group">
                      <label>Current Password</label>
                      <div className="password-input-container">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                        />
                        <button
                          className="toggle-password-btn"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                        />
                        <button
                          className="toggle-password-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                        />
                        <button
                          className="toggle-password-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {passwordData.newPassword && passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="error-message">Passwords do not match</p>
                      )}
                  </div>
                )}
              </div>

              <div className="security-questions-section">
                <h3 className="section-header">
                  <FaShieldAlt size={14} /> Security Questions
                </h3>

                <button
                  className="visibility-toggle"
                  onClick={() => setShowSecurityQuestions(!showSecurityQuestions)}
                >
                  {showSecurityQuestions ? <FaChevronDown /> : <FaChevronRight />}
                  {showSecurityQuestions ? 'Hide Security Questions' : 'Change Security Questions'}
                </button>

                {showSecurityQuestions && (
                  <div className="security-questions-fields">
                    {securityQuestionsData.map((question, index) => (
                      <div key={`question-${index}`} className="security-question-group">
                        <div className="form-group">
                          <label>Question {index + 1}</label>
                          <select
                            value={question.question}
                            onChange={(e) => handleSecurityQuestionChange(index, 'question', e.target.value)}
                          >
                            <option value="">Select a question</option>
                            {securityQuestionOptions.map((opt, i) => (
                              <option key={`opt-${i}`} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Answer</label>
                          <input
                            type="text"
                            value={question.answer}
                            onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                            placeholder="Enter your answer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
              <button onClick={() => handleSave(currentUser)} className="save-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;