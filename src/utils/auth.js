// Authentication utility functions

/**
 * Get user information from localStorage
 * @returns {Object|null} User object or null if not found
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Get user role from localStorage
 * @returns {string|null} User role or null if not found
 */
export const getUserRole = () => {
  const user = getUser()
  return user?.role || null
}

/**
 * Check if user has admin role
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdmin = () => {
  const role = getUserRole()
  return role === 'admin' || role === 'Admin'
}

/**
 * Check if user has specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} True if user has the required role
 */
export const hasRole = (requiredRole) => {
  const userRole = getUserRole()
  return userRole === requiredRole
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  return !!token
}

/**
 * Store user data in localStorage
 * @param {Object} userData - User object to store
 */
export const setUser = (userData) => {
  try {
    localStorage.setItem('user', JSON.stringify(userData))
  } catch (error) {
    console.error('Error storing user data:', error)
  }
}

/**
 * Clear user data from localStorage
 */
export const clearUser = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  sessionStorage.clear()
}
