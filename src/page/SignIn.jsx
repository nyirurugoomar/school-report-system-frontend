import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signin } from '../api/auth'
import logo from '../assets/logo_reb.png'

function SignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Form submitted with data:', formData)

    try {
      const response = await signin(formData)
      console.log('Signin successful, response:', response)
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token)
        console.log('Token stored in localStorage')
      }
      
      // Navigate to comment page
      navigate('/comment')
    } catch (error) {
      console.error('Signin error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      
      // More detailed error handling
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your connection.'
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4'>
      {/* Header */}
      <div className='text-center mb-8'>
        <img src={logo} alt="logo" className='w-60 h-60' />
      </div>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Welcome Back</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='w-full max-w-md space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm'>
            {error}
          </div>
        )}

        {/* Username Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Username</label>
          <input 
            type="username" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder='Enter your username'
            required
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder='Enter your password'
            required
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
        <button 
          type="submit"
          disabled={loading}
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer'
        >
          {loading ? 'Signing In...' : 'Log In'}
        </button>

        {/* Sign Up Link */}
        <div className='text-center'>
          <span className='text-white text-sm'>Don't have an account? </span>
          <Link to="/signup" className='text-green-400 hover:text-green-300 text-sm font-medium'>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}

export default SignIn