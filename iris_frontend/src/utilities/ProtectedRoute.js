// ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { getUserRoles } from './auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRoles = getUserRoles();
  const userEmail = localStorage.getItem('userEmail');

  // Allow access if user is in forgot password flow
  if (userEmail) {
    return children;
  }

  const hasAccess = allowedRoles.some(role => userRoles.includes(role));
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
