import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SignIn() {
    const navigate = useNavigate()
  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Welcome Back</h1>
      </div>

      {/* Form */}
      <div className='w-full max-w-md space-y-6'>
        {/* Email Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Email Address</label>
          <input 
            type="email" 
            placeholder='you@example.com'
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <input 
            type="password" 
            placeholder='Enter your password'
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>

        {/* Forgot Password Link */}
        <div className='text-left'>
          <a href="#" className='text-green-400 hover:text-green-300 text-sm font-medium'>
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <button onClick={() => navigate('/comment')} className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer'>
          Log In
        </button>

        {/* Sign Up Link */}
        <div className='text-center'>
          <span className='text-white text-sm'>Don't have an account? </span>
          <Link to="/signup" className='text-green-400 hover:text-green-300 text-sm font-medium'>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn