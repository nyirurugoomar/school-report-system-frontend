import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { isAuthenticated, getUser } from '../utils/auth'
import logo from '../assets/log2.png'

function ChangePassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    console.log('ChangePassword component mounted, checking authentication...')
    const authStatus = isAuthenticated()
    console.log('Authentication status:', authStatus)
    
    if (!authStatus) {
      console.log('User not authenticated, redirecting to sign in...')
      // Redirect to sign in if not authenticated with helpful message
      navigate('/signin', { 
        state: { 
          message: 'You must be logged in to change your password. If you forgot your password, please contact your administrator for assistance.' 
        },
        replace: true
      })
    } else {
      console.log('User is authenticated, showing change password form')
    }
  }, [navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match')
      setLoading(false)
      return
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('New password must be different from old password')
      setLoading(false)
      return
    }

    try {
      const response = await changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      })
      
      setSuccess(response.message || 'Password changed successfully!')
      
      // Clear form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        navigate('/signin', { state: { message: 'Password changed successfully. Please sign in with your new password.' } })
      }, 2000)
    } catch (error) {
      console.error('Change password error:', error)
      let errorMessage = 'Failed to change password. Please try again.'
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const user = getUser()
  const isAuth = isAuthenticated()

  // Show loading state while checking authentication
  if (!isAuth) {
    return (
      <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4 py-8'>
        <div className='text-center'>
          <p className='text-white text-lg'>Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4 py-8'>
      {/* Header */}
      <div className='text-center mb-6 sm:mb-8'>
        <img src={logo} alt="logo" className='w-[20rem] h-32 sm:w-48 sm:h-48 lg:w-[40rem] lg:h-60' />
      </div>
      <div className='text-center mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2'>Change Password</h1>
        <p className='text-slate-400 text-sm sm:text-base'>
          {user?.username ? `Update password for ${user.username}` : 'Update your account password'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6'>
        {/* Success Message */}
        {success && (
          <div className='bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm'>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm'>
            {error}
          </div>
        )}

        {/* Old Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Current Password *</label>
          <div className='relative'>
            <input 
              type={showOldPassword ? "text" : "password"} 
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder='Enter your current password'
              required
              className='w-full px-3 sm:px-4 py-3 sm:py-3 pr-10 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none'
              aria-label={showOldPassword ? 'Hide password' : 'Show password'}
            >
              {showOldPassword ? (
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

        {/* New Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>New Password *</label>
          <div className='relative'>
            <input 
              type={showNewPassword ? "text" : "password"} 
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder='Enter your new password'
              required
              minLength={6}
              className='w-full px-3 sm:px-4 py-3 sm:py-3 pr-10 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none'
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
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
          <p className='text-slate-400 text-xs'>Must be at least 6 characters long</p>
        </div>

        {/* Confirm Password Field */}
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Confirm New Password *</label>
          <div className='relative'>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Confirm your new password'
              required
              minLength={6}
              className='w-full px-3 sm:px-4 py-3 sm:py-3 pr-10 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none'
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
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

        {/* Change Password Button */}
        <button 
          type="submit"
          disabled={loading}
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 sm:py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer text-sm sm:text-base'
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>

        {/* Back to Sign In Link */}
        <div className='text-center'>
          <Link to="/signin" className='text-green-400 hover:text-green-300 text-xs sm:text-sm font-medium'>
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  )
}

export default ChangePassword

