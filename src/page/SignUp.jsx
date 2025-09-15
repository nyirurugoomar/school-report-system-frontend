import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'
import logo from '../assets/logo_reb.png'
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
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4'>
      <div className='text-center mb-8'>
        <img src={logo} alt="logo" className='w-60 h-60' />
      </div>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Create New Account</h1>
      </div>
      
      <form onSubmit={handleSubmit} className='w-full max-w-md space-y-6'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm'>
            {error}
          </div>
        )}

        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Full Name</label>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder='full name'
            required
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
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
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>
        
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Password</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder='password'
            required
            minLength={6}
            className='w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className='w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
        >
          {loading ? 'Creating Account...' : 'Create Account'}
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