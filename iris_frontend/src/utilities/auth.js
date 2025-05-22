import { jwtDecode } from 'jwt-decode';

export function getUserRoles() {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const decoded = jwtDecode(token);
    // Support both 'role' (string) and 'roles' (array or string)
    if (decoded.roles) {
      return Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
    }
    if (decoded.role) {
      return [decoded.role];
    }
    return [];
  } catch (err) {
    return [];
  }
}