import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'
import logo from '../assets/log2.png'
function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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

    try {
      const response = await signup(formData)
      
      // Store token in localStorage if provided
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      
      // Navigate to attendance page or success page
      navigate('/comment')
    } catch (error) {
      console.error('Signup error:', error)
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4 py-8'>
      <div className='text-center mb-6 sm:mb-8'>
        <img src={logo} alt="logo" className='w-[20rem] h-32 sm:w-48 sm:h-48 lg:w-[40rem] lg:h-60' />
      </div>
      <div className='text-center mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2'>Create New Account</h1>
        <p className='text-slate-400 text-sm sm:text-base'>Join our school management system</p>
      </div>
      
      <form onSubmit={handleSubmit} className='w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm'>
            {error}
          </div>
        )}

        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Username</label>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder='Enter your full name'
            required
            className='w-full px-3 sm:px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
          />
        </div>
        
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Email Address</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder='you@example.com'
            required
            className='w-full px-3 sm:px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
          />
        </div>
        
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder='Enter your password'
            required
            minLength={6}
            className='w-full px-3 sm:px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base'
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className='text-center mt-4'>
        <span className='text-white text-xs sm:text-sm'>Already have an account? </span>
        <Link to="/" className='text-green-400 hover:text-green-300 text-xs sm:text-sm font-medium'>
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default SignUp