import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearUser, isAdmin, getUserRole } from '../utils/auth'
import logo from '../assets/Partnershiplogo.png'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Helper function to check if current route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Check if user is admin (hide Comments, Attendance, Marks for all admins)
  const userIsAdmin = isAdmin()
  
  // Debug: Log user role information
  const userRole = getUserRole()
  console.log('Navbar - Current user role:', userRole)
  console.log('Navbar - Is admin:', userIsAdmin)
  console.log('Navbar - Current path:', location.pathname)

  // Logout functionality
  const handleLogout = () => {
    try {
      // Clear all authentication data using utility function
      clearUser()
      
      // Close mobile menu if open
      setIsMobileMenuOpen(false)
      
      // Redirect to sign in page
      navigate('/signin')
      
      // Optional: Show success message
      console.log('Successfully logged out')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      navigate('/signin')
    }
  }

  // Close mobile menu when clicking on a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className='bg-slate-900 px-4 sm:px-6 py-4'>
      <div className='flex justify-between items-center'>
        {/* Logo */}
        <div className='flex-shrink-0'>
          <img src={logo} alt="logo" className='w-12 h-10 sm:w-16 sm:h-14' />
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex space-x-4'>
          {/* Only show Comments, Attendance, Marks if NOT admin */}
          {!userIsAdmin && (
            <>
              <Link 
                to="/comment" 
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/comment') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Comments
              </Link>
              <Link 
                to="/attendance" 
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/attendance') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Attendance
              </Link>
              <Link 
                to="/marks" 
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/marks') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Marks
              </Link>
            </>
          )}
          {isAdmin() && (
            <Link 
              to="/admin" 
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive('/admin') 
                  ? 'bg-slate-700 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Desktop Logout Button */}
        <div className='hidden md:flex items-center'>
          <button 
            onClick={handleLogout}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center space-x-2'
            title="Logout from the system"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden flex items-center space-x-2'>
          <button 
            onClick={handleLogout}
            className='px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center space-x-1'
            title="Logout"
          >
            <span>🚪</span>
            <span className='text-sm'>Logout</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='p-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md'
            aria-label="Toggle mobile menu"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden mt-4 pb-4 border-t border-slate-700'>
          <div className='flex flex-col space-y-2 pt-4'>
            {/* Only show Comments, Attendance, Marks if NOT admin */}
            {!userIsAdmin && (
              <>
                <Link 
                  to="/comment" 
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-md transition-colors ${
                    isActive('/comment') 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  📝 Comments
                </Link>
                <Link 
                  to="/attendance" 
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-md transition-colors ${
                    isActive('/attendance') 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  📊 Attendance
                </Link>
                <Link 
                  to="/marks" 
                  onClick={handleLinkClick}
                  className={`px-4 py-3 rounded-md transition-colors ${
                    isActive('/marks') 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  📈 Marks
                </Link>
              </>
            )}
            {isAdmin() && (
              <Link 
                to="/admin" 
                onClick={handleLinkClick}
                className={`px-4 py-3 rounded-md transition-colors ${
                  isActive('/admin') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                ⚙️ Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Navbar