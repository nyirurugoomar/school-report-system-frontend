import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  
  // Helper function to check if current route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className='bg-slate-900 px-6 py-4 flex justify-between items-center'>
      {/* Left side - Room and Credits info */}
      {/* <div className='text-gray-300 text-sm'>
        <span>Room: 203 | Credits: 3</span>
      </div> */}
      
      {/* Right side - Navigation buttons */}
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
      </div>
    </div>
  )
}

export default Navbar