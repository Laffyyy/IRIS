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

export async function validateSession() {
  console.log('Starting session validation...');
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found in localStorage');
    clearSession();
    return false;
  }

  try {
    // Check if token is expired
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    console.log('Token expiration check:', {
      tokenExp: decoded.exp,
      currentTime: currentTime,
      isExpired: decoded.exp && decoded.exp < currentTime
    });

    if (decoded.exp && decoded.exp < currentTime) {
      console.log('Token has expired');
      clearSession();
      return false;
    }

    console.log('Making validation request to server...');
    const response = await fetch('http://localhost:3000/api/auth/validate-session', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Server response status:', response.status);
    if (!response.ok) {
      const data = await response.json();
      console.log('Server error response:', data);
      if (data.error === 'INVALID_SESSION' || data.error === 'TOKEN_EXPIRED') {
        console.log('Session is invalid or expired');
        clearSession();
      }
      return false;
    }

    console.log('Session is valid');
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    clearSession();
    return false;
  }
}

export function clearSession() {
  console.log('Clearing session data...');
  // Clear all session-related data
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('password');
  
  console.log('Redirecting to login page...');
  // Force redirect to login page
  window.location.replace('/');
}

// Start session validation interval
let validationInterval = null;

export function startSessionValidation(interval = 3000) { // Check every 3 seconds
  console.log('Starting session validation interval...');
  if (validationInterval) {
    console.log('Clearing existing validation interval');
    clearInterval(validationInterval);
  }
  
  // Immediate validation
  console.log('Performing immediate session validation');
  validateSession();
  
  validationInterval = setInterval(async () => {
    console.log('Running periodic session validation...');
    const isValid = await validateSession();
    console.log('Session validation result:', isValid);
    if (!isValid) {
      console.log('Session is invalid, stopping validation interval');
      clearInterval(validationInterval);
    }
  }, interval);
}

export function stopSessionValidation() {
  console.log('Stopping session validation...');
  if (validationInterval) {
    clearInterval(validationInterval);
    validationInterval = null;
  }
}

// Add event listener for storage changes
window.addEventListener('storage', (event) => {
  console.log('Storage event detected:', event);
  if (event.key === 'token' && !event.newValue) {
    console.log('Token was removed from storage');
    clearSession();
  }
});