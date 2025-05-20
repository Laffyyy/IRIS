import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaFileDownload, FaTimesCircle, FaUpload, FaEye, FaEyeSlash, FaLock, FaUsers, FaUserShield, FaHistory, FaTicketAlt, FaUserSlash, FaKey, FaShieldAlt } from 'react-icons/fa';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './UserManagement.css';

function isExactRole(role) {
  const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
  return allowedRoles.includes(role);
}

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
  const [originalUser, setOriginalUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [anchorSelectedIndex, setAnchorSelectedIndex] = useState(null);
  
  // Add user modal state
  const [newUser, setNewUser] = useState({
    employeeId: '',
    email: '',
    name: '',
    role: 'HR'
  });

  // Debounced new user fields
  const [debouncedNewUser, setDebouncedNewUser] = useState(newUser);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedNewUser(newUser), 400);
    return () => clearTimeout(handler);
  }, [newUser]);

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
  const [fileError, setFileError] = useState('');

  // State for confirmation and result modals
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [showBulkResultModal, setShowBulkResultModal] = useState(false);
  const [bulkResultMessage, setBulkResultMessage] = useState('');
  const [bulkResultSuccess, setBulkResultSuccess] = useState(false);

  // Add state for confirmation modal
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [pendingEditUser, setPendingEditUser] = useState(null);

  // Add state for edit result modal
  const [showEditResultModal, setShowEditResultModal] = useState(false);
  const [editResultSuccess, setEditResultSuccess] = useState(false);
  const [editResultMessage, setEditResultMessage] = useState('');

  // Security question options
  const securityQuestionOptions = [
    "What was your first pet's name?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What was your childhood nickname?"
  ];

  // In the Edit User Modal, add a checkbox to enable editing of Employee ID
  const [employeeIdEditable, setEmployeeIdEditable] = useState(false);

  // Add a computed variable for password mismatch
  const passwordMismatch =
    (passwordData.newPassword || passwordData.confirmPassword) &&
    (passwordData.newPassword !== passwordData.confirmPassword);

  // Add state for individual add errors and confirmation/result modals
  const [individualAddError, setIndividualAddError] = useState('');
  const [individualAddErrors, setIndividualAddErrors] = useState({});
  const [showIndividualConfirmModal, setShowIndividualConfirmModal] = useState(false);
  const [showIndividualResultModal, setShowIndividualResultModal] = useState(false);
  const [individualResultSuccess, setIndividualResultSuccess] = useState(false);
  const [individualResultMessage, setIndividualResultMessage] = useState('');

  // Add state for editing index
  const [editingPreviewIndex, setEditingPreviewIndex] = useState(null);
  const [editingPreviewUser, setEditingPreviewUser] = useState(null);

  // Add state for editing individual preview modal
  const [editPreviewModalOpen, setEditPreviewModalOpen] = useState(false);
  const [editPreviewErrors, setEditPreviewErrors] = useState({});

  // Add loading state for async DB duplicate check
  const [editPreviewCheckingDb, setEditPreviewCheckingDb] = useState(false);

  // Add a ref to track the latest checked values
  const lastCheckedRef = useRef({ employeeId: '', email: '' });

  // Store the original preview user for comparison
  const [originalPreviewUser, setOriginalPreviewUser] = useState(null);

  // --- Sorting and Filtering State ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [statusFilter, setStatusFilter] = useState('All');
  // For preview tables
  const [individualSortConfig, setIndividualSortConfig] = useState({ key: null, direction: null });
  const [individualSearchTerm, setIndividualSearchTerm] = useState('');
  const [individualRoleFilter, setIndividualRoleFilter] = useState('All');
  const [individualStatusFilter, setIndividualStatusFilter] = useState('All');
  const [bulkSortConfig, setBulkSortConfig] = useState({ key: null, direction: null });
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [bulkRoleFilter, setBulkRoleFilter] = useState('All');
  const [bulkStatusFilter, setBulkStatusFilter] = useState('All');

  // Debounced search terms
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [debouncedIndividualSearchTerm, setDebouncedIndividualSearchTerm] = useState(individualSearchTerm);
  const [debouncedBulkSearchTerm, setDebouncedBulkSearchTerm] = useState(bulkSearchTerm);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedIndividualSearchTerm(individualSearchTerm), 400);
    return () => clearTimeout(handler);
  }, [individualSearchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedBulkSearchTerm(bulkSearchTerm), 400);
    return () => clearTimeout(handler);
  }, [bulkSearchTerm]);

  // --- Sorting Handlers ---
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  const handleIndividualSort = (key) => {
    setIndividualSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  const handleBulkSort = (key) => {
    setBulkSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // --- Filtering and Sorting Logic ---
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.dUser_ID && user.dUser_ID.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (user.dName && user.dName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (user.dEmail && user.dEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    const matchesRole =
      roleFilter === 'All' || (user.dUser_Type && user.dUser_Type === roleFilter);
    const matchesStatus =
      statusFilter === 'All' || (user.dStatus && user.dStatus === statusFilter);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const sortedUsers = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredUsers;
    const sorted = [...filteredUsers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortConfig]);

  // --- Individual Preview Filtering/Sorting ---
  const filteredIndividualPreview = individualPreview.filter(user => {
    const matchesSearch =
      (user.employeeId && user.employeeId.toString().toLowerCase().includes(debouncedIndividualSearchTerm.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(debouncedIndividualSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(debouncedIndividualSearchTerm.toLowerCase()));
    const matchesRole =
      individualRoleFilter === 'All' || (user.role && user.role === individualRoleFilter);
    const matchesStatus =
      individualStatusFilter === 'All' || (user.status && user.status === individualStatusFilter);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const sortedIndividualPreview = React.useMemo(() => {
    if (!individualSortConfig.key || !individualSortConfig.direction) return filteredIndividualPreview;
    const sorted = [...filteredIndividualPreview].sort((a, b) => {
      let aValue = a[individualSortConfig.key];
      let bValue = b[individualSortConfig.key];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return individualSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return individualSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredIndividualPreview, individualSortConfig]);

  // --- Bulk Preview Filtering/Sorting ---
  const filteredBulkUsers = bulkUsers.filter(user => {
    const matchesSearch =
      (user.employeeId && user.employeeId.toString().toLowerCase().includes(debouncedBulkSearchTerm.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(debouncedBulkSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(debouncedBulkSearchTerm.toLowerCase()));
    const matchesRole =
      bulkRoleFilter === 'All' || (user.role && user.role === bulkRoleFilter);
    const matchesStatus =
      bulkStatusFilter === 'All' || (user.status && user.status === bulkStatusFilter);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const sortedBulkUsers = React.useMemo(() => {
    if (!bulkSortConfig.key || !bulkSortConfig.direction) return filteredBulkUsers;
    const sorted = [...filteredBulkUsers].sort((a, b) => {
      let aValue = a[bulkSortConfig.key];
      let bValue = b[bulkSortConfig.key];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return bulkSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return bulkSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredBulkUsers, bulkSortConfig]);

  // Fetch users function
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

  // Fetch users on page load only
  useEffect(() => {
    fetchUsers();
  }, []);


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

  // File processing with validation
  const handleFile = async (file) => {
    setFileError('');
    // 1. Filename validation
    if (!file.name.includes('user_upload_template')) {
      setFile(null);
      setBulkUsers([]);
      setInvalidUsers([]);
      setFileError('Invalid filename. Please use the provided template.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      let data = e.target.result;
      let workbook, sheetName, worksheet, jsonData;
      let isCSV = file.name.endsWith('.csv');
      const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
      try {
        if (isCSV) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }
        sheetName = workbook.SheetNames[0];
        worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      } catch (err) {
        setFile(null);
        setBulkUsers([]);
        setInvalidUsers([]);
        setFileError('File could not be parsed.');
        return;
      }

      // 2. Header validation
      const requiredHeader = ['EMPLOYEE ID', 'NAME', 'EMAIL', 'ROLE'];
      const header = jsonData[0] || [];
      const headerValid = requiredHeader.length === header.length && requiredHeader.every((h, i) => h === header[i]);
      if (!headerValid) {
        setFile(null);
        setBulkUsers([]);
        setInvalidUsers([]);
        setFileError('Invalid Format. Please use the provided template.');
        return;
      }

      // 3. Row/cell validation
      const parsedUsers = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const [employeeId, name, email, role, ...extra] = row;
        const reasons = [];
        const hasExtraContent = extra.some(cell => cell && cell.toString().trim() !== '');
        if (hasExtraContent) {
          reasons.push('Extra columns detected. Only EMPLOYEE ID, NAME, EMAIL, and ROLE should have values.');
        }
        if (!employeeId) reasons.push('Missing Employee ID');
        if (!name) reasons.push('Missing Name');
        if (!email) reasons.push('Missing Email');
        if (!role) reasons.push('Missing Role');
        // Employee ID validation
        if (employeeId && !/^[0-9]{1,10}$/.test(employeeId)) reasons.push('Employee ID must be numbers only and up to 10 digits');
        // Name validation
        if (name && name.length > 50) reasons.push('Name must be 50 characters or less');
        // Email validation
        if (email && email.length > 50) reasons.push('Email must be 50 characters or less');
        const roleStr = typeof role === 'string' ? role : String(role || '');
        if (roleStr && !allowedRoles.includes(roleStr.trim().toUpperCase())) {
          reasons.push('Invalid role');
        }
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (email && !emailRegex.test(email)) {
          reasons.unshift('Invalid email format');
        }
        if (reasons.length > 0) {
          parsedUsers.push({
            employeeId: employeeId || '',
            name: name || '',
            email: email || '',
            role: role || '',
            reasons,
            notEditable: reasons.some(r => r.includes('database'))
          });
        } else {
          parsedUsers.push({
            employeeId,
            name,
            email,
            role,
            valid: true,
          });
        }
      }

      // Count occurrences in the file
      const idCounts = {};
      const emailCounts = {};
      parsedUsers.forEach(user => {
        idCounts[user.employeeId] = (idCounts[user.employeeId] || 0) + 1;
        emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
      });

      // 1. Check for duplicates in the file
      const seenIds = new Set();
      const seenEmails = new Set();
      const fileDuplicateIds = new Set();
      const fileDuplicateEmails = new Set();
      for (const user of parsedUsers) {
        if (seenIds.has(user.employeeId)) fileDuplicateIds.add(user.employeeId);
        if (seenEmails.has(user.email)) fileDuplicateEmails.add(user.email);
        seenIds.add(user.employeeId);
        seenEmails.add(user.email);
      }

      // 2. Check for duplicates in the database
      let dbDuplicates = [];
      try {
        const adminEmployeeIds = parsedUsers.filter(u => u.role && u.role.toUpperCase() === 'ADMIN').map(u => u.employeeId);
        const adminEmails = parsedUsers.filter(u => u.role && u.role.toUpperCase() === 'ADMIN').map(u => u.email);
        const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeIds: parsedUsers.map(u => u.employeeId),
            emails: parsedUsers.map(u => u.email),
            adminEmployeeIds,
            adminEmails
          })
        });
        dbDuplicates = await response.json();
      } catch (e) {
        // handle error
      }

      // 3. Mark users as invalid if they are duplicates in file or DB
      const invalidUsers = [];
      const validUsers = [];
      for (const user of parsedUsers) {
        const reasons = [];
        // Re-apply char limit/format validation
        if (!user.employeeId || !/^[0-9]{1,10}$/.test(user.employeeId)) reasons.push('Employee ID must be numbers only and up to 10 digits');
        if (!user.name || user.name.length > 50) reasons.push('Name must be 50 characters or less');
        if (!user.email || user.email.length > 50) reasons.push('Email must be 50 characters or less');
        if (!user.role) reasons.push('Role is required');
        const roleStr = typeof user.role === 'string' ? user.role : String(user.role || '');
        if (roleStr && !allowedRoles.includes(roleStr.trim().toUpperCase())) {
          reasons.push('Role must be exactly one of: ' + allowedRoles.join(', '));
        }
        if (idCounts[user.employeeId] > 1) reasons.push('Duplicate Employee ID in file');
        if (emailCounts[user.email] > 1) reasons.push('Duplicate Email in file');
        if (dbDuplicates.some(u => u.dUser_ID === user.employeeId)) reasons.push('Duplicate Employee ID in database');
        if (dbDuplicates.some(u => u.dEmail === user.email)) reasons.push('Duplicate Email in database');
        if (reasons.length > 0) {
          invalidUsers.push({ ...user, reasons, notEditable: reasons.some(r => r.includes('database')) });
        } else {
          validUsers.push(user);
        }
      }
      setBulkUsers(validUsers);
      setInvalidUsers(invalidUsers);
      setFile(file);
      // After setting bulkUsers and invalidUsers in handleFile, switch to invalid tab if no valid users
      if (validUsers.length === 0 && invalidUsers.length > 0) {
        setPreviewTab('invalid');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setFile(null);
    setBulkUsers([]);
    setInvalidUsers([]);
  };

  // Generate CSV template for bulk upload
  const generateTemplate = () => {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace('T', '_')
      .replace(/\.\d+Z$/, '')
      .slice(0, 19);
    const csvContent = "EMPLOYEE ID,NAME,EMAIL,ROLE\nE001,John Doe,john@example.com,HR/REPORTS/CNB/ADMIN";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `user_upload_template_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remove newUser state for the add user form
  // Add refs for each input field
  const employeeIdRef = useRef();
  const emailRef = useRef();
  const nameRef = useRef();
  const roleRef = useRef();

  // Update handleAddToList to use refs
  const handleAddToList = async () => {
    setIndividualAddError('');
    setIndividualAddErrors({});
    const employeeId = employeeIdRef.current.value;
    const email = emailRef.current.value;
    const name = nameRef.current.value;
    const role = roleRef.current.value;
    const errors = {};
    // 1. Required fields
    if (!employeeId) errors.employeeId = 'Employee ID is required.';
    if (!email) errors.email = 'Email is required.';
    if (!name) errors.name = 'Name is required.';
    if (!role) errors.role = 'Role is required.';
    // Employee ID must be numbers only and up to 10 digits
    if (employeeId && !/^[0-9]{1,10}$/.test(employeeId)) errors.employeeId = 'Employee ID must be numbers only and up to 10 digits.';
    // Name must be 50 characters or less
    if (name && name.length > 50) errors.name = 'Name must be 50 characters or less.';
    // Email must be 50 characters or less
    if (email && email.length > 50) errors.email = 'Email must be 50 characters or less.';
    // 2. Email format
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (email && !emailRegex.test(email)) errors.email = 'Invalid email format.';
    // 3. Duplicates in preview
    if (employeeId && individualPreview.some(u => u.employeeId === employeeId)) errors.employeeId = 'Duplicate Employee ID in preview.';
    if (email && individualPreview.some(u => u.email === email)) errors.email = 'Duplicate Email in preview.';
    // If any errors so far, show all
    let hasErrors = Object.keys(errors).length > 0;
    // 4. Duplicates in database (tbl_login and tbl_admin for Admin)
    let dbDuplicates = [];
    if (!hasErrors) {
      try {
        if (role && role.toUpperCase() === 'ADMIN') {
          const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeIds: [employeeId], emails: [email], admin: true })
          });
          dbDuplicates = await response.json();
        } else {
          const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeIds: [employeeId], emails: [email] })
          });
          dbDuplicates = await response.json();
        }
        if (dbDuplicates.some(u => u.dUser_ID === employeeId)) errors.employeeId = 'Duplicate Employee ID in database';
        if (dbDuplicates.some(u => u.dEmail === email)) errors.email = 'Duplicate Email in database';
      } catch (e) {
        errors.general = 'Error checking duplicates in database.';
      }
    }
    if (Object.keys(errors).length > 0) {
      setIndividualAddErrors(errors);
      return;
    }
    // If all good, add to preview
    setIndividualPreview(prev => [...prev, { employeeId, email, name, role, status: 'FIRST-TIME' }]);
    // Clear the input fields
    employeeIdRef.current.value = '';
    emailRef.current.value = '';
    nameRef.current.value = '';
    roleRef.current.value = '';
    setIndividualAddErrors({});
  };

  // Add state for last add count
  const [lastAddCount, setLastAddCount] = useState(0);
  const [lastDeleteCount, setLastDeleteCount] = useState(0);

  // Submit individual users
  const handleAddIndividual = async () => {
    if (individualPreview.length > 0) {
      setLastAddCount(individualPreview.length);
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
        setAddModalOpen(false);
        setIndividualPreview([]);
        // Do NOT call setUsers here. Let fetchUsers update the table.
      } catch (error) {
        console.error('Error adding users:', error);
      }
    }
  };

  // Submit bulk users (with result modal)
  const handleBulkUpload = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: bulkUsers.map(user => ({
            ...user,
            password: 'defaultPassword123',
            createdBy: 'admin',
            status: 'FIRST-TIME',
          }))
        })
      });

      let result = null;
      let errorMsg = '';
      try {
        result = await response.json();
      } catch (e) {
        // ignore JSON parse error
      }

      if (!response.ok) {
        errorMsg = (result && result.error) ? result.error : (result && result.message) ? result.message : 'Failed to bulk add users';
        setShowBulkResultModal(true);
        setBulkResultSuccess(false);
        setBulkResultMessage('Bulk upload error: ' + errorMsg);
        return;
      }

      setAddModalOpen(false);
      setBulkUsers([]);
      setFile(null);
      setShowBulkResultModal(true);
      setBulkResultSuccess(true);
      setBulkResultMessage(bulkUsers.length === 1 ? 'User uploaded successfully!' : `Users (${bulkUsers.length}) uploaded successfully!`);
      // Do NOT call setUsers here. Let fetchUsers update the table.
    } catch (error) {
      setShowBulkResultModal(true);
      setBulkResultSuccess(false);
      setBulkResultMessage('Bulk upload error: ' + (error.message || 'Unknown error'));
    }
  };

  // Delete selected users
  const handleDeleteUsers = async () => {
    if (deleteConfirmText === 'DELETE' && selectedUsers.length > 0) {
      try {
        const response = await fetch('http://localhost:5000/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUsers })
        });

        let result = null;
        try {
          result = await response.json();
        } catch (e) {}

        if (!response.ok) {
          setShowDeleteResultModal(true);
          setDeleteResultSuccess(false);
          setDeleteResultMessage(result && result.message ? result.message : 'Failed to deactivate users');
          return;
        }

        setSelectedUsers([]);
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        setShowDeleteResultModal(true);
        setDeleteResultSuccess(true);
        setDeleteResultMessage('User(s) deactivated successfully!');
        // Do NOT call setUsers here. Let fetchUsers update the table.
      } catch (error) {
        setShowDeleteResultModal(true);
        setDeleteResultSuccess(false);
        setDeleteResultMessage('Delete error: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Edit user handler
  const handleEdit = (user) => {
    setCurrentUser(user);
    setOriginalUser(user);
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
      const changedFields = { dLogin_ID: updatedUser.dLogin_ID };
      const changes = [];
      if (originalUser.dUser_ID !== updatedUser.dUser_ID) {
        changedFields.employeeId = updatedUser.dUser_ID;
        changes.push(`Employee ID changed from '${originalUser.dUser_ID}' to '${updatedUser.dUser_ID}'`);
      }
      if (originalUser.dName !== updatedUser.dName) {
        changedFields.name = updatedUser.dName;
        changes.push(`Name changed from '${originalUser.dName}' to '${updatedUser.dName}'`);
      }
      if (originalUser.dEmail !== updatedUser.dEmail) {
        changedFields.email = updatedUser.dEmail;
        changes.push(`Email changed from '${originalUser.dEmail}' to '${updatedUser.dEmail}'`);
      }
      if (originalUser.dUser_Type !== updatedUser.dUser_Type) {
        changedFields.role = updatedUser.dUser_Type;
        changes.push(`Role changed from '${originalUser.dUser_Type}' to '${updatedUser.dUser_Type}'`);
      }
      if (originalUser.dStatus !== updatedUser.dStatus) {
        changedFields.status = updatedUser.dStatus;
        changes.push(`Status changed from '${originalUser.dStatus}' to '${updatedUser.dStatus}'`);
      }
      if (showPasswordFields && passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
        changedFields.password = passwordData.newPassword;
        changes.push('Password changed');
      }
      // Reset Account logic
      if (resetConfirmed) {
        changedFields.password = 'defaultPassword123'; // or your default password
        changedFields.securityQuestions = [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ];
        changes.push('Account reset: password set to default and security questions cleared');
      }
      // Check if security questions changed
      let securityQuestionsChanged = false;
      if (showSecurityQuestions) {
        for (let i = 0; i < 3; i++) {
          const origQ = originalUser[`dSecurity_Question${i+1}`] || '';
          const origA = originalUser[`dAnswer_${i+1}`] || '';
          const newQ = securityQuestionsData[i]?.question || '';
          const newA = securityQuestionsData[i]?.answer || '';
          if (origQ !== newQ || origA !== newA) {
            changes.push(`Security Question ${i+1} changed`);
            securityQuestionsChanged = true;
          }
        }
        if (securityQuestionsChanged) {
          await fetch(`http://localhost:5000/api/users/${updatedUser.dLogin_ID}/security-questions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: securityQuestionsData })
          });
        }
      }
      // If no user fields changed, but security questions did
      if (Object.keys(changedFields).length === 1 && securityQuestionsChanged) {
        setEditModalOpen(false);
        setEditResultSuccess(true);
        setEditResultMessage(`Changes Made<br><span style='display:block;margin-bottom:6px;'></span>${formatEditResultMessage(changes)}`);
        setShowEditResultModal(true);
        return;
      }
      // If nothing changed
      if (Object.keys(changedFields).length === 1 && !securityQuestionsChanged) {
        setEditResultSuccess(false);
        setEditResultMessage('No changes were made.');
        setShowEditResultModal(true);
        return;
      }
      // Otherwise, update user fields
      const response = await fetch(`http://localhost:5000/api/users/${updatedUser.dLogin_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      });
      let result = null;
      try {
        result = await response.json();
      } catch (e) {}
      if (!response.ok) {
        setEditResultSuccess(false);
        setEditResultMessage(result && result.message ? result.message : 'Failed to update user');
        setShowEditResultModal(true);
        return;
      }
      setEditModalOpen(false);
      setEditResultSuccess(true);
      setEditResultMessage(`Changes Made<br><span style='display:block;margin-bottom:6px;'></span>${formatEditResultMessage(changes)}`);
      setShowEditResultModal(true);
      // Do NOT call setUsers here. Let fetchUsers update the table.
    } catch (error) {
      setEditResultSuccess(false);
      setEditResultMessage(error.message || 'Failed to update user');
      setShowEditResultModal(true);
    }
  };

  // Helper to format changes for the result modal
  function formatEditResultMessage(changes) {
    if (!changes || changes.length === 0) return '';
    const userDetailChanges = changes.filter(c => !c.startsWith('Security Question'));
    const securityQChanges = changes.filter(c => c.startsWith('Security Question') || c.startsWith('Answer'));
    let msg = '';
    if (userDetailChanges.length > 0) {
      msg += `<b style='display:block;margin-bottom:4px;'>User details:</b><ul style='margin:0 0 8px 18px'>`;
      userDetailChanges.forEach(c => { msg += `<li>${c}</li>`; });
      msg += '</ul>';
    }
    if (securityQChanges.length > 0) {
      msg += `<b style='display:block;margin-bottom:4px;'>Security Questions:</b><ul style='margin:0 0 8px 18px'>`;
      securityQChanges.forEach(c => { msg += `<li>${c}</li>`; });
      msg += '</ul>';
    }
    return msg;
  }

  // Update the edit preview modal logic for real-time validation
  useEffect(() => {
    if (editPreviewModalOpen && editingPreviewUser) {
      const errors = {};
      if (!editingPreviewUser.employeeId) errors.employeeId = 'Employee ID is required';
      if (!editingPreviewUser.name) errors.name = 'Name is required';
      if (!editingPreviewUser.email) errors.email = 'Email is required';
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (editingPreviewUser.email && !emailRegex.test(editingPreviewUser.email)) errors.email = 'Invalid email format';
      if (!editingPreviewUser.role) errors.role = 'Role is required';
      // Check for duplicates in preview (excluding self)
      if (individualPreview.some((u, i) => i !== editingPreviewIndex && u.employeeId === editingPreviewUser.employeeId)) errors.employeeId = 'Duplicate Employee ID in preview.';
      if (individualPreview.some((u, i) => i !== editingPreviewIndex && u.email === editingPreviewUser.email)) errors.email = 'Duplicate Email in preview.';
      setEditPreviewErrors(errors);
    }
  }, [editingPreviewUser, editPreviewModalOpen, individualPreview, editingPreviewIndex]);

  // Add async DB duplicate check for Employee ID and Email in edit preview modal
  useEffect(() => {
    let isMounted = true;
    async function checkDbDuplicates() {
      if (!editPreviewModalOpen || !editingPreviewUser || !originalPreviewUser) return;
      setEditPreviewCheckingDb(true);
      const checkedEmployeeId = editingPreviewUser.employeeId;
      const checkedEmail = editingPreviewUser.email;
      let errors = { ...editPreviewErrors };
      // Only check for duplicates if value is changed from original
      const employeeIdChanged = checkedEmployeeId !== originalPreviewUser.employeeId;
      const emailChanged = checkedEmail !== originalPreviewUser.email;
      // Preview duplicate check (only if changed)
      if (employeeIdChanged && individualPreview.some((u, i) => i !== editingPreviewIndex && u.employeeId === checkedEmployeeId)) {
        errors.employeeId = 'Duplicate Employee ID in preview.';
      }
      if (emailChanged && individualPreview.some((u, i) => i !== editingPreviewIndex && u.email === checkedEmail)) {
        errors.email = 'Duplicate Email in preview.';
      }
      // DB duplicate check (only if changed)
      if ((employeeIdChanged && checkedEmployeeId) || (emailChanged && checkedEmail)) {
        try {
          const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeIds: employeeIdChanged ? [checkedEmployeeId] : [], emails: emailChanged ? [checkedEmail] : [] })
          });
          const dbDuplicates = await response.json();
          if (employeeIdChanged && dbDuplicates.some(u => u.dUser_ID === checkedEmployeeId)) {
            errors.employeeId = 'Duplicate Employee ID in database.';
          }
          if (emailChanged && dbDuplicates.some(u => u.dEmail === checkedEmail)) {
            errors.email = 'Duplicate Email in database.';
          }
        } catch (e) {
          // Optionally show DB error
        }
      }
      // Only update errors if the checked values still match the current input
      if (
        isMounted &&
        editingPreviewUser &&
        editingPreviewUser.employeeId === checkedEmployeeId &&
        editingPreviewUser.email === checkedEmail
      ) {
        setEditPreviewErrors(errors);
        setEditPreviewCheckingDb(false);
      }
    }
    checkDbDuplicates();
    return () => { isMounted = false; };
  // eslint-disable-next-line
  }, [editPreviewModalOpen, editingPreviewUser, originalPreviewUser, individualPreview, editingPreviewIndex]);

  // Determine modal size based on preview data
  const shouldExpandModal = (bulkUsers.length > 10 || invalidUsers.length > 10);

  // Add state for delete result modal
  const [showDeleteResultModal, setShowDeleteResultModal] = useState(false);
  const [deleteResultSuccess, setDeleteResultSuccess] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState('');

  // Add state for reset account in Edit User modal
  const [showResetDropdown, setShowResetDropdown] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetConfirmed, setResetConfirmed] = useState(false);

  // Add validation state for edit modal
  const [editUserErrors, setEditUserErrors] = useState({});

  // Validation function for edit modal
  function validateEditUser(user) {
    const errors = {};
    if (!user.dUser_ID) errors.dUser_ID = 'Employee ID is required.';
    else if (!/^[0-9]{1,10}$/.test(user.dUser_ID)) errors.dUser_ID = 'Employee ID must be numbers only and up to 10 digits.';
    if (!user.dName) errors.dName = 'Name is required.';
    else if (user.dName.length > 50) errors.dName = 'Name must be 50 characters or less.';
    if (!user.dEmail) errors.dEmail = 'Email is required.';
    else {
      if (user.dEmail.length > 50) errors.dEmail = 'Email must be 50 characters or less.';
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(user.dEmail)) errors.dEmail = 'Invalid email format.';
    }
    if (!user.dUser_Type) errors.dUser_Type = 'Role is required.';
    if (!user.dStatus) errors.dStatus = 'Status is required.';
    return errors;
  }

  // Watch for changes in currentUser in edit modal
  useEffect(() => {
    if (editModalOpen && currentUser) {
      const handler = setTimeout(() => {
        const newErrors = validateEditUser(currentUser);
        setEditUserErrors(prevErrors => {
          // Only update if errors actually changed
          const prevKeys = Object.keys(prevErrors);
          const newKeys = Object.keys(newErrors);
          if (
            prevKeys.length !== newKeys.length ||
            prevKeys.some(key => prevErrors[key] !== newErrors[key])
          ) {
            return newErrors;
          }
          return prevErrors;
        });
      }, 150); // 150ms debounce

      return () => clearTimeout(handler);
    }
  }, [editModalOpen, currentUser]);

  // Add a function to check if there are changes between currentUser and originalUser
  function isUserChanged(current, original) {
    if (!current || !original) return false;
    return (
      current.dUser_ID !== original.dUser_ID ||
      current.dName !== original.dName ||
      current.dEmail !== original.dEmail ||
      current.dUser_Type !== original.dUser_Type ||
      current.dStatus !== original.dStatus
    );
  }

  // Add a function to check if any edit action (fields, password, or reset) is changed
  function isEditActionChanged() {
    // User fields changed
    if (isUserChanged(currentUser, originalUser)) return true;
    // Password change
    if (
      showPasswordFields &&
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordData.newPassword === passwordData.confirmPassword
    ) return true;
    // Reset confirmed
    if (resetConfirmed) return true;
    return false;
  }

  // Improved WebSocket for real-time updates with auto-reconnect
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    function connect() {
      ws = new window.WebSocket('ws://localhost:5000');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'USER_UPDATE') {
            console.log('USER_UPDATE received');
            fetchUsers();
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        // Try to reconnect after 2 seconds
        reconnectTimeout = setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Debounced backend duplicate check for editing invalid user
  const duplicateCheckTimeout = useRef();

  // Add loading state for async DB duplicate check
  const [editValidCheckingDb, setEditValidCheckingDb] = useState(false);
  const [editInvalidCheckingDb, setEditInvalidCheckingDb] = useState(false);
  // Add navigation state
  const [activeTable, setActiveTable] = useState('users');

  // Add filtered users based on active tab
  const getFilteredUsers = () => {
    let filtered = [...users];
    
    // Apply tab-specific filtering
    if (activeTable === 'admin') {
      filtered = filtered.filter(user => user.dUser_Type === 'ADMIN');
      // Apply status filter for admin tab
      if (statusFilter !== 'All') {
        filtered = filtered.filter(user => user.dStatus === statusFilter);
      }
    } else if (activeTable === 'tickets') {
      filtered = filtered.filter(user => 
        user.dStatus === 'NEED-RESET' || user.dStatus === 'RESET-DONE'
      );
      if (roleFilter !== 'All') {
        filtered = filtered.filter(user => user.dUser_Type === roleFilter);
      }
    } else if (activeTable === 'deactivated') {
      filtered = filtered.filter(user => user.dStatus === 'DEACTIVATED');
      // Apply role filter for deactivated tab
      if (roleFilter !== 'All') {
        filtered = filtered.filter(user => user.dUser_Type === roleFilter);
      }
    } else if (activeTable === 'users') {
      // Only show ACTIVE and FIRST-TIME users in users tab, and exclude ADMIN users
      filtered = filtered.filter(user => (user.dStatus === 'ACTIVE' || user.dStatus === 'FIRST-TIME') && user.dUser_Type !== 'ADMIN');
    }

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(user => 
        (user.dUser_ID && user.dUser_ID.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (user.dName && user.dName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (user.dEmail && user.dEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // Apply role filter for users tab
    if (activeTable === 'users' && roleFilter !== 'All') {
      filtered = filtered.filter(user => user.dUser_Type === roleFilter);
    }

    // Apply status filter for users tab (but only for ACTIVE and FIRST-TIME)
    if (activeTable === 'users' && statusFilter !== 'All') {
      filtered = filtered.filter(user => user.dStatus === statusFilter);
    }

    return filtered;
  };

  // Add effect to handle tab changes
  useEffect(() => {
    // Reset filters when tab changes
    if (activeTable === 'admin') {
      setRoleFilter('ADMIN');
      setStatusFilter('All');
    } else if (activeTable === 'tickets') {
      setRoleFilter('All');
      setStatusFilter('All');
    } else if (activeTable === 'deactivated') {
      setRoleFilter('All');
      setStatusFilter('DEACTIVATED');
    } else if (activeTable === 'users') {
      setRoleFilter('All');
      setStatusFilter('All');
    }
    setSelectedUsers([]); // Deselect all users when switching tabs
  }, [activeTable]);

  // Improved emoji regex (covers most emoji ranges)
  const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g;
  const allowedCharsRegex = /^[A-Za-z0-9@._-]+$/;
  const allowedNameRegex = /^[A-Za-z0-9._-]+$/;

  // Add new state for restore modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showRestoreResultModal, setShowRestoreResultModal] = useState(false);
  const [restoreResultSuccess, setRestoreResultSuccess] = useState(false);
  const [restoreResultMessage, setRestoreResultMessage] = useState('');
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  // Add restore handler
  const handleRestoreUsers = async () => {
    if (restoreConfirmText === 'RESTORE' && selectedUsers.length > 0) {
      try {
        const response = await fetch('http://localhost:5000/api/users/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUsers })
        });

        let result = null;
        try {
          result = await response.json();
        } catch (e) {}

        if (!response.ok) {
          setShowRestoreResultModal(true);
          setRestoreResultSuccess(false);
          setRestoreResultMessage(result && result.message ? result.message : 'Failed to restore users');
          return;
        }

        setSelectedUsers([]);
        setShowRestoreModal(false);
        setRestoreConfirmText('');
        setShowRestoreResultModal(true);
        setRestoreResultSuccess(true);
        setRestoreResultMessage(selectedUsers.length === 1 ? 'User restored successfully!' : `Users (${selectedUsers.length}) restored successfully!`);
        // Do NOT call setUsers here. Let fetchUsers update the table.
      } catch (error) {
        setShowRestoreResultModal(true);
        setRestoreResultSuccess(false);
        setRestoreResultMessage('Restore error: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <div className="user-management-container">
      <div className="user-management-card">
        <div className="user-management-header">
          <h1>User Management</h1>
          <div className="subtitle">Manage system users and their access</div>
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

          {activeTable === 'users' && (
            <>
              <div className="filter-container">
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="FIRST-TIME">FIRST-TIME</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </div>

              <div className="filter-container">
                <label>Filter by Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="HR">HR</option>
                  <option value="REPORTS">REPORTS</option>
                  <option value="CNB">CNB</option>
                </select>
              </div>
            </>
          )}

          {activeTable === 'admin' && (
            <>
              <div className="filter-container">
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="FIRST-TIME">FIRST-TIME</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </div>
            </>
          )}

          {activeTable === 'deactivated' && (
            <>
              <div className="filter-container">
                <label>Filter by Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR">HR</option>
                  <option value="REPORTS">REPORTS</option>
                  <option value="CNB">CNB</option>
                </select>
              </div>
            </>
          )}

          {activeTable === 'tickets' && (
            <>
              <div className="filter-container">
                <label>Filter by Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR">HR</option>
                  <option value="REPORTS">REPORTS</option>
                  <option value="CNB">CNB</option>
                </select>
              </div>
              <div className="filter-container">
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="NEED-RESET">NEED-RESET</option>
                  <option value="RESET-DONE">RESET-DONE</option>
                </select>
              </div>
            </>
          )}

          <button className="add-user-btn" onClick={() => setAddModalOpen(true)}>
            <FaPlus /> Add User
          </button>
        </div>

        <div className="table-container">
          <div className="table-navigation">
            <div 
              className={`nav-item ${activeTable === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTable('users')}
            >
              <FaUsers className="nav-icon" />
              <span>Users ({users.filter(user => (user.dStatus === 'ACTIVE' || user.dStatus === 'FIRST-TIME') && user.dUser_Type !== 'ADMIN').length})</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'admin' ? 'active' : ''}`} 
              onClick={() => setActiveTable('admin')}
            >
              <FaUserShield className="nav-icon" />
              <span>Admin ({users.filter(user => user.dUser_Type === 'ADMIN').length})</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'tickets' ? 'active' : ''}`} 
              onClick={() => setActiveTable('tickets')}
            >
              <FaTicketAlt className="nav-icon" />
              <span>Tickets ({users.filter(user => user.dStatus === 'NEED-RESET' || user.dStatus === 'RESET-DONE').length})</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'deactivated' ? 'active' : ''}`} 
              onClick={() => setActiveTable('deactivated')}
            >
              <FaUserSlash className="nav-icon" />
              <span>Deactivated ({users.filter(user => user.dStatus === 'DEACTIVATED').length})</span>
            </div>
          </div>
          <div className="table-wrapper">
            {activeTable === 'users' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="actions-col">
                        <div className="actions-header">
                          Actions
                          <div className="select-all-container">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => String(user.dUser_ID)));
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
                    {getFilteredUsers().map((user, index) => (
                      <tr
                        key={user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onClick={(e) => {
                          if (
                            e.target.tagName !== 'BUTTON' &&
                            e.target.tagName !== 'svg' &&
                            e.target.tagName !== 'path' &&
                            e.target.type !== 'checkbox'
                          ) {
                            if (e.shiftKey && anchorSelectedIndex !== null) {
                                const clickedIsSelected = selectedUsers.includes(user.dUser_ID);
                              if (clickedIsSelected) {
                                const start = Math.min(lastSelectedIndex, index);
                                const end = Math.max(lastSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => String(u.dUser_ID));
                                setSelectedUsers(prev => prev.filter(id => !rangeUserIds.includes(id)));
                                setLastSelectedIndex(index);
                              } else {
                                const start = Math.min(anchorSelectedIndex, index);
                                const end = Math.max(anchorSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => String(u.dUser_ID));
                                setSelectedUsers(prev => {
                                  const newSet = new Set(prev);
                                  rangeUserIds.forEach(id => newSet.add(id));
                                  return Array.from(newSet);
                                });
                                setLastSelectedIndex(index);
                              }
                            } else {
                              setSelectedUsers(prev =>
                                  selectedUsers.includes(user.dUser_ID)
                                  ? prev.filter(id => id !== user.dUser_ID)
                                  : [...prev, user.dUser_ID]
                              );
                                if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 0) {
                                setAnchorSelectedIndex(index);
                                setLastSelectedIndex(index);
                              }
                                if (selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 1) {
                                setAnchorSelectedIndex(null);
                                setLastSelectedIndex(null);
                              }
                                if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length > 0) {
                                setLastSelectedIndex(index);
                              }
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
                                setSelectedUsers([String(user.dUser_ID)]);
                                setShowDeleteModal(true);
                              }}
                              className="delete-btn"
                            >
                              <FaTrash size={12} /> Delete
                            </button>
                            <input
                              type="checkbox"
                                checked={selectedUsers.includes(user.dUser_ID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedUsers(prev =>
                                  e.target.checked
                                    ? [...prev, String(user.dUser_ID)]
                                    : prev.filter(id => id !== String(user.dUser_ID))
                                );
                                if (!e.target.checked && selectedUsers.length === 1) {
                                  setAnchorSelectedIndex(null);
                                } else if (e.target.checked && selectedUsers.length === 0) {
                                  setAnchorSelectedIndex(index);
                                }
                                setLastSelectedIndex(index);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            {activeTable === 'admin' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="actions-col">
                        <div className="actions-header">
                          Actions
                          <div className="select-all-container">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
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
                    {getFilteredUsers().map((user, index) => (
                      <tr
                        key={user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onClick={(e) => {
                          if (
                            e.target.tagName !== 'BUTTON' &&
                            e.target.tagName !== 'svg' &&
                            e.target.tagName !== 'path' &&
                            e.target.type !== 'checkbox'
                          ) {
                            if (e.shiftKey && anchorSelectedIndex !== null) {
                              const clickedIsSelected = selectedUsers.includes(user.dUser_ID);
                              if (clickedIsSelected) {
                                const start = Math.min(lastSelectedIndex, index);
                                const end = Math.max(lastSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => prev.filter(id => !rangeUserIds.includes(id)));
                                setLastSelectedIndex(index);
                              } else {
                                const start = Math.min(anchorSelectedIndex, index);
                                const end = Math.max(anchorSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => {
                                  const newSet = new Set(prev);
                                  rangeUserIds.forEach(id => newSet.add(id));
                                  return Array.from(newSet);
                                });
                                setLastSelectedIndex(index);
                              }
                            } else {
                              setSelectedUsers(prev =>
                                selectedUsers.includes(user.dUser_ID)
                                  ? prev.filter(id => id !== user.dUser_ID)
                                  : [...prev, user.dUser_ID]
                              );
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 0) {
                                setAnchorSelectedIndex(index);
                                setLastSelectedIndex(index);
                              }
                              if (selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 1) {
                                setAnchorSelectedIndex(null);
                                setLastSelectedIndex(null);
                              }
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length > 0) {
                                setLastSelectedIndex(index);
                              }
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
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedUsers(prev =>
                                  e.target.checked
                                    ? [...prev, user.dUser_ID]
                                    : prev.filter(id => id !== user.dUser_ID)
                                );
                                if (!e.target.checked && selectedUsers.length === 1) {
                                  setAnchorSelectedIndex(null);
                                } else if (e.target.checked && selectedUsers.length === 0) {
                                  setAnchorSelectedIndex(index);
                                }
                                setLastSelectedIndex(index);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            {activeTable === 'tickets' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="actions-col">
                        <div className="actions-header">
                          Actions
                          <div className="select-all-container">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
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
                    {getFilteredUsers().map((user, index) => (
                      <tr
                        key={user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onClick={(e) => {
                          if (
                            e.target.tagName !== 'BUTTON' &&
                            e.target.tagName !== 'svg' &&
                            e.target.tagName !== 'path' &&
                            e.target.type !== 'checkbox'
                          ) {
                            if (e.shiftKey && anchorSelectedIndex !== null) {
                              const clickedIsSelected = selectedUsers.includes(user.dUser_ID);
                              if (clickedIsSelected) {
                                const start = Math.min(lastSelectedIndex, index);
                                const end = Math.max(lastSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => prev.filter(id => !rangeUserIds.includes(id)));
                                setLastSelectedIndex(index);
                              } else {
                                const start = Math.min(anchorSelectedIndex, index);
                                const end = Math.max(anchorSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => {
                                  const newSet = new Set(prev);
                                  rangeUserIds.forEach(id => newSet.add(id));
                                  return Array.from(newSet);
                                });
                                setLastSelectedIndex(index);
                              }
                            } else {
                              setSelectedUsers(prev =>
                                selectedUsers.includes(user.dUser_ID)
                                  ? prev.filter(id => id !== user.dUser_ID)
                                  : [...prev, user.dUser_ID]
                              );
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 0) {
                                setAnchorSelectedIndex(index);
                                setLastSelectedIndex(index);
                              }
                              if (selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 1) {
                                setAnchorSelectedIndex(null);
                                setLastSelectedIndex(null);
                              }
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length > 0) {
                                setLastSelectedIndex(index);
                              }
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
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedUsers(prev =>
                                  e.target.checked
                                    ? [...prev, user.dUser_ID]
                                    : prev.filter(id => id !== user.dUser_ID)
                                );
                                if (!e.target.checked && selectedUsers.length === 1) {
                                  setAnchorSelectedIndex(null);
                                } else if (e.target.checked && selectedUsers.length === 0) {
                                  setAnchorSelectedIndex(index);
                                }
                                setLastSelectedIndex(index);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            {activeTable === 'deactivated' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className="actions-col">
                        <div className="actions-header">
                          Actions
                          <div className="select-all-container">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
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
                    {getFilteredUsers().map((user, index) => (
                      <tr
                        key={user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onClick={(e) => {
                          if (
                            e.target.tagName !== 'BUTTON' &&
                            e.target.tagName !== 'svg' &&
                            e.target.tagName !== 'path' &&
                            e.target.type !== 'checkbox'
                          ) {
                            if (e.shiftKey && anchorSelectedIndex !== null) {
                              const clickedIsSelected = selectedUsers.includes(user.dUser_ID);
                              if (clickedIsSelected) {
                                const start = Math.min(lastSelectedIndex, index);
                                const end = Math.max(lastSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => prev.filter(id => !rangeUserIds.includes(id)));
                                setLastSelectedIndex(index);
                              } else {
                                const start = Math.min(anchorSelectedIndex, index);
                                const end = Math.max(anchorSelectedIndex, index);
                                const rangeUserIds = sortedUsers.slice(start, end + 1).map(u => u.dUser_ID);
                                setSelectedUsers(prev => {
                                  const newSet = new Set(prev);
                                  rangeUserIds.forEach(id => newSet.add(id));
                                  return Array.from(newSet);
                                });
                                setLastSelectedIndex(index);
                              }
                            } else {
                              setSelectedUsers(prev =>
                                selectedUsers.includes(user.dUser_ID)
                                  ? prev.filter(id => id !== user.dUser_ID)
                                  : [...prev, user.dUser_ID]
                              );
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 0) {
                                setAnchorSelectedIndex(index);
                                setLastSelectedIndex(index);
                              }
                              if (selectedUsers.includes(user.dUser_ID) && selectedUsers.length === 1) {
                                setAnchorSelectedIndex(null);
                                setLastSelectedIndex(null);
                              }
                              if (!selectedUsers.includes(user.dUser_ID) && selectedUsers.length > 0) {
                                setLastSelectedIndex(index);
                              }
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowRestoreModal(true);
                              }}
                              className="restore-btn"
                              style={{ backgroundColor: '#0a7', color: 'white' }}
                            >
                              <FaKey size={12} /> Restore
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedUsers(prev =>
                                  e.target.checked
                                    ? [...prev, user.dUser_ID]
                                    : prev.filter(id => id !== user.dUser_ID)
                                );
                                if (!e.target.checked && selectedUsers.length === 1) {
                                  setAnchorSelectedIndex(null);
                                } else if (e.target.checked && selectedUsers.length === 0) {
                                  setAnchorSelectedIndex(index);
                                }
                                setLastSelectedIndex(index);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
        {selectedUsers.length > 0 && activeTable !== 'deactivated' && (
          <div className="delete-all-container">
            <button
              className="delete-all-btn"
              onClick={() => {
                setShowDeleteModal(true);
              }}
            >
              <FaTrash /> Delete Selected ({selectedUsers.length})
            </button>
          </div>
        )}

        {selectedUsers.length > 0 && activeTable === 'deactivated' && (
          <div className="delete-all-container">
            <button
              className="restore-all-btn"
              onClick={() => {
                setShowRestoreModal(true);
              }}
              style={{ backgroundColor: '#0a7', color: 'white', minWidth: 180 }}
            >
              <FaKey /> Restore Selected ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal add-user-modal" style={{ width: '900px' }}>
            <div className="modal-header">
              <h2>Add User</h2>
              <button onClick={() => {
                setAddModalOpen(false);
                setShowResetDropdown(false);
                setResetConfirmText('');
                setResetConfirmed(false);
                setIndividualAddError('');
                setIndividualPreview([]);
                setBulkUsers([]);
                setInvalidUsers([]);
                setPreviewTab('valid');
                setFile(null);
                setFileError('');
                if (employeeIdRef.current) employeeIdRef.current.value = '';
                if (emailRef.current) emailRef.current.value = '';
                if (nameRef.current) nameRef.current.value = '';
                if (roleRef.current) roleRef.current.value = '';
              }} className="close-btn">
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
                      ref={employeeIdRef}
                      required
                      maxLength={10}
                      pattern="\\d{1,10}"
                      onInput={e => {
                        // Only allow numbers, no whitespace, no emojis
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      }}
                      onChange={() => setIndividualAddErrors(errors => ({ ...errors, employeeId: undefined }))}
                    />
                    {individualAddErrors.employeeId && (
                      <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{individualAddErrors.employeeId}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      ref={emailRef}
                      required
                      maxLength={50}
                      onInput={e => {
                        // Only allow A-Za-z0-9@._-, no whitespace, no emojis
                        e.target.value = e.target.value.replace(/[^A-Za-z0-9@._-]/g, '');
                      }}
                      onChange={() => setIndividualAddErrors(errors => ({ ...errors, email: undefined }))}
                    />
                    {individualAddErrors.email && (
                      <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{individualAddErrors.email}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employee Name</label>
                    <input
                      type="text"
                      name="name"
                    ref={nameRef}
                      required
                      maxLength={50}
                      onInput={e => {
                        // Only allow A-Za-z0-9-_. no whitespace, no emojis
                        e.target.value = e.target.value.replace(/[^A-Za-z0-9._-]/g, '');
                      }}
                      onChange={() => setIndividualAddErrors(errors => ({ ...errors, name: undefined }))}
                    />
                    {individualAddErrors.name && (
                      <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{individualAddErrors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Department/Role</label>
                    <select
                      name="role"
                      ref={roleRef}
                      defaultValue=""
                      onChange={() => setIndividualAddErrors(errors => ({ ...errors, role: undefined }))}
                    >
                      <option value="">Select a role</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="HR">HR</option>
                      <option value="REPORTS">REPORTS</option>
                      <option value="CNB">CNB</option>
                    </select>
                    {individualAddErrors.role && (
                      <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{individualAddErrors.role}</div>
                    )}
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    className="add-to-list-btn"
                    onClick={handleAddToList}
                    disabled={false}
                  >
                    + Add to List
                  </button>
                </div>
                {individualAddErrors.general && (
                  <div style={{ color: 'red', marginTop: 8 }}>{individualAddErrors.general}</div>
                )}

                <hr className="add-user-hr" />

                {individualPreview.length > 0 && (
                  <>
                    {/* Controls above the table, only shown if there are users */}
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-start' }}>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={debouncedIndividualSearchTerm}
                        onChange={e => setDebouncedIndividualSearchTerm(e.target.value)}
                        style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4, minWidth: 120 }}
                      />
                      <select value={individualRoleFilter} onChange={e => setIndividualRoleFilter(e.target.value)} style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}>
                        <option value="All">All Roles</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="HR">HR</option>
                        <option value="REPORTS">REPORTS</option>
                        <option value="CNB">CNB</option>
                      </select>
                    </div>
                    <div className="individual-preview" style={{ maxHeight: shouldExpandModal ? 'calc(100vh - 420px)' : '340px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
                      <table>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8', zIndex: 1 }}>
                          <tr>
                            <th onClick={() => handleIndividualSort('employeeId')} style={{ cursor: 'pointer' }}>
                              Employee ID {individualSortConfig.key === 'employeeId' ? (individualSortConfig.direction === 'asc' ? '▲' : individualSortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
                            <th onClick={() => handleIndividualSort('name')} style={{ cursor: 'pointer' }}>
                              Name {individualSortConfig.key === 'name' ? (individualSortConfig.direction === 'asc' ? '▲' : individualSortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
                            <th onClick={() => handleIndividualSort('email')} style={{ cursor: 'pointer' }}>
                              Email {individualSortConfig.key === 'email' ? (individualSortConfig.direction === 'asc' ? '▲' : individualSortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
                            <th onClick={() => handleIndividualSort('role')} style={{ cursor: 'pointer' }}>
                              Role {individualSortConfig.key === 'role' ? (individualSortConfig.direction === 'asc' ? '▲' : individualSortConfig.direction === 'desc' ? '▼' : '') : ''}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedIndividualPreview.map((user, index) => (
                            <tr key={`individual-preview-${index}`}>
                              <td>{user.employeeId}</td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role}</td>
                              <td>
                                <button className="remove-btn" onClick={() => handleRemoveFromPreview(user.employeeId)}><FaTimes /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  <div className="add-user-actions" style={{ marginTop: 10 }}>
                    <button onClick={() => setShowIndividualConfirmModal(true)} className="save-btn" disabled={individualPreview.length === 0}>
                      {individualPreview.length <= 1 ? 'Add User' : `Add Users (${individualPreview.length})`}
                    </button>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bulk-upload-form">
                <div className="bulk-upload-actions">
                  <h3><FaUpload /> Upload Users</h3>
                  <button onClick={generateTemplate} className="generate-template-btn">
                    <FaFileDownload /> Generate Template
                  </button>
                </div>

                {!file && (
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
                )}

                {file && (
                  <div className="file-preview" style={{ marginTop: 0 }}>
                    <span>📄 {file.name}</span>
                    <button onClick={removeFile} className="remove-file-btn">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}

                {fileError && (
                  <div style={{ color: 'red', marginTop: '8px', fontWeight: 500 }}>
                    {fileError}
                  </div>
                )}

                {(bulkUsers.length > 0 || invalidUsers.length > 0) && (
                  <>
                    {/* Controls above the table, only shown if there are users */}
                    <div style={{ marginBottom: -25, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-start' }}>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={debouncedBulkSearchTerm}
                        onChange={e => setDebouncedBulkSearchTerm(e.target.value)}
                        style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4, minWidth: 120 }}
                      />
                      <select value={bulkRoleFilter} onChange={e => setBulkRoleFilter(e.target.value)} style={{ padding: 4, border: '1px solid #ccc', borderRadius: 4 }}>
                        <option value="All">All Roles</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="HR">HR</option>
                        <option value="REPORTS">REPORTS</option>
                        <option value="CNB">CNB</option>
                      </select>
                    </div>
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
                          <>
                            {/* Controls above the table, only shown if there are users */}
                            <div className="valid-users-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th onClick={() => handleBulkSort('employeeId')} style={{ cursor: 'pointer' }}>
                                      Employee ID {bulkSortConfig.key === 'employeeId' ? (bulkSortConfig.direction === 'asc' ? '▲' : bulkSortConfig.direction === 'desc' ? '▼' : '') : ''}
                                    </th>
                                    <th onClick={() => handleBulkSort('name')} style={{ cursor: 'pointer' }}>
                                      Name {bulkSortConfig.key === 'name' ? (bulkSortConfig.direction === 'asc' ? '▲' : bulkSortConfig.direction === 'desc' ? '▼' : '') : ''}
                                    </th>
                                    <th onClick={() => handleBulkSort('email')} style={{ cursor: 'pointer' }}>
                                      Email {bulkSortConfig.key === 'email' ? (bulkSortConfig.direction === 'asc' ? '▲' : bulkSortConfig.direction === 'desc' ? '▼' : '') : ''}
                                    </th>
                                    <th onClick={() => handleBulkSort('role')} style={{ cursor: 'pointer' }}>
                                      Role {bulkSortConfig.key === 'role' ? (bulkSortConfig.direction === 'asc' ? '▲' : bulkSortConfig.direction === 'desc' ? '▼' : '') : ''}
                                    </th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedBulkUsers.map((user, index) => (
                                    <tr key={`valid-${index}`}>
                                      <td>{user.employeeId}</td>
                                      <td>{user.name}</td>
                                      <td>{user.email}</td>
                                      <td>{user.role}</td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            className="remove-btn"
                                            onClick={() => setBulkUsers(bulkUsers.filter((_, i) => i !== index))}
                                          >
                                            <FaTimes />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {previewTab === 'invalid' && invalidUsers.length > 0 && (
                          <div className="invalid-users-table">
                            <table>
                              <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8', zIndex: 1 }}>
                                <tr>
                                  <th>Reason</th>
                                  <th>Employee ID</th>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Role</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invalidUsers.map((user, index) => (
                                  <tr key={`invalid-${index}`}>
                                    <td className="reason-cell" title={user.reasons && user.reasons.join(', ')}>
                                      {user.reasons && user.reasons.join(', ')}
                                    </td>
                                    <td title={user.employeeId}>{user.employeeId}</td>
                                    <td title={user.name}>{user.name}</td>
                                    <td title={user.email}>{user.email}</td>
                                    <td title={user.role}>{user.role}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="cancel-btn" onClick={() => {
                    setAddModalOpen(false);
                    setShowResetDropdown(false);
                    setResetConfirmText('');
                    setResetConfirmed(false);
                    setIndividualAddError('');
                    setIndividualPreview([]);
                    setBulkUsers([]);
                    setInvalidUsers([]);
                    setPreviewTab('valid');
                    setFile(null);
                    setFileError('');
                    if (employeeIdRef.current) employeeIdRef.current.value = '';
                    if (emailRef.current) emailRef.current.value = '';
                    if (nameRef.current) nameRef.current.value = '';
                    if (roleRef.current) roleRef.current.value = '';
                  }}>Cancel</button>
                  <button
                    onClick={() => setShowBulkConfirmModal(true)}
                    className="save-btn"
                    disabled={bulkUsers.length === 0}
                  >
                    {bulkUsers.length === 1
                      ? `Submit User (1)`
                      : bulkUsers.length > 1
                        ? `Submit Users (${bulkUsers.length})`
                        : 'Submit Users'}
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
            <div className="modal-header">
              <h2>
              <FaTrash /> Confirm Deletion
              </h2>
              <button className="close-btn" onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
            <p>
              You are about to delete {selectedUsers.length} user(s).
              This action cannot be undone. Type <strong>DELETE</strong> to proceed.
            </p>
            {selectedUsers.length > 0 && (
                <div className="user-list">
                  {users
                    .filter(user => selectedUsers.includes(String(user.dUser_ID)))
                    .map(user => (
                      <div key={user.dUser_ID} className="user-list-item">
                        <div className="user-info">
                          <div className="user-name">{user.dName}</div>
                          <div className="user-email">{user.dEmail}</div>
                        </div>
                      </div>
                    ))}
              </div>
            )}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
                className="delete-confirm-input"
              onInput={e => {
                e.target.value = e.target.value.replace(/[^A-Z]/g, '');
              }}
            />
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                className="delete-btn"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                onClick={() => {
                  setLastDeleteCount(selectedUsers.length);
                  handleDeleteUsers();
                }}
              >
                <FaTrash /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && currentUser && (
        <div className="modal-overlay">
          <div className="modal edit-user-modal" style={{ position: 'relative' }}>
            <button
              onClick={() => { setEditModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); setCurrentUser(null); setOriginalUser(null); setEditUserErrors({}); setShowPasswordFields(false); setShowSecurityQuestions(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setSecurityQuestionsData([ { question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' } ]); setIndividualAddError(''); }}
              className="close-btn"
              style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Edit User</h2>
            </div>
            <div className="edit-user-flex-row" style={{ display: 'flex', gap: 32 }}>
              {/* Left column: Employee ID, Email, Name, Role, Status */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="employee-id-label-row">
                    <label htmlFor="employee-id-input">
                      Employee ID:
                    </label>
                    {!employeeIdEditable && (
                      <FaLock className="locked-indicator" title="Enable editing to change Employee ID" />
                    )}
                  </div>
                  <input
                    id="employee-id-input"
                    type="text"
                    name="employeeId"
                    value={currentUser.dUser_ID}
                    onChange={(e) => setCurrentUser({ ...currentUser, dUser_ID: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                    readOnly={!employeeIdEditable}
                    className={!employeeIdEditable ? 'disabled-input' : ''}
                    required
                    maxLength={10}
                    pattern="\\d{1,10}"
                    style={{ background: !employeeIdEditable ? '#f5f5f5' : undefined, color: !employeeIdEditable ? '#aaa' : undefined, cursor: !employeeIdEditable ? 'not-allowed' : undefined }}
                  />
                  {editUserErrors.dUser_ID && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dUser_ID}</div>}
                </div>
                <div className="employee-id-checkbox-row" style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <input
                      type="checkbox"
                      id="edit-employee-id"
                      checked={employeeIdEditable}
                      onChange={() => setEmployeeIdEditable((v) => !v)}
                      style={{ margin: 0 }}
                    />
                    Enable editing of Employee ID
                  </label>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={currentUser.dEmail}
                    onChange={(e) => setCurrentUser({...currentUser, dEmail: e.target.value.slice(0, 50)})}
                    required
                    maxLength={50}
                  />
                  {editUserErrors.dEmail && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dEmail}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={currentUser.dName}
                    onChange={(e) => setCurrentUser({...currentUser, dName: e.target.value.slice(0, 50)})}
                    required
                    maxLength={50}
                  />
                  {editUserErrors.dName && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dName}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Role:</label>
                  <select
                    name="role"
                    value={currentUser.dUser_Type}
                    onChange={(e) => setCurrentUser({...currentUser, dUser_Type: e.target.value})}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="HR">HR</option>
                    <option value="REPORTS">REPORTS</option>
                    <option value="CNB">CNB</option>
                  </select>
                  {editUserErrors.dUser_Type && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dUser_Type}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Status:</label>
                  <select
                    name="status"
                    value={currentUser.dStatus}
                    onChange={(e) => setCurrentUser({...currentUser, dStatus: e.target.value})}
                  >
                    {currentUser.dStatus === 'RESET-DONE' ? (
                      <>
                        <option value="RESET-DONE">RESET-DONE</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DEACTIVATE">DEACTIVATE</option>
                      </>
                    ) : (
                      <>
                        {currentUser.dStatus === 'FIRST-TIME' && <option value="FIRST-TIME">FIRST-TIME</option>}
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DEACTIVATE">DEACTIVATE</option>
                      </>
                    )}
                  </select>
                  {editUserErrors.dStatus && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dStatus}</div>}
                </div>
              </div>
              {/* Right column: Password and Reset Account (stacked vertically) */}
              <div style={{ flex: 1, minWidth: 340, maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 24 }}>
                <div className="password-change-section" style={{ marginBottom: 0, width: '100%' }}>
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
                      {passwordMismatch && (
                        <p className="error-message" style={{ color: 'red' }}>Passwords do not match</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="security-questions-section" style={{ width: '100%' }}>
                  <h3 className="section-header">
                    <FaShieldAlt size={14} /> Reset Account
                  </h3>
                  <button
                    className="visibility-toggle"
                    onClick={() => setShowResetDropdown(v => !v)}
                    style={{ marginBottom: 8 }}
                  >
                    {showResetDropdown ? <FaChevronDown /> : <FaChevronRight />}
                    {showResetDropdown ? 'Hide Reset Account' : 'Reset Account'}
                  </button>
                  {showResetDropdown && !resetConfirmed && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Type RESET to confirm"
                        value={resetConfirmText}
                        onChange={e => setResetConfirmText(e.target.value)}
                        style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4, marginRight: 8 }}
                      />
                      <button
                        className="save-btn"
                        style={{ padding: '6px 14px', fontSize: 13 }}
                        disabled={resetConfirmText !== 'RESET'}
                        onClick={() => setResetConfirmed(true)}
                      >
                        Confirm Reset
                      </button>
                    </div>
                  )}
                  {resetConfirmed && (
                    <div style={{ color: '#0a7', marginTop: 8, fontWeight: 500 }}>
                      Reset Confirmation is set. The account will be reset when you save changes.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => { setEditModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); setCurrentUser(null); setOriginalUser(null); setEditUserErrors({}); setShowPasswordFields(false); setShowSecurityQuestions(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setSecurityQuestionsData([ { question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' } ]); setIndividualAddError(''); }}>Cancel</button>
              <button
                onClick={() => { setPendingEditUser(currentUser); setShowEditConfirmModal(true); }}
                className="save-btn"
                disabled={
                  passwordMismatch ||
                  Object.keys(editUserErrors).length > 0 ||
                  (editUserErrors.dUser_ID && editUserErrors.dUser_ID.includes('Duplicate Employee ID in database')) ||
                  (editUserErrors.dEmail && editUserErrors.dEmail.includes('Duplicate Email in database')) ||
                  !isEditActionChanged()
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk upload confirmation modal */}
      {showBulkConfirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Bulk Upload</h2>
              <button onClick={() => setShowBulkConfirmModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>Are you sure you want to upload {bulkUsers.length} users?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => { setShowBulkConfirmModal(false); setIndividualAddError(''); }}>Cancel</button>
              <button
                onClick={() => {
                  setShowBulkConfirmModal(false);
                  handleBulkUpload();
                }}
                className="save-btn"
              >
                Yes, Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk upload result modal */}
      {showBulkResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{bulkResultSuccess ? 'Upload Successful' : 'Upload Failed'}</h2>
            </div>
            <p>{bulkResultMessage}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowBulkResultModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {showEditConfirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Edit</h2>
              <button onClick={() => setShowEditConfirmModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>Are you sure you want to save changes to this user?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => { setShowEditConfirmModal(false); setIndividualAddError(''); }}>No</button>
              <button
                className="save-btn"
                onClick={async () => {
                  setShowEditConfirmModal(false);
                  await handleSave(pendingEditUser);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {showEditResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{editResultSuccess ? 'Edit Successful' : 'Edit Failed'}</h2>
            </div>
            <p dangerouslySetInnerHTML={{ __html: (
              editResultSuccess
                ? (Array.isArray(pendingEditUser) && pendingEditUser.length > 1
                    ? `Users (${pendingEditUser.length}) edited successfully!`
                    : 'User edited successfully!')
                : editResultMessage
            ) }} />
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowEditResultModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showIndividualConfirmModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Add User</h2>
              <button onClick={() => setShowIndividualConfirmModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>Are you sure you want to add {individualPreview.length} user(s)?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => { setShowIndividualConfirmModal(false); setIndividualAddError(''); }}>No</button>
              <button
                className="save-btn"
                onClick={async () => {
                  setLastAddCount(individualPreview.length);
                  setShowIndividualConfirmModal(false);
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
                    let result = null;
                    try {
                      result = await response.json();
                    } catch (e) {}
                    if (!response.ok) {
                      setShowIndividualResultModal(true);
                      setIndividualResultSuccess(false);
                      setIndividualResultMessage('Add user error: ' + (result && result.message ? result.message : 'Failed to add users'));
                      return;
                    }
                    setShowIndividualResultModal(true);
                    setIndividualResultSuccess(true);
                    setIndividualResultMessage('Users added successfully!');
                    setIndividualPreview([]);
                    // Do NOT call fetchUsers here. Let it be handled by WebSocket.
                  } catch (error) {
                    setShowIndividualResultModal(true);
                    setIndividualResultSuccess(false);
                    setIndividualResultMessage('Add user error: ' + (error.message || 'Unknown error'));
                  }
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {showIndividualResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{individualResultSuccess ? 'Add Successful' : 'Add Failed'}</h2>
            </div>
            <p>{
              individualResultSuccess
                ? (lastAddCount === 1
                    ? 'User added successfully!'
                    : `Users (${lastAddCount}) added successfully!`)
                : individualResultMessage
            }</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowIndividualResultModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {showDeleteResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{deleteResultSuccess ? 'Deactivation Successful' : 'Deactivation Failed'}</h2>
            </div>
            <p>{
              deleteResultSuccess
                ? (lastDeleteCount === 1
                    ? 'User deactivated successfully!'
                    : `Users (${lastDeleteCount}) deactivated successfully!`)
                : deleteResultMessage
            }</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowDeleteResultModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal-overlay">
          <div className="modal delete-confirmation-modal">
            <div className="modal-header">
              <h2 style={{ color: '#0a7', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaKey style={{ color: '#0a7' }} /> Confirm Restoration
              </h2>
              <button className="close-btn" onClick={() => {
                setShowRestoreModal(false);
                setRestoreConfirmText('');
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <p>
                You are about to restore {selectedUsers.length} user(s).
                This will change their status to FIRST-TIME. Type <strong>RESTORE</strong> to proceed.
              </p>
              {selectedUsers.length > 0 && (
                <div className="user-list">
                  {users
                    .filter(user => selectedUsers.includes(String(user.dUser_ID)))
                    .map(user => (
                      <div key={user.dUser_ID} className="user-list-item">
                        <div className="user-info">
                          <div className="user-name">{user.dName}</div>
                          <div className="user-email">{user.dEmail}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="Type RESTORE to confirm"
                className="delete-confirm-input"
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^A-Z]/g, '');
                }}
              />
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className="restore-btn"
                disabled={restoreConfirmText !== 'RESTORE'}
                onClick={handleRestoreUsers}
                style={{ backgroundColor: '#0a7', color: 'white' }}
              >
                <FaKey /> Restore Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Result Modal */}
      {showRestoreResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{restoreResultSuccess ? 'Restoration Successful' : 'Restoration Failed'}</h2>
            </div>
            <p>{restoreResultMessage}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowRestoreResultModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;