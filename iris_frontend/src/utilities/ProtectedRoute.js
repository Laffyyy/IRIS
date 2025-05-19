// ProtectedRoute.js
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRoles, startSessionValidation, stopSessionValidation } from './auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRoles = getUserRoles();

  useEffect(() => {
    // Start session validation when protected route is accessed
    startSessionValidation();

    // Cleanup: stop session validation when leaving protected route
    return () => {
      stopSessionValidation();
    };
  }, []);

  // Check if user has any of the allowed roles
  const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
