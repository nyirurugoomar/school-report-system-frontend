import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function RoleSelection() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')

  const handleRoleChange = (e) => {
    const role = e.target.value
    setSelectedRole(role)
    
    if (role === 'teacher') {
      navigate('/comment?role=teacher')
    } else if (role === 'mentor') {
      navigate('/comment?role=mentor')
    }
  }

  return (
    <div className='min-h-screen bg-slate-800 flex flex-col justify-center items-center px-4 py-8'>
      <div className='max-w-2xl w-full'>
        <h1 className='text-4xl font-bold text-white mb-4 text-center'>Select Your Role</h1>
        <p className='text-slate-400 text-center mb-8'>Please choose your role to continue</p>
        
        <div className='mt-8'>
          <div className='space-y-2 mb-6'>
            <label className='block text-white text-sm font-medium'>Select Role *</label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a role</option>
              <option value="teacher">👨‍🏫 Teacher</option>
              <option value="mentor">👨‍💼 Mentor</option>
            </select>
          </div>
          
          {selectedRole === 'teacher' && (
            <div className='bg-green-900/30 border border-green-500 rounded-lg p-4 mb-4'>
              <p className='text-green-300 text-sm'>
                <strong>Teacher:</strong> To evaluate the daily activity of the students include comment and attendance of students
              </p>
            </div>
          )}
          
          {selectedRole === 'mentor' && (
            <div className='bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4'>
              <p className='text-blue-300 text-sm'>
                <strong>Mentor:</strong> To evaluate Teacher and guide them to improve their teaching skills
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleSelection

