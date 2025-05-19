import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaFileDownload, FaTimesCircle, FaUpload, FaEye, FaEyeSlash, FaLock, FaUsers, FaUserShield, FaHistory, FaTicketAlt, FaUserSlash } from 'react-icons/fa';
import { FaKey, FaShieldAlt, FaChevronRight, FaChevronDown } from 'react-icons/fa';
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

  // Edit invalid user state
  const [editInvalidModalOpen, setEditInvalidModalOpen] = useState(false);
  const [editingInvalidUser, setEditingInvalidUser] = useState(null);
  const [editingInvalidUserIndex, setEditingInvalidUserIndex] = useState(null);
  const [editInvalidErrors, setEditInvalidErrors] = useState({});
  const [editInvalidDbErrors, setEditInvalidDbErrors] = useState({});

  // State for editing valid users
  const [editValidModalOpen, setEditValidModalOpen] = useState(false);
  const [editingValidUser, setEditingValidUser] = useState(null);
  const [editingValidUserIndex, setEditingValidUserIndex] = useState(null);
  const [editValidErrors, setEditValidErrors] = useState({});
  const [editValidDbErrors, setEditValidDbErrors] = useState({});

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
    const employeeId = employeeIdRef.current.value;
    const email = emailRef.current.value;
    const name = nameRef.current.value;
    const role = roleRef.current.value;
    // 1. Required fields
    if (!employeeId || !email || !name || !role) {
      setIndividualAddError('All fields are required.');
      return;
    }
    // Employee ID must be numbers only and up to 10 digits
    if (!/^[0-9]{1,10}$/.test(employeeId)) {
      setIndividualAddError('Employee ID must be numbers only and up to 10 digits.');
      return;
    }
    // Name must be 50 characters or less
    if (name.length > 50) {
      setIndividualAddError('Name must be 50 characters or less.');
      return;
    }
    // Email must be 50 characters or less
    if (email.length > 50) {
      setIndividualAddError('Email must be 50 characters or less.');
      return;
    }
    // 2. Email format
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      setIndividualAddError('Invalid email format.');
      return;
    }
    // 3. Duplicates in preview
    if (individualPreview.some(u => u.employeeId === employeeId)) {
      setIndividualAddError('Duplicate Employee ID in preview.');
      return;
    }
    if (individualPreview.some(u => u.email === email)) {
      setIndividualAddError('Duplicate Email in preview.');
      return;
    }
    // 4. Duplicates in database (tbl_login and tbl_admin for Admin)
    try {
      let dbDuplicates = [];
      if (role && role.toUpperCase() === 'ADMIN') {
        const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeIds: [employeeId], emails: [email], admin: true })
        });
        dbDuplicates = await response.json();
        if (dbDuplicates.some(u => u.dUser_ID === employeeId)) {
          setIndividualAddError('Duplicate Employee ID in database');
          return;
        }
        if (dbDuplicates.some(u => u.dEmail === email)) {
          setIndividualAddError('Duplicate Email in database');
          return;
        }
      } else {
        const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeIds: [employeeId], emails: [email] })
        });
        dbDuplicates = await response.json();
        if (dbDuplicates.some(u => u.dUser_ID === employeeId)) {
          setIndividualAddError('Duplicate Employee ID in database');
          return;
        }
        if (dbDuplicates.some(u => u.dEmail === email)) {
          setIndividualAddError('Duplicate Email in database');
          return;
        }
      }
    } catch (e) {
      setIndividualAddError('Error checking duplicates in database.');
      return;
    }
    // If all good, add to preview
    setIndividualPreview(prev => [...prev, { employeeId, email, name, role, status: 'FIRST-TIME' }]);
    // Clear the input fields
    employeeIdRef.current.value = '';
    emailRef.current.value = '';
    nameRef.current.value = '';
    roleRef.current.value = 'HR';
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
        fetchUsers();
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

      setUsers(prev => [...prev, ...bulkUsers]);
      setAddModalOpen(false);
      setBulkUsers([]);
      setFile(null);
      setShowBulkResultModal(true);
      setBulkResultSuccess(true);
      setBulkResultMessage('Users uploaded successfully!');
      fetchUsers();
    } catch (error) {
      setShowBulkResultModal(true);
      setBulkResultSuccess(false);
      setBulkResultMessage('Bulk upload error: ' + (error.message || 'Unknown error'));
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

        let result = null;
        try {
          result = await response.json();
        } catch (e) {}

        if (!response.ok) {
          setShowDeleteResultModal(true);
          setDeleteResultSuccess(false);
          setDeleteResultMessage(result && result.message ? result.message : 'Failed to delete users');
          return;
        }

        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.dUser_ID)));
        setSelectedUsers([]);
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        setShowDeleteResultModal(true);
        setDeleteResultSuccess(true);
        setDeleteResultMessage('Users deleted successfully!');
        fetchUsers();
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
      setUsers(users.map(user => user.dLogin_ID === updatedUser.dLogin_ID ? { ...user, ...changedFields } : user));
      setEditModalOpen(false);
      setEditResultSuccess(true);
      setEditResultMessage(`Changes Made<br><span style='display:block;margin-bottom:6px;'></span>${formatEditResultMessage(changes)}`);
      setShowEditResultModal(true);
      fetchUsers();
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

  // Handler to open modal for editing invalid user
  const handleEditInvalidUser = (index) => {
    const user = { ...invalidUsers[index] };
    setEditingInvalidUser(user);
    setEditingInvalidUserIndex(index);
    setEditInvalidErrors(validateEditingInvalidUser(user));
    setEditInvalidModalOpen(true);
  };

  // Add at the top of your component:
  const lastCheckedInvalidRef = useRef({ employeeId: '', email: '' });
  const lastCheckedValidRef = useRef({ employeeId: '', email: '' });
  const dbAbortInvalidController = useRef(null);
  const dbAbortValidController = useRef(null);

  // Utility to build Sets for O(1) duplicate checks
  function buildDuplicateSets(users, excludeIndex = null, key = 'employeeId', emailKey = 'email') {
    const idSet = new Set();
    const emailSet = new Set();
    users.forEach((u, i) => {
      if (excludeIndex !== null && i === excludeIndex) return;
      if (u[key]) idSet.add(u[key]);
      if (u[emailKey]) emailSet.add(u[emailKey]);
    });
    return { idSet, emailSet };
  }

  // Optimized Edit Invalid User Change Handler
  const handleEditingInvalidUserChange = (e) => {
    const { name, value } = e.target;
    setEditingInvalidUser(prev => {
      const updated = { ...prev, [name]: value };
      // Build Sets for O(1) duplicate check
      const { idSet, emailSet } = buildDuplicateSets([...bulkUsers, ...invalidUsers], editingInvalidUserIndex);
      const errors = {};
      const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!updated.employeeId) errors.employeeId = 'Employee ID is required';
      else if (!/^[0-9]{1,10}$/.test(updated.employeeId)) errors.employeeId = 'Employee ID must be numbers only and up to 10 digits';
      else if (idSet.has(updated.employeeId)) errors.employeeId = 'Duplicate Employee ID in file';
      if (!updated.name) errors.name = 'Name is required';
      else if (updated.name.length > 50) errors.name = 'Name must be 50 characters or less';
      if (!updated.email) errors.email = 'Email is required';
      else if (updated.email.length > 50) errors.email = 'Email must be 50 characters or less';
      else if (!emailRegex.test(updated.email)) errors.email = 'Invalid email format';
      else if (emailSet.has(updated.email)) errors.email = 'Duplicate Email in file';
      if (!updated.role) errors.role = 'Role is required';
      else if (!allowedRoles.includes(updated.role.trim().toUpperCase())) errors.role = 'Role must be exactly one of: ' + allowedRoles.join(', ');
      setEditInvalidErrors(errors);
      // Debounce validation and DB check
      if (window.editInvalidDbTimeout) clearTimeout(window.editInvalidDbTimeout);
      window.editInvalidDbTimeout = setTimeout(async () => {
        // Only check if value changed
        if (
          lastCheckedInvalidRef.current.employeeId === updated.employeeId &&
          lastCheckedInvalidRef.current.email === updated.email
        ) return;
        lastCheckedInvalidRef.current = {
          employeeId: updated.employeeId,
          email: updated.email,
        };
        // Cancel previous request
        if (dbAbortInvalidController.current) dbAbortInvalidController.current.abort();
        dbAbortInvalidController.current = new AbortController();
        let dbDuplicates = [];
        try {
          const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeIds: [updated.employeeId],
              emails: [updated.email]
            }),
            signal: dbAbortInvalidController.current.signal,
          });
          dbDuplicates = await response.json();
        } catch (e) { if (e.name === 'AbortError') return; }
        const dbErrors = {};
        if (dbDuplicates.some(u => u.dUser_ID === updated.employeeId)) {
          dbErrors.employeeId = 'Duplicate Employee ID in database';
        }
        if (dbDuplicates.some(u => u.dEmail === updated.email)) {
          dbErrors.email = 'Duplicate Email in database';
        }
        setEditInvalidDbErrors(dbErrors);
      }, 400);
      return updated;
    });
  };

  // Handler to save the edited invalid user
  const handleSaveEditedInvalidUser = async () => {
    const { employeeId, name, email, role } = editingInvalidUser;
    const errors = {};
    const reasons = [];
    const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];

    // 1. Required fields
    if (!employeeId) { errors.employeeId = 'Employee ID is required'; reasons.push('Missing Employee ID'); }
    if (!name) { errors.name = 'Name is required'; reasons.push('Missing Name'); }
    if (!email) { errors.email = 'Email is required'; reasons.push('Missing Email'); }
    if (!role) { errors.role = 'Role is required'; reasons.push('Missing Role'); }
    const roleStr = typeof role === 'string' ? role : String(role || '');
    const isValidRole = allowedRoles.some(allowed => roleStr.trim().toUpperCase() === allowed);
    if (!isValidRole) {
      errors.role = 'Role must be exactly one of: ' + allowedRoles.join(', ');
      reasons.push('Role must be exactly one of: ' + allowedRoles.join(', '));
    }

    // 2. Check for duplicates in the file (excluding the row being edited)
    const otherInvalids = invalidUsers.filter((_, i) => i !== editingInvalidUserIndex);
    const allBulk = [...bulkUsers, ...otherInvalids];
    const idCount = allBulk.filter(u => u.employeeId === employeeId).length;
    const emailCount = allBulk.filter(u => u.email === email).length;
    if (idCount > 0) {
      errors.employeeId = 'Duplicate Employee ID in file';
      reasons.push('Duplicate Employee ID in file');
    }
    if (emailCount > 0) {
      errors.email = 'Duplicate Email in file';
      reasons.push('Duplicate Email in file');
    }

    // 3. Check for duplicates in the database (synchronously before proceeding)
    let dbDuplicates = [];
    try {
      const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: [employeeId],
          emails: [email]
        })
      });
      dbDuplicates = await response.json();
    } catch (e) {
      // handle error
    }
    if (dbDuplicates.some(u => u.dUser_ID === employeeId)) {
      errors.employeeId = 'Duplicate Employee ID in database';
      reasons.push('Duplicate Employee ID in database');
    }
    if (dbDuplicates.some(u => u.dEmail === email)) {
      errors.email = 'Duplicate Email in database';
      reasons.push('Duplicate Email in database');
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = 'Invalid email format';
      reasons.push('Invalid email format');
    }

    setEditInvalidErrors(errors);

    // If still invalid, keep modal open and show errors
    if (Object.keys(errors).length > 0 || reasons.length > 0) {
      setEditingInvalidUser(prev => ({ ...prev, reasons }));
      return;
    }

    // Move to valid users
    setBulkUsers(prev => [
      ...prev,
      { employeeId, name, email, role, valid: true }
    ]);
    // Remove from invalid users
    setInvalidUsers(prev => prev.filter((_, i) => i !== editingInvalidUserIndex));
    setEditInvalidModalOpen(false);
    setEditingInvalidUser(null);
    setEditingInvalidUserIndex(null);
    setEditInvalidErrors({});
    setEditInvalidDbErrors({});
    // Refresh users table from backend
    fetchUsers();
  };

  // Handler to open modal for editing valid user
  const handleEditValidUser = (index) => {
    setEditingValidUser({ ...bulkUsers[index] });
    setEditingValidUserIndex(index);
    setEditValidModalOpen(true);
  };


  // Handler to save the edited valid user
  const handleSaveEditedValidUser = async () => {
    const { employeeId, name, email, role } = editingValidUser;
    const errors = validateEditingValidUser(editingValidUser);

    // Synchronous DB duplicate check before proceeding
    let dbDuplicates = [];
    try {
      const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: [employeeId],
          emails: [email]
        })
      });
      dbDuplicates = await response.json();
    } catch (e) {}
    if (dbDuplicates.some(u => u.dUser_ID === employeeId)) {
      errors.employeeId = 'Duplicate Employee ID in database';
    }
    if (dbDuplicates.some(u => u.dEmail === email)) {
      errors.email = 'Duplicate Email in database';
    }
    setEditValidErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const updatedValids = bulkUsers.map((user, i) =>
      i === editingValidUserIndex ? { employeeId, name, email, role, valid: true } : user
    );

    // Get the new valid/invalid lists
    const { validUsers, invalidUsers: newInvalidUsers } = await revalidateAllUsers([...updatedValids, ...invalidUsers]);

    // Check if the edited user is still valid
    const stillValid = validUsers.some(
      user => user.employeeId === employeeId && user.email === email
    );

    if (stillValid) {
      setEditValidModalOpen(false);
      setEditingValidUser(null);
      setEditingValidUserIndex(null);
      setEditValidErrors({});
      // Refresh users table from backend
      fetchUsers();
    } else {
      // Optionally, show a message that the user is now invalid (e.g., due to backend duplicate)
      setEditValidErrors({ general: 'User is now invalid due to backend validation. Please check errors.' });
    }
  };

  const revalidateAllUsers = async (allUsers) => {
    const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
    // Count occurrences in the file
    const idCounts = {};
    const emailCounts = {};
    allUsers.forEach(user => {
      idCounts[user.employeeId] = (idCounts[user.employeeId] || 0) + 1;
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    // Check for duplicates in the database
    let dbDuplicates = [];
    try {
      const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: allUsers.map(u => u.employeeId),
          emails: allUsers.map(u => u.email)
        })
      });
      dbDuplicates = await response.json();
    } catch (e) {
      // handle error
    }

    // Mark users as invalid if they are duplicates in file or DB or fail any validation
    const invalidUsers = [];
    const validUsers = [];
    const seenIds = new Set();
    const seenEmails = new Set();
    for (const user of allUsers) {
      const reasons = [];
      // Required fields
      if (!user.employeeId) reasons.push('Missing Employee ID');
      if (!user.name) reasons.push('Missing Name');
      if (!user.email) reasons.push('Missing Email');
      if (!user.role) reasons.push('Missing Role');
      // Char limits/format
      if (user.employeeId && !/^[0-9]{1,10}$/.test(user.employeeId)) reasons.push('Employee ID must be numbers only and up to 10 digits');
      if (user.name && user.name.length > 50) reasons.push('Name must be 50 characters or less');
      if (user.email && user.email.length > 50) reasons.push('Email must be 50 characters or less');
      // Duplicates in DB
      if (dbDuplicates.some(u => u.dUser_ID === user.employeeId)) reasons.push('Duplicate Employee ID in database');
      if (dbDuplicates.some(u => u.dEmail === user.email)) reasons.push('Duplicate Email in database');
      // Role
      const roleStr = typeof user.role === 'string' ? user.role : String(user.role || '');
      if (roleStr && !allowedRoles.includes(roleStr.trim().toUpperCase())) {
        reasons.push('Role must be exactly one of: ' + allowedRoles.join(', '));
      }
      // Email format
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (user.email && !emailRegex.test(user.email)) reasons.unshift('Invalid email format');
      // Only allow the first valid occurrence of each Employee ID and Email
      if (reasons.length === 0) {
        if (seenIds.has(user.employeeId)) {
          reasons.push('Duplicate Employee ID in file');
        }
        if (seenEmails.has(user.email)) {
          reasons.push('Duplicate Email in file');
        }
      }
      if (reasons.length > 0) {
        invalidUsers.push({
          ...user,
          reasons,
          notEditable: reasons.some(
            r => r === 'Duplicate Employee ID in database' || r === 'Duplicate Email in database'
          )
        });
      } else {
        validUsers.push(user);
        seenIds.add(user.employeeId);
        seenEmails.add(user.email);
      }
    }
    setBulkUsers(validUsers);
    setInvalidUsers(invalidUsers);
    return { validUsers, invalidUsers };
  };

  const validateEditingValidUser = (user) => {
    const errors = {};
    const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!user.employeeId) errors.employeeId = 'Employee ID is required';
    else if (!/^[0-9]{1,10}$/.test(user.employeeId)) errors.employeeId = 'Employee ID must be numbers only and up to 10 digits.';
    if (!user.name) errors.name = 'Name is required';
    else if (user.name.length > 50) errors.name = 'Name must be 50 characters or less.';
    if (!user.email) errors.email = 'Email is required';
    else {
      if (user.email.length > 50) errors.email = 'Email must be 50 characters or less.';
      if (!emailRegex.test(user.email)) errors.email = 'Invalid email format';
    }
    if (!user.role) errors.role = 'Role is required';
    const roleStr = typeof user.role === 'string' ? user.role : String(user.role || '');
    if (roleStr && !allowedRoles.includes(roleStr.trim().toUpperCase())) {
      errors.role = 'Role must be exactly one of: ' + allowedRoles.join(', ');
    }
    return errors;
  };

  const validateEditingInvalidUser = (user) => {
    const errors = {};
    const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!user.employeeId) errors.employeeId = 'Employee ID is required';
    else if (!/^[0-9]{1,10}$/.test(user.employeeId)) errors.employeeId = 'Employee ID must be numbers only and up to 10 digits.';
    if (!user.name) errors.name = 'Name is required';
    else if (user.name.length > 50) errors.name = 'Name must be 50 characters or less.';
    if (!user.email) errors.email = 'Email is required';
    else {
      if (user.email.length > 50) errors.email = 'Email must be 50 characters or less.';
      if (!emailRegex.test(user.email)) errors.email = 'Invalid email format';
    }
    if (!user.role) errors.role = 'Role is required';
    const roleStr = typeof user.role === 'string' ? user.role : String(user.role || '');
    if (roleStr && !allowedRoles.includes(roleStr.trim().toUpperCase())) {
      errors.role = 'Role must be exactly one of: ' + allowedRoles.join(', ');
    }
    return errors;
  };

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

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new window.WebSocket('ws://localhost:5000');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'USER_UPDATE') {
          fetchUsers();
        }
      } catch (e) {}
    };
    return () => {
      ws.close();
    };
  }, []);

  // Debounced backend duplicate check for editing invalid user
  const duplicateCheckTimeout = useRef();

  // Debounced backend duplicate check for editing valid user
  const duplicateCheckValidTimeout = useRef();
  const handleEditingValidUserChange = (e) => {
    const { name, value } = e.target;
    setEditingValidUser(prev => {
      const updated = { ...prev, [name]: value };
      // Build Sets for O(1) duplicate check
      const { idSet, emailSet } = buildDuplicateSets([...bulkUsers, ...invalidUsers], editingValidUserIndex);
      const errors = {};
      const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!updated.employeeId) errors.employeeId = 'Employee ID is required';
      else if (!/^[0-9]{1,10}$/.test(updated.employeeId)) errors.employeeId = 'Employee ID must be numbers only and up to 10 digits';
      else if (idSet.has(updated.employeeId)) errors.employeeId = 'Duplicate Employee ID in file';
      if (!updated.name) errors.name = 'Name is required';
      else if (updated.name.length > 50) errors.name = 'Name must be 50 characters or less';
      if (!updated.email) errors.email = 'Email is required';
      else if (updated.email.length > 50) errors.email = 'Email must be 50 characters or less';
      else if (!emailRegex.test(updated.email)) errors.email = 'Invalid email format';
      else if (emailSet.has(updated.email)) errors.email = 'Duplicate Email in file';
      if (!updated.role) errors.role = 'Role is required';
      else if (!allowedRoles.includes(updated.role.trim().toUpperCase())) errors.role = 'Role must be exactly one of: ' + allowedRoles.join(', ');
      setEditValidErrors(errors);
      // Debounce validation and DB check
      if (window.editValidDbTimeout) clearTimeout(window.editValidDbTimeout);
      window.editValidDbTimeout = setTimeout(async () => {
        // Only check if value changed
        if (
          lastCheckedValidRef.current.employeeId === updated.employeeId &&
          lastCheckedValidRef.current.email === updated.email
        ) return;
        lastCheckedValidRef.current = {
          employeeId: updated.employeeId,
          email: updated.email,
        };
        // Cancel previous request
        if (dbAbortValidController.current) dbAbortValidController.current.abort();
        dbAbortValidController.current = new AbortController();
        let dbDuplicates = [];
        try {
          const response = await fetch('http://localhost:5000/api/users/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeIds: [updated.employeeId],
              emails: [updated.email]
            }),
            signal: dbAbortValidController.current.signal,
          });
          dbDuplicates = await response.json();
        } catch (e) { if (e.name === 'AbortError') return; }
        const dbErrors = {};
        if (dbDuplicates.some(u => u.dUser_ID === updated.employeeId)) {
          dbErrors.employeeId = 'Duplicate Employee ID in database';
        }
        if (dbDuplicates.some(u => u.dEmail === updated.email)) {
          dbErrors.email = 'Duplicate Email in database';
        }
        setEditValidDbErrors(dbErrors);
      }, 400);
      return updated;
    });
  };

  // Add loading state for async DB duplicate check
  const [editValidCheckingDb, setEditValidCheckingDb] = useState(false);
  const [editInvalidCheckingDb, setEditInvalidCheckingDb] = useState(false);
  // Add navigation state
  const [activeTable, setActiveTable] = useState('users');

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

          <div className="filter-container">
            <label>Filter by Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="FIRST-TIME">FIRST-TIME</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
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
          <div className="table-navigation">
            <div 
              className={`nav-item ${activeTable === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTable('users')}
            >
              <FaUsers className="nav-icon" />
              <span>Users</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'admin' ? 'active' : ''}`} 
              onClick={() => setActiveTable('admin')}
            >
              <FaUserShield className="nav-icon" />
              <span>Admin</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'tickets' ? 'active' : ''}`} 
              onClick={() => setActiveTable('tickets')}
            >
              <FaTicketAlt className="nav-icon" />
              <span>Tickets</span>
            </div>
            <div 
              className={`nav-item ${activeTable === 'deactivated' ? 'active' : ''}`} 
              onClick={() => setActiveTable('deactivated')}
            >
              <FaUserSlash className="nav-icon" />
              <span>Deactivated</span>
            </div>
          </div>
          <div className="table-wrapper">
            {activeTable === 'users' && (
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
              {sortedUsers.map((user, index) => {
                const isSelected = selectedUsers.includes(String(user.dUser_ID));
                return (
                  <tr
                    key={String(user.dUser_ID)}
                    className={isSelected ? 'selected-row' : ''}
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
                            isSelected
                              ? prev.filter(id => id !== String(user.dUser_ID))
                              : [...prev, String(user.dUser_ID)]
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
            )}
            {activeTable === 'admin' && (
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
                  {sortedUsers.map((user, index) => (
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
            )}
            {activeTable === 'tickets' && (
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
                  {sortedUsers.map((user, index) => (
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
            )}
            {activeTable === 'deactivated' && (
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
                  {sortedUsers.map((user, index) => (
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
            )}
          </div>
        </div>
        {selectedUsers.length > 0 && (
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
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal add-user-modal" style={{ width: '900px' }}>
            <div className="modal-header">
              <h2>Add User</h2>
              <button onClick={() => { setAddModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); }} className="close-btn">
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
                        // Remove non-numeric characters and limit to 10
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      ref={emailRef}
                      required
                      maxLength={50}
                    />
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Department/Role</label>
                    <select
                      name="role"
                      ref={roleRef}
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
                    disabled={
                      individualAddError && (
                        individualAddError.includes('Duplicate Employee ID in preview.') ||
                        individualAddError.includes('Duplicate Email in preview.') ||
                        individualAddError.includes('Duplicate Employee ID in database') ||
                        individualAddError.includes('Duplicate Email in database')
                      )
                    }
                  >
                    Add to List
                  </button>
                </div>

                <hr className="add-user-hr" />

                <div className="add-user-actions">
                  <button onClick={() => setShowIndividualConfirmModal(true)} className="save-btn" disabled={individualPreview.length === 0}>Add User</button>
                </div>

                {individualAddError && (
                  <div style={{ color: 'red', marginBottom: 8 }}>{individualAddError}</div>
                )}

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
                        <option value="Admin">Admin</option>
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
                        <option value="Admin">Admin</option>
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
                                            className="edit-btn"
                                            onClick={() => handleEditValidUser(index)}
                                          >
                                            <FaEdit /> Edit
                                          </button>
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
                                  <th>Actions</th>
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
                                    <td>
                                      {!user.notEditable && (
                                        <button
                                          className="edit-btn"
                                          onClick={() => handleEditInvalidUser(index)}
                                        >
                                          <FaEdit /> Edit
                                        </button>
                                      )}
                                    </td>
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

                <div className="modal-actions">
                  <button onClick={() => { setAddModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); }} className="cancel-btn">Cancel</button>
                  <button
                    onClick={() => setShowBulkConfirmModal(true)}
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
              This action cannot be undone. Type <strong>CONFIRM</strong> to proceed.
            </p>
            {selectedUsers.length > 0 && (
                <div className="user-list">
                  {users
                    .filter(user => selectedUsers.includes(String(user.dUser_ID)))
                    .map(user => (
                      <li key={String(user.dUser_ID)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span>{user.dName}</span>
                        <span className="user-id" style={{ color: '#888', fontSize: '12px', marginLeft: 8 }}>{String(user.dUser_ID)}</span>
                      </li>
                    ))}
              </div>
            )}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type CONFIRM to delete"
                className="delete-confirm-input"
            />
            </div>
            <div className="modal-actions">
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
                disabled={deleteConfirmText !== 'CONFIRM'}
                onClick={handleDeleteUsers}
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
          <div className="modal edit-user-modal">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => { setEditModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); }} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
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
                  style={{
                    background: !employeeIdEditable ? '#f5f5f5' : undefined,
                    color: !employeeIdEditable ? '#aaa' : undefined,
                    cursor: !employeeIdEditable ? 'not-allowed' : undefined,
                  }}
                />
                {editUserErrors.dUser_ID && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dUser_ID}</div>}
              </div>
              <div className="form-group">
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
            </div>
            <div className="employee-id-checkbox-row">
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

            <div className="form-row">
              <div className="form-group">
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
                {editUserErrors.dUser_Type && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dUser_Type}</div>}
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
                  {currentUser.dStatus === 'RESET-DONE' ? (
                    <>
                      <option value="RESET-DONE">RESET-DONE</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </>
                  ) : (
                    <>
                      {currentUser.dStatus === 'FIRST-TIME' && <option value="FIRST-TIME">FIRST-TIME</option>}
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </>
                  )}
                </select>
                {editUserErrors.dStatus && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dStatus}</div>}
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

              <div className="security-questions-section">
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

            <div className="modal-actions">
              <button onClick={() => { setEditModalOpen(false); setShowResetDropdown(false); setResetConfirmText(''); setResetConfirmed(false); }} className="cancel-btn">Cancel</button>
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

      {/* Edit Invalid User Modal */}
      {editInvalidModalOpen && editingInvalidUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px' }}>
            <div className="modal-header">
              <h2>Edit Invalid User</h2>
              <button onClick={() => { setEditInvalidModalOpen(false); setEditInvalidErrors({}); setEditInvalidDbErrors({}); }} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={editingInvalidUser.employeeId}
                onChange={handleEditingInvalidUserChange}
                maxLength={10}
                pattern="\\d{1,10}"
              />
              {editInvalidErrors.employeeId && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidErrors.employeeId}</div>
              )}
              {editInvalidDbErrors.employeeId && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidDbErrors.employeeId}</div>
              )}
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={editingInvalidUser.name}
                onChange={handleEditingInvalidUserChange}
                maxLength={50}
              />
              {editInvalidErrors.name && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidErrors.name}</div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editingInvalidUser.email}
                onChange={handleEditingInvalidUserChange}
                maxLength={50}
              />
              {editInvalidErrors.email && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidErrors.email}</div>
              )}
              {editInvalidDbErrors.email && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidDbErrors.email}</div>
              )}
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={editingInvalidUser.role}
                onChange={handleEditingInvalidUserChange}
              >
                <option value="">Select Role</option>
                <option value="HR">HR</option>
                <option value="REPORTS">REPORTS</option>
                <option value="ADMIN">ADMIN</option>
                <option value="CNB">CNB</option>
              </select>
              {editInvalidErrors.role && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editInvalidErrors.role}</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => { setEditInvalidModalOpen(false); setEditInvalidErrors({}); setEditInvalidDbErrors({}); }} className="cancel-btn">Cancel</button>
              <button
                onClick={handleSaveEditedInvalidUser}
                className="save-btn"
                disabled={Object.keys(editInvalidErrors).length > 0 || Object.keys(editInvalidDbErrors).length > 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Valid User Modal */}
      {editValidModalOpen && editingValidUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px' }}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button onClick={() => { setEditValidModalOpen(false); setEditValidErrors({}); setEditValidDbErrors({}); }} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={editingValidUser.employeeId}
                onChange={handleEditingValidUserChange}
                maxLength={10}
                pattern="\\d{1,10}"
              />
              {editValidErrors.employeeId && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidErrors.employeeId}</div>
              )}
              {editValidDbErrors.employeeId && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidDbErrors.employeeId}</div>
              )}
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={editingValidUser.name}
                onChange={handleEditingValidUserChange}
                maxLength={50}
              />
              {editValidErrors.name && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidErrors.name}</div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editingValidUser.email}
                onChange={handleEditingValidUserChange}
                maxLength={50}
              />
              {editValidErrors.email && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidErrors.email}</div>
              )}
              {editValidDbErrors.email && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidDbErrors.email}</div>
              )}
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={editingValidUser.role}
                onChange={handleEditingValidUserChange}
              >
                <option value="">Select Role</option>
                <option value="HR">HR</option>
                <option value="REPORTS">REPORTS</option>
                <option value="ADMIN">ADMIN</option>
                <option value="CNB">CNB</option>
              </select>
              {editValidErrors.role && (
                <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editValidErrors.role}</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => { setEditValidModalOpen(false); setEditValidErrors({}); setEditValidDbErrors({}); }} className="cancel-btn">Cancel</button>
              <button
                onClick={handleSaveEditedValidUser}
                className="save-btn"
                disabled={Object.keys(editValidErrors).length > 0 || Object.keys(editValidDbErrors).length > 0}
              >
                Save
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
            <div className="modal-actions">
              <button onClick={() => setShowBulkConfirmModal(false)} className="cancel-btn">Cancel</button>
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
              <button onClick={() => setShowBulkResultModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>{bulkResultMessage}</p>
            <div className="modal-actions">
              <button onClick={() => setShowBulkResultModal(false)} className="save-btn">OK</button>
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
            <div className="modal-actions">
              <button onClick={() => setShowEditConfirmModal(false)} className="cancel-btn">No</button>
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
              <button onClick={() => setShowEditResultModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p dangerouslySetInnerHTML={{ __html: editResultMessage }} />
            <div className="modal-actions">
              <button onClick={() => setShowEditResultModal(false)} className="save-btn">OK</button>
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
            <div className="modal-actions">
              <button onClick={() => setShowIndividualConfirmModal(false)} className="cancel-btn">No</button>
              <button
                className="save-btn"
                onClick={async () => {
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
                    fetchUsers();
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
              <button onClick={() => setShowIndividualResultModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>{individualResultMessage}</p>
            <div className="modal-actions">
              <button onClick={() => setShowIndividualResultModal(false)} className="save-btn">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {showDeleteResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{deleteResultSuccess ? 'Delete Successful' : 'Delete Failed'}</h2>
              <button onClick={() => setShowDeleteResultModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>{deleteResultMessage}</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteResultModal(false)} className="save-btn">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;