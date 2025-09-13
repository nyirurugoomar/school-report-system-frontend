import React from 'react'
import { useNavigate } from 'react-router-dom'
function Comment() {
  const navigate = useNavigate()
  return (
    <div className='min-h-screen bg-slate-800 px-4 py-8'>
      <div className='w-full'>
        <h1 className='text-4xl font-bold text-white mb-8 text-center'>Please fill the Comment form</h1>
        
        <form className='w-full space-y-6 px-8'>
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Class Name</label>
            <input 
              type="text" 
              placeholder='Enter Class Name'
              className='w-[800px] px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Subject Name</label>
            <input 
              type="text" 
              placeholder='Enter Subject Name'
              className='w-[800px] px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Number of Student</label>
            <input 
              type="number" 
              placeholder='Enter Number of Student'
              className='w-[800px] px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400'
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Enter Success Story</label>
            <textarea 
              placeholder='Enter Success Story'
              className='w-[800px] px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 resize-none'
              rows={4}
            />
          </div>
          
          <div className='space-y-2'>
            <label className='block text-white text-sm font-medium'>Any Challenge</label>
            <textarea 
              placeholder='Enter Challenge'
              className='w-[800px] px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 resize-none'
              rows={4}
            />
          </div>
          
          <div className='pt-4'>
            <button 
              onClick={() => navigate('/success')}
              type="submit"
              className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200'
            >
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Comment