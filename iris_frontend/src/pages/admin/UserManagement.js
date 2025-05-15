import React, { useState, useCallback } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaFileDownload, FaTimesCircle, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaKey, FaShieldAlt, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
  // State for main table
  const [users, setUsers] = useState([
    {
      id: 1,
      employeeId: 'E01M1',
      name: 'John Aldie Abdul Doe',
      email: 'john.aldie_abdul.deo@gmail.com',
      role: 'Admin',
      status: 'Active',
      password: 'initialPassword123',
      securityQuestions: [
        { question: 'What was your first pet\'s name?', answer: 'Fluffy' },
        { question: 'What city were you born in?', answer: 'New York' },
        { question: 'What is your mother\'s maiden name?', answer: 'Smith' }
      ]
    },
    {
      id: 2,
      employeeId: 'E02M1',
      name: 'Jane Smith',
      email: 'jane.smith@gmail.com',
      role: 'Reports POC',
      status: 'Active',
      password: 'initialPassword456',
      securityQuestions: [
        { question: 'What was your first pet\'s name?', answer: 'Max' },
        { question: 'What city were you born in?', answer: 'Chicago' },
        { question: 'What is your mother\'s maiden name?', answer: 'Johnson' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State for password change
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for security questions
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [securityQuestionsData, setSecurityQuestionsData] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  // State for add user modal
  const [newUser, setNewUser] = useState({
    employeeId: '',
    email: '',
    name: '',
    role: 'HR'
  });

  // State for bulk upload
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkUsers, setBulkUsers] = useState([]);
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);

  // Filter users for main table
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()); // Added employeeId to search
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle file drop for bulk upload
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

  // Simulate file processing
  const handleFile = (file) => {
    setFile(file);
    // Mock data
    const mockValidUsers = [
      {
        employeeId: 'E01M1',
        name: 'John Aldie Abdul Doe',
        email: 'john.aldie_abdul.deo@gmail.com',
        role: 'Admin',
        status: 'Active',
        valid: true
      },
      {
        employeeId: 'E02M1',
        name: 'Jane Smith',
        email: 'jane.smith@gmail.com',
        role: 'Reports POC',
        status: 'Active',
        valid: true
      }
    ];
    const mockInvalidUsers = [
      {
        employeeId: 'EQNM',
        name: 'John Abise Abdul Doe',
        email: 'john.abise.abaid.doe@gmail.com',
        role: 'Admin',
        status: 'Active',
        valid: false,
        reason: 'Invalid Format'
      },
      {
        employeeId: 'EQ2M1',
        name: 'Jane Smith',
        email: 'jane.smith@gmail.com',
        role: 'Report+ POC',
        status: 'Active',
        valid: false,
        reason: 'Same Dataset'
      }
    ];
    setBulkUsers(mockValidUsers);
    setInvalidUsers(mockInvalidUsers);
    setPreviewTab('valid');
  };

  // Remove uploaded file
  const removeFile = () => {
    setFile(null);
    setBulkUsers([]);
    setInvalidUsers([]);
  };

  // Generate template for bulk upload
  const generateTemplate = () => {
    const csvContent = "Employee ID,Name,Email,Role,Status\nE01M1,John Doe,john.doe@example.com,HR,Active";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'user_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle adding individual user to preview
  const handleAddToList = () => {
    if (newUser.employeeId && newUser.email && newUser.name && newUser.role) {
      setIndividualPreview([{
        ...newUser,
        status: 'Active'
      }]);
    }
  };

  // Handle adding individual user submission
  const handleAddIndividual = () => {
    if (individualPreview.length > 0) {
      const userToAdd = {
        ...individualPreview[0],
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        password: 'defaultPassword123',
        securityQuestions: [
          { question: 'What was your first pet\'s name?', answer: 'Default' },
          { question: 'What city were you born in?', answer: 'Default' },
          { question: 'What is your mother\'s maiden name?', answer: 'Default' }
        ]
      };
      setUsers([...users, userToAdd]);
      setAddModalOpen(false);
      setNewUser({
        employeeId: '',
        email: '',
        name: '',
        role: 'HR'
      });
      setIndividualPreview([]);
    }
  };

  // Handle bulk upload submission
  const handleBulkUpload = () => {
    const usersToAdd = bulkUsers.map((user, index) => ({
      ...user,
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + index + 1 : index + 1,
      password: 'defaultPassword123',
      securityQuestions: [
        { question: 'What was your first pet\'s name?', answer: 'Default' },
        { question: 'What city were you born in?', answer: 'Default' },
        { question: 'What is your mother\'s maiden name?', answer: 'Default' }
      ]
    }));
    setUsers([...users, ...usersToAdd]);
    setAddModalOpen(false);
    setBulkUsers([]);
    setInvalidUsers([]);
    setFile(null);
  };

  // Other handlers
  const handleEdit = (user) => {
    setCurrentUser(user);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSecurityQuestionsData(user.securityQuestions);
    setShowPasswordFields(false);
    setShowSecurityQuestions(false);
    setEditModalOpen(true);
  };

  const handleDelete = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleSave = (updatedUser) => {
    // Only update password if fields are filled and match
    if (showPasswordFields && passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
      updatedUser.password = passwordData.newPassword;
    }

    // Update security questions if modified
    if (showSecurityQuestions) {
      updatedUser.securityQuestions = securityQuestionsData;
    }

    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setEditModalOpen(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const removeIndividualPreview = () => {
    setIndividualPreview([]);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    const updatedQuestions = [...securityQuestionsData];
    updatedQuestions[index][field] = value;
    setSecurityQuestionsData(updatedQuestions);
  };

  // Security question options
  const securityQuestionOptions = [
    'What was your first pet\'s name?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was the name of your first school?',
    'What was your childhood nickname?',
    'What is your favorite movie?'
  ];

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
              <option value="Reports POC">Reports POC</option>
              <option value="C&B">C&B</option>
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
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="employee-id-col">{user.employeeId}</td>
                  <td className="name-col">{user.name}</td>
                  <td className="email-col">{user.email}</td>
                  <td className="role-col">{user.role}</td>
                  <td className="status-col">{user.status}</td>
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
                      <option value="Reports POC">Reports POC</option>
                      <option value="C&B">C&B</option>
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
                          <th>Status</th>
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
                            <td>{user.status}</td>
                            <td>
                              <button
                                className="remove-btn"
                                onClick={removeIndividualPreview}
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
                  value={currentUser.employeeId}
                  onChange={(e) => setCurrentUser({...currentUser, employeeId: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
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
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role:</label>
                <select
                  name="role"
                  value={currentUser.role}
                  onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Reports POC">Reports POC</option>
                  <option value="C&B">C&B</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status:</label>
                <select
                  name="status"
                  value={currentUser.status}
                  onChange={(e) => setCurrentUser({...currentUser, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Side-by-side layout for Password and Security Questions */}
            <div className="password-security-container">
              {/* Password Change Section */}
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

              {/* Security Questions Section */}
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