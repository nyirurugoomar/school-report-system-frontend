import { Routes, Route } from 'react-router-dom'
import SignIn from './page/SignIn'
import SignUp from './page/SignUp'
import Comment from './page/Comment'
import MainLayout from './layouts/MainLayout'
import Attendance from './page/Attendance'
import Success from './page/Success'
function App() {
  return (
    <>
      <Routes>
        {/* Routes without layout */}
        <Route path='/' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/success' element={<Success />} />
        {/* Routes with MainLayout */}
        <Route path='/main' element={<MainLayout />}>
          <Route path='comment' element={<Comment />} />
          <Route path='attendance' element={<Attendance />} />
        </Route>
        
        {/* Direct routes with MainLayout */}
        <Route path='/comment' element={<MainLayout />}>
          <Route index element={<Comment />} />
        </Route>
        <Route path='/attendance' element={<MainLayout />}>
          <Route index element={<Attendance />} />
        </Route>
        {/* <Route path='/schedule' element={<MainLayout />}>
          <Route index element={<div className='px-4 py-8'><h1 className='text-4xl font-bold text-white text-center'>Schedule Page</h1></div>} />
        </Route> */}
      </Routes>
    </>
  )
}

export default App