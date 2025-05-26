// KPIManagement.js
import axios from 'axios';
import React, { useState, useCallback, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload, FaSearch, FaCheckCircle, FaCheck, FaBan, FaRedo } from 'react-icons/fa';

const BASE_URL = 'http://localhost:3000/api/kpis';  // Change from /admin/kpis to /api/kpis

const KPIManagement = () => {

  const categories = ['Compliance', 'Customer Experience', 'Employee Performance', 'Finance', 'Healthcare', 'Logistics', 'Operational Efficiency', 'Sales', 'Tech'];
  const behaviors = ['Lower the Better', 'Higher the Better', 'Hit or Miss'];

 const isDuplicateKPI = (name, bulkKpis = []) => {
    if (!name) return false;
    
    // Check against existing KPIs
    const isDuplicateInExisting = kpis.some(existingKpi => {
        // Add null checks for existingKpi and its properties
        if (!existingKpi || !existingKpi.dKPI_Name) return false;
        return existingKpi.dKPI_Name.toLowerCase().trim() === name.toLowerCase().trim();
    });

    // Check against current bulk upload
    const isDuplicateInBulk = bulkKpis.filter(bulkKpi => {
        // Add null checks for bulkKpi and its properties
        if (!bulkKpi || !bulkKpi.name) return false;
        return bulkKpi.name.toLowerCase().trim() === name.toLowerCase().trim();
    }).length > 1; // More than one means duplicate in bulk

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
  const [editingBulkKpi, setEditingBulkKpi] = useState(null);

  // Add bulk upload states
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkKpis, setBulkKpis] = useState([]);
  const [invalidKpis, setInvalidKpis] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);

  // Add these helper functions after your state declarations
  const hasActiveKPIs = () => selectedKPIs.some(kpi => kpi.dStatus !== 'DEACTIVATED');
  const hasDeactivatedKPIs = () => selectedKPIs.some(kpi => kpi.dStatus === 'DEACTIVATED');
  const areAllDeactivated = () => selectedKPIs.every(kpi => kpi.dStatus === 'DEACTIVATED');
  const areAllActive = () => selectedKPIs.every(kpi => kpi.dStatus !== 'DEACTIVATED');
  
  // Add confirmation when adding KPIs
  const [addConfirmation, setAddConfirmation] = useState('');

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
  const [showBulkReactivateModal, setShowBulkReactivateModal] = useState(false);
  const [bulkReactivateConfirmation, setBulkReactivateConfirmation] = useState('');

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

  // First add this state to track the last selected item
  const [lastSelectedId, setLastSelectedId] = useState(null);


  const handleViewDetails = (kpi) => {
    setSelectedKpiDetails(kpi);
    setShowDetailsModal(true);
  };

  const showAlert = (message, type = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // Modify the modal close handler
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setAddConfirmation(''); // Reset the confirmation text
    setKpiToAdd(null);
  };



  const handleFormSubmit = () => {
      if (!kpiName.trim()) {
          showAlert('KPI name is required');
          return;
      }

      if (isDuplicateKPI(kpiName)) {
          showAlert('A KPI with this name already exists');
          return;
      }

      // Generate the next KPI ID
      const nextKpiId = generateNextKpiId(kpis);

      setKpiToAdd({
          id: nextKpiId,
          name: kpiName,
          category: category,
          behavior: behavior,
          description: description
      });
      setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
      try {
          const kpiData = {
              dKPI_ID: kpiToAdd.id.trim(),    
              dKPI_Name: kpiToAdd.name.trim(),
              dCategory: kpiToAdd.category,
              dDescription: kpiToAdd.description || '',
              dCalculationBehavior: kpiToAdd.behavior,
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

          const newKpi = await response.json();

          // Update both recentlyAdded and kpis states
          setRecentlyAdded(prev => [{
              dKPI_ID: newKpi.dKPI_ID || kpiData.dKPI_ID,
              name: newKpi.dKPI_Name,
              category: newKpi.dCategory,
              behavior: newKpi.dCalculationBehavior,
              description: newKpi.dDescription
          }, ...prev]);

          // Add the new KPI to the existing table data
          setKpis(prevKpis => [{
              dKPI_ID: newKpi.dKPI_ID,
              dKPI_Name: newKpi.dKPI_Name,
              dCategory: newKpi.dCategory,
              dDescription: newKpi.dDescription,
              dCalculationBehavior: newKpi.dCalculationBehavior,
              dStatus: 'ACTIVE',
              dCreatedBy: kpiData.dCreatedBy,
              tCreatedAt: new Date().toISOString()
          }, ...prevKpis]);

          resetForm();
          setShowConfirmModal(false);
          setSimpleSuccessMessage(`${kpiToAdd.name} has been added successfully`);
          setShowSimpleSuccess(true);
      } catch (error) {
          console.error('Error details:', error);
          showAlert(`Failed to add KPI: ${error.message}`);
      }
  };


    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

  const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        
        // Validate file extension
        if (!file.name.endsWith('.csv')) {
          setValidationMessage('Please upload a CSV file');
          setShowValidationModal(true);
          return;
        }

        // Validate filename pattern
        if (!ALLOWED_FILE_PATTERN.test(file.name)) {
          setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
          setShowValidationModal(true);
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setValidationMessage('File size exceeds 5MB limit');
          setShowValidationModal(true);
          return;
        }

        handleFile(file);
      }
    };

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
        const { validKpis, invalidKpis } = processFileContent(text);

        setFile(file);
        setBulkKpis(validKpis);
        setInvalidKpis(invalidKpis);
        
        // Show appropriate tab based on results
        if (invalidKpis.length > 0) {
          setPreviewTab('invalid');
        } else if (validKpis.length > 0) {
          setPreviewTab('valid');
        }

        // If no valid KPIs at all, show message
        if (validKpis.length === 0 && invalidKpis.length === 0) {
          setValidationMessage('No valid KPIs found in the file');
          setShowValidationModal(true);
          resetBulkUploadState();
        }
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

        const headers = rows[0].split(',').map(header => header?.trim() || '');
        const structureValidation = validateCSVStructure(headers);
        
        if (!structureValidation.isValid) {
          showAlert(structureValidation.errors.length > 0 ? structureValidation.errors : 'Invalid CSV structure.');
          return { validKpis: [], invalidKpis: [] };
        }

        const validKpis = [];
        const invalidKpis = [];
        
        // Add null checks when creating existingNames Set
        const existingNames = new Set(
          kpis
            .filter(kpi => kpi && kpi.dKPI_Name) // Filter out null/undefined KPIs and names
            .map(kpi => kpi.dKPI_Name.toLowerCase().trim())
        );
        
        const namesInCsv = new Map();

        // First pass: collect names from CSV
        rows.slice(1).forEach(row => {
          if (!row) return; // Skip empty rows
          const columns = row.split(',');
          const name = columns[0]?.trim() || '';
          if (name) {
            namesInCsv.set(name.toLowerCase(), (namesInCsv.get(name.toLowerCase()) || 0) + 1);
          }
        });

        // Second pass: validate and categorize
        rows.slice(1).forEach(row => {
          if (!row) return; // Skip empty rows
          const columns = row.split(',');
          const name = columns[0]?.trim() || '';
          const category = columns[1]?.trim() || '';
          const behavior = columns[2]?.trim() || '';
          const description = columns[3]?.trim() || '';

          const kpiData = {
            name,
            category,
            behavior,
            description
          };

          let isValid = true;
          let reason = '';

          // Validation checks with null safety
          if (!name) {
            isValid = false;
            reason = 'Missing KPI name';
          } else if (existingNames.has(name.toLowerCase())) {
            isValid = false;
            reason = 'KPI name already exists in database';
          } else if (namesInCsv.get(name.toLowerCase()) > 1) {
            isValid = false;
            reason = 'Duplicate KPI name in CSV file';
          } else if (!category) {
            isValid = false;
            reason = 'Missing category';
          } else if (!categories.includes(category)) {
            isValid = false;
            reason = 'Invalid category';
          } else if (!behavior) {
            isValid = false;
            reason = 'Missing behavior';
          } else if (!behaviors.includes(behavior)) {
            isValid = false;
            reason = 'Invalid behavior';
          }

          if (isValid) {
            validKpis.push(kpiData);
          } else {
            invalidKpis.push({
              ...kpiData,
              reason
            });
          }
        });

        setBulkKpis(validKpis);
        setInvalidKpis(invalidKpis);
        
        if (invalidKpis.length > 0) {
          setPreviewTab('invalid');
        } else {
          setPreviewTab('valid');
        }

        return { validKpis, invalidKpis };
      } catch (error) {
        console.error('Error processing CSV:', error);
        showAlert('Error processing file. Please check the file format.');
        return { validKpis: [], invalidKpis: [] };
      }
    };

    // Add this function to validate CSV structure
    const validateCSVStructure = (headers) => {
        const requiredColumns = ['KPI Name', 'Category', 'Behavior', 'Description'];
        const missingColumns = requiredColumns.filter(col => 
          !headers.some(header => (header || '').trim() === col)
        );
        const errors = [];
        
        if (missingColumns.length > 0) {
          errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        }
        
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
                  dDescription: kpi.description || '', 
                  dCreatedBy: '2505170018'
              };

              console.log('Sending KPI data:', kpiData);

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

              const responseData = await response.json();
              
              // Update recently added after we have the response
              setRecentlyAdded(prev => [{
                  name: kpi.name,
                  category: kpi.category,
                  behavior: kpi.behavior,
                  description: kpi.description,
                  dKPI_ID: responseData.dKPI_ID
              }, ...prev]);

              return responseData;
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

    // Update the useEffect for fetching KPIs
    useEffect(() => {
      const fetchKPIs = async () => {
        try {
          const response = await fetch(BASE_URL);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          // Map database columns to UI fields
          const formattedKPIs = data.map(kpi => ({
            dKPI_ID: kpi.dKPI_ID,
            dKPI_Name: kpi.dKPI_Name,
            dCategory: kpi.dCategory,
            dDescription: kpi.dDescription,
            dCalculationBehavior: kpi.dCalculationBehavior,
            dStatus: kpi.dStatus || 'ACTIVE',
            dCreatedBy: kpi.dCreatedBy,
            tCreatedAt: kpi.tCreatedAt
          }));

          const validKPIs = formattedKPIs.filter(kpi => kpi && kpi.dKPI_ID);
          console.log('Fetched KPIs:', validKPIs);
          setKpis(validKPIs);
        } catch (error) {
          console.error('Error fetching KPIs:', error);
          showAlert('Failed to load KPIs. Please try again.');
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

  const generateNextKpiId = (existingKpis) => {
    // Filter out any null/undefined KPI IDs and get only valid KPI IDs
    const validKpiIds = existingKpis
      .map(kpi => kpi.dKPI_ID)
      .filter(id => id && id.startsWith('KPI'))
      .map(id => parseInt(id.replace('KPI', ''), 10));

    // If no existing KPIs, start with KPI0001
    if (validKpiIds.length === 0) {
      return 'KPI0001';
    }

    // Find the maximum number and add 1
    const maxNumber = Math.max(...validKpiIds);
    const nextNumber = maxNumber + 1;
    
    // Format the new ID with leading zeros
    return `KPI${String(nextNumber).padStart(4, '0')}`;
  };

  const handleUpdateKpi = async (updatedKpi) => {
    try {
      const updateData = {
        dKPI_Name: updatedKpi.name || updatedKpi.dKPI_Name,
        dCategory: updatedKpi.category || updatedKpi.dCategory,
        dCalculationBehavior: updatedKpi.behavior || updatedKpi.dCalculationBehavior,
        dDescription: updatedKpi.description || updatedKpi.dDescription || ''
      };

      const response = await fetch(`${BASE_URL}/${updatedKpi.dKPI_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const updatedKpiData = await response.json();

      // Update the KPIs state with correct field mapping
      setKpis(prevKpis => prevKpis.map(kpi => 
        kpi.dKPI_ID === updatedKpi.dKPI_ID ? {
          ...kpi,
          dKPI_Name: updatedKpiData.dKPI_Name,
          dCategory: updatedKpiData.dCategory,
          dCalculationBehavior: updatedKpiData.dCalculationBehavior,
          dDescription: updatedKpiData.dDescription
        } : kpi
      ));

      setSimpleSuccessMessage('KPI updated successfully!');
      setShowSimpleSuccess(true);
    } catch (error) {
      console.error('Error updating KPI:', error);
      showAlert(`Failed to update KPI: ${error.message}`);
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
        // Array to store successfully uploaded KPIs
        const uploadedKpis = [];
        
        // Process each KPI sequentially to avoid race conditions
        for (const kpi of bulkKpis) {
          try {
            const nextKpiId = generateNextKpiId([...kpis, ...uploadedKpis]);
            
            const kpiData = {
              dKPI_ID: nextKpiId,
              dKPI_Name: kpi.name,
              dCategory: kpi.category,
              dCalculationBehavior: kpi.behavior,
              dDescription: kpi.description || '',
              dCreatedBy: '2505170018',
              dStatus: 'ACTIVE'
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
              throw new Error(`Failed to create KPI ${kpi.name}: ${response.statusText}`);
            }

            const result = await response.json();
            uploadedKpis.push(result);
          } catch (error) {
            console.error(`Error uploading KPI ${kpi.name}:`, error);
            throw error;
          }
        }

        if (uploadedKpis.length > 0) {
          // Update recently added state
          const newlyAddedKpis = uploadedKpis.map(kpi => ({
            name: kpi.dKPI_Name,
            category: kpi.dCategory,
            behavior: kpi.dCalculationBehavior,
            description: kpi.dDescription,
            dKPI_ID: kpi.dKPI_ID
          }));

          setRecentlyAdded(prev => [...newlyAddedKpis, ...prev]);

          // Update main table data
          const newTableKpis = uploadedKpis.map(kpi => ({
            dKPI_ID: kpi.dKPI_ID,
            dKPI_Name: kpi.dKPI_Name,
            dCategory: kpi.dCategory,
            dDescription: kpi.dDescription,
            dCalculationBehavior: kpi.dCalculationBehavior,
            dStatus: 'ACTIVE',
            dCreatedBy: '2505170018',
            tCreatedAt: new Date().toISOString()
          }));

          setKpis(prevKpis => [...newTableKpis, ...prevKpis]);

          // Show success message
          setSimpleSuccessMessage(`${uploadedKpis.length} KPI${uploadedKpis.length > 1 ? 's' : ''} added successfully!`);
          setShowSimpleSuccess(true);

          // Reset states
          resetBulkUploadState();
          setActiveTab('viewKPIs');
        }

      } catch (error) {
        console.error('Bulk upload error:', error);
        showAlert(`Failed to upload KPIs: ${error.message}`);
      }
    };

    // Add this function to reset bulk upload state
  const resetBulkUploadState = () => {
    setBulkKpis([]);
    setInvalidKpis([]);
    setFile(null);
    setPreviewTab('valid');
  };

  // Add this function to handle delete click
  const handleDeleteClick = (kpi) => {
    setKpiToDelete(kpi);
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };

const handleDeleteConfirm = async () => {
  if (deleteConfirmation.trim() === 'CONFIRM') {
    try {
      const response = await fetch(`${BASE_URL}/${kpiToDelete.dKPI_ID}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
         body: JSON.stringify({
          dCreatedBy: '2505170018' // Add this line
        })
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
        },
      body: JSON.stringify({
        dCreatedBy: '2505170018' // Add this line
      })
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
    setEditingKpi(null);
    setIndividualPreview([]);
  };
  

  const removeFromPreview = (index) => {
  setIndividualPreview(individualPreview.filter((_, i) => i !== index));
  };

  const renderFilterControls = () => {
    // Count active and deactivated KPIs
    const activeCount = kpis.filter(kpi => kpi.dStatus !== 'DEACTIVATED').length;
    const deactivatedCount = kpis.filter(kpi => kpi.dStatus === 'DEACTIVATED').length;
    return (
      <div className="filter-controls">
        <div className="status-tab-group">
          <button
            className={`status-tab${statusFilter === 'Active' ? ' active' : ''}`}
            onClick={() => setStatusFilter('Active')}
          >
            <span className="status-label">Active</span>
            <span className="status-badge active-badge">
              <span className="check-circle"><FaCheck size={8} /></span> {activeCount}
            </span>
          </button>
          <button
            className={`status-tab${statusFilter === 'Deactivated' ? ' deactivated active' : ''}`}
            onClick={() => setStatusFilter('Deactivated')}
          >
            <span className="status-label">Deactivated</span>
            <span className="status-badge deactivated-badge">
              <FaBan size={14} /> {deactivatedCount}
            </span>
          </button>
        </div>
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


    // Update the handleBulkReactivate function
    const handleBulkReactivate = async () => {
      if (bulkReactivateConfirmation.trim() === 'REACTIVATE') {
        try {
          const promises = selectedKPIs.map(kpi => 
            fetch(`http://localhost:3000/api/kpis/${kpi.dKPI_ID}/reactivate`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              }
            })
          );
    
          const responses = await Promise.all(promises);
          const failedResponses = responses.filter(response => !response.ok);
          
          if (failedResponses.length > 0) {
            throw new Error(`Failed to reactivate ${failedResponses.length} KPIs`);
          }
    
          // Update KPIs locally
          const updatedKpis = kpis.map(kpi => 
            selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)
              ? { ...kpi, dStatus: 'ACTIVE' }
              : kpi
          );
          setKpis(updatedKpis);
          
          // Show success message
          setSimpleSuccessMessage(`${selectedKPIs.length} KPI${selectedKPIs.length > 1 ? 's' : ''} reactivated successfully!`);
          setShowSimpleSuccess(true);
          
          // Reset states
          setSelectedKPIs([]);
          setShowBulkReactivateModal(false);
          setBulkReactivateConfirmation('');
        } catch (error) {
          console.error('Bulk reactivate error:', error);
          showAlert(`Failed to reactivate KPIs: ${error.message}`);
        }
      } else {
        showAlert('Please type "REACTIVATE" to confirm reactivation');
      }
    };

    // Then modify your handleSelectKPI function:
    const handleSelectKPI = (kpi, event) => {
      if (event && event.shiftKey && lastSelectedId) {
        // Get all KPIs currently displayed
        const currentKPIs = getSortedKPIs();
        
        // Find indexes for last selected and current KPI
        const lastIndex = currentKPIs.findIndex(k => k.dKPI_ID === lastSelectedId);
        const currentIndex = currentKPIs.findIndex(k => k.dKPI_ID === kpi.dKPI_ID);
        
        // Get the range of KPIs to select
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
        // Get KPIs in range
        const kpisToSelect = currentKPIs.slice(start, end + 1);
        
        // Add all KPIs in range to selection if not already selected
        const newSelection = [...selectedKPIs];
        kpisToSelect.forEach(k => {
          if (!newSelection.some(selected => selected.dKPI_ID === k.dKPI_ID)) {
            newSelection.push(k);
          }
        });
        
        setSelectedKPIs(newSelection);
      } else {
        // Regular single selection logic
        if (selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)) {
          setSelectedKPIs(selectedKPIs.filter(selected => selected.dKPI_ID !== kpi.dKPI_ID));
        } else {
          setSelectedKPIs([...selectedKPIs, kpi]);
        }
        setLastSelectedId(kpi.dKPI_ID);
      }
    };

  const handleSelectAll = () => {
    if (selectedKPIs.length === getFilteredKPIs().length) {
      // Deselect all
      setSelectedKPIs([]);
    } else {
      // Select all with same status as first selected KPI
      const firstSelectedStatus = selectedKPIs[0]?.dStatus;
      const filteredKPIs = getFilteredKPIs();
      if (firstSelectedStatus) {
        setSelectedKPIs(filteredKPIs.filter(kpi => kpi.dStatus === firstSelectedStatus));
      } else {
        // No current selection - select all with same status as first KPI
        const firstKPIStatus = filteredKPIs[0]?.dStatus;
        setSelectedKPIs(filteredKPIs.filter(kpi => kpi.dStatus === firstKPIStatus));
      }
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
    // Filter out any null/undefined KPIs first
    const filtered = getFilteredKPIs().filter(kpi => kpi && kpi.dKPI_ID);
    
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      if (!a || !b) return 0;
      
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // For string comparison, ignore case
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // For dates, convert to timestamp
      if (sortConfig.key === 'tCreatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
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
            <p><strong>KPI ID:</strong> {kpiToAdd.id}</p>
            <p><strong>KPI Name:</strong> {kpiToAdd.name}</p>
            <p><strong>Category:</strong> {kpiToAdd.category}</p>
            <p><strong>Behavior:</strong> {kpiToAdd.behavior}</p>
            <p><strong>Description:</strong> {kpiToAdd.description || '-'}</p>
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
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
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
                          >
                            Valid ({bulkKpis.length})
                          </button>
                          <button
                            className={`preview-tab ${previewTab === 'invalid' ? 'active' : ''}`}
                            onClick={() => setPreviewTab('invalid')}
                          >
                            Invalid ({invalidKpis.length})
                          </button>
                        </div>

                        <div className="preview-content">
                          {previewTab === 'valid' && (
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
                                        <div className="action-buttons">
                                          <button 
                                            onClick={() => {
                                              const updatedKpis = [...bulkKpis];
                                              updatedKpis.splice(index, 1);
                                              setBulkKpis(updatedKpis);
                                            }} 
                                            className="delete-btn"
                                          >
                                            <FaTrash size={12} /> Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {previewTab === 'invalid' && (
                            <div className="invalid-kpis-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Error Reason</th>
                                    <th>KPI Name</th>
                                    <th>Category</th>
                                    <th>Behavior</th>
                                    <th>Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invalidKpis.map((kpi, index) => (
                                    <tr key={`invalid-${index}`}>
                                      <td className="reason-cell" style={{ color: 'red' }}>
                                        {kpi.reason}
                                      </td>
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

                        {bulkKpis.length > 0 && (
                          <div className="modal-actions">
                            <button
                              onClick={handleBulkUpload}
                              className="save-btn"
                              disabled={bulkKpis.length === 0}
                            >
                              Submit KPIs {bulkKpis.length > 0 && `(${bulkKpis.length})`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

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
                {recentlyAdded.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No recently added KPIs
                    </td>
                  </tr>
                ) : (
                  recentlyAdded.map((kpi, idx) => (
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
                  ))
                )}
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
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="checkbox"
                              checked={selectedKPIs.length === getFilteredKPIs().length && getFilteredKPIs().length > 0}
                              onChange={handleSelectAll}
                              id="selectAll"
                            />
                            <label htmlFor="selectAll" style={{ fontSize: '13px', color: '#333', cursor: 'pointer' }}>
                              Select All
                            </label>
                          </div>
                        </th>
                        <th onClick={() => handleSort('dKPI_ID')} style={{ cursor: 'pointer' }}>
                          KPI ID {sortConfig.key === 'dKPI_ID' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
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
                        <th onClick={() => handleSort('dCalculationBehavior')} style={{ cursor: 'pointer' }}>
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
                      {getSortedKPIs().length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                            No KPIs found
                          </td>
                        </tr>
                      ) : (
                        getSortedKPIs().map((kpi, index) => (
                           <tr 
                              key={kpi.dKPI_ID || `kpi-${index}`}
                              onClick={(e) => {
                                if (e.target.closest('.action-buttons')) return;
                                handleSelectKPI(kpi, e);
                              }}
                              style={{ cursor: 'pointer' }}
                              className={selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID) ? 'selected-row' : ''}
                            >
                            <td data-label="Select">
                              <input
                                type="checkbox"
                                checked={selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)}
                                onChange={() => handleSelectKPI(kpi)}
                              />
                            </td>
                            <td data-label="KPI ID" className="tooltip-cell" data-tooltip={kpi.dKPI_ID}>
                              {kpi.dKPI_ID}
                            </td>
                            <td data-label="KPI Name" className="tooltip-cell" data-tooltip={kpi.dKPI_Name}>
                              {kpi.dKPI_Name}
                            </td>
                            <td data-label="Category" className="tooltip-cell" data-tooltip={kpi.dCategory}>
                              {kpi.dCategory}
                            </td>
                            <td data-label="Calculation Behavior" className="tooltip-cell" data-tooltip={kpi.dCalculationBehavior}>
                              {kpi.dCalculationBehavior}
                            </td>
                            <td data-label="Status" className="tooltip-cell" data-tooltip={kpi.dStatus === 'DEACTIVATED' ? 'Deactivated' : 'Active'}>
                              {kpi.dStatus === 'DEACTIVATED' ? 'Deactivated' : 'Active'}
                            </td>
                            <td data-label="Description" className="tooltip-cell" data-tooltip={kpi.dDescription || '-'}>
                              <div className="description-cell">
                                {kpi.dDescription || '-'}
                              </div>
                            </td>
                            <td data-label="Created By" className="tooltip-cell" data-tooltip={kpi.dCreatedBy || '-'}>
                              {kpi.dCreatedBy || '-'}
                            </td>
                            <td data-label="Created At" className="tooltip-cell" data-tooltip={kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}>
                              {kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}
                            </td>
                            <td data-label="Actions">
                              <div className="action-buttons">
                                {kpi.dStatus === 'DEACTIVATED' ? (
                                  <button className="reactivate-btn" onClick={() => handleReactivateClick(kpi)}>
                                    <FaCheck size={12} /> Reactivate
                                  </button>
                                ) : (
                                  <button className="deactivate-btn" onClick={() => handleDeleteClick(kpi)}>
                                    <FaBan size={12} /> Deactivate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
              {selectedKPIs.length > 0 && (
                <div className="bulk-actions">
                  {areAllActive() && (
                    <button 
                      className="bulk-disable-btn"
                      onClick={() => setShowBulkDisableModal(true)}
                    >
                      <FaBan /> Deactivate Selected KPIs
                      <span className="count">{selectedKPIs.length}</span>
                    </button>
                  )}
                  {areAllDeactivated() && (
                    <button 
                      className="bulk-reactivate-btn"
                      onClick={() => setShowBulkReactivateModal(true)}
                    >
                      <FaRedo /> Reactivate Selected KPIs
                      <span className="count">{selectedKPIs.length}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
       {showConfirmModal && kpiToAdd && (
        <div className="modal-overlay">
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h2>Confirm KPI Addition</h2>
            </div>
            
            <div className="warning-message">
              <p>Please type CONFIRM to add this KPI:</p>
            </div>

            <div className="kpi-details">
                <p><strong>KPI ID:</strong> {kpiToAdd.id}</p>
                <p><strong>KPI Name:</strong> {kpiToAdd.name}</p>
                <p><strong>Category:</strong> {kpiToAdd.category}</p>
                <p><strong>Behavior:</strong> {kpiToAdd.behavior}</p>
                <p><strong>Description:</strong> {kpiToAdd.description || '-'}</p>
            </div>

            <div className="confirmation-input">
              <input
                type="text"
                value={addConfirmation}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                  setAddConfirmation(value.toUpperCase());
                }}
                onPaste={(e) => e.preventDefault()}
                placeholder="Type 'CONFIRM' to proceed"
                maxLength="7"
                className={addConfirmation && addConfirmation.trim() !== 'CONFIRM' ? 'error' : ''}
              />
            </div>

            <div className="modal-actions">
            <button 
              onClick={() => {
                setShowConfirmModal(false);
                setAddConfirmation('');
              }} 
              className="cancel-btn"
            >
              Cancel
            </button>
              <button 
                onClick={handleConfirmAdd}
                className="save-btn"
                disabled={addConfirmation.trim() !== 'CONFIRM'}
              >
                Add KPI
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
                  <p>These are the KPI details that are about to be deactivated.</p>
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
                  placeholder="Please type CONFIRM to proceed."
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
                  <p>Please confirm the deactivation of <strong>{selectedKPIs.length}</strong> KPI{selectedKPIs.length > 1 ? 's' : ''}</p>
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

        {showBulkReactivateModal && (
          <div className="modal-overlay">
            <div className="modal delete-confirmation-modal">
            <div className="modal-header">
                <h2>Bulk Reactivation</h2>
              </div>
              

                 <p>Please confirm the deactivation of <strong>{selectedKPIs.length}</strong> KPI{selectedKPIs.length > 1 ? 's' : ''}</p>

                
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
                    value={bulkReactivateConfirmation}  // Fixed typo from 'bulkReativateConfirmation'
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 10);
                      setBulkReactivateConfirmation(value.toUpperCase());
                    }}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Type 'REACTIVATE' to confirm"
                    maxLength="10"
                    className={bulkReactivateConfirmation && bulkReactivateConfirmation.trim() !== 'REACTIVATE' ? 'error' : ''}
                  />

                  {bulkReactivateConfirmation && bulkReactivateConfirmation.trim() !== 'REACTIVATE' && (  // Fixed typo from 'bulkReactivateeConfirmation'
                    <span className="error-message"></span>
                  )}
                </div>


            <div className="modal-actions">
              <button
              onClick={() => {
                setShowBulkReactivateModal(false);
                setBulkReactivateConfirmation('');
            }}
              disabled={selectedKPIs.length === 0}
              className="bulk-action-btn reactivate"
              style={{
                backgroundColor: '#b2b6ba',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              
            >
              Cancel
            </button>
              <button 
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={handleBulkReactivate}
                className="confirm-btn"
                disabled={bulkReactivateConfirmation !== 'REACTIVATE'}
              >
                <FaRedo /> Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Add Validation Modal */}
        {showValidationModal && (
          <div className="modal-overlay">
            <div className={`modal validation-modal ${validationMessage.includes('reactivated') ? 'success-modal' : ''}`}>
              <div className="modal-header">
                <h2>{validationMessage.includes('reactivated') ? 'KPI Reactivation' : 'Validation Error'}</h2>
              </div>

              <div className={`warning-message ${validationMessage.includes('reactivated') ? 'success-message' : ''}`}>
                {validationMessage.includes('reactivated') ? (
                  <FaCheck className="success-icon" />
                ) : null}
                <p>{validationMessage}</p>
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

    // Add state declarations
    const [name, setName] = useState(kpi?.dKPI_Name || kpi?.name || '');
    const [category, setCategory] = useState(kpi?.dCategory || kpi?.category || '');
    const [behavior, setBehavior] = useState(kpi?.dCalculationBehavior || kpi?.behavior || '');
    const [description, setDescription] = useState(kpi?.dDescription || kpi?.description || '');
    const [error, setError] = useState('');

    useEffect(() => {
      const isDuplicate =
        kpis.some(item =>
          item?.dKPI_Name?.toLowerCase?.()?.trim() === name?.toLowerCase?.()?.trim() &&
          item.dKPI_ID !== kpi.dKPI_ID
        ) ||
        recentlyAdded.some((item, idx) =>
          item?.name?.toLowerCase?.()?.trim() === name?.toLowerCase?.()?.trim() &&
          idx !== kpi.idx
        );

      if (isDuplicate) {
        setError('A KPI with this name already exists.');
      } else {
        setError('');
      }
    }, [name, kpis, recentlyAdded, kpi.dKPI_ID, kpi.idx]);

      // Add this handleSave function
        const handleSave = () => {
          if (error) return;
          
          onSave({
            ...kpi,
            name,
            category,
            behavior,
            description
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
          <div className="char-counter">
            {description.length}/150
          </div>
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