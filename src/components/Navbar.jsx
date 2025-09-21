import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearUser, isAdmin } from '../utils/auth'
import logo from '../assets/logo_reb.png'
function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Helper function to check if current route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Logout functionality
  const handleLogout = () => {
    try {
      // Clear all authentication data using utility function
      clearUser()
      
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

  return (
    <div className='bg-slate-900 px-6 py-4 flex justify-between items-center'>

      <div>
        <img src={logo} alt="logo" className='w-16 h-14' />
      </div>
      {/* Left side - Navigation buttons */}
      <div className='flex space-x-4'>
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
      
      {/* Right side - Logout button */}
      <div className='flex items-center'>
        <button 
          onClick={handleLogout}
          className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center space-x-2'
          title="Logout from the system"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Navbar