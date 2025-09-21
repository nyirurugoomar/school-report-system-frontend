import { Routes, Route } from 'react-router-dom'
import SignIn from './page/SignIn'
import SignUp from './page/SignUp'
import Comment from './page/Comment'
import MainLayout from './layouts/MainLayout'
import Attendance from './page/Attendance'
import Success from './page/Success'
import Admin from './page/Admin'
import Marks from './page/Marks'
import CreateMarks from './page/CreateMarks'
import EditMarks from './page/EditMarks'
import ProtectedRoute from './components/ProtectedRoute'
function App() {
  return (
    <>
      <Routes>
        {/* Routes without layout */}
        <Route path='/' element={<SignIn />} />
        <Route path='/signin' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/success' element={<Success />} />
        {/* Routes with MainLayout */}
        <Route path='/main' element={<MainLayout />}>
          <Route path='comment' element={<Comment />} />
          <Route path='attendance' element={<Attendance />} />
          <Route path='marks' element={<Marks />} />
          <Route path='create-marks' element={<CreateMarks />} />
          <Route path='edit-marks/:marksId' element={<EditMarks />} />
          <Route path='admin' element={
          <ProtectedRoute requiredRole="admin" fallbackPath="comment">
            <Admin />
          </ProtectedRoute>
        } />
        </Route>
        
        {/* Direct routes with MainLayout */}
        <Route path='/comment' element={<MainLayout />}>
          <Route index element={<Comment />} />
        </Route>
        <Route path='/attendance' element={<MainLayout />}>
          <Route index element={<Attendance />} />
        </Route>
        <Route path='/marks' element={<MainLayout />}>
          <Route index element={<Marks />} />
        </Route>
        <Route path='/create-marks' element={<MainLayout />}>
          <Route index element={<CreateMarks />} />
        </Route>
        <Route path='/edit-marks/:marksId' element={<MainLayout />}>
          <Route index element={<EditMarks />} />
        </Route>
        <Route path='/admin' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute requiredRole="admin" fallbackPath="/comment">
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
        {/* <Route path='/schedule' element={<MainLayout />}>
          <Route index element={<div className='px-4 py-8'><h1 className='text-4xl font-bold text-white text-center'>Schedule Page</h1></div>} />
        </Route> */}
      </Routes>
    </>
  )
}

export default App