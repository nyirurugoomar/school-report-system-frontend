import React from 'react'
import { Link } from 'react-router-dom'

function Success() {
  return (
    <div className='min-h-screen bg-slate-800 flex items-center justify-center px-4'>
      <div className='max-w-md w-full text-center'>
        {/* Success Icon with Animation */}
        <div className='mb-8'>
          <div className='mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce'>
            <svg 
              className='w-10 h-10 text-white' 
              fill='none' 
              stroke='currentColor' 
              viewBox='0 0 24 24'
            >
              <path 
                strokeLinecap='round' 
                strokeLinejoin='round' 
                strokeWidth={3} 
                d='M5 13l4 4L19 7' 
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-4'>
            Success!
          </h1>
          <p className='text-gray-300 text-lg leading-relaxed'>
            Your information has been submitted successfully. Thank you for your contribution!
          </p>
        </div>

        {/* Action Buttons */}
        <div className='space-y-4'>
          <Link 
            to='/comment'
            className='block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105'
          >
            Submit Another Comment
          </Link>
          
          <Link 
            to='/attendance'
            className='block w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105'
          >
            Create Attendance
          </Link>
          
          
        </div>

        {/* Additional Info */}
        <div className='mt-8 p-4 bg-slate-700 rounded-lg'>
          <p className='text-gray-300 text-sm'>
            <span className='text-green-400 font-semibold'>✓</span> Your data has been saved securely
          </p>
         
        </div>
      </div>
    </div>
  )
}

export default Success