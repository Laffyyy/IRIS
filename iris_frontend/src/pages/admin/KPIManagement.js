// KPIManagement.js
import axios from 'axios';
import React, { useState, useCallback, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload, FaSearch, FaCheckCircle, FaCheck, FaBan } from 'react-icons/fa';

const BASE_URL = 'http://localhost:3000/api/kpis';  // Change from /admin/kpis to /api/kpis

const KPIManagement = () => {

  const categories = ['Compliance', 'Customer Experience', 'Employee Performance', 'Finance', 'Healthcare', 'Logistics', 'Operational Efficiency', 'Sales', 'Tech'];
  const behaviors = ['Lower the Better', 'Higher the Better', 'Hit or Miss'];

  const isDuplicateKPI = (name, bulkKpis = []) => {
    if (!name) return false;
    // Check against existing KPIs
    const isDuplicateInExisting = kpis.some(existingKpi => 
      existingKpi?.dKPI_Name?.toLowerCase().trim() === name.toLowerCase().trim()
    );
    // Check against current bulk upload
    const isDuplicateInBulk = bulkKpis.filter(
      bulkKpi => bulkKpi?.name?.toLowerCase().trim() === name.toLowerCase().trim()
    ).length > 1; // More than one means duplicate in bulk
    return isDuplicateInExisting || isDuplicateInBulk;
  };
  
  const [activeTab, setActiveTab] = useState('addKPI');
  const [editingKpi, setEditingKpi] = useState(null);
  const [kpis, setKpis] = useState([]);
  
  // Add this at the top with other state declarations
  const [descriptionCount, setDescriptionCount] = useState(0);
  const MAX_DESCRIPTION_LENGTH = 150;
  const MAX_NAME_LENGTH = 30;
  

  // Form states
  const [kpiName, setKpiName] = useState('');
  const [category, setCategory] = useState('');
  const [behavior, setBehavior] = useState('');
  const [description, setDescription] = useState('');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);

  // Add bulk upload states
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkKpis, setBulkKpis] = useState([]);
  const [invalidKpis, setInvalidKpis] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);

  

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [behaviorFilter, setBehaviorFilter] = useState('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  
  const ALLOWED_FILE_PATTERN = /^kpi_upload_\d{8}\.csv$/;

  const [isDuplicateName, setIsDuplicateName] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [kpiToAdd, setKpiToAdd] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [showDisableSuccessModal, setShowDisableSuccessModal] = useState(false);
  
  const [showSimpleSuccess, setShowSimpleSuccess] = useState(false);
  const [simpleSuccessMessage, setSimpleSuccessMessage] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [selectedKPIs, setSelectedKPIs] = useState([]);
  const [showBulkDisableModal, setShowBulkDisableModal] = useState(false);
  const [bulkDisableConfirmation, setBulkDisableConfirmation] = useState('');

  // Add this validation function after the existing functions
  const validateInput = (value) => {
    // Allow alphanumeric characters, spaces, and "-" character
    return value.replace(/[^a-zA-Z0-9\s-]/g, '');
  };

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // 'error' or 'success'

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKpiDetails, setSelectedKpiDetails] = useState(null);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [kpiToReactivate, setKpiToReactivate] = useState(null);

  const handleViewDetails = (kpi) => {
    setSelectedKpiDetails(kpi);
    setShowDetailsModal(true);
  };

  const showAlert = (message, type = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleFormSubmit = () => {
    if (editingKpi) {
      handleUpdateKpi();
    } else {
      // Check for duplicates in existing KPIs
      if (isDuplicateKPI(kpiName)) {
        showAlert('A KPI with this name already exists. Please use a different name.');
        return;
      }

      // Set the KPI to add and show confirmation modal
      setKpiToAdd({
        name: kpiName,
        category: category,
        behavior: behavior,
        description: description
      });
      setShowConfirmModal(true);
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const kpiData = {
        dKPI_Name: kpiToAdd.name.trim(),
        dCategory: kpiToAdd.category,
        dCalculationBehavior: kpiToAdd.behavior,
        dDescription: kpiToAdd.description || '',
        dCreatedBy: '2505170018'
      };

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(kpiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Refresh KPI list
      const refreshResponse = await fetch(BASE_URL);
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh KPI list');
      }
      const updatedKpis = await refreshResponse.json();
      setKpis(updatedKpis);

      resetForm();
      setShowConfirmModal(false);
      setSimpleSuccessMessage(`${kpiToAdd.name} has been added successfully`);
      setShowSimpleSuccess(true);

      setShowSimpleSuccess(true);

      setRecentlyAdded(prev => [
        {
          name: kpiToAdd.name,
          category: kpiToAdd.category,
          behavior: kpiToAdd.behavior,
          description: kpiToAdd.description,
          dKPI_ID: updatedKpis[updatedKpis.length - 1]?.dKPI_ID || null
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Error details:', error);
      showAlert(`Failed to add KPI: ${error.message}`);
    }
  };


  {/*// Handle file drop for bulk upload
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
      const file = e.dataTransfer.files[0];
      // Use the same validation as handleFileChange
      if (!ALLOWED_FILE_PATTERN.test(file.name)) {
        setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
        setShowValidationModal(true);
        return;
      }
      handleFile(file);
    }
  }, []); */}

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Add filename validation
        if (!ALLOWED_FILE_PATTERN.test(file.name)) {
          setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
          setShowValidationModal(true);
          // Reset the file input
          e.target.value = '';
          return;
        }
        
        handleFile(file);
      }
    };

  const handleFile = async (file) => {
    try {
      if (!ALLOWED_FILE_PATTERN.test(file.name)) {
        setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
        setShowValidationModal(true);
        resetBulkUploadState();
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const kpisToValidate = processFileContent(text);

      // Check for duplicates in existing KPIs
      if (isDuplicateKPI(kpiName)) {
        showAlert('A KPI with this name already exists. Please use a different name.');
        return;
      }
        
        if (kpisToValidate.length === 0) {
          setValidationMessage('No valid KPIs found in the file');
          setShowValidationModal(true);
          resetBulkUploadState();
          return;
        }
        



        // First, count all names in the file
        const nameCounts = {};
        kpisToValidate.forEach(kpi => {
          const key = kpi.name?.toLowerCase().trim();
          if (key) {
            nameCounts[key] = (nameCounts[key] || 0) + 1;
          }
        });

        const validKpis = [];
        const invalidKpis = [];

        kpisToValidate.forEach(kpi => {
          let isValid = true;
          let reason = '';
          const key = kpi.name?.toLowerCase().trim();

          if (!kpi.name) {
            isValid = false;
            reason = 'Missing KPI name';
          } else if (kpis.some(existingKpi => existingKpi.dKPI_Name.toLowerCase().trim() === key)) {
            isValid = false;
            reason = 'KPI name already exists in database';
          } else if (nameCounts[key] > 1) {
            isValid = false;
            reason = 'Duplicate KPI name in CSV file';
          } else if (!kpi.category || !kpi.behavior) {
            isValid = false;
            reason = 'Missing required fields';
          } else if (!categories.includes(kpi.category)) {
            isValid = false;
            reason = 'Invalid category';
          } else if (!behaviors.includes(kpi.behavior)) {
            isValid = false;
            reason = 'Invalid behavior';
          }

          if (isValid) {
            validKpis.push(kpi);
          } else {
            invalidKpis.push({ ...kpi, reason });
          }
        });

        setFile(file);
        setBulkKpis(validKpis);
        setInvalidKpis(invalidKpis);
        setPreviewTab(invalidKpis.length > 0 ? 'invalid' : 'valid');
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setValidationMessage('Error processing file. Please check the file format.');
      setShowValidationModal(true);
      resetBulkUploadState();
    }
  };

  // Remove uploaded file
  const removeFile = () => {
      resetBulkUploadState();
  };

  // Generate template for bulk upload
  const generateTemplate = () => {
    const csvHeader = "KPI Name,Category,Behavior,Description,,,Valid Input Reference";
    const exampleData = [
      "Revenue Growth,Financial,Higher the Better,Measures growth in total revenue,,,Valid Categories: Compliance, Customer Experience, Employee Performance, Finance, Healthcare, Logistics, Operational Efficiency, Sales, Tech",
      "Customer Satisfaction,Customer Experience,Lower the Better,Measures overall customer satisfaction,,,Valid Behaviors: Lower the Better, Higher the Better, Hit or Miss",
      "Employee Turnover,Employee Performance,Lower the Better,Tracks employee turnover rate"
    ];

    // Combine header and data rows
    const fileContent = [csvHeader, ...exampleData].join('\n');

    const today = new Date();
    const dateString = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
    
    const filename = `kpi_upload_${dateString}.csv`;

    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFileContent = (text) => {
    try {
      const rows = text.split('\n')
        .filter(row => row.trim() !== '' && !row.startsWith(',,,'));

      const headers = rows[0].split(',').map(header => header.trim());
      const structureValidation = validateCSVStructure(headers);
      
      if (!structureValidation.isValid) {
        showAlert(structureValidation.errors.length > 0 ? structureValidation.errors : 'Invalid CSV structure.');
        return [];
      }

      const dataRows = rows.slice(1)
        .filter(row => row.trim())
        .map(row => {
          const columns = row.split(',');
          if (columns[0]?.trim()) {
            const name = columns[0]?.trim();
            const category = columns[1]?.trim();
            const behavior = columns[2]?.trim();
            const description = columns[3]?.trim();

            let isValid = true;
            let reason = '';

            // Case-insensitive category check
            const categoryMatch = categories.find(
              cat => cat.toLowerCase() === category.toLowerCase()
            );
            
            // Case-insensitive behavior check
            const behaviorMatch = behaviors.find(
              beh => beh.toLowerCase() === behavior.toLowerCase()
            );

            if (!categoryMatch) {
              isValid = false;
              reason = 'Invalid category';
            } else if (!behaviorMatch) {
              isValid = false;
              reason = 'Invalid behavior';
            }

            return {
              name,
              category: categoryMatch || category, // Use matched category if found
              behavior: behaviorMatch || behavior, // Use matched behavior if found
              description,
              ...(isValid ? {} : { reason })
            };
          }
          return null;
        })
        .filter(row => row !== null);

      return dataRows;
    } catch (error) {
      console.error('Error processing CSV:', error);
      showAlert('Error processing file. Please check the file format.');
      return [];
    }
  };

  // Add this function to validate CSV structure
  const validateCSVStructure = (headers) => {
    const requiredColumns = ['KPI Name', 'Category', 'Behavior', 'Description'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.trim() === col)
    );
    const errors = [];
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    // Add more checks and push to errors as needed
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleAddKpi = async () => {
    try {
        const promises = individualPreview.map(async kpi => {
            const kpiData = {
                dKPI_Name: kpi.name.trim(),
                dCategory: kpi.category,
                dCalculationBehavior: kpi.behavior,
                dDescription: kpi.description || '', // Ensure description is never null
                dCreatedBy: '2505170018' // Add your actual user ID here
            };

            setRecentlyAdded(prev => [
              {
                name: kpiName,
                category: category,
                behavior: behavior,
                description: description,
                dKPI_ID: response.dKPI_ID
              },
              ...prev
            ]);

            console.log('Sending KPI data:', kpiData); // Add this for debugging

            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(kpiData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server response:', errorData); // Add this for debugging
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            return response.json();
        });

        const responses = await Promise.all(promises);
        
        // Refresh KPI list
        const refreshResponse = await fetch(BASE_URL);
        if (!refreshResponse.ok) {
            throw new Error('Failed to refresh KPI list');
        }
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);

        resetForm();
        setActiveTab('viewKPIs');
        setSimpleSuccessMessage(
          individualPreview.length === 1
            ? `KPI "${kpiName}" added successfully!`
            : `${individualPreview.length} KPIs added successfully!`
        );
    } catch (error) {
        console.error('Error details:', error);
        showAlert(`Failed to add KPIs: ${error.message}`);
    }
};

  // Add useEffect for fetching KPIs
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch(BASE_URL);
        if (response.ok) {
          const data = await response.json();
          setKpis(data);
        }
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      }
    };

    fetchKPIs();
  }, []);

  // Add this useEffect to revalidate bulk KPIs whenever existing KPIs change
  useEffect(() => {
    if (bulkKpis.length > 0 || invalidKpis.length > 0) {
      revalidateBulkKPIs();
    }
  }, [kpis]); // This will trigger when kpis state changes

  // Add this new function to handle revalidation
  const revalidateBulkKPIs = () => {
    const kpisToValidate = [...bulkKpis, ...invalidKpis];

    // First pass: count all names
    const nameCounts = {};
    kpisToValidate.forEach(kpi => {
      const key = kpi.name?.toLowerCase().trim();
      if (key) {
        nameCounts[key] = (nameCounts[key] || 0) + 1;
      }
    });

    const validKpis = [];
    const newInvalidKpis = [];

    kpisToValidate.forEach(kpi => {
      let isValid = true;
      let reason = '';
      const key = kpi.name?.toLowerCase().trim();

      if (!kpi.name) {
        isValid = false;
        reason = 'Missing KPI name';
      } else if (kpis.some(existingKpi => existingKpi.dKPI_Name.toLowerCase().trim() === key)) {
        isValid = false;
        reason = 'KPI name already exists in database';
      } else if (nameCounts[key] > 1) {
        isValid = false;
        reason = 'Duplicate KPI name in CSV file';
      } else if (!kpi.category || !kpi.behavior) {
        isValid = false;
        reason = 'Missing required fields';
      } else if (!categories.includes(kpi.category)) {
        isValid = false;
        reason = 'Invalid category';
      } else if (!behaviors.includes(kpi.behavior)) {
        isValid = false;
        reason = 'Invalid behavior';
      }

      if (isValid) {
        validKpis.push({
          ...kpi,
          category: kpi.category,
          behavior: kpi.behavior
        });
      } else {
        newInvalidKpis.push({
          ...kpi,
          reason
        });
      }
    });

    setBulkKpis(validKpis);
    setInvalidKpis(newInvalidKpis);

    if (newInvalidKpis.length > 0 && validKpis.length === 0) {
      setPreviewTab('invalid');
    } else if (validKpis.length > 0 && newInvalidKpis.length === 0) {
      setPreviewTab('valid');
    }
  };

  const handleUpdateKpi = async (updatedKpi) => {
    const { dKPI_ID, dKPI_Name, dCategory, dDescription, dCalculationBehavior } = updatedKpi;

    if (dKPI_Name?.trim() && dCategory && dCalculationBehavior) {
      try {
        const updateData = {
          dKPI_Name,
          dCategory: capitalizeFirstLetter(dCategory),
          dDescription,
          dCalculationBehavior: capitalizeFirstLetter(dCalculationBehavior),
        };

        const response = await fetch(`http://localhost:3000/api/kpis/${dKPI_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Server error: ${response.status}`);
        }

        const refreshResponse = await fetch('http://localhost:3000/api/kpis');
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);

        // Success modal
        setSimpleSuccessMessage('KPI updated successfully!');
        setSuccessCount(0);
      } catch (error) {
        console.error('Error updating KPI:', error);
        showAlert(`Failed to update KPI: ${error.message}`);
      }
    }
  };

  const handleEditClick = async (kpiId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const kpi = await response.json();
      
      // Set the form data and editing state
      setEditingKpi(kpi);
      setKpiName(kpi.dKPI_Name);
      setCategory(kpi.dCategory);
      setBehavior(kpi.dCalculationBehavior);
      setDescription(kpi.dDescription || '');
      setDescriptionCount(kpi.dDescription ? kpi.dDescription.length : 0);
      
      // Force individual upload method when editing
      setUploadMethod('individual');
      setActiveTab('addKPI');
      
      // Clear any bulk upload state
      setBulkKpis([]);
      setInvalidKpis([]);
      setFile(null);
      
    } catch (error) {
      console.error('Error fetching KPI for edit:', error);
      showAlert('Failed to load KPI data for editing. Please try again.');
    }
  };

  const handleSave = async (updatedKpi) => {
      try {
        // Set the form values from the currentKpi
        setKpiName(updatedKpi.name);
        setCategory(updatedKpi.category);
        setBehavior(updatedKpi.behavior);
        setDescription(updatedKpi.description);
        setEditingKpi({ dKPI_ID: updatedKpi.id }); // Set the ID for update

        // Call handleUpdateKpi which has the API call logic
        await handleUpdateKpi();
        
        // Close the modal
        setEditModalOpen(false);
        setCurrentKpi(null);
        
      } catch (error) {
        console.error('Error saving KPI:', error);
        showAlert('Failed to save changes. Please try again.');
      }
    };

  // Handle adding individual KPI to preview
  const handleAddToList = () => {
      if (kpiName.trim() && category && behavior) {
        setIndividualPreview([{
          name: kpiName,
          category: category,
          behavior: behavior,
          description: description
        }]);
      }
    };
    
    // Handle bulk upload submission
    const handleBulkUpload = async () => {
      try {
        // Create array of promises for each valid KPI
        const uploadPromises = bulkKpis.map(kpi => {
          const kpiData = {
            dKPI_Name: kpi.name,
            dCategory: kpi.category,
            dCalculationBehavior: kpi.behavior,
            dDescription: kpi.description || '',
            dCreatedBy: '2505170018'
          };
    
          return fetch('http://localhost:3000/api/kpis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(kpiData)
          }).then(response => response.json()); // Parse each response
        });
    
        const uploadedKpis = await Promise.all(uploadPromises);
        
        // Check if any uploads failed
        const failedUploads = uploadedKpis.filter(response => !response || response.error);
        if (failedUploads.length > 0) {
          throw new Error(`Failed to add ${failedUploads.length} KPIs`);
        }
    
        // Fetch updated KPI list
        const refreshResponse = await fetch('http://localhost:3000/api/kpis');
        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh KPI list');
        }
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);
    
        // Update recently added with the new KPIs
        const newlyAddedKpis = uploadedKpis.map(response => ({
          name: response.dKPI_Name,
          category: response.dCategory,
          behavior: response.dCalculationBehavior,
          description: response.dDescription,
          dKPI_ID: response.dKPI_ID
        }));
    
        setRecentlyAdded(prev => [...newlyAddedKpis, ...prev]); 
    
        // Set success message and count
        setSimpleSuccessMessage(`${bulkKpis.length} KPI${bulkKpis.length > 1 ? 's' : ''} added successfully!`);
        setSuccessCount(bulkKpis.length);
        setShowSimpleSuccess(true);
    
        // Reset all bulk upload related states
        resetBulkUploadState();
        setActiveTab('viewKPIs');
    
      } catch (error) {
        console.error('Bulk upload error:', error);
        showAlert(`Failed to upload KPIs: ${error.message}`);
      }
    };

  const resetBulkUploadState = () => {
    setBulkKpis([]);
    setInvalidKpis([]);
    setFile(null);
    setPreviewTab('valid');
    
    // Reset the file input element
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
        fileInput.value = '';
    }
};
    
const handleDeleteClick = (kpi) => {
  setKpiToDelete(kpi);
  setShowDeleteModal(true);
};

const handleDeleteConfirm = async () => {
  if (deleteConfirmation.trim() === 'CONFIRM') {
    try {
      const response = await fetch(`${BASE_URL}/${kpiToDelete.dKPI_ID}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the KPI status locally
      const updatedKpis = kpis.map(kpi =>
        kpi.dKPI_ID === kpiToDelete.dKPI_ID
          ? { ...kpi, dStatus: 'DEACTIVATED' }
          : kpi
      );
      setKpis(updatedKpis);
      setShowDeleteModal(false);
      setKpiToDelete(null);
      setDeleteConfirmation('');
      setSimpleSuccessMessage(`KPI "${kpiToDelete.dKPI_Name}" has been deactivated successfully`);
      setShowSimpleSuccess(true);
    } catch (error) {
      console.error('Error deactivating KPI:', error);
      showAlert('Failed to deactivate KPI. Please try again.');
    }
  } else {
    showAlert('Please type "CONFIRM" to proceed deactivating');
  }
};


  const handleReactivateClick = (kpi) => {
    setKpiToReactivate(kpi);
    setShowReactivateModal(true);
  };
  
  const handleReactivateConfirm = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${kpiToReactivate.dKPI_ID}/reactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to reactivate KPI');
      }
  
      // Update the KPI status locally
      const updatedKpis = kpis.map(kpi => 
        kpi.dKPI_ID === kpiToReactivate.dKPI_ID 
          ? { ...kpi, dStatus: 'ACTIVE' } 
          : kpi
      );
      setKpis(updatedKpis);
      setShowReactivateModal(false);
      setKpiToReactivate(null);
      setValidationMessage(`KPI "${kpiToReactivate.dKPI_Name}" has been reactivated successfully`);
      setShowValidationModal(true);
    } catch (error) {
      console.error('Error reactivating KPI:', error);
      showAlert('Failed to reactivate KPI');
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  

  const handleDescriptionChange = (e) => {
    const text = validateInput(e.target.value);
    if (text.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(text);
    }
  };

  const handleKpiNameChange = (e) => {
    const text = validateInput(e.target.value);
    if (text.length <= MAX_NAME_LENGTH) {
      setKpiName(text);
      // Check for duplicates whenever name changes
      setIsDuplicateName(isDuplicateKPI(text));
    }
  };

  const handleTabSwitch = (newTab) => {
  const hasUnsavedChanges = kpiName || category || behavior || individualPreview.length > 0;

  if (hasUnsavedChanges) {
    const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?');
    if (confirmed) {
      resetForm();
      setActiveTab(newTab);
    }
  } else {
    setActiveTab(newTab);
  }
};

  const resetForm = () => {
    setKpiName('');
    setDescriptionCount(0);
    setCategory('');
    setBehavior('');
    setDescription('');
    setCurrentKpi(null);
    setEditingKpi(null); // Add this line
    setIndividualPreview([]);
  };
  

  const removeFromPreview = (index) => {
  setIndividualPreview(individualPreview.filter((_, i) => i !== index));
  };

  const renderFilterControls = () => {
    return (
      <div className="filter-controls">
        <select
          className="status-filter-dropdown"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="Active">Active</option>
          <option value="Deactivated">Deactivated</option>
          <option value="All">All Status</option>
        </select>
        <div className="search-bar-container">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search KPIs..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
                setSearchQuery(value);
                setSelectedKpi(null);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedKpi(null);
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
        <div className="filter-selects">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={`filter-${cat}`} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={behaviorFilter}
            onChange={(e) => setBehaviorFilter(e.target.value)}
          >
            <option value="">All Behaviors</option>
            {behaviors.map(beh => (
              <option key={`filter-${beh}`} value={beh}>{beh}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const getKpiSuggestions = () => {
      if (!searchQuery) return [];
      
      return kpis.filter(kpi => 
        kpi.dKPI_Name.toLowerCase().startsWith(searchQuery.toLowerCase())
      ).map(kpi => ({
        id: kpi.dKPI_ID,
        name: kpi.dKPI_Name
      }));
    };

    // Add this function to filter KPIs
  const getFilteredKPIs = () => {
    return kpis.filter(kpi => {

      // Status filter
      if (statusFilter !== 'All') {
        const isActive = statusFilter === 'Active';
        const kpiIsActive = kpi.dStatus !== 'DEACTIVATED';
        if (isActive !== kpiIsActive) {
          return false;
        }
      }

      // If a specific KPI is selected from dropdown
      if (selectedKpi) {
        return kpi.dKPI_ID === selectedKpi;
      }

      // Search query filter - using startsWith() for KPI names
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = kpi.dKPI_Name?.toLowerCase().startsWith(query);

        if (!matchesName) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && kpi.dCategory !== categoryFilter) {
        return false;
      }

      // Behavior filter
      if (behaviorFilter && kpi.dCalculationBehavior !== behaviorFilter) {
        return false;
      }

      return true;
    });
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && searchQuery) {
        // Apply the search filter when Enter is pressed
        setShowSuggestions(false);
      } else if (e.key === 'Escape') {
        // Clear search when Escape is pressed
        setSearchQuery('');
        setShowSuggestions(false);
        setSelectedKpi(null);
      } else if (e.key === 'ArrowDown' && showSuggestions) {
        // Prevent cursor movement in input
        e.preventDefault();
      }
    };

    const handleBulkDisable = async () => {
      if (bulkDisableConfirmation.trim() === 'DEACTIVATE') {
        try {
          const promises = selectedKPIs.map(kpi => 
            fetch(`http://localhost:3000/api/kpis/${kpi.dKPI_ID}/deactivate`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              }
            })
          );
    
          const responses = await Promise.all(promises);
          const failedResponses = responses.filter(response => !response.ok);
          
          if (failedResponses.length > 0) {
            throw new Error(`Failed to deactivate ${failedResponses.length} KPIs`);
          }
    
          // Update KPIs locally first
          const updatedKpis = kpis.map(kpi => 
            selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)
              ? { ...kpi, dStatus: 'DEACTIVATED' }
              : kpi
          );
          setKpis(updatedKpis);
          
          // Show success modal
          setSimpleSuccessMessage(`${selectedKPIs.length} KPI${selectedKPIs.length > 1 ? 's' : ''} deactivated successfully!`);
          setSuccessCount(selectedKPIs.length);
          setShowSimpleSuccess(true);
          
          // Reset states
          setSelectedKPIs([]);
          setShowBulkDisableModal(false);
          setBulkDisableConfirmation('');
        } catch (error) {
          console.error('Bulk deactivate error:', error);
          showAlert(`Failed to deactivate KPIs: ${error.message}`);
        }
      } else {
        showAlert('Please type "DEACTIVATE" to confirm bulk deactivation');
      }
    };

  const handleBulkReactivate = async () => {
    try {
      const response = await fetch('/api/kpis/bulk/reactivate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpiIds: selectedKPIs.map(kpi => kpi.dKPI_ID)
        })
      });
      
      if (response.ok) {
        // Refresh KPI list
        const refreshResponse = await fetch('http://localhost:3000/api/kpis');
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);
        
        // Clear selection
        setSelectedKPIs([]);
        // Show success message
        setValidationMessage(`${selectedKPIs.length} KPIs reactivated successfully`);
        setShowValidationModal(true);
      } else {
        throw new Error('Failed to reactivate KPIs');
      }
    } catch (error) {
      setValidationMessage('Failed to reactivate KPIs: ' + error.message);
      setShowValidationModal(true);
    }
  };

  const handleSelectKPI = (kpi) => {
    if (selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)) {
      setSelectedKPIs(selectedKPIs.filter(selected => selected.dKPI_ID !== kpi.dKPI_ID));
    } else {
      setSelectedKPIs([...selectedKPIs, kpi]);
    }
  };

  const handleSelectAll = () => {
    if (selectedKPIs.length === getFilteredKPIs().length) {
      setSelectedKPIs([]);
    } else {
      setSelectedKPIs(getFilteredKPIs());
    }
  };

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [editRecentKpi, setEditRecentKpi] = useState(null); // for editing modal

  const [showNoChangesModal, setShowNoChangesModal] = useState(false);
  const [tempKpiData, setTempKpiData] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortedKPIs = () => {
    const sorted = [...getFilteredKPIs()].filter(kpi => kpi && kpi.dKPI_ID); // Add null check
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (!a || !b) return 0; // Handle undefined objects
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        // For string comparison, ignore case
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  };

  const handleSaveRecentKpi = async (updatedKpi) => {
    try {
      if (updatedKpi.dKPI_ID) {
        const originalKpi = kpis.find(k => k.dKPI_ID === updatedKpi.dKPI_ID);
        const hasChanges = 
          originalKpi.dKPI_Name !== updatedKpi.name ||
          originalKpi.dCategory !== updatedKpi.category ||
          originalKpi.dCalculationBehavior !== updatedKpi.behavior ||
          originalKpi.dDescription !== updatedKpi.description;

        if (!hasChanges) {
          setTempKpiData(updatedKpi);
          setShowNoChangesModal(true);
          setEditRecentKpi(null);
          return;
        }
        // Update in backend
        const response = await fetch(`http://localhost:3000/api/kpis/${updatedKpi.dKPI_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            dKPI_Name: updatedKpi.name,
            dCategory: updatedKpi.category,
            dCalculationBehavior: updatedKpi.behavior,
            dDescription: updatedKpi.description
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Server error: ${response.status}`);
        }

        // Refresh main kpis list
        const refreshResponse = await fetch('http://localhost:3000/api/kpis');
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);

        // Find the updated KPI from the refreshed list
        const backendKpi = updatedKpis.find(k => k.dKPI_ID === updatedKpi.dKPI_ID);

        // Update recentlyAdded state as well
        setRecentlyAdded(prev =>
          prev.map((k, i) =>
            i === updatedKpi.idx
              ? {
                  ...k,
                  ...backendKpi, // Use backend's latest data
                  name: backendKpi.dKPI_Name,
                  category: backendKpi.dCategory,
                  behavior: backendKpi.dCalculationBehavior,
                  description: backendKpi.dDescription
                }
              : k
          )
        );

        setSimpleSuccessMessage(
          updatedKpi.dKPI_ID 
            ? `KPI "${updatedKpi.name}" updated successfully!`
            : `KPI "${updatedKpi.name}" updated successfully!`
        );
        setShowSimpleSuccess(true);
        setSuccessCount(0);
      } else {
        // Only in recentlyAdded, update local state
        setRecentlyAdded(prev =>
          prev.map((k, i) => i === updatedKpi.idx ? updatedKpi : k)
        );
        setSimpleSuccessMessage('KPI updated successfully!');
        setSuccessCount(0);
      }
      setEditRecentKpi(null);
    } catch (error) {
      showAlert(`Failed to update KPI: ${error.message}`);
    }
  };



  // Add this with other state declarations
  const [statusFilter, setStatusFilter] = useState('Active'); 

  // Update filteredStatusKPIs to include statusFilter
  const filteredStatusKPIs = kpis.filter(kpi => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = kpi.dKPI_Name?.toLowerCase().startsWith(query);
      if (!matchesName) {
        return false;
      }
    }
    if (categoryFilter && kpi.dCategory !== categoryFilter) {
      return false;
    }
    if (behaviorFilter && kpi.dCalculationBehavior !== behaviorFilter) {
      return false;
    }
    if (statusFilter === 'Active' && kpi.dStatus === 'DEACTIVATED') {
      return false;
    }
    if (statusFilter === 'Deactivated' && kpi.dStatus !== 'DEACTIVATED') {
      return false;
    }
    return true;
  });

    {showDetailsModal && selectedKpiDetails && (
      <div className="modal-overlay">
        <div className="modal description-modal">
          <div className="modal-header">
            <h2>{selectedKpiDetails.dKPI_Name}</h2>
            <button 
              className="close-btn"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="kpi-details">
              <p><strong>Category:</strong> {selectedKpiDetails.dCategory}</p>
              <p><strong>Behavior:</strong> {selectedKpiDetails.dCalculationBehavior}</p>
              <p><strong>Description:</strong> {selectedKpiDetails.dDescription}</p>
            </div>
          </div>
        </div>
      </div>
    )}

  return (
    <>
          {showSimpleSuccess && (
          <div className="modal-overlay">
          <div className="modal success-modal" style={{ width: '450px', height: '250px' }}>
            <div className="modal-header">
              <h3>
                {simpleSuccessMessage.includes('deactivated') ? 'KPI Deactivation' :
                 simpleSuccessMessage.includes('updated') ? 'KPI Updated' : 
                 simpleSuccessMessage.includes('reactivated') ? 'KPI Reactivation' : 
                 'KPI Added'}
              </h3>
            </div>

            <p className="success-message">
              {simpleSuccessMessage}
              {successCount > 0 && ` (${successCount})`}
            </p>

              <div className="modal-actions">
                <button 
                  onClick={() => setShowSimpleSuccess(false)}
                  className="save-btn"
                  style={{ backgroundColor: '#0052CC', width: '100%' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      <div className="kpi-management-container">
        <div className="white-card">
          <div className="kpi-management-header">
            <h1>KPI Management</h1>
            <p className="subtitle">Manage your Key Performance Indicators</p>
          </div>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'addKPI' ? 'active' : ''}`}
            onClick={() => setActiveTab('addKPI')}
          >
            {editingKpi ? 'Edit KPI' : 'Add New KPI'}
          </div>
          <div 
            className={`tab ${activeTab === 'viewKPIs' ? 'active' : ''}`}
            onClick={() => {
              // Only reset if there's no data being edited
              if (!kpiName && !category && !behavior && individualPreview.length === 0) {
                resetForm();
              }
              setActiveTab('viewKPIs');
            }}
          >
            Existing KPIs
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addKPI' ? 'active' : ''}`}>
          <div className="form-section">
            <p className="modal-subtitle">Choose how you want to add new KPIs.</p>
            <div className="kpi-upload-sections">
              <div className="kpi-upload-card">
                <div className="individual-upload-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>KPI Name</label>
                      <input
                        type="text"
                        value={kpiName}
                        onChange={handleKpiNameChange}
                        placeholder="Enter KPI name"
                        maxLength={MAX_NAME_LENGTH}
                        className={isDuplicateName ? 'duplicate-error' : ''}
                      />
                      {isDuplicateName && (
                        <span className="error-message">This KPI name already exists</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isDuplicateName}
                      >
                       <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={`category-${cat}`} value={cat}>{cat}</option>
                      ))}
                      </select>
                    </div>
                  </div>

                    <div className="form-row">
                      <div className="form-group">
                      <label>Recommended Calculation Behavior</label>
                        <select
                          value={behavior}
                          onChange={(e) => setBehavior(e.target.value)}
                          disabled={isDuplicateName}
                        >
                          <option value="">Select behavior</option>
                          {behaviors.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <div className="description-container">
                        <textarea
                          value={description}
                          onChange={handleDescriptionChange}
                          placeholder="Describe what this KPI measures and why it's important"
                          rows="3"
                          disabled={isDuplicateName}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                          style={{
                            resize: 'none',
                            overflowY: 'auto',
                            width: '100%',
                            boxSizing: 'border-box',
                            minHeight: '80px',
                            maxHeight: '120px'
                          }}
                        />
                        <div className="char-counter">
                          {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                      </div>
                    </div>

                  <button 
                    onClick={handleFormSubmit}
                    className="add-to-list-btn"
                    disabled={!kpiName.trim() || !category || !behavior}
                  >
                    {editingKpi ? 'Save Changes' : '+ Add New KPI'}
                  </button>
                </div>
              </div>
              <div className="kpi-upload-card">
                <div className="bulk-upload-form">
                  <div className="bulk-upload-actions">
                    <h3><FaUpload /> Upload KPIs</h3>
                    <button onClick={generateTemplate} className="generate-template-btn">
                      <FaFileDownload /> Generate Template
                    </button>
                  </div>

                    <div
                      className={`drop-zone ${dragActive ? 'active' : ''}`}
                    >
                      <div className="drop-zone-content">
                          <p>Upload your CSV file here</p>
                          <p>File name format: kpi_upload_YYYYMMDD.csv</p>
                          <p>Example: kpi_upload_20250520.csv</p>
                          <p>Maximum file size: 5MB</p>
                          <input
                              type="file"
                              id="file-upload"
                              accept=".csv"
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

                    {(bulkKpis.length > 0 || invalidKpis.length > 0) && (
                      <div className="upload-preview">
                        <div className="preview-tabs">
                          <button
                            className={`preview-tab ${previewTab === 'valid' ? 'active' : ''}`}
                            onClick={() => setPreviewTab('valid')}
                            disabled={bulkKpis.length === 0}
                          >
                            Valid ({bulkKpis.length})
                          </button>
                          <button
                            className={`preview-tab ${previewTab === 'invalid' ? 'active' : ''}`}
                            onClick={() => setPreviewTab('invalid')}
                            disabled={invalidKpis.length === 0}
                          >
                            Invalid ({invalidKpis.length})
                          </button>
                        </div>

                        <div className="preview-content">
                          {previewTab === 'valid' && bulkKpis.length > 0 && (
                            <div className="valid-kpis-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>KPI Name</th>
                                    <th>Category</th>
                                    <th>Behavior</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkKpis.map((kpi, index) => (
                                    <tr key={`valid-${index}`}>
                                      <td>{kpi.name}</td>
                                      <td>{kpi.category}</td>
                                      <td>{kpi.behavior}</td>
                                      <td>{kpi.description}</td>
                                      <td>
                                        <button onClick={() => {
                                          const updatedKpis = [...bulkKpis];
                                          updatedKpis.splice(index, 1);
                                          setBulkKpis(updatedKpis);
                                        }} className="delete-btn">
                                          <FaTrash size={12} /> Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {previewTab === 'invalid' && invalidKpis.length > 0 && (
                            <div className="invalid-kpis-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Reason</th>
                                    <th>KPI Name</th>
                                    <th>Category</th>
                                    <th>Behavior</th>
                                    <th>Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invalidKpis.map((kpi, index) => (
                                    <tr key={`invalid-${index}`}>
                                      <td className="reason-cell">{kpi.reason}</td>
                                      <td>{kpi.name}</td>
                                      <td>{kpi.category}</td>
                                      <td>{kpi.behavior}</td>
                                      <td>{kpi.description}</td>
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
                      <button
                        onClick={handleBulkUpload}
                        className="save-btn"
                        disabled={!file || bulkKpis.length === 0}
                      >
                        Submit KPIs {bulkKpis.length > 0 && `(${bulkKpis.length})`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="recently-added-table">
        <div className="recently-added-card">
          <h2>Recently Added</h2>
          <div className="table-container">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>KPI Name</th>
                    <th>Category</th>
                    <th>Behavior</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyAdded.map((kpi, idx) => (
                    <tr key={idx}>
                      <td>{kpi.name}</td>
                      <td>{kpi.category}</td>
                      <td>{kpi.behavior}</td>
                      <td>{kpi.description}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => setEditRecentKpi({ ...kpi, idx })}
                            title="Edit"
                          >
                            <FaPencilAlt style={{ marginRight: '6px' }} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>     

          </div>

          <div className={`tab-content ${activeTab === 'viewKPIs' ? 'active' : ''}`}>
            <div className="existing-kpis">
              {renderFilterControls()}
              <div className="table-container">
                {selectedKPIs.length > 0 && (
                  <div className="bulk-actions">
                    <button 
                        className={selectedKPIs.some(kpi => kpi.dStatus === 'ACTIVE') 
                          ? 'bulk-disable-btn' 
                          : 'bulk-reactivate-btn'}
                        onClick={() => selectedKPIs.some(kpi => kpi.dStatus === 'ACTIVE') 
                          ? setShowBulkDisableModal(true) 
                          : handleBulkReactivate()}
                      >{selectedKPIs.some(kpi => kpi.dStatus === 'ACTIVE') 
                        ? <><FaTimes size={12} /> Deactivate Selected KPIs</>
                        : <><FaCheck size={12} /> Reactivate Selected KPIs</>}
                      <span className="count">{selectedKPIs.length}</span>
                    </button>
                  </div>
                )}
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedKPIs.length === getFilteredKPIs().length && getFilteredKPIs().length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th onClick={() => handleSort('dKPI_ID')} style={{ cursor: 'pointer' }}>
                          ID {sortConfig.key === 'dKPI_ID' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dKPI_Name')} style={{ cursor: 'pointer' }}>
                          KPI Name {sortConfig.key === 'dKPI_Name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dCategory')} style={{ cursor: 'pointer' }}>
                          Category {sortConfig.key === 'dCategory' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dCalculationBehavior')} style={{ cursor: 'pointer' }}>
                          Calculation Behavior {sortConfig.key === 'dCalculationBehavior' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
                          Status {sortConfig.key === 'dStatus' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dDescription')} style={{ cursor: 'pointer' }}>
                          Description {sortConfig.key === 'dDescription' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('dCreatedBy')} style={{ cursor: 'pointer' }}>
                          Created By {sortConfig.key === 'dCreatedBy' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => handleSort('tCreatedAt')} style={{ cursor: 'pointer' }}>
                          Created At {sortConfig.key === 'tCreatedAt' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedKPIs().map((kpi, index) => (
                        <tr key={kpi.dKPI_ID}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)}
                              onChange={() => handleSelectKPI(kpi)}
                            />
                          </td>
                          <td>{kpi.dKPI_ID}</td>
                          <td>{kpi.dKPI_Name}</td>
                          <td>{kpi.dCategory}</td>
                          <td>{kpi.dCalculationBehavior}</td>
                          <td>{kpi.dStatus === 'DEACTIVATED' ? 'Deactivated' : 'Active'}</td>
                          <td>
                          <div className="description-cell" title={kpi.dDescription}>
                            {kpi.dDescription}
                          </div>
                        </td>
                          <td>{kpi.dCreatedBy || '-'}</td>
                          <td className="created-at-cell" data-tooltip={kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}>
                            {kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}
                          </td>
                          <td>
                          <div className="action-buttons">
                              {kpi.dStatus === 'DEACTIVATED' ? (
                                <button 
                                className="reactivate-btn"
                                onClick={() => handleReactivateClick(kpi)}
                              >
                                  <FaCheck size={12} /> Reactivate
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleDeleteClick(kpi)} 
                                  className="delete-btn"
                                >
                                  <FaBan size={12} /> Deactivate
                                  </button>
                              )}
                          </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        

        {showConfirmModal && kpiToAdd && (
        <div className="modal-overlay">
        <div className="modal confirm-modal">
          <div className="modal-header">
            <h2>Confirm KPI Addition</h2>
          </div>
            
              <p>Please confirm the details of the KPI to be added:</p>
              <div className="kpi-details">
                <p>Name:<strong>{kpiToAdd.name}</strong></p>
                <p>Category:<strong>{kpiToAdd.category}</strong></p>
                <p>Behavior:<strong>{kpiToAdd.behavior}</strong></p>
                <p className="description-line">
                  Description:
                  <span className="description-text">
                    {kpiToAdd.description || '-'}
                  </span>
                </p>
              </div>

            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleConfirmAdd} className="save-btn">
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}



        {/* Delete Confirmation Modal */}
        {showDeleteModal && kpiToDelete && (
          <div className="modal-overlay">
            <div className="modal delete-confirmation-modal">
            <div className="modal-header">
              <h2 style={{ color: 'red' }}>KPI Deactivation</h2>
            </div>
              

                <div className="warning-message">
                  <FaTimesCircle className="warning-icon" />
                  <p>These are the KPI details that are about to be deactivated. Please type "CONFIRM" to proceed.</p>
                </div>
                
                <div className="kpi-details">
                  <p><strong>KPI Name:</strong> {kpiToDelete.dKPI_Name}</p>
                  <p><strong>Category:</strong> {kpiToDelete.dCategory}</p>
                  <p><strong>Behavior:</strong> {kpiToDelete.dCalculationBehavior}</p>
                  <p className="description-line">
                    <strong>Description:</strong>
                    <span className="description-text">
                      {kpiToDelete.dDescription || '-'}
                    </span>
                  </p>
                </div>

                <div className="confirmation-input">
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                    setDeleteConfirmation(value.toUpperCase());
                  }}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="CONFIRM"
                  maxLength="7"
                  className={deleteConfirmation && deleteConfirmation.trim() !== 'CONFIRM' ? 'error' : ''}
                />
                {deleteConfirmation && deleteConfirmation.trim() !== 'CONFIRM' && (
                  <span className="error-message"></span>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setKpiToDelete(null);
                    setDeleteConfirmation('');
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="delete-confirm-btn"
                  disabled={deleteConfirmation.trim() !== 'CONFIRM'}
                >
                  Deactivate KPI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Disable Modal */}
        {showBulkDisableModal && (
          <div className="modal-overlay">
            <div className="modal delete-confirmation-modal">
            <div className="modal-header">
                <h2 style={{ color: 'red' }}>Bulk Deactivation</h2>
              </div>
              
                <div className="warning-message">
                  <FaTimesCircle className="warning-icon" />
                  <p>Please confirm the deactivation of <strong>{selectedKPIs.length}</strong> KPIs.</p>
                </div>
                
                <div className="kpi-details">
                  <div className="selected-kpis-list">
                    {selectedKPIs.map(kpi => (
                      <p key={kpi.dKPI_ID}><strong>{kpi.dKPI_Name}</strong></p>
                    ))}
                  </div>
                </div>

                <div className="confirmation-input">

                <input
                    type="text"
                    value={bulkDisableConfirmation}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 10);
                      setBulkDisableConfirmation(value.toUpperCase());
                    }}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Type 'DEACTIVATE' to confirm"
                    maxLength="10"
                    className={bulkDisableConfirmation && bulkDisableConfirmation.trim() !== 'DEACTIVATE' ? 'error' : ''}
                  />

                  {bulkDisableConfirmation && bulkDisableConfirmation.trim() !== 'DEACTIVATE' && (
                    <span className="error-message"></span>
                  )}
                </div>


              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowBulkDisableModal(false);
                    setBulkDisableConfirmation('');
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkDisable}
                  className="delete-confirm-btn"
                  disabled={bulkDisableConfirmation.trim() !== 'DEACTIVATE'}
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Validation Modal */}
        {showValidationModal && (
          <div className="modal-overlay">
            <div className="modal validation-modal">
              <div className="modal-header">
                <h2>Validation Error</h2>
              </div>
              <div className="modal-content">
                <div className="warning-message">
                  <FaTimesCircle className="warning-icon" />
                  <p>{validationMessage}</p>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  onClick={() => setShowValidationModal(false)} 
                  className="ok-btn"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

{showReactivateModal && kpiToReactivate && (
          <div className="modal-overlay">
            <div className="modal confirm-modal">
              <div className="modal-header">
                <h2>Confirm Reactivation</h2>
              </div>
              <p>Are you sure you want to reactivate the KPI "<strong>{kpiToReactivate.dKPI_Name}</strong>"?</p>
              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowReactivateModal(false);
                    setKpiToReactivate(null);
                  }} 
                  className="cancel-btn small"
                  style={{ minWidth: '80px', padding: '8px 16px' }}
                >
                  No
                </button>
                <button 
                  onClick={handleReactivateConfirm}
                  className="save-btn small"
                  style={{ minWidth: '80px', padding: '8px 16px' }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoChangesModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ width: '450px', height: '250px' }}>
              <div className="modal-header">
                <h3>No Changes Detected</h3>
              </div>
                <p>No changes were made to the KPI. Do you want to continue editing?</p>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    setShowNoChangesModal(false);
                    setEditRecentKpi(tempKpiData);
                  }}
                  className="save-btn"
                  style={{ backgroundColor: '#0052CC', flex: 1 }}
                >
                  Continue Editing
                </button>
                <button 
                  onClick={() => {
                    setShowNoChangesModal(false);
                    setTempKpiData(null);
                  }}
                  className="cancel-btn"
                  style={{ backgroundColor: '#B2B6BA', flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editRecentKpi && (
          <EditKpiModal
            kpi={editRecentKpi}
            kpis={kpis}
            recentlyAdded={recentlyAdded}
            onSave={handleSaveRecentKpi}
            onCancel={() => setEditRecentKpi(null)}
            validateInput={validateInput}
          />
        )}
      </div>
    </>
  );
};

const EditKpiModal = ({ kpi, kpis, recentlyAdded, onSave, onCancel, validateInput }) => {
  const categories = [
    'Compliance', 'Customer Experience', 'Employee Performance', 'Finance',
    'Healthcare', 'Logistics', 'Operational Efficiency', 'Sales', 'Tech'
  ];
  const behaviors = ['Lower the Better', 'Higher the Better', 'Hit or Miss'];

  const [name, setName] = useState(kpi.name);
  const [category, setCategory] = useState(kpi.category);
  const [behavior, setBehavior] = useState(kpi.behavior);
  const [description, setDescription] = useState(kpi.description);
  const [error, setError] = useState('');

  // Dynamic duplicate check
  useEffect(() => {
    const isDuplicate =
      kpis.some(item =>
        item.dKPI_Name.toLowerCase().trim() === name.toLowerCase().trim() &&
        item.dKPI_ID !== kpi.dKPI_ID
      ) ||
      recentlyAdded.some((item, idx) =>
        item.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        idx !== kpi.idx
      );

    if (isDuplicate) {
      setError('A KPI with this name already exists.');
    } else {
      setError('');
    }
  }, [name, kpis, recentlyAdded, kpi.dKPI_ID, kpi.idx]);

  const handleSave = () => {
    if (error) return; // Prevent save if error exists
    onSave({
      ...kpi,
      name,
      category,
      behavior,
      description,
      idx: kpi.idx
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal edit-kpi-modal">
        <div className="modal-header">
          <h1><b>Edit KPI</b></h1>

        </div>

          <div className="form-group">
            <label>KPI Name</label>
            <input 
              value={name} 
              onChange={e => setName(validateInput(e.target.value))}
              maxLength={30}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Calculation Behavior</label>
            <select value={behavior} onChange={e => setBehavior(e.target.value)}>
              <option value="">Select behavior</option>
              {behaviors.map(beh => (
                <option key={beh} value={beh}>{beh}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(validateInput(e.target.value))}
              rows="3"
              maxLength={150}
              style={{
                resize: 'none',
                overflowY: 'auto',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={!name.trim() || !category || !behavior}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default KPIManagement;