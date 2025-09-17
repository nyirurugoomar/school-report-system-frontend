import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, isAdmin, hasRole } from '../utils/auth'

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.requiredRole - Required role to access the route
 * @param {string} props.fallbackPath - Path to redirect to if access denied
 * @returns {React.ReactNode} Protected content or redirect
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallbackPath = '/comment',
  requireAuth = true 
}) => {
  const location = useLocation()

  // Check if user is authenticated
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin()) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />
    }
    
    if (requiredRole !== 'admin' && !hasRole(requiredRole)) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />
    }
  }

  return children
}

export default ProtectedRoute
