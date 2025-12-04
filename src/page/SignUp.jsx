import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'
import logo from '../assets/log2.png'
function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

    // Validate role selection
    if (!formData.role) {
      setError('Please select a role (Teacher or Mentor)')
      setLoading(false)
      return
    }

    try {
      const response = await signup(formData)
      
      // Store token in localStorage if provided
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      
      // Navigate to comment page with role parameter
      navigate(`/comment?role=${formData.role}`)
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
          <div className='relative'>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder='Enter your password'
              required
              minLength={6}
              className='w-full px-3 sm:px-4 py-3 pr-10 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-sm sm:text-base'
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
        
        <div className='space-y-2'>
          <label className='block text-white text-sm font-medium'>Select Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className='w-full px-3 sm:px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base'
          >
            <option value="">Select a role</option>
            <option value="teacher">👨‍🏫 Teacher</option>
            <option value="mentor">👨‍💼 Mentor</option>
          </select>
          {formData.role === 'teacher' && (
            <p className='text-green-300 text-xs mt-1'>
              Teacher: To evaluate the daily activity of the students include comment and attendance of students
            </p>
          )}
          {formData.role === 'mentor' && (
            <p className='text-blue-300 text-xs mt-1'>
              Mentor: To evaluate Teacher and guide them to improve their teaching skills
            </p>
          )}
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