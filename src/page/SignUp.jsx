import React from 'react'
import { Link } from 'react-router-dom'
function SignUp() {
  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4'>
        <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Create New Account</h1>
      </div>
      <form className='w-full max-w-md space-y-6'>
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Full Name</label>
          <input 
            type="text" 
            placeholder='full name'
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Email Address</label>
          <input 
            type="email" 
            placeholder='you@example.com'
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <input 
            type="password" 
            placeholder='password'
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>
        <button className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'>
          Create Account
        </button>
      </form>
      <div className='text-center mt-4'>
        <span className='text-white text-sm'>Already have an account? </span>
        <Link to="/" className='text-green-400 hover:text-green-300 text-sm font-medium'>
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default SignUp