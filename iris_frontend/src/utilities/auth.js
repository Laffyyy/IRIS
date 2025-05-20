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

// List of paths that should not trigger session validation
const excludedPaths = ['/otp', '/change-password', '/security-questions', '/update-password'];

export async function validateSession() {
  // Skip validation for excluded paths
  if (excludedPaths.includes(window.location.pathname)) {
    return true;
  }

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
    console.log('Using token:', token);
    
    const response = await fetch('http://localhost:3000/api/auth/validate-session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Server response status:', response.status);
    const responseData = await response.json();
    console.log('Server response data:', responseData);

    if (!response.ok) {
      console.log('Session validation failed:', responseData.error);
      clearSession();
      return false;
    }

    // Verify that the session ID in the response matches the one in the token
    if (responseData.data && responseData.data.sessionId !== decoded.sessionId) {
      console.log('Session ID mismatch - possible session hijacking attempt');
      clearSession();
      return false;
    }

    console.log('Session validation successful:', responseData);
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
  
  // Stop any ongoing validation
  stopSessionValidation();
  
  console.log('Redirecting to login page...');
  // Force redirect to login page
  window.location.replace('/');
}

// Start session validation interval
let validationInterval = null;

export function startSessionValidation(interval = 3000) { // Check every 3 seconds
  // Skip validation for excluded paths
  if (excludedPaths.includes(window.location.pathname)) {
    return;
  }

  console.log('Starting session validation interval...');
  if (validationInterval) {
    console.log('Clearing existing validation interval');
    clearInterval(validationInterval);
  }
  
  // Immediate validation
  console.log('Performing immediate session validation');
  validateSession().then(isValid => {
    if (!isValid) {
      console.log('Initial session validation failed');
      return; // Don't start interval if initial validation fails
    }
    
    validationInterval = setInterval(async () => {
      // Skip validation for excluded paths
      if (excludedPaths.includes(window.location.pathname)) {
        return;
      }

      console.log('Running periodic session validation...');
      const isValid = await validateSession();
      console.log('Session validation result:', isValid);
      if (!isValid) {
        console.log('Session is invalid, stopping validation interval');
        clearInterval(validationInterval);
      }
    }, interval);
  }).catch(error => {
    console.error('Error in initial session validation:', error);
    clearSession();
  });
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

// Add event listener for visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Page became visible, validating session...');
    validateSession();
  }
});

// Add event listener for focus
window.addEventListener('focus', () => {
  console.log('Window focused, validating session...');
  validateSession();
});