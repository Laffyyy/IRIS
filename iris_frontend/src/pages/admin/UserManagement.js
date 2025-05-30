import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaFileDownload, FaTimesCircle, FaUpload, FaEye, FaEyeSlash, FaLock, FaLockOpen, FaUsers, FaUserShield, FaHistory, FaTicketAlt, FaUserSlash, FaKey, FaShieldAlt } from 'react-icons/fa';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './UserManagement.module.css';
import styles from './UserManagement.module.css';
import './UserManagement.css';
import { useUser } from '../../contexts/UserContext';

// Add this near the top, after imports and before the UserManagement component
const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g;
const sanitizeIndividualInput = (input, type) => {
  if (typeof input !== 'string') input = String(input || '');
  let value = input.trim();
  value = value.replace(emojiRegex, '');
  if (type === 'employeeId') {
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
  } else if (type === 'name') {
    value = value
      .replace(/[^A-Za-z0-9\-_. ,]/g, '') // Only allowed chars (no @)
      .replace(/([\-_. ,])\1+/g, '$1') // No consecutive special chars
      .replace(/ +/g, ' ') // Collapse multiple spaces
      .replace(/^[\-_. ,]+/, '') // No special char at start
      .trim();
  } else if (type === 'email') {
    value = value.replace(/[^A-Za-z0-9@._-]/g, '');
  }
  return value;
};

function isExactRole(role) {
  const allowedRoles = ['HR', 'REPORTS', 'ADMIN', 'CNB'];
  return allowedRoles.includes(role);
}

// Add this helper above handleFile
function sanitizeBulkName(name) {
  return (name || '')
    .replace(/[^A-Za-z0-9\-_. ,]/g, '') // Only allowed chars (no @)
    .replace(/([\-_. ,])\1+/g, '$1') // No consecutive special chars
    .replace(/^[\-_. ,]+/, '') // No special char at start
    .replace(/ +/g, ' ') // Collapse multiple spaces to one
    .trim(); // Remove leading/trailing spaces
}

// Add sanitization utility
const sanitizeUserData = (userData) => {
  return {
    ...userData,
    dUser_ID: userData.dUser_ID ? userData.dUser_ID.trim().replace(/[^0-9]/g, '') : '',
    dName: userData.dName ? userData.dName
      .trim()
      .replace(/[^A-Za-z0-9\-_. ,]/g, '')
      .replace(/([\-_. ,])\1+/g, '$1')
      .replace(/^[\-_. ,]+/, '') : '',
    dEmail: userData.dEmail ? userData.dEmail.trim().toLowerCase() : '',
    dUser_Type: userData.dUser_Type ? userData.dUser_Type.toUpperCase() : '',
  };
};

// Add password validation utility
const validatePassword = (password) => {
  const errors = [];
  
  // Check length (15-20 characters)
  if (!password || password.length < 15 || password.length > 20) {
    errors.push('Password must be 15-20 characters long');
    return errors;
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasAllowedSymbols = /[.!@_]/.test(password);
  const hasOnlyAllowedChars = /^[A-Za-z0-9.!@_-]+$/.test(password);

  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasAllowedSymbols) errors.push('Password must contain at least one symbol (. _ ! @-)');
  if (!hasOnlyAllowedChars) errors.push('Password can only contain letters, numbers, and symbols (. _ -! @-)');

  return errors;
};

// Add password requirement check function
const checkPasswordRequirements = (password) => {
  return {
    length: password && password.length >= 15 && password.length <= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[.!@_-]/.test(password)
  };
};

// Add this before the PasswordRequirements component
const areAllPasswordRequirementsMet = (password) => {
  const requirements = checkPasswordRequirements(password);
  return Object.values(requirements).every(requirement => requirement === true);
};

// Password Requirements Component
const PasswordRequirements = ({ password }) => {
  const requirements = checkPasswordRequirements(password);
  
  const requirementsList = [
    { key: 'length', text: 'Be 15-20 characters long' },
    { key: 'uppercase', text: 'Include at least one uppercase letter' },
    { key: 'lowercase', text: 'Include at least one lowercase letter' },
    { key: 'number', text: 'Include at least one number' },
    { key: 'symbol', text: 'Include at least one allowed symbol (. _ ! @-)' }
  ];

  return (
    <div className="iris-password-requirements">
      <h4 className="iris-requirements-title">Password Requirements:</h4>
      <ul className="iris-requirements-list">
        {requirementsList.map(({ key, text }) => (
          <li key={key} className={`iris-requirement-item ${requirements[key] ? 'iris-requirement-met' : 'iris-requirement-unmet'}`}>
            <span className="iris-requirement-icon">
              {requirements[key] ? '✓' : '✕'}
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
};

const UserManagement = () => {
  // State declarations
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Add navigation state at the top with other state declarations
  const [activeTable, setActiveTable] = useState('users');
  const [recentlyAddedUsers, setRecentlyAddedUsers] = useState([]);

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

  // Add for click-and-drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragLastIndex, setDragLastIndex] = useState(null);
  const [dragToggled, setDragToggled] = useState(new Set());
  const { user, updateUserDetails } = useUser();
  // Debounced new user fields
  const [debouncedNewUser, setDebouncedNewUser] = useState(newUser);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedNewUser(newUser), 400);
    return () => clearTimeout(handler);
  }, [newUser]);

  useEffect(() => {
      // Fetch user details when component mounts and user exists
      if (user?.employeeId) {
        updateUserDetails(user.employeeId);
      }
    }, [user?.employeeId]);
  
    let formattedLastLogin = 'N/A';
    if (user?.lastLogin) {
      const lastLoginDate = new Date(user.lastLogin);
      // Get time parts
      let [time, ampm] = lastLoginDate
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        .split(' ');
      // Combine without space between time and am/pm, and make am/pm lowercase
      const formattedTime = `${time}${ampm.toLowerCase()}`;
      const formattedDate = lastLoginDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      formattedLastLogin = `${formattedTime} ${formattedDate}`;
    }

    const userInfo = {
    name: user?.name || 'Unknown User',
    role: user?.type === 'ADMIN' ? 'Incentive Administrator' : user?.type || 'User',
    responsibilities: ['User Management', 'Activity Logs Monitoring'],
    lastLogin: formattedLastLogin || 'N/A',
    status: user.status || 'ACTIVE'
  };

  // Bulk upload state
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkUsers, setBulkUsers] = useState([]);
  const [invalidUsers, setInvalidUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
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

  // Add a computed variable for password mismatch
  const passwordMismatch =
    (passwordData.newPassword || passwordData.confirmPassword) &&
    (passwordData.newPassword !== passwordData.confirmPassword);

  // Add state for individual add errors and confirmation/result modals
  const [individualAddError, setIndividualAddError] = useState('');
  const [individualAddErrors, setIndividualAddErrors] = useState({});
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
  const [individualSearchTerm, setIndividualSearchTerm] = useState('');
  const [individualStatusFilter, setIndividualStatusFilter] = useState('All');
  const [bulkSortConfig, setBulkSortConfig] = useState({ key: null, direction: null });
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [bulkRoleFilter, setBulkRoleFilter] = useState('All');
  const [bulkStatusFilter, setBulkStatusFilter] = useState('All');

  // Lock and Unlock
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [lockConfirmText, setLockConfirmText] = useState('');
  const [unlockConfirmText, setUnlockConfirmText] = useState('');
  const [showLockResultModal, setShowLockResultModal] = useState(false);
  const [lockResultSuccess, setLockResultSuccess] = useState(false);
  const [lockResultMessage, setLockResultMessage] = useState('');
  const [lastLockCount, setLastLockCount] = useState(0);
  const [showUnlockResultModal, setShowUnlockResultModal] = useState(false);
  const [unlockResultSuccess, setUnlockResultSuccess] = useState(false);
  const [unlockResultMessage, setUnlockResultMessage] = useState('');
  const [lastUnlockCount, setLastUnlockCount] = useState(0);
  const lockResultOkBtnRef = useRef();
  const unlockResultOkBtnRef = useRef();


  // Deactivate
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [showDeactivateResultModal, setShowDeactivateResultModal] = useState(false);
  const [deactivateResultSuccess, setDeactivateResultSuccess] = useState(false);
  const [deactivateResultMessage, setDeactivateResultMessage] = useState('');
  const [lastDeactivateCount, setLastDeactivateCount] = useState(0);
  const deactivateConfirmInputRef = useRef();
  const deactivateResultOkBtnRef = useRef();

  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);

  // Debounced search terms
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [debouncedBulkSearchTerm, setDebouncedBulkSearchTerm] = useState(bulkSearchTerm);
  
      useEffect(() => {
      // Fetch user details when component mounts and user exists
      if (user?.employeeId) {
        updateUserDetails(user.employeeId);
      }
    }, [user?.employeeId]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedBulkSearchTerm(bulkSearchTerm), 400);
    return () => clearTimeout(handler);
  }, [bulkSearchTerm]);

  useEffect(() => {
  if (showDeactivateModal && deactivateConfirmInputRef.current) {
    deactivateConfirmInputRef.current.focus();
    deactivateConfirmInputRef.current.select();
  }
}, [showDeactivateModal]);

useEffect(() => {
  if (showLockResultModal && lockResultOkBtnRef.current) {
    lockResultOkBtnRef.current.focus();
  }
}, [showLockResultModal]);

useEffect(() => {
  if (showUnlockResultModal && unlockResultOkBtnRef.current) {
    unlockResultOkBtnRef.current.focus();
  }
}, [showUnlockResultModal]);

useEffect(() => { 
  if (showDeactivateResultModal && deactivateResultOkBtnRef.current) {
    deactivateResultOkBtnRef.current.focus(); 
  }
}, [showDeactivateResultModal]);

  // --- Sorting Handlers ---
  const handleSort = (key) => {
    // Only sort if we're on the active table
    if (activeTable === 'users' || activeTable === 'admin' || activeTable === 'tickets' || activeTable === 'deactivated') {
      setSortConfig(prev => {
        if (prev.key === key) {
          if (prev.direction === 'asc') return { key, direction: 'desc' };
          if (prev.direction === 'desc') return { key: null, direction: null };
          return { key, direction: 'asc' };
        }
        return { key, direction: 'asc' };
      });
    }
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

  // Lock and Unlock handler functions
const handleLockUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selectedUsers })
    });
    
    if (!response.ok) {
      const result = await response.json();
      setShowLockResultModal(true);
      setLockResultSuccess(false);
      setLockResultMessage(result?.message || 'Failed to lock users');
      setActionErrorMessage(result?.message || 'Failed to lock users');
      setShowActionErrorModal(true);
      return;
    }

    setSelectedUsers([]);
    setShowLockModal(false);
    setLockConfirmText('');
    setShowLockResultModal(true);
    setLockResultSuccess(true);
    setLockResultMessage(
      selectedUsers.length === 1 
        ? 'User locked successfully!' 
        : `Users (${selectedUsers.length}) locked successfully!`
    );
    
    fetchUsers();
  } catch (error) {
    setShowLockResultModal(true);
    setLockResultSuccess(false);
    setLockResultMessage('Error locking users: ' + (error.message || 'Unknown error'));
  }
};

const handleUnlockUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selectedUsers })
    });

    if (!response.ok) {
      const result = await response.json();
      setShowUnlockResultModal(true);
      setUnlockResultSuccess(false);
      setUnlockResultMessage(result?.message || 'Failed to unlock users');
      setActionErrorMessage(result?.message || 'Failed to unlock users');
      setShowActionErrorModal(true);
      return;
    }

    setSelectedUsers([]);
    setShowUnlockModal(false);
    setUnlockConfirmText('');
    setShowUnlockResultModal(true);
    setUnlockResultSuccess(true);
    setUnlockResultMessage(
      selectedUsers.length === 1 
        ? 'User unlocked successfully!' 
        : `Users (${selectedUsers.length}) unlocked successfully!`
    );
    
    fetchUsers();
  } catch (error) {
    setShowUnlockResultModal(true);
    setUnlockResultSuccess(false);
    setUnlockResultMessage('Error unlocking users: ' + (error.message || 'Unknown error'));
  }
};

  // --- Filtering and Sorting Logic ---
  // Filter users based on the active tab
  const tabFilteredUsers = React.useMemo(() => {
    if (activeTable === 'admin') {
          // Only show ADMIN users that are not LOCKED or other ticket statuses
    return users.filter(user => 
      user.dUser_Type === 'ADMIN' && 
      user.dStatus !== 'LOCKED' &&
      user.dStatus !== 'NEED-RESET' &&
      user.dStatus !== 'RESET-DONE' &&
      user.dStatus !== 'DEACTIVATED' &&
      (statusFilter === 'All' || user.dStatus === statusFilter)
    );
    
    } else if (activeTable === 'tickets') {
      return users.filter(user => (user.dStatus === 'NEED-RESET' || user.dStatus === 'RESET-DONE') && (roleFilter === 'All' || user.dUser_Type === roleFilter) && (statusFilter === 'All' || user.dStatus === statusFilter));
    } else if (activeTable === 'locked') {
    // Only show LOCKED users with optional role filter
    return users.filter(user => 
      user.dStatus === 'LOCKED' && 
      (roleFilter === 'All' || user.dUser_Type === roleFilter)
    );
    } else if (activeTable === 'deactivated') {
      return users.filter(user => user.dStatus === 'DEACTIVATED' && (roleFilter === 'All' || user.dUser_Type === roleFilter));
    } else if (activeTable === 'users') {
      // Only show ACTIVE and FIRST-TIME users in users tab, and exclude ADMIN users
      return users.filter(user => (user.dStatus === 'ACTIVE' || user.dStatus === 'FIRST-TIME') && user.dUser_Type !== 'ADMIN' && (roleFilter === 'All' || user.dUser_Type === roleFilter) && (statusFilter === 'All' || user.dStatus === statusFilter));
    }
    return users;
  }, [users, activeTable, roleFilter, statusFilter]);

  // Apply search filter to tabFilteredUsers
  const filteredUsers = tabFilteredUsers.filter(user => {
    const matchesSearch =
      (user.dUser_ID && user.dUser_ID.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (user.dName && user.dName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (user.dEmail && user.dEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    return matchesSearch;
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

  // --- Bulk Preview Filtering/Sorting ---
  const filteredBulkUsers = React.useMemo(() => {
    return bulkUsers.filter(user => {
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
  }, [bulkUsers, debouncedBulkSearchTerm, bulkRoleFilter, bulkStatusFilter]);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users");
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

      // Helper function to sanitize input
      const sanitizeInput = (input, type) => {
        if (typeof input !== 'string') input = String(input || '');
        let value = input.trim();
        // Remove leading/trailing whitespace and collapse multiple spaces inside
        value = value.replace(/\s+/g, ' ');
        // Remove emojis
        value = value.replace(emojiRegex, '');
        if (type === 'employeeId') {
          // Remove all non-digits and trim to 10 digits
          value = value.replace(/[^0-9]/g, '').slice(0, 10);
        } else if (type === 'name') {
          // Only allow letters, numbers, spaces, dots, hyphens, underscores, commas
          value = value.replace(/[^A-Za-z0-9\-_. ,]/g, '');
        } else if (type === 'email') {
          // Only allow allowed email chars
          value = value.replace(/[^A-Za-z0-9@._-]/g, '');
        }
        return value;
      };

      // Helper function to validate allowed characters
      const validateAllowedChars = (input, type) => {
        if (!input) return true;
        switch(type) {
          case 'name':
            return allowedNameRegex.test(input);
          case 'email':
            return allowedEmailRegex.test(input);
          case 'employeeId':
            return /^[0-9]{10}$/.test(input);
          case 'role':
            return allowedRoles.includes(input.toUpperCase());
          default:
            return true;
        }
      };

      // 3. Row/cell validation
      const parsedUsers = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        let [employeeId, name, email, role, ...extra] = [
          sanitizeInput(row[0], 'employeeId'),
          sanitizeBulkName(row[1]),
          sanitizeInput(row[2], 'email'),
          sanitizeInput(row[3], 'role'),
          ...row.slice(4)
        ];
        const reasons = [];

        // Check for extra content
        const hasExtraContent = extra.some(cell => cell && cell.toString().trim() !== '');
        if (hasExtraContent) {
          reasons.push('Extra columns detected. Only EMPLOYEE ID, NAME, EMAIL, and ROLE should have values.');
        }

        // Required field checks
        if (!employeeId) reasons.push('Missing Employee ID');
        else if (!validateAllowedChars(employeeId, 'employeeId')) {
          reasons.push('Employee ID must be exactly 10 digits and contain only numbers');
        }

        if (!name) reasons.push('Missing Name');
        else if (!validateAllowedChars(name, 'name')) {
          reasons.push('Name contains invalid characters. Only letters, numbers, spaces, dots, hyphens, underscores, and commas are allowed');
        }

        if (!email) reasons.push('Missing Email');
        else if (!validateAllowedChars(email, 'email')) {
          reasons.push('Email contains invalid characters. Only letters, numbers, @, dots, hyphens, and underscores are allowed');
        }

        if (!role) reasons.push('Missing Role');
        const roleStr = typeof role === 'string' ? role.trim().toUpperCase() : String(role || '').trim().toUpperCase();
        if (roleStr && !allowedRoles.includes(roleStr)) {
          reasons.push('Invalid role. Must be one of: ' + allowedRoles.join(', '));
        }

        // Length validations
        if (name && name.length > 50) reasons.push('Name must be 50 characters or less');
        if (email && email.length > 50) reasons.push('Email must be 50 characters or less');

        // Email format validation
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (email && !emailRegex.test(email)) {
          reasons.push('Invalid email format');
        }

        // Check for emojis or special characters
        if (employeeId && emojiRegex.test(employeeId)) {
          reasons.push('Employee ID contains emojis or special characters');
        }
        if (name && emojiRegex.test(name)) {
          reasons.push('Name contains emojis or special characters');
        }
        if (email && emojiRegex.test(email)) {
          reasons.push('Email contains emojis or special characters');
        }

        if (reasons.length > 0) {
          parsedUsers.push({
            employeeId: employeeId || '',
            name: name || '',
            email: email || ''.toLowerCase(),
            role: roleStr || '',
            reasons,
            notEditable: reasons.some(r => r.includes('database'))
          });
        } else {
          parsedUsers.push({
            employeeId,
            name,
            email,
            role: roleStr,
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
        const response = await fetch('http://localhost:3000/api/users/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeIds: parsedUsers.map(u => u.employeeId),
            emails: parsedUsers.map(u => u.email),
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
        const sanitizedUser = {
          employeeId: sanitizeInput(user.employeeId, 'employeeId'),
          name: sanitizeInput(user.name, 'name'),
          email: sanitizeInput(user.email, 'email').toLowerCase(),
          role: sanitizeInput(user.role, 'role')
        };

        // Re-apply all validations with sanitized data
        if (!sanitizedUser.employeeId || !validateAllowedChars(sanitizedUser.employeeId, 'employeeId')) {
          reasons.push('Employee ID must be exactly 10 digits and contain only numbers');
        }
        if (!sanitizedUser.name || !validateAllowedChars(sanitizedUser.name, 'name')) {
          reasons.push('Name contains invalid characters. Only letters, numbers, spaces, dots, hyphens, underscores, and commas are allowed');
        }
        if (!sanitizedUser.email || !validateAllowedChars(sanitizedUser.email, 'email')) {
          reasons.push('Email contains invalid characters. Only letters, numbers, @, dots, hyphens, and underscores are allowed');
        }
        if (!sanitizedUser.role || !allowedRoles.includes(sanitizedUser.role)) {
          reasons.push('Role must be exactly one of: ' + allowedRoles.join(', '));
        }

        // Length validations
        if (sanitizedUser.name && sanitizedUser.name.length > 50) reasons.push('Name must be 50 characters or less');
        if (sanitizedUser.email && sanitizedUser.email.length > 50) reasons.push('Email must be 50 characters or less');

        // Email format validation
        if (sanitizedUser.email && !emailRegex.test(sanitizedUser.email)) {
          reasons.push('Invalid email format');
        }

        // Check for emojis or special characters
        if (emojiRegex.test(sanitizedUser.employeeId)) {
          reasons.push('Employee ID contains emojis or special characters');
        }
        if (emojiRegex.test(sanitizedUser.name)) {
          reasons.push('Name contains emojis or special characters');
        }
        if (emojiRegex.test(sanitizedUser.email)) {
          reasons.push('Email contains emojis or special characters');
        }

        // Duplicate checks
        if (idCounts[sanitizedUser.employeeId] > 1) reasons.push('Duplicate Employee ID in file');
        if (emailCounts[sanitizedUser.email] > 1) reasons.push('Duplicate Email in file');
        if (dbDuplicates.some(u => u.dUser_ID === sanitizedUser.employeeId)) reasons.push('Duplicate Employee ID in database');
        if (dbDuplicates.some(u => u.dEmail === sanitizedUser.email)) reasons.push('Duplicate Email in database');

        if (reasons.length > 0) {
          invalidUsers.push({ ...sanitizedUser, reasons, notEditable: reasons.some(r => r.includes('database')) });
        } else {
          validUsers.push(sanitizedUser);
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
    const csvContent = "EMPLOYEE ID,NAME,EMAIL,ROLE\n1234567890,John.Doe,john.doe@example.com,HR\n9876543210,Jane_Smith,jane.smith@example.com,REPORTS";
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

  // Add state for last add count
  const [lastAddCount, setLastAddCount] = useState(0);
  const [lastDeleteCount, setLastDeleteCount] = useState(0);


  // Submit bulk users (with result modal)
  const handleBulkUpload = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: bulkUsers.map(user => ({
            ...user,
            password: 'password123',
            createdBy: user.employeeId,
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
        // Also show unified error modal
        setActionErrorMessage(errorMsg);
        setShowActionErrorModal(true);
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
  const handleDeleteUsers = () => {
  if (deleteConfirmText === 'DELETE' && selectedUsers.length > 0) {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setShowDeleteWarningModal(true);
  }
};

const handleConfirmPermanentDelete = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users/delete-permanent', {
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
      setDeleteResultMessage(result?.message || 'Failed to delete users');
      setActionErrorMessage(result?.message || 'Failed to delete users');
      setShowActionErrorModal(true);
      return;
    }

    setSelectedUsers([]);
    setShowDeleteWarningModal(false);
    setShowDeleteResultModal(true);
    setDeleteResultSuccess(true);
    setDeleteResultMessage(
      selectedUsers.length === 1 
        ? 'User deleted successfully!' 
        : `Users (${selectedUsers.length}) deleted successfully!`
    );
    
    fetchUsers();
  } catch (error) {
    setShowDeleteResultModal(true);
    setDeleteResultSuccess(false);
    setDeleteResultMessage('Delete error: ' + (error.message || 'Unknown error'));
  }
};

const handleDeactivateUsers = async () => {
  if (deactivateConfirmText === 'DEACTIVATE' && selectedUsers.length > 0) {
    try {
      const response = await fetch('http://localhost:3000/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers })
      });

      if (!response.ok) {
        const result = await response.json();
        setShowDeactivateResultModal(true);
        setDeactivateResultSuccess(false);
        setDeactivateResultMessage(result?.message || 'Failed to deactivate users');
        setActionErrorMessage(result?.message || 'Failed to deactivate users');
        setShowActionErrorModal(true);
        return;
      }

      setSelectedUsers([]);
      setShowDeactivateModal(false);
      setDeactivateConfirmText('');
      setShowDeactivateResultModal(true);
      setDeactivateResultSuccess(true);
      setDeactivateResultMessage(
        selectedUsers.length === 1 
          ? 'User deactivated successfully!' 
          : `Users (${selectedUsers.length}) deactivated successfully!`
      );
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      setShowDeactivateResultModal(true);
      setDeactivateResultSuccess(false);
      setDeactivateResultMessage('Error deactivating users: ' + (error.message || 'Unknown error'));
    }
  }
};

  // Edit user handler
  const handleEdit = (user) => {
    const sanitizedUser = sanitizeUserData(user);
    // Make sure we preserve the entry IDs
    sanitizedUser.dLoginEntry_ID = user.dLoginEntry_ID;
    sanitizedUser.dAdminEntry_ID = user.dAdminEntry_ID;
    setOriginalUser(sanitizedUser);
    setCurrentUser(sanitizedUser);
    setShowResetDropdown(false);
    setEditModalOpen(true);
    setEditUserErrors({});
    setResetConfirmText('');
    setResetConfirmed(false);
  };

  // Handle new user input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    const sanitizedData = sanitizeUserData({ [name]: value });
    setNewUser(prev => ({ ...prev, [name]: sanitizedData[name] }));
  };

  // Update handlePasswordChange to prevent invalid characters
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow valid characters (letters, numbers, and allowed symbols)
    if (name === 'newPassword' || name === 'confirmPassword') {
      const sanitizedValue = value.replace(/[^A-Za-z0-9.!@_-]/g, '');
      if (sanitizedValue !== value) {
        e.target.value = sanitizedValue;
        return; // Don't update state if invalid characters were prevented
      }
    }
    
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      const requirements = checkPasswordRequirements(value);
      const errors = [];
      
      // Only show errors if user has started typing
      if (value.length > 0) {
        if (!requirements.length) errors.push('Password must be 15-20 characters long');
        if (!requirements.uppercase) errors.push('Password must contain at least one uppercase letter');
        if (!requirements.lowercase) errors.push('Password must contain at least one lowercase letter');
        if (!requirements.number) errors.push('Password must contain at least one number');
        if (!requirements.symbol) errors.push('Password must contain at least one symbol (. _ ! @)');
      }
      
      setEditUserErrors(prev => ({
        ...prev,
        password: errors.length > 0 ? errors : undefined
      }));

      // Also check confirmation match if confirmation was already entered
      if (passwordData.confirmPassword) {
        if (value !== passwordData.confirmPassword) {
          setEditUserErrors(prev => ({
            ...prev,
            confirmPassword: ['Passwords do not match']
          }));
        } else {
          setEditUserErrors(prev => {
            const { confirmPassword, ...rest } = prev;
            return rest;
          });
        }
      }
    }
    
    if (name === 'confirmPassword') {
      if (value !== passwordData.newPassword) {
        setEditUserErrors(prev => ({
          ...prev,
          confirmPassword: ['Passwords do not match']
        }));
      } else {
        setEditUserErrors(prev => {
          const { confirmPassword, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  // Update validateEditUser function to handle errors properly
  const validateEditUser = async (user, originalUser) => {
    const errors = {};
    
    // Basic validation with improved error messages
    if (!user.dUser_ID) {
      errors.dUser_ID = 'Employee ID is required.';
    } else if (!/^[0-9]{10}$/.test(user.dUser_ID)) {
      errors.dUser_ID = 'Employee ID must be exactly 10 digits.';
    }
    
    if (!user.dEmail) {
      errors.dEmail = 'Email is required.';
    } else if (user.dEmail.length > 50) {
      errors.dEmail = 'Email must be 50 characters or less.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.dEmail)) {
      errors.dEmail = 'Invalid email format.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.dEmail)) {
      errors.dEmail = 'Email contains invalid characters.';
    }
    
    if (!user.dName) {
      errors.dName = 'Name is required.';
    } else if (user.dName.length > 50) {
      errors.dName = 'Name must be 50 characters or less.';
    } else if (!/^[A-Za-z0-9\-_. ,]+$/.test(user.dName)) {
      errors.dName = 'Name contains invalid characters.';
    }
    
    if (!user.dUser_Type) {
      errors.dUser_Type = 'Role is required.';
    }
    
    // Check for duplicates only if values changed
    if (user.dUser_ID !== originalUser.dUser_ID || user.dEmail !== originalUser.dEmail) {
      try {
        const response = await fetch('http://localhost:3000/api/users/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeIds: [user.dUser_ID],
            emails: [user.dEmail],
            excludeLoginId: originalUser.dLoginEntry_ID || originalUser.dAdminEntry_ID
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to check for duplicates');
        }
        
        const dbDuplicates = await response.json();
        
        if (dbDuplicates.some(u => u.dUser_ID === user.dUser_ID && u.dUser_ID !== originalUser.dUser_ID)) {
          errors.dUser_ID = 'This Employee ID is already in use.';
        }
        if (dbDuplicates.some(u => u.dEmail === user.dEmail && u.dEmail !== originalUser.dEmail)) {
          errors.dEmail = 'This email is already in use.';
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
        errors.general = 'Error checking for duplicates. Please try again.';
      }
    }
    
    return errors;
  };

  // Update handleSave to include password validation
  const handleSave = async (updatedUser) => {
    const isAdmin = updatedUser.dUser_Type === 'ADMIN';
    
    try {
      // Validate before proceeding
      const validationErrors = await validateEditUser(updatedUser, originalUser);
      
      // Add strict password validation if changing password
      if (showPasswordFields && passwordData.newPassword) {
        if (!areAllPasswordRequirementsMet(passwordData.newPassword)) {
          setEditUserErrors(prev => ({
            ...prev,
            password: ['All password requirements must be met']
          }));
          return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setEditUserErrors(prev => ({
            ...prev,
            confirmPassword: ['Passwords do not match']
          }));
          return;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        console.log('Validation errors:', validationErrors);
        setEditUserErrors(validationErrors);
        return;
      }

      // Track changes for display and logging
      const changes = [];
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: updatedUser.dUser_ID,
        changes: {}
      };

      if (originalUser.dUser_ID !== updatedUser.dUser_ID) {
        changes.push(`Employee ID changed from '${originalUser.dUser_ID}' to '${updatedUser.dUser_ID}'`);
        auditLog.changes.employeeId = {
          from: originalUser.dUser_ID,
          to: updatedUser.dUser_ID
        };
      }
      if (originalUser.dName !== updatedUser.dName) {
        changes.push(`Name changed from '${originalUser.dName}' to '${updatedUser.dName}'`);
        auditLog.changes.name = {
          from: originalUser.dName,
          to: updatedUser.dName
        };
      }
      if (originalUser.dEmail !== updatedUser.dEmail) {
        changes.push(`Email changed from '${originalUser.dEmail}' to '${updatedUser.dEmail}'`);
        auditLog.changes.email = {
          from: originalUser.dEmail,
          to: updatedUser.dEmail
        };
      }
      if (originalUser.dUser_Type !== updatedUser.dUser_Type) {
        changes.push(`Role changed from '${originalUser.dUser_Type}' to '${updatedUser.dUser_Type}'`);
        auditLog.changes.role = {
          from: originalUser.dUser_Type,
          to: updatedUser.dUser_Type
        };
      }
      if (originalUser.dStatus !== updatedUser.dStatus) {
        changes.push(`Status changed from '${originalUser.dStatus}' to '${updatedUser.dStatus}'`);
        auditLog.changes.status = {
          from: originalUser.dStatus,
          to: updatedUser.dStatus
        };
      }
      if (showPasswordFields && passwordData.newPassword) {
        changes.push('Password changed');
        auditLog.changes.passwordChanged = true;
      }
      if (resetConfirmed) {
        changes.push('Account reset: password set to default and security questions cleared');
        auditLog.changes.accountReset = true;
      }

      // If no changes were made
      if (changes.length === 0 && !resetConfirmed && 
          !(showPasswordFields && passwordData.newPassword)) {
        setShowNoChangesModal(true);
        return;
      }

      // Log the changes for audit
      console.log('Audit log:', auditLog);

      // Determine if user is admin and get correct ID
      const isAdmin = updatedUser.dUser_Type === 'ADMIN';
      let userId;
      
      // Use the correct entry ID field based on user type
      if (isAdmin) {
        userId = updatedUser.dAdminEntry_ID;
        if (!userId) {
          console.error('Missing admin entry ID:', updatedUser);
          throw new Error('Invalid admin entry ID');
        }
      } else {
        userId = updatedUser.dLoginEntry_ID;
        if (!userId) {
          console.error('Missing login entry ID:', updatedUser);
          throw new Error('Invalid login entry ID');
        }
      }

      // Create update payload based on user type
      const updateData = {
        employeeId: updatedUser.dUser_ID,
        name: updatedUser.dName,
        email: updatedUser.dEmail,
        status: updatedUser.dStatus,
        isAdmin: isAdmin,
      };

      // Add role only for non-admin users
      if (!isAdmin) {
        updateData.role = updatedUser.dUser_Type;
      }

      // Handle password changes
      if (showPasswordFields && passwordData.newPassword && 
          passwordData.newPassword === passwordData.confirmPassword) {
        updateData.password = passwordData.newPassword;
      }

      // Handle account reset
      if (resetConfirmed) {
          updateData.securityQuestions = [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ];
          updateData.status = 'RESET-DONE';
      }

      // Make the API call
      console.log('Updating user:', { 
        userId, 
        isAdmin, 
        updateData,
        entryId: isAdmin ? updatedUser.dAdminEntry_ID : updatedUser.dLoginEntry_ID 
      });

      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update user');
      }

      const result = await response.json();

      // If security questions changed (only for non-admin users)
      if (!isAdmin && showSecurityQuestions && securityQuestionsData.some((q, i) => {
        const origQ = originalUser[`dSecurity_Question${i+1}`] || '';
        const origA = originalUser[`dAnswer_${i+1}`] || '';
        return q.question !== origQ || q.answer !== origA;
      })) {
        await fetch(`http://localhost:3000/api/users/${userId}/security-questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: securityQuestionsData })
        });
        changes.push('Security questions updated');
      }

      // Success case
      setEditModalOpen(false);
      setEditResultSuccess(true);
      setEditResultMessage(formatEditResultMessage(changes));
      setShowEditResultModal(true);
      
      // Reset states
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setResetConfirmed(false);
      setShowPasswordFields(false);
      setShowSecurityQuestions(false);
      
      // Refresh the users list
      fetchUsers();

    } catch (error) {
      console.error('Error updating user:', {
        error: error.message,
        userId: updatedUser.dUser_ID,
        entryId: isAdmin ? updatedUser.dAdminEntry_ID : updatedUser.dLoginEntry_ID,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'Failed to update user';
      if (error.message.includes('duplicate')) {
        errorMessage = 'This Employee ID or Email is already in use';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check all fields and try again';
      } else if (error.message.includes('Invalid admin entry ID')) {
        errorMessage = 'Could not determine the correct admin ID. Please try again or contact support.';
      } else if (error.message.includes('Invalid login entry ID')) {
        errorMessage = 'Could not determine the correct user ID. Please try again or contact support.';
      }
      
      setEditResultSuccess(false);
      setEditResultMessage(errorMessage);
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
      setEditPreviewErrors(errors);
    }
  }, [editingPreviewUser, editPreviewModalOpen, editingPreviewIndex]);

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

  // Watch for changes in currentUser in edit modal
  useEffect(() => {
    if (editModalOpen && currentUser) {
      const handler = setTimeout(() => {
        const newErrors = validateEditUser(currentUser, originalUser);
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
  }, [editModalOpen, currentUser, originalUser]);

  // Add a function to check if there are changes between currentUser and originalUser
  function isUserChanged(current, original) {
    if (!current || !original) return false;
    
    const isAdmin = current.dUser_Type === 'ADMIN';
    
    // Basic fields that both types have
    const basicFieldsChanged = 
      current.dUser_ID !== original.dUser_ID ||
      current.dName !== original.dName ||
      current.dEmail !== original.dEmail ||
      current.dStatus !== original.dStatus;

    // For non-admin users, also check role
    if (!isAdmin) {
      return basicFieldsChanged || current.dUser_Type !== original.dUser_Type;
    }

    return basicFieldsChanged;
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
    const wsRef = { current: null };
    let reconnectAttempts = 0;
    let reconnectTimeout = null;

    function connect() {
      wsRef.current = new WebSocket('ws://localhost:3000');
      wsRef.current.onopen = () => {
        reconnectAttempts = 0;
      };
      wsRef.current.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'USER_UPDATE') {
            fetchUsers();
          }
        } catch (e) {}
      };
      wsRef.current.onclose = () => {
        // Exponential backoff for reconnection
        reconnectAttempts++;
        const timeout = Math.min(30000, 1000 * 2 ** reconnectAttempts);
        reconnectTimeout = setTimeout(connect, timeout);
      };
      wsRef.current.onerror = () => {
        wsRef.current.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Debounced backend duplicate check for editing invalid user
  const duplicateCheckTimeout = useRef();

  // Add loading state for async DB duplicate check
  const [editValidCheckingDb, setEditValidCheckingDb] = useState(false);
  const [editInvalidCheckingDb, setEditInvalidCheckingDb] = useState(false);

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
        user.dStatus === 'NEED-RESET' || user.dStatus === 'RESET-DONE');
      if (roleFilter !== 'All') {
        filtered = filtered.filter(user => user.dUser_Type === roleFilter);
      }
    } else if (activeTable === 'locked') {
      filtered = filtered.filter(user => user.dStatus === 'LOCKED');
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
      filtered = filtered.filter(user => (user.dStatus === 'ACTIVE' || user.dStatus === 'FIRST-TIME') && user.dUser_Type !== 'ADMIN' && (roleFilter === 'All' || user.dUser_Type === roleFilter) && (statusFilter === 'All' || user.dStatus === statusFilter));
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
    setSortConfig({ key: null, direction: null }); // Reset sorting when switching tabs
  }, [activeTable]);

  // Improved emoji regex (covers most emoji ranges)
  const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83D[\uDE00-\uDE4F])/g;
  const allowedCharsRegex = /^[A-Za-z0-9@._-]+$/;
  const allowedNameRegex = /^[A-Za-z0-9\-_. ,]+$/;
  const allowedEmailRegex = /^[A-Za-z0-9@._-]+$/;
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // Add new state for restore modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showRestoreResultModal, setShowRestoreResultModal] = useState(false);
  const [restoreResultSuccess, setRestoreResultSuccess] = useState(false);
  const [restoreResultMessage, setRestoreResultMessage] = useState('');
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  // Add state to store restored default passwords
  const [restoredDefaultPasswords, setRestoredDefaultPasswords] = useState([]);

  // Add restore handler
  const handleRestoreUsers = async () => {
    if (restoreConfirmText === 'RESTORE' && selectedUsers.length > 0) {
      try {
        const response = await fetch('http://localhost:3000/api/users/restore', {
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
          setRestoredDefaultPasswords([]);
          return;
        }
        setSelectedUsers([]);
        setShowRestoreModal(false);
        setRestoreConfirmText('');
        setShowRestoreResultModal(true);
        setRestoreResultSuccess(true);
        setRestoreResultMessage(selectedUsers.length === 1 ? 'User restored successfully!' : `Users (${selectedUsers.length}) restored successfully!`);
        setRestoredDefaultPasswords(result && result.restoredPasswords ? result.restoredPasswords : []);
        // Hide/clear reset UI
        setShowResetDropdown(false);
        setResetConfirmText('');
        setResetConfirmed(false);
        // Do NOT call setUsers here. Let fetchUsers update the table.
      } catch (error) {
        setShowRestoreResultModal(true);
        setRestoreResultSuccess(false);
        setRestoreResultMessage('Restore error: ' + (error.message || 'Unknown error'));
        setRestoredDefaultPasswords([]);
      }
    }
  };

  // Add global mouseup listener to stop dragging if mouse leaves table
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragLastIndex(null);
      setDragToggled(new Set());
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Add state for no changes modal
  const [showNoChangesModal, setShowNoChangesModal] = useState(false);

  // Add state for unified action error modal
  const [showActionErrorModal, setShowActionErrorModal] = useState(false);
  const [actionErrorMessage, setActionErrorMessage] = useState('');

  // Add refs for first input in each modal
  const addFirstInputRef = useRef();
  const editFirstInputRef = useRef();
  const confirmFirstInputRef = useRef();

  // Focus first input when add modal opens
  useEffect(() => {
    if (addModalOpen && addFirstInputRef.current) {
      addFirstInputRef.current.focus();
    }
  }, [addModalOpen]);
  // Focus first input when edit modal opens
  useEffect(() => {
    if (editModalOpen && editFirstInputRef.current) {
      editFirstInputRef.current.focus();
    }
  }, [editModalOpen]);
  // Focus first input when confirmation modal opens
  useEffect(() => {
    if (showEditConfirmModal && confirmFirstInputRef.current) {
      confirmFirstInputRef.current.focus();
    }
  }, [showEditConfirmModal]);

  // Add ref for confirmation input
  const deleteConfirmInputRef = useRef();
  // Auto-select confirmation input when delete modal opens
  useEffect(() => {
    if (showDeleteModal && deleteConfirmInputRef.current) {
      deleteConfirmInputRef.current.focus();
      deleteConfirmInputRef.current.select();
    }
  }, [showDeleteModal]);

  // Add ref for restore confirmation input
  const restoreConfirmInputRef = useRef();
  // Auto-select confirmation input when restore modal opens
  useEffect(() => {
    if (showRestoreModal && restoreConfirmInputRef.current) {
      restoreConfirmInputRef.current.focus();
      restoreConfirmInputRef.current.select();
    }
  }, [showRestoreModal]);

  // Add refs for OK buttons in result modals
  const deleteResultOkBtnRef = useRef();
  const individualResultOkBtnRef = useRef();
  const editResultOkBtnRef = useRef();
  const restoreResultOkBtnRef = useRef();
  const bulkResultOkBtnRef = useRef();
  const actionErrorOkBtnRef = useRef();
  const noChangesOkBtnRef = useRef();

  // Auto-focus OK button when result modals open
  useEffect(() => { if (showDeleteResultModal && deleteResultOkBtnRef.current) deleteResultOkBtnRef.current.focus(); }, [showDeleteResultModal]);
  useEffect(() => { if (showIndividualResultModal && individualResultOkBtnRef.current) individualResultOkBtnRef.current.focus(); }, [showIndividualResultModal]);
  useEffect(() => { if (showEditResultModal && editResultOkBtnRef.current) editResultOkBtnRef.current.focus(); }, [showEditResultModal]);
  useEffect(() => { if (showRestoreResultModal && restoreResultOkBtnRef.current) restoreResultOkBtnRef.current.focus(); }, [showRestoreResultModal]);
  useEffect(() => { if (showBulkResultModal && bulkResultOkBtnRef.current) bulkResultOkBtnRef.current.focus(); }, [showBulkResultModal]);
  useEffect(() => { if (showActionErrorModal && actionErrorOkBtnRef.current) actionErrorOkBtnRef.current.focus(); }, [showActionErrorModal]);
  useEffect(() => { if (showNoChangesModal && noChangesOkBtnRef.current) noChangesOkBtnRef.current.focus(); }, [showNoChangesModal]);

  // Add refs for Yes buttons in confirmation modals
  const editConfirmYesBtnRef = useRef();
  const bulkConfirmYesBtnRef = useRef();

  // Auto-focus Yes button when confirmation modals open
  useEffect(() => { if (showEditConfirmModal && editConfirmYesBtnRef.current) editConfirmYesBtnRef.current.focus(); }, [showEditConfirmModal]);
  useEffect(() => { if (showBulkConfirmModal && bulkConfirmYesBtnRef.current) bulkConfirmYesBtnRef.current.focus(); }, [showBulkConfirmModal]);

  // Add at the top, after other state declarations
  const [addUserMessage, setAddUserMessage] = useState(null);

  // Add state for error modal
  const [showAddUserErrorModal, setShowAddUserErrorModal] = useState(false);
  const [addUserErrorDetail, setAddUserErrorDetail] = useState('');

  // Add the new handler for adding a user
  const handleAddUser = async () => {
    setAddUserMessage(null);
    // Sanitize all fields before validation
    const employeeId = sanitizeIndividualInput(employeeIdRef.current.value, 'employeeId');
    const email = sanitizeIndividualInput(emailRef.current.value, 'email').toLowerCase();
    const name = sanitizeIndividualInput(nameRef.current.value, 'name');
    const role = roleRef.current.value;
    const errors = {};
    // 1. Required fields
    if (!employeeId) errors.employeeId = ['Employee ID is required.'];
    else if (!/^[0-9]{10}$/.test(employeeId)) errors.employeeId = ['Employee ID must be exactly 10 digits.'];
    if (!email) errors.email = ['Email is required.'];
    if (!name) errors.name = ['Name is required.'];
    if (!role) errors.role = ['Role is required.'];
    if (name && name.length > 50) (errors.name = errors.name || []).push('Name must be 50 characters or less.');
    if (email && email.length > 50) (errors.email = errors.email || []).push('Email must be 50 characters or less.');
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (email && !emailRegex.test(email)) (errors.email = errors.email || []).push('Invalid email format.');
    if (employeeId && recentlyAddedUsers.some(u => u.employeeId === employeeId)) (errors.employeeId = errors.employeeId || []).push('Duplicate Employee ID in recently added users.');
    if (email && recentlyAddedUsers.some(u => u.email === email)) (errors.email = errors.email || []).push('Duplicate Email in recently added users.');
    if (Object.keys(errors).length > 0) {
      setAddUserMessage({ type: 'error', errors });
      setAddUserErrorDetail(Object.values(errors).flat().join(' '));
      return;
    }
    
    // Check for duplicates in DB
    try {
      const response = await fetch('http://localhost:3000/api/users/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: [employeeId], emails: [email] })
      });
      const dbDuplicates = await response.json();
      if (dbDuplicates.some(u => u.dUser_ID === employeeId)) {
        setAddUserMessage({ type: 'error', errors: { employeeId: ['Duplicate Employee ID in database.'] } });
        setAddUserErrorDetail('Duplicate Employee ID in database.');
        return;
      }
      if (dbDuplicates.some(u => u.dEmail === email)) {
        setAddUserMessage({ type: 'error', errors: { email: ['Duplicate Email in database.'] } });
        setAddUserErrorDetail('Duplicate Email in database.');
        return;
      }
    } catch (e) {
      setAddUserMessage({ type: 'error', text: 'Error checking duplicates in database.' });
      return;
    }
    
    // Add user to DB
    try {
      const response = await fetch('http://localhost:3000/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [{ employeeId, email, name, role, password: 'defaultPass123', createdBy: user.employeeId, status: 'FIRST-TIME' }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        // If backend returns a field, show error under that field
        if (data.field && data.message) {
          setAddUserMessage({ type: 'error', errors: { [data.field]: data.message } });
        } else if (data.message) {
          setAddUserMessage({ type: 'error', errors: { general: data.message } });
        } else {
          setAddUserMessage({ type: 'error', errors: { general: 'Failed to add user.' } });
        }
        return;
      }
      setAddUserMessage({ type: 'success', text: 'User added successfully!' });
      setRecentlyAddedUsers(prev => [{ employeeId, email, name, role }, ...prev]);
      // Clear form
      if (employeeIdRef.current) employeeIdRef.current.value = '';
      if (emailRef.current) emailRef.current.value = '';
      if (nameRef.current) nameRef.current.value = '';
      if (roleRef.current) roleRef.current.value = '';
    } catch (e) {
      setAddUserMessage({ type: 'error', text: 'Failed to add user.' });
    }
  };

  // Undo single user: delete from DB and remove from recentlyAddedUsers
  const handleUndoUser = async (user) => {
    setAddUserMessage(null);
    try {
      // Delete user by Employee ID
      const response = await fetch('http://localhost:3000/api/users/delete-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.employeeId,
          userType: user.role  // Send the actual user type/role
        })
      });
      if (!response.ok) {
        let msg = 'Failed to undo user.';
        try { const data = await response.json(); if (data && data.message) msg = data.message; } catch {}
        setAddUserMessage({ type: 'error', errors: { general: msg } });
        setAddUserErrorDetail(msg);
        setShowAddUserErrorModal(true);
        return;
      }
      setRecentlyAddedUsers(prev => prev.filter(u => u.employeeId !== user.employeeId));
      setAddUserMessage({ type: 'success', text: 'User deleted successfully!' });
    } catch (e) {
      setAddUserMessage({ type: 'error', errors: { general: 'Failed to undo user.' } });
      setAddUserErrorDetail('Failed to undo user.');
      setShowAddUserErrorModal(true);
    }
  };

  // Undo all users: delete all from DB and clear recentlyAddedUsers
  const handleUndoAll = async () => {
    setAddUserMessage(null);
    if (recentlyAddedUsers.length === 0) return;
    try {
      const response = await fetch('http://localhost:3000/api/users/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: recentlyAddedUsers.map(user => ({
            userId: user.employeeId,
            userType: user.role  // Send the actual user type/role
          }))
        })
      });
      if (!response.ok) {
        let msg = 'Failed to undo all users.';
        try { const data = await response.json(); if (data && data.message) msg = data.message; } catch {}
        setAddUserMessage({ type: 'error', errors: { general: msg } });
        setAddUserErrorDetail(msg);
        setShowAddUserErrorModal(true);
        return;
      }
      setRecentlyAddedUsers([]);
      setAddUserMessage({ type: 'success', text: 'All users deleted successfully!' });
    } catch (e) {
      setAddUserMessage({ type: 'error', errors: { general: 'Failed to undo all users.' } });
      setAddUserErrorDetail('Failed to undo all users.');
      setShowAddUserErrorModal(true);
    }
  };

  // Remove individualPreview cleanup
  const handleClose = () => {
    setAddModalOpen(false);
    setNewUser({
      employeeId: '',
      email: '',
      name: '',
      role: 'HR'
    });
    setIndividualAddErrors({});
    setIndividualAddError('');
    setShowIndividualResultModal(false);
    setIndividualResultSuccess(false);
    setIndividualResultMessage('');
    setAddUserMessage(null); // Reset error state when modal is closed
    // Remove this line
    // setIndividualPreview([]);
  };

  // Remove individualPreview cleanup from other functions
  const handleCancel = () => {
    setEditModalOpen(false);
    setCurrentUser(null);
    setOriginalUser(null);
    setShowPasswordFields(false);
    setShowSecurityQuestions(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSecurityQuestionsData([
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ]);
    // Remove this line
    // setIndividualPreview([]);
    setResetConfirmText('');
    setResetConfirmed(false);
  };

  // 1. Make the success message disappear after 3 seconds
  useEffect(() => {
    if (addUserMessage?.type === 'success') {
      const timer = setTimeout(() => setAddUserMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addUserMessage]);

  // Add useEffect to auto-close error modal after 3 seconds
  useEffect(() => {
    if (showAddUserErrorModal) {
      const timer = setTimeout(() => setShowAddUserErrorModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAddUserErrorModal]);

  // Add state for tracking touched fields and form submission in the Edit User modal
  const [editFieldTouched, setEditFieldTouched] = useState({
    dUser_ID: false,
    dEmail: false,
    dName: false,
    dUser_Type: false,
    dStatus: false
  });
  const [editFormSubmitted, setEditFormSubmitted] = useState(false);

  // Add state for showing the no changes label in the edit modal
  const [showNoChangesLabel, setShowNoChangesLabel] = useState(false);

  // Add a ref to store the timeout for the no changes label
  const noChangesTimeoutRef = useRef();

  return (
    <div className={styles['user-management-container']}>
      <div className={styles['user-management-card']}>
        <div className={styles['user-management-header']}>
          <h1>User Management</h1>
          <div className={styles['subtitle']}>Manage system users and their access</div>
        </div>

        <div className={styles['controls']}>
          <div className={styles['search-container']}>
            <FaSearch className={styles['search-icon']} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                // Only allow alphanumeric characters, spaces, and basic punctuation
                const filteredValue = e.target.value.replace(/[^a-zA-Z0-9\s\-._@]/g, '').slice(0, 50);
                setSearchTerm(filteredValue);
              }}
            />
          </div>

          {activeTable === 'users' && (
            <>
              <div className={styles['filter-container']}>
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="FIRST-TIME">FIRST-TIME</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </div>

              <div className={styles['filter-container']}>
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
              <div className={styles['filter-container']}>
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="FIRST-TIME">FIRST-TIME</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </div>
            </>
          )}

          {activeTable === 'locked' && (
            <>
              <div className={styles['filter-container']}>
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

          {activeTable === 'deactivated' && (
            <>
              <div className={styles['filter-container']}>
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
              <div className={styles['filter-container']}>
                <label>Filter by Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR">HR</option>
                  <option value="REPORTS">REPORTS</option>
                  <option value="CNB">CNB</option>
                </select>
              </div>
              <div className={styles['filter-container']}>
                <label>Filter by Status:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="NEED-RESET">NEED-RESET</option>
                  <option value="RESET-DONE">RESET-DONE</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </div>
            </>
          )}

          <button className={styles['add-user-btn']} onClick={() => setAddModalOpen(true)}>
            <FaPlus /> Add User
          </button>
        </div>

        <div className={styles['table-container']}>
          <div className={styles['table-navigation']}>
            <div 
              className={`${styles['nav-item']} ${activeTable === 'users' ? styles['active'] : ''}`} 
              onClick={() => setActiveTable('users')}
            >
              <FaUsers className={styles['nav-icon']} />
              <span>Users ({users.filter(user => (user.dStatus === 'ACTIVE' || user.dStatus === 'FIRST-TIME') && user.dUser_Type !== 'ADMIN').length})</span>
            </div>
            <div 
              className={`${styles['nav-item']} ${activeTable === 'admin' ? styles['active'] : ''}`} 
              onClick={() => setActiveTable('admin')}
            >
              <FaUserShield className={styles['nav-icon']} />
              <span>Admin ({users.filter(user => 
                user.dUser_Type === 'ADMIN' && 
                user.dStatus !== 'LOCKED' &&
                user.dStatus !== 'NEED-RESET' &&
                user.dStatus !== 'RESET-DONE' &&
                user.dStatus !== 'DEACTIVATED'
              ).length})</span>
            </div>
            <div 
              className={`${styles['nav-item']} ${activeTable === 'tickets' ? styles['active'] : ''}`} 
              onClick={() => setActiveTable('tickets')}
            >
              <FaTicketAlt className={styles['nav-icon']} />
              <span>Tickets ({users.filter(user => user.dStatus === 'NEED-RESET' || user.dStatus === 'RESET-DONE').length})</span>
            </div>
            <div 
              className={`${styles['nav-item']} ${activeTable === 'locked' ? styles['active'] : ''}`} 
              onClick={() => setActiveTable('locked')}
            >
              <FaLock className={styles['nav-icon']} />
              <span>Locked ({users.filter(user => user.dStatus === 'LOCKED').length})</span>
            </div>
            <div 
              className={`${styles['nav-item']} ${activeTable === 'deactivated' ? styles['active'] : ''}`} 
              onClick={() => setActiveTable('deactivated')}
            >
              <FaUserSlash className={styles['nav-icon']} />
              <span>Deactivated ({users.filter(user => user.dStatus === 'DEACTIVATED').length})</span>
            </div>
          </div>
          <div className={styles['table-wrapper']}>
            {activeTable === 'users' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className={styles['employee-id-col']} onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['name-col']} onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['email-col']} onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['role-col']} onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['status-col']} onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['actions-col']}>
                        <div className={styles['actions-header']}>
                          Actions
                          <div className={styles['select-all-container']}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => String(user.dUser_ID)));
                                  // When selecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                } else {
                                  setSelectedUsers([]);
                                  // When deselecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                }
                              }}
                            />
                            <span className={styles['selected-count']}>
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
                        key={user.dLogin_ID || user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onMouseDown={e => {
                          // Only handle row selection if not clicking on a checkbox or button
                          if (
                            e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
                          ) return;
                          if (
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'svg' ||
                            e.target.tagName === 'path'
                          ) return;
                          setIsDragging(true);
                          setDragLastIndex(index);
                          setDragToggled(new Set([index]));
                          setSelectedUsers(prev => {
                            if (prev.includes(user.dUser_ID)) {
                              return prev.filter(id => id !== user.dUser_ID);
                            } else {
                              return [...prev, user.dUser_ID];
                            }
                          });
                        }}
                        onMouseEnter={() => {
                          if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                            // Get all indices between dragLastIndex and current index
                            const start = Math.min(dragLastIndex, index);
                            const end = Math.max(dragLastIndex, index);
                            const indicesToToggle = [];
                            for (let i = start; i <= end; i++) {
                              if (!dragToggled.has(i)) {
                                indicesToToggle.push(i);
                              }
                            }
                            if (indicesToToggle.length > 0) {
                              setSelectedUsers(prev => {
                                let newSelected = [...prev];
                                indicesToToggle.forEach(i => {
                                  const rowUser = sortedUsers[i];
                                  if (!rowUser) return;
                                  if (newSelected.includes(rowUser.dUser_ID)) {
                                    newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                                  } else {
                                    newSelected.push(rowUser.dUser_ID);
                                  }
                                });
                                return newSelected;
                              });
                              setDragToggled(prevSet => {
                                const newSet = new Set(prevSet);
                                indicesToToggle.forEach(i => newSet.add(i));
                                return newSet;
                              });
                            }
                            setDragLastIndex(index);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragLastIndex(null);
                          setDragToggled(new Set());
                        }}
                      >
                        <td>{user.dUser_ID}</td>
                        <td>{user.dName}</td>
                        <td>{user.dEmail}</td>
                        <td>{user.dUser_Type}</td>
                        <td>{user.dStatus}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <button onClick={() => handleEdit(user)} className={styles['edit-btn']}>
                              <FaEdit size={12} /> Edit
                            </button>
                              <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowLockModal(true);
                              }}
                              className={styles['lock-btn']}
                            >
                              <FaLock size={12} /> Lock
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowDeactivateModal(true);
                              }}
                              className={styles['deactivate-btn']}
                            >
                              <FaUserSlash size={12} /> Deactivate
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                // Only handle checkbox toggle, prevent row click
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
              {activeTable === 'admin' && (
                tabFilteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                    No users found.
                  </div>
                ) : (
                <table>
                  <thead>
                    <tr>
                      <th className={styles['employee-id-col']} onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['name-col']} onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['email-col']} onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['role-col']} onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['status-col']} onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['actions-col']}>
                        <div className={styles['actions-header']}>
                          Actions
                          <div className={styles['select-all-container']}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                                  // When selecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                } else {
                                  setSelectedUsers([]);
                                  // When deselecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                }
                              }}
                            />
                            <span className={styles['selected-count']}>
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
                        key={user.dLogin_ID || user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onMouseDown={e => {
                          // Only handle row selection if not clicking on a checkbox or button
                          if (
                            e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
                          ) return;
                          if (
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'svg' ||
                            e.target.tagName === 'path'
                          ) return;
                          setIsDragging(true);
                          setDragLastIndex(index);
                          setDragToggled(new Set([index]));
                          setSelectedUsers(prev => {
                            if (prev.includes(user.dUser_ID)) {
                              return prev.filter(id => id !== user.dUser_ID);
                            } else {
                              return [...prev, user.dUser_ID];
                            }
                          });
                        }}
                        onMouseEnter={() => {
                          if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                            // Get all indices between dragLastIndex and current index
                            const start = Math.min(dragLastIndex, index);
                            const end = Math.max(dragLastIndex, index);
                            const indicesToToggle = [];
                            for (let i = start; i <= end; i++) {
                              if (!dragToggled.has(i)) {
                                indicesToToggle.push(i);
                              }
                            }
                            if (indicesToToggle.length > 0) {
                              setSelectedUsers(prev => {
                                let newSelected = [...prev];
                                indicesToToggle.forEach(i => {
                                  const rowUser = sortedUsers[i];
                                  if (!rowUser) return;
                                  if (newSelected.includes(rowUser.dUser_ID)) {
                                    newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                                  } else {
                                    newSelected.push(rowUser.dUser_ID);
                                  }
                                });
                                return newSelected;
                              });
                              setDragToggled(prevSet => {
                                const newSet = new Set(prevSet);
                                indicesToToggle.forEach(i => newSet.add(i));
                                return newSet;
                              });
                            }
                            setDragLastIndex(index);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragLastIndex(null);
                          setDragToggled(new Set());
                        }}
                      >
                        <td>{user.dUser_ID}</td>
                        <td>{user.dName}</td>
                        <td>{user.dEmail}</td>
                        <td>{user.dUser_Type}</td>
                        <td>{user.dStatus}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <button onClick={() => handleEdit(user)} className={styles['edit-btn']}>
                              <FaEdit size={12} /> Edit
                            </button>
                              <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowLockModal(true);
                              }}
                              className={styles['lock-btn']}
                            >
                              <FaLock size={12} /> Lock
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowDeactivateModal(true);
                              }}
                              className={styles['deactivate-btn']}
                            >
                              <FaUserSlash size={12} /> Deactivate
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                // Only handle checkbox toggle, prevent row click
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
                      <th className={styles['employee-id-col']} onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['name-col']} onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['email-col']} onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['role-col']} onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['status-col']} onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['actions-col']}>
                        <div className={styles['actions-header']}>
                          Actions
                          <div className={styles['select-all-container']}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                                  // When selecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                } else {
                                  setSelectedUsers([]);
                                  // When deselecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                }
                              }}
                            />
                            <span className={styles['selected-count']}>
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
                        key={user.dLogin_ID || user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onMouseDown={e => {
                          // Only handle row selection if not clicking on a checkbox or button
                          if (
                            e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
                          ) return;
                          if (
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'svg' ||
                            e.target.tagName === 'path'
                          ) return;
                          setIsDragging(true);
                          setDragLastIndex(index);
                          setDragToggled(new Set([index]));
                          setSelectedUsers(prev => {
                            if (prev.includes(user.dUser_ID)) {
                              return prev.filter(id => id !== user.dUser_ID);
                            } else {
                              return [...prev, user.dUser_ID];
                            }
                          });
                        }}
                        onMouseEnter={() => {
                          if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                            // Get all indices between dragLastIndex and current index
                            const start = Math.min(dragLastIndex, index);
                            const end = Math.max(dragLastIndex, index);
                            const indicesToToggle = [];
                            for (let i = start; i <= end; i++) {
                              if (!dragToggled.has(i)) {
                                indicesToToggle.push(i);
                              }
                            }
                            if (indicesToToggle.length > 0) {
                              setSelectedUsers(prev => {
                                let newSelected = [...prev];
                                indicesToToggle.forEach(i => {
                                  const rowUser = sortedUsers[i];
                                  if (!rowUser) return;
                                  if (newSelected.includes(rowUser.dUser_ID)) {
                                    newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                                  } else {
                                    newSelected.push(rowUser.dUser_ID);
                                  }
                                });
                                return newSelected;
                              });
                              setDragToggled(prevSet => {
                                const newSet = new Set(prevSet);
                                indicesToToggle.forEach(i => newSet.add(i));
                                return newSet;
                              });
                            }
                            setDragLastIndex(index);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragLastIndex(null);
                          setDragToggled(new Set());
                        }}
                      >
                        <td>{user.dUser_ID}</td>
                        <td>{user.dName}</td>
                        <td>{user.dEmail}</td>
                        <td>{user.dUser_Type}</td>
                        <td>{user.dStatus}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <button onClick={() => handleEdit(user)} className={styles['edit-btn']}>
                              <FaEdit size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowLockModal(true);
                              }}
                              className={styles['lock-btn']}
                            >
                              <FaLock size={12} /> Lock
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowDeactivateModal(true);
                              }}
                              className={styles['deactivate-btn']}
                            >
                              <FaUserSlash size={12} /> Deactivate
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                // Only handle checkbox toggle, prevent row click
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
            {activeTable === 'locked' && (
              getFilteredUsers().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
                  No locked users found.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className={styles['employee-id-col']} onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['name-col']} onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['email-col']} onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['role-col']} onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['status-col']} onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['actions-col']}>
                        <div className={styles['actions-header']}>
                          Actions
                          <div className={styles['select-all-container']}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                } else {
                                  setSelectedUsers([]);
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                }
                              }}
                            />
                            <span className={styles['selected-count']}>
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
                        key={user.dLogin_ID || user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onMouseDown={e => {
                          if (
                            e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
                          ) return;
                          if (
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'svg' ||
                            e.target.tagName === 'path'
                          ) return;
                          setIsDragging(true);
                          setDragLastIndex(index);
                          setDragToggled(new Set([index]));
                          setSelectedUsers(prev => {
                            if (prev.includes(user.dUser_ID)) {
                              return prev.filter(id => id !== user.dUser_ID);
                            } else {
                              return [...prev, user.dUser_ID];
                            }
                          });
                        }}
                        onMouseEnter={() => {
                          if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                            const start = Math.min(dragLastIndex, index);
                            const end = Math.max(dragLastIndex, index);
                            const indicesToToggle = [];
                            for (let i = start; i <= end; i++) {
                              if (!dragToggled.has(i)) {
                                indicesToToggle.push(i);
                              }
                            }
                            if (indicesToToggle.length > 0) {
                              setSelectedUsers(prev => {
                                let newSelected = [...prev];
                                indicesToToggle.forEach(i => {
                                  const rowUser = sortedUsers[i];
                                  if (!rowUser) return;
                                  if (newSelected.includes(rowUser.dUser_ID)) {
                                    newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                                  } else {
                                    newSelected.push(rowUser.dUser_ID);
                                  }
                                });
                                return newSelected;
                              });
                              setDragToggled(prevSet => {
                                const newSet = new Set(prevSet);
                                indicesToToggle.forEach(i => newSet.add(i));
                                return newSet;
                              });
                            }
                            setDragLastIndex(index);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragLastIndex(null);
                          setDragToggled(new Set());
                        }}
                      >
                        <td>{user.dUser_ID}</td>
                        <td>{user.dName}</td>
                        <td>{user.dEmail}</td>
                        <td>{user.dUser_Type}</td>
                        <td>{user.dStatus}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <button onClick={() => handleEdit(user)} className={styles['edit-btn']}>
                              <FaEdit size={12} /> Edit
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUsers([user.dUser_ID]);
                                  setShowUnlockModal(true);
                                }}
                                className={styles['unlock-btn']}
                                style={{ backgroundColor: '#0a7', color: 'white' }}
                              >
                                <FaLockOpen size={12} /> Unlock
                              </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
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
                      <th className={styles['employee-id-col']} onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
                        Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['name-col']} onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
                        Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['email-col']} onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
                        Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['role-col']} onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
                        Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['status-col']} onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
                      </th>
                      <th className={styles['actions-col']}>
                        <div className={styles['actions-header']}>
                          Actions
                          <div className={styles['select-all-container']}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                                  // When selecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                } else {
                                  setSelectedUsers([]);
                                  // When deselecting all, clear anchor/last
                                  setAnchorSelectedIndex(null);
                                  setLastSelectedIndex(null);
                                }
                              }}
                            />
                            <span className={styles['selected-count']}>
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
                        key={user.dLogin_ID || user.dUser_ID}
                        className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
                        onMouseDown={e => {
                          // Only handle row selection if not clicking on a checkbox or button
                          if (
                            e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
                          ) return;
                          if (
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'svg' ||
                            e.target.tagName === 'path'
                          ) return;
                          setIsDragging(true);
                          setDragLastIndex(index);
                          setDragToggled(new Set([index]));
                          setSelectedUsers(prev => {
                            if (prev.includes(user.dUser_ID)) {
                              return prev.filter(id => id !== user.dUser_ID);
                            } else {
                              return [...prev, user.dUser_ID];
                            }
                          });
                        }}
                        onMouseEnter={() => {
                          if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                            // Get all indices between dragLastIndex and current index
                            const start = Math.min(dragLastIndex, index);
                            const end = Math.max(dragLastIndex, index);
                            const indicesToToggle = [];
                            for (let i = start; i <= end; i++) {
                              if (!dragToggled.has(i)) {
                                indicesToToggle.push(i);
                              }
                            }
                            if (indicesToToggle.length > 0) {
                              setSelectedUsers(prev => {
                                let newSelected = [...prev];
                                indicesToToggle.forEach(i => {
                                  const rowUser = sortedUsers[i];
                                  if (!rowUser) return;
                                  if (newSelected.includes(rowUser.dUser_ID)) {
                                    newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                                  } else {
                                    newSelected.push(rowUser.dUser_ID);
                                  }
                                });
                                return newSelected;
                              });
                              setDragToggled(prevSet => {
                                const newSet = new Set(prevSet);
                                indicesToToggle.forEach(i => newSet.add(i));
                                return newSet;
                              });
                            }
                            setDragLastIndex(index);
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragLastIndex(null);
                          setDragToggled(new Set());
                        }}
                      >
                        <td>{user.dUser_ID}</td>
                        <td>{user.dName}</td>
                        <td>{user.dEmail}</td>
                        <td>{user.dUser_Type}</td>
                        <td>{user.dStatus}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                              <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowDeleteModal(true);
                              }}
                              className={styles['delete-btn']}
                              style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                              <FaTrash size={12} /> Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUsers([user.dUser_ID]);
                                setShowRestoreModal(true);
                              }}
                              className={styles['restore-btn']}
                              style={{ backgroundColor: '#0a7', color: 'white' }}
                            >
                              <FaKey size={12} /> Restore
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.dUser_ID)}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                // Only handle checkbox toggle, prevent row click
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
          {selectedUsers.length > 0 && activeTable !== 'deactivated' && activeTable !== 'locked' && (
            <div className={styles['batch-actions-container']}>
              <button
                className={styles['lock-all-btn']}
                onClick={() => setShowLockModal(true)}
              >
                <FaLock /> Lock Selected ({selectedUsers.length})
              </button>
              <button
                className={styles['deactivate-all-btn']}
                onClick={() => setShowDeactivateModal(true)}
              >
                <FaUserSlash /> Deactivate Selected ({selectedUsers.length})
              </button>
            </div>
          )}

          {selectedUsers.length > 0 && activeTable === 'locked' && (
            <div className={styles['batch-actions-container']}>
              <button
                className={styles['unlock-all-btn']}
                onClick={() => setShowUnlockModal(true)}
                style={{ backgroundColor: '#0a7', color: 'white' }}
              >
                <FaLockOpen /> Unlock Selected ({selectedUsers.length})
              </button>
            </div>
          )}

          {selectedUsers.length > 0 && activeTable === 'deactivated' && (
            <div className={styles['batch-actions-container']}>
              <button
                className={styles['delete-all-btn']}
                onClick={() => setShowDeleteModal(true)}
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                <FaTrash /> Delete Selected ({selectedUsers.length})
              </button>
              <button
                className={styles['restore-all-btn']}
                onClick={() => setShowRestoreModal(true)}
                style={{ backgroundColor: '#0a7', color: 'white' }}
              >
                <FaKey /> Restore Selected ({selectedUsers.length})
              </button>
            </div>
          )}
      </div>

      {/* Lock Confirmation Modal */}
      {showLockModal && (
      <div className="modal-overlay">
        <div className="modal lock-confirmation-modal">
          <div className="modal-header">
            <h2><FaLock /> Confirm Lock</h2>
          </div>
          <div className="modal-content">
            <p>
              You are about to <strong>LOCK</strong> {selectedUsers.length} user(s).
              This will prevent them from logging in.
            </p>
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
            <input
              type="text"
              value={lockConfirmText}
              onChange={(e) => setLockConfirmText(e.target.value.slice(0, 4))}
              placeholder="Type LOCK to confirm"
              className="lock-confirm-input"
              maxLength={4}
              onInput={e => {
                e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4);
              }}
            />
          </div>
          <div className="modal-actions">
            <button 
              className="cancel-btn" 
              onClick={() => {
                setShowLockModal(false);
                setLockConfirmText('');
              }}
            >
              Cancel
            </button>
              <button
                className="user-lock-btn"
                disabled={lockConfirmText !== 'LOCK'}
                onClick={handleLockUsers}
                style={{ backgroundColor: '#0a7', color: 'white' }}
              >
                <FaLock /> Lock Users
              </button>
          </div>
        </div>
      </div>
    )}

    {/* Lock Result Modal */}
    {showLockResultModal && (
      <div className="modal-overlay">
        <div className="modal" style={{ width: '400px' }}>
          <div className="modal-header">
            <h2>{lockResultSuccess ? 'Lock Successful' : 'Lock Failed'}</h2>
          </div>
          <p>{lockResultMessage}</p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="save-btn" 
              ref={lockResultOkBtnRef}
              onClick={() => setShowLockResultModal(false)}
              onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="modal-overlay">
          <div className="modal unlock-confirmation-modal">
            <div className="modal-header">
              <h2><FaLockOpen /> Confirm Unlock</h2>
            </div>
            <div className="modal-content">
              <p>
                You are about to <strong>UNLOCK</strong> {selectedUsers.length} user(s).
                This will allow them to log in again.
              </p>
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
              <input
                type="text"
                value={unlockConfirmText}
                onChange={(e) => setUnlockConfirmText(e.target.value.slice(0, 6))}
                placeholder="Type UNLOCK to confirm"
                className="unlock-confirm-input"
                maxLength={6}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 6);
                }}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className="unlock-btn"
                disabled={unlockConfirmText !== 'UNLOCK'}
                onClick={handleUnlockUsers}
                style={{ backgroundColor: '#0a7', color: 'white' }}
              >
                <FaLockOpen /> Unlock Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Result Modal */}
      {showUnlockResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{unlockResultSuccess ? 'Unlock Successful' : 'Unlock Failed'}</h2>
            </div>
            <p>{unlockResultMessage}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="save-btn" 
                ref={unlockResultOkBtnRef}
                onClick={() => setShowUnlockResultModal(false)}
                onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal usermanagement-deactivate-confirmation-modal">
            <div className="modal-header">
              <h2><FaUserSlash /> Confirm Deactivation</h2>
            </div>
            <div className="modal-content">
              <p>
                You are about to <strong>DEACTIVATE</strong> {selectedUsers.length} user(s).
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
                value={deactivateConfirmText}
                onChange={(e) => setDeactivateConfirmText(e.target.value.slice(0, 10))}
                placeholder="Type DEACTIVATE to confirm"
                className="deactivate-confirm-input"
                maxLength={10}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 10);
                }}
                ref={deactivateConfirmInputRef}
                onKeyDown={e => { if (e.key === 'Enter') document.getElementById('deactivate-btn')?.click(); }}
              />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className="deactivate-btn"
                id="deactivate-btn"
                disabled={deactivateConfirmText.trim() !== 'DEACTIVATE'}
                onClick={() => {
                  setLastDeactivateCount(selectedUsers.length);
                  handleDeactivateUsers();
                }}
              >
                <FaUserSlash /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Result Modal */}
      {showDeactivateResultModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>{deactivateResultSuccess ? 'Deactivation Successful' : 'Deactivation Failed'}</h2>
            </div>
            <p>{
              deactivateResultSuccess
                ? (lastDeactivateCount === 1
                    ? 'User deactivated successfully!'
                    : `Users (${lastDeactivateCount}) deactivated successfully!`)
                : deactivateResultMessage
            }</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="save-btn" 
                ref={deactivateResultOkBtnRef} 
                onClick={() => setShowDeactivateResultModal(false)} 
                onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="add-user-modal">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button onClick={handleClose} className="close-btn">
                <FaTimes />
              </button>
            </div>

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
            {uploadMethod === 'individual' && (
              <div className="modal-subtitle subtitle-aligned">Enter the details for the new user.</div>
            )}

            {uploadMethod === 'individual' ? (
              <div className="individual-upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      ref={el => { employeeIdRef.current = el; addFirstInputRef.current = el; }}
                      required
                      maxLength={10}
                      minLength={10}
                      pattern="[0-9]{10}"
                      onInput={e => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') document.getElementById('add-user-btn')?.click(); }}
                    />
                    {addUserMessage?.type === 'error' && addUserMessage.errors?.employeeId && (
                      <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>
                        {addUserMessage.errors.employeeId}
                      </div>
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
                        e.target.value = e.target.value
                          .replace(/\s+/g, '')
                          .replace(/([@\-_. ,])\1+/g, '$1')
                          .replace(/^[@\-_. ,]+/, '');
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') document.getElementById('add-user-btn')?.click(); }}
                    />
                    {addUserMessage?.type === 'error' && addUserMessage.errors?.email && (
                      <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>
                        {addUserMessage.errors.email}
                      </div>
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
                        let v = e.target.value;
                        v = v.replace(/[^A-Za-z\-_. ,]/g, ''); // Only allow letters and allowed special chars, NO numbers
                        v = v.replace(/^[ ]+/, ''); // No space at start
                        v = v.replace(/([\-_. ,])\1+/g, '$1'); // No consecutive special chars
                        v = v.replace(/ +/g, ' '); // Collapse multiple spaces
                        v = v.replace(/^[\-_. ,]+/, ''); // No special char at start
                        // Prevent consecutive spaces at end
                        if (v.length > 1 && v[v.length - 1] === ' ' && v[v.length - 2] === ' ') {
                          v = v.slice(0, -1);
                        }
                        e.target.value = v;
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') document.getElementById('add-user-btn')?.click(); }}
                    />
                    {addUserMessage?.type === 'error' && Array.isArray(addUserMessage.errors?.name) && addUserMessage.errors.name.map((msg, i) => (
                      <div key={i} style={{ color: 'red', fontSize: 13, marginTop: 2 }}>{msg}</div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>Department/Role</label>
                    <select
                      name="role"
                      ref={roleRef}
                      defaultValue=""
                    >
                      <option value="">Select a role</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="HR">HR</option>
                      <option value="REPORTS">REPORTS</option>
                      <option value="CNB">CNB</option>
                    </select>
                    {addUserMessage?.type === 'error' && addUserMessage.errors?.role && (
                      <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>
                        {addUserMessage.errors.role}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                  {addUserMessage?.type === 'error' && (
                      <div style={{ color: 'red', fontWeight: 500, marginLeft: 8, minWidth: 180, textAlign: 'left' }}>
                        {addUserMessage.errors?.general}
                      </div>
                  )}
                  {addUserMessage?.type === 'success' && (
                    <div style={{ color: 'green', fontWeight: 500, marginLeft: 8, minWidth: 180, textAlign: 'left' }}>
                      {addUserMessage.text}
                    </div>
                  )}
                  <button
                    className="add-user-btn"
                    id="add-user-btn"
                    onClick={handleAddUser}
                  >
                    Add User
                  </button>
                </div>
                {/* Recently Added Section */}
                {recentlyAddedUsers.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3>Recently Added ({recentlyAddedUsers.length})</h3>
                    <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 4, border: '1px solid #f0f0f0', background: '#fafbfc' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
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
                          {recentlyAddedUsers.slice(0, Math.max(5, recentlyAddedUsers.length)).map((user, idx) => (
                            <tr key={`recently-added-${idx}`}>
                              <td>{user.employeeId}</td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role}</td>
                              <td>
                                <button style={{ color: '#1976d2', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleUndoUser(user)}>Undo</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <button style={{ color: '#1976d2', border: '1px solid #1976d2', background: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }} onClick={handleUndoAll}>Undo All</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles['bulk-upload-form']}>
                <div className={styles['bulk-upload-actions']}>
                  <h3><FaUpload /> Upload Users</h3>
                  <button onClick={generateTemplate} className={styles['generate-template-btn']}>
                    <FaFileDownload /> Generate Template
                  </button>
                </div>

                {!file && (
                  <div
                    className={`${styles['drop-zone']} ${dragActive ? styles['active'] : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className={styles['drop-zone-content']}>
                      <p>Drag and drop your file here or</p>
                      <p>CSV or Excel files only (max 5MB)</p>
                      <input
                        type="file"
                        id="file-upload"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-upload" className={styles['browse-files-btn']}>
                        Browse Files
                      </label>
                    </div>
                  </div>
                )}

                {file && (
                  <div className={styles['file-preview']} style={{ marginTop: 0 }}>
                    <span>📄 {file.name}</span>
                    <button onClick={removeFile} className={styles['remove-file-btn']}>
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
                        onChange={e => {
                          // Only allow alphanumeric characters, spaces, and basic punctuation
                          const filteredValue = e.target.value.replace(/[^a-zA-Z0-9\s\-._@]/g, '').slice(0, 50);
                          setDebouncedBulkSearchTerm(filteredValue);
                        }}
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
                    <div className={styles['upload-preview']}>
                      <div className={styles['preview-tabs']}>
                        <button
                          className={`${styles['preview-tab']} ${previewTab === 'valid' ? styles['active'] : ''}`}
                          onClick={() => setPreviewTab('valid')}
                          disabled={bulkUsers.length === 0}
                        >
                          Valid ({bulkUsers.length})
                        </button>
                        <button
                          className={`${styles['preview-tab']} ${previewTab === 'invalid' ? styles['active'] : ''}`}
                          onClick={() => setPreviewTab('invalid')}
                          disabled={invalidUsers.length === 0}
                        >
                          Invalid ({invalidUsers.length})
                        </button>
                      </div>

                      <div className={styles['preview-content']}>
                        {previewTab === 'valid' && bulkUsers.length > 0 && (
                          <>
                            {/* Controls above the table, only shown if there are users */}
                            <div className={styles['valid-users-table']}>
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
                                  {filteredBulkUsers.map((user, index) => (
                                    <tr key={`valid-${index}`}>
                                      <td>{user.employeeId}</td>
                                      <td>{user.name}</td>
                                      <td>{user.email}</td>
                                      <td>{user.role}</td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            className={styles['remove-btn']}
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
                          <div className={styles['invalid-users-table']}>
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
                                    <td className={styles['reason-cell']} title={user.reasons && user.reasons.join(', ')}>
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

                <div className={styles['modal-actions']} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className={styles['cancel-btn']} onClick={handleClose}>Cancel</button>
                  <button
                    onClick={() => setShowBulkConfirmModal(true)}
                    className={styles['save-btn']}
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
          <div className="modal usermanagement-delete-confirmation-modal">
            <div className="modal-header">
              <h2><FaTrash /> Confirm Deletion</h2>
            </div>
            <div className="modal-content">
              <p>
                You are about to <strong>DELETE</strong> {selectedUsers.length} user(s). 
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
                onChange={(e) => setDeleteConfirmText(e.target.value.slice(0, 7))}
                placeholder="Type DELETE to confirm"
                className="delete-confirm-input"
                maxLength={7}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                }}
                ref={deleteConfirmInputRef}
                onKeyDown={e => { if (e.key === 'Enter') document.getElementById('delete-permanently-btn')?.click(); }}
              />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
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
                id="delete-permanently-btn"
                disabled={deleteConfirmText.trim() !== 'DELETE'}
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

      {/* Delete Warning Modal */}
      {showDeleteWarningModal && (
        <div className="modal-overlay">
          <div className="modal usermanagement-delete-warning-modal">
            <div className="modal-header">
              <h2><FaTrash /> Warning: Permanent Deletion</h2>
            </div>
            <div className="modal-content">
              <div style={{ 
                backgroundColor: '#fff5f5', 
                border: '1px solid #dc3545', 
                borderRadius: '4px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}>
                <p style={{ color: '#dc3545', fontWeight: 'bold', marginBottom: '8px' }}>
                  ⚠️ This action cannot be undone!
                </p>
                <p style={{ color: '#dc3545' }}>
                  Continuing this action will permanently delete the selected user(s) from the system.
                  All associated data will be permanently lost.
                </p>
              </div>
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
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteWarningModal(false);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleConfirmPermanentDelete}
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                <FaTrash /> Yes, Delete Permanently
              </button>
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
              <button className="save-btn" ref={deleteResultOkBtnRef} onClick={() => setShowDeleteResultModal(false)} onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal-overlay">
          <div className="modal restore-confirmation-modal">
            <div className="modal-header">
              <h2 style={{ color: '#0a7', display: 'flex', alignItems: 'center', gap: 8 }}><FaKey style={{ color: '#0a7' }} /> Confirm Restoration</h2>
            </div>
            <div className="modal-content">
              <p>
                You are about to restore {selectedUsers.length} user(s). This will change their status to FIRST-TIME.
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
                onChange={(e) => setRestoreConfirmText(e.target.value.slice(0, 7))}
                placeholder="Type RESTORE to confirm"
                className="delete-confirm-input"
                maxLength={7}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                }}
                ref={restoreConfirmInputRef}
                onKeyDown={e => { if (e.key === 'Enter') document.getElementById('restore-btn')?.click(); }}
              />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
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
                id="restore-btn"
                disabled={restoreConfirmText.trim() !== 'RESTORE'}
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
              <button className="save-btn" ref={restoreResultOkBtnRef} onClick={() => setShowRestoreResultModal(false)} onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* No Changes Modal */}
      {showNoChangesModal && (
        <div className="modal-overlay no-changes-modal">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>No Changes</h2>
            </div>
            <div className="modal-content">
            <p>No changes were made.</p>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="save-btn" 
                ref={noChangesOkBtnRef} 
                onClick={() => setShowNoChangesModal(false)} 
                onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionErrorModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>Action Failed</h2>
            </div>
            <p style={{ color: '#b00', fontWeight: 500 }}>{actionErrorMessage}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" ref={actionErrorOkBtnRef} onClick={() => setShowActionErrorModal(false)} onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && currentUser && (
        <div className="modal-overlay">
          <div className="edit-user-modal">
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Edit User</h2>
            </div>
            <div className="edit-user-flex-row">
              {/* Left column: Employee ID, Email, Name, Role, Status */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="employee-id-label-row">
                    <label htmlFor="employee-id-input">
                      Employee ID:
                      <FaLock className="locked-indicator" title="Field cannot be changed" style={{ marginLeft: 8, color: '#888' }} />
                    </label>
                  </div>
                  <input
                      id="employee-id-input"
                      type="text"
                      name="employeeId"
                      value={currentUser.dUser_ID}
                      ref={editFirstInputRef}
                      readOnly={true}
                      className="disabled-input"
                      style={{ 
                        background: '#f5f5f5',
                        color: '#666',
                        cursor: 'not-allowed'
                      }}
                    />
                  {(editFormSubmitted || editFieldTouched.dUser_ID) && editUserErrors.dUser_ID && (
                    <div className="error-message" style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '4px' }}>
                      {editUserErrors.dUser_ID}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={currentUser.dEmail}
                    onInput={e => {
                      // Remove all whitespace immediately as user types
                      e.target.value = e.target.value.replace(/\s+/g, '');
                    }}
                    onChange={e => {
                      const raw = e.target.value;
                      // Remove all whitespace, collapse consecutive special chars, no special char at start
                      let value = raw
                        .replace(/\s+/g, '') // Remove all whitespace (no spaces allowed)
                        .replace(/([@\-_.\,])\1+/g, '$1') // No consecutive special chars
                        .replace(/^[@\-_.\,]+/, ''); // No special char as first char
                      setCurrentUser({ ...currentUser, dEmail: value.toLowerCase() });
                      setEditFieldTouched(prev => ({ ...prev, dEmail: true }));
                      if (editUserErrors.dEmail) {
                        setEditUserErrors(prev => ({ ...prev, dEmail: undefined }));
                      }
                    }}
                    onBlur={() => setEditFieldTouched(prev => ({ ...prev, dEmail: true }))}
                    className={editUserErrors.dEmail ? 'error-input' : ''}
                    required
                    maxLength={50}
                    style={{ borderColor: editUserErrors.dEmail ? '#ff4444' : undefined }}
                    onKeyDown={e => { if (e.key === 'Enter') document.getElementById('save-changes-btn')?.click(); }}
                  />
                  {(editFormSubmitted || editFieldTouched.dEmail) && editUserErrors.dEmail && (
                    <div className="error-message" style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '4px' }}>
                      {editUserErrors.dEmail}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Name:</label>
                  <input
                  type="text"
                  name="name"
                  value={currentUser.dName}
                  onChange={e => {
                    const raw = e.target.value;
                    // Only allow letters and allowed special chars, NO numbers
                    let value = raw.replace(/[^A-Za-z\-_. ,]/g, '');
                    value = value.replace(/([\-_. ,])\1+/g, '$1');
                    value = value.replace(/^[\-_. ,]+/, '');
                    setCurrentUser({...currentUser, dName: value});
                    setEditFieldTouched(prev => ({ ...prev, dName: true }));
                    if (editUserErrors.dName) {
                      setEditUserErrors(prev => ({ ...prev, dName: undefined }));
                    }
                  }}
                  onBlur={() => setEditFieldTouched(prev => ({ ...prev, dName: true }))}
                  className={editUserErrors.dName ? 'error-input' : ''}
                  required
                  maxLength={50}
                  style={{ borderColor: editUserErrors.dName ? '#ff4444' : undefined }}
                  onKeyDown={e => { if (e.key === 'Enter') document.getElementById('save-changes-btn')?.click(); }}
                />
                  {(editFormSubmitted || editFieldTouched.dName) && editUserErrors.dName && (
                    <div className="error-message" style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '4px' }}>
                      {editUserErrors.dName}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>
                    Role:
                    {activeTable === 'admin' && (
                      <FaLock className="locked-indicator" title="Field cannot be changed" style={{ marginLeft: 8, color: '#888' }} />
                    )}
                  </label>
                  <select
                    name="role"
                    value={currentUser.dUser_Type}
                    onChange={(e) => setCurrentUser({...currentUser, dUser_Type: e.target.value})}
                    disabled={activeTable === 'admin'}
                    style={
                      activeTable === 'admin'
                        ? { background: '#f5f5f5', color: '#666', cursor: 'not-allowed' }
                        : {}
                    }
                  >
                  {activeTable === 'users' && (
                    <>
                      <option value="HR">HR</option>
                      <option value="REPORTS">REPORTS</option>
                      <option value="CNB">CNB</option>
                    </>
                  )}
                  {activeTable === 'admin' && (
                    <option value="ADMIN">ADMIN</option>
                  )}
                  </select>
                  {editUserErrors.dUser_Type && <div style={{ color: 'red', fontSize: '0.9em', margin: '2px 0 0 0' }}>{editUserErrors.dUser_Type}</div>}
                  {editFieldTouched.dUser_Type && editUserErrors.dUser_Type && (
                    <div className="error-message" style={{ color: '#ff4444', fontSize: '0.9em', marginTop: '4px' }}>
                      {editUserErrors.dUser_Type}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Status:
                    <FaLock className="locked-indicator" title="Status cannot be changed" style={{ marginLeft: 8 }} />
                  </label>
                  <select
                    name="status"
                    value={currentUser.dStatus}
                    disabled={true}
                    style={{ 
                      background: '#f5f5f5',
                      color: '#666',
                      cursor: 'not-allowed'
                    }}
                  >
                    <option value={currentUser.dStatus}>{currentUser.dStatus}</option>
                  </select>
                </div>
              </div>
              {/* Right column: Password and Reset Account (stacked vertically) */}
              <div style={{ flex: 1, minWidth: 340, maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 24 }}>
                {/* Password section */}
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
                    <div className="iris-password-section">
                      <div className="iris-password-field">
                        <label>New Password:</label>
                        <div className="iris-password-input-wrapper">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className={`iris-password-input ${editUserErrors.password ? 'iris-password-error' : ''}`}
                            maxLength={20}
                          />
                          <button
                            type="button"
                            className="iris-password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="iris-password-field">
                        <label>Confirm Password:</label>
                        <div className="iris-password-input-wrapper">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className={`iris-password-input ${editUserErrors.confirmPassword ? 'iris-password-error' : ''}`}
                            maxLength={20}
                          />
                          <button
                            type="button"
                            className="iris-password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {editUserErrors.confirmPassword && (
                          <div className="iris-password-error-message" style={{ color: '#dc3545' }}>
                            {editUserErrors.confirmPassword[0]}
                      </div>
                      )}
                      </div>

                      {/* Password requirements below the input fields */}
                      <PasswordRequirements password={passwordData.newPassword} />
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
                        onChange={e => setResetConfirmText(e.target.value.slice(0, 7))}
                        maxLength={7}
                        style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4, marginRight: 8 }}
                        onInput={e => {
                          // Allow both cases for input
                          e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') document.getElementById('save-changes-btn')?.click(); }}
                      />
                      <button
                        className="save-btn"
                        style={{ padding: '6px 14px', fontSize: 13 }}
                        // Require uppercase for confirmation
                        disabled={resetConfirmText !== 'RESET'}
                        onClick={() => setResetConfirmed(true)}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
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
                {showNoChangesLabel && (
                  <div style={{ color: '#b00', fontWeight: 500, marginBottom: 0, background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                    No changes were made.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button
                onClick={async () => {
                  setEditFormSubmitted(true);
                  // If there are no validation errors, show the confirmation modal
                  if (
                    !(Object.values(editUserErrors).some(Boolean) ||
                      ((passwordData.newPassword || passwordData.confirmPassword) &&
                        (!areAllPasswordRequirementsMet(passwordData.newPassword) ||
                         passwordData.newPassword !== passwordData.confirmPassword)))
                  ) {
                    // Check if any changes were made
                    const hasChanges = isUserChanged(currentUser, originalUser) || 
                      resetConfirmed || 
                      (showPasswordFields && passwordData.newPassword && 
                        passwordData.newPassword === passwordData.confirmPassword) ||
                      (showSecurityQuestions && securityQuestionsData.some((q, i) => {
                        const origQ = originalUser[`dSecurity_Question${i+1}`] || '';
                        const origA = originalUser[`dAnswer_${i+1}`] || '';
                        return q.question !== origQ || q.answer !== origA;
                      }));
                    if (!hasChanges) {
                      setShowNoChangesLabel(true);
                      if (noChangesTimeoutRef.current) clearTimeout(noChangesTimeoutRef.current);
                      noChangesTimeoutRef.current = setTimeout(() => setShowNoChangesLabel(false), 2000);
                    return;
                    } else {
                      setShowNoChangesLabel(false);
                      setPendingEditUser(currentUser);
                    setShowEditConfirmModal(true);
                    }
                  }
                }}
                className="save-btn"
                id="save-changes-btn"
                disabled={
                  Object.values(editUserErrors).some(Boolean) ||
                  ((passwordData.newPassword || passwordData.confirmPassword) &&
                    (!areAllPasswordRequirementsMet(passwordData.newPassword) ||
                     passwordData.newPassword !== passwordData.confirmPassword))
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
          <div className="modal">
            <div className="modal-header">
              <h2>Confirm Bulk Upload</h2>
              <button onClick={() => setShowBulkConfirmModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <p>Are you sure you want to upload {bulkUsers.length} user/s?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => { setShowBulkConfirmModal(false); setIndividualAddError(''); }}>Cancel</button>
              <button
                onClick={() => {
                  setShowBulkConfirmModal(false);
                  handleBulkUpload();
                }}
                className="save-btn"
                ref={bulkConfirmYesBtnRef}
                onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}
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
          <div className="modal">
            <div className="modal-header">
              <h2>{bulkResultSuccess ? 'Upload Successful' : 'Upload Failed'}</h2>
            </div>
            <p>{bulkResultMessage}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" ref={bulkResultOkBtnRef} onClick={() => setShowBulkResultModal(false)} onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}>OK</button>
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
            </div>
            <p>Are you sure you want to save changes to this user?</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => setShowEditConfirmModal(false)}>No</button>
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
            <p dangerouslySetInnerHTML={{ __html: editResultMessage }} />
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" ref={editResultOkBtnRef} onClick={() => setShowEditResultModal(false)} onKeyDown={e => { if (e.key === 'Enter') e.target.click(); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showAddUserErrorModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#b00' }}>Add User Error</h2>
            </div>
            <p style={{ color: '#b00', fontWeight: 500 }}>{addUserErrorDetail}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="save-btn" onClick={() => setShowAddUserErrorModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;