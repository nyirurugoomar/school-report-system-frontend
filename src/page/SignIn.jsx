import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signin } from '../api/auth'
import { setUser } from '../utils/auth'
import logo from '../assets/log2.png'
import { useTracking } from '../hooks/useTracking'

function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { trackFormSubmission, trackLoginAttempt } = useTracking()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Check for message from navigation state (e.g., after password change)
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message)
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

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

    // Track form submission
    await trackFormSubmission('signin_form', {
      username: formData.username,
      timestamp: new Date().toISOString()
    })

    console.log('Form submitted with data:', formData)

    try {
      const response = await signin(formData)
      console.log('Signin successful, response:', response)
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token)
        console.log('Token stored in localStorage')
      }
      
      // Store user data including role
      if (response.user) {
        setUser(response.user)
        console.log('User data stored:', response.user)
      } else if (response.role) {
        // If backend only returns role, create user object
        setUser({ 
          username: formData.username, 
          role: response.role 
        })
        console.log('User role stored:', response.role)
      }
      
      // Track successful login
      await trackLoginAttempt(formData.username, true, {
        userRole: response.user?.role || response.role,
        timestamp: new Date().toISOString()
      })
      
      // Navigate based on user role
      const userRole = response.user?.role || response.role
      if (userRole && userRole.toLowerCase() === 'admin') {
        console.log('Admin user detected, redirecting to admin dashboard')
        navigate('/admin')
      } else {
        console.log('Regular user detected, redirecting to comments page')
        navigate('/comment')
      }
    } catch (error) {
      console.error('Signin error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      
      // Track failed login
      await trackLoginAttempt(formData.username, false, {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
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
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4 py-8'>
      {/* Header */}
      <div className='text-center mb-6 sm:mb-8'>
        <img src={logo} alt="logo" className='w-[20rem] h-32 sm:w-48 sm:h-48 lg:w-[40rem] lg:h-60' />
      </div>
      <div className='text-center mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2'>Welcome Back</h1>
        <p className='text-slate-400 text-sm sm:text-base'>Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6'>
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
            className='w-full px-3 sm:px-4 py-3 sm:py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
          />
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <div className='relative'>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter your password'
              required
              className='w-full px-3 sm:px-4 py-3 sm:py-3 pr-10 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.46 3.46L12 12m-3.42-3.42L5.12 5.12m7.532 7.532L12 12m0 0l3.29 3.29M12 12l3.29-3.29m0 0A9.97 9.97 0 0118.88 18.88m-3.46-3.46L12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className='text-left'>
          <Link 
            to="/change-password" 
            onClick={() => {
              console.log('Forgot password link clicked, navigating to /change-password')
            }}
            className='text-green-400 hover:text-green-300 text-sm font-medium hover:underline'
          >
            Forgot password?
          </Link>
        </div>

        {/* Login Button */}
        <button 
          type="submit"
          disabled={loading}
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 sm:py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer text-sm sm:text-base'
        >
          {loading ? 'Signing In...' : 'Log In'}
        </button>

        {/* Sign Up Link */}
        <div className='text-center'>
          <span className='text-white text-xs sm:text-sm'>Don't have an account? </span>
          <Link to="/signup" className='text-green-400 hover:text-green-300 text-xs sm:text-sm font-medium'>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}

export default SignIn