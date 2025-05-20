// ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { getUserRoles, validateSession, startSessionValidation, stopSessionValidation } from './auth';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const userRoles = getUserRoles();
  const location = useLocation();

  // List of paths that should not trigger session validation
  const excludedPaths = ['/otp', '/change-password', '/security-questions', '/update-password'];

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      // Skip validation for excluded paths
      if (excludedPaths.includes(location.pathname)) {
        if (mounted) {
          setIsValid(true);
          setIsValidating(false);
        }
        return;
      }

      try {
        // Start session validation when entering protected route
        startSessionValidation();
        
        const valid = await validateSession();
        if (mounted) {
          setIsValid(valid);
          setIsValidating(false);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        if (mounted) {
          setIsValid(false);
          setIsValidating(false);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      mounted = false;
      // Stop session validation when leaving protected route
      if (!excludedPaths.includes(location.pathname)) {
        stopSessionValidation();
      }
    };
  }, [location.pathname]); // Re-run when path changes

  if (isValidating) {
    return <LoadingSpinner />;
  }

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  const hasAccess = allowedRoles.some(role => userRoles.includes(role));
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
