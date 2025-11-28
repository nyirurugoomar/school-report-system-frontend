import { Routes, Route } from 'react-router-dom'
import SignIn from './page/SignIn'
import SignUp from './page/SignUp'
import Comment from './page/Comment'
import RoleSelection from './page/RoleSelection'
import MainLayout from './layouts/MainLayout'
import Attendance from './page/Attendance'
import Success from './page/Success'
import Admin from './page/Admin'
import Marks from './page/Marks'
import CreateMarks from './page/CreateMarks'
import EditMarks from './page/EditMarks'
import ProtectedRoute from './components/ProtectedRoute'
import { useTracking } from './hooks/useTracking'

function App() {
  // Initialize tracking
  useTracking()
  return (
    <>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path='/' element={<SignIn />} />
        <Route path='/signin' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/success' element={<Success />} />
        
        {/* Protected routes - require authentication */}
        <Route path='/main' element={<MainLayout />}>
          <Route path='comment' element={
            <ProtectedRoute>
              <Comment />
            </ProtectedRoute>
          } />
          <Route path='attendance' element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path='marks' element={
            <ProtectedRoute>
              <Marks />
            </ProtectedRoute>
          } />
          <Route path='create-marks' element={
            <ProtectedRoute>
              <CreateMarks />
            </ProtectedRoute>
          } />
          <Route path='edit-marks/:marksId' element={
            <ProtectedRoute>
              <EditMarks />
            </ProtectedRoute>
          } />
          <Route path='admin' element={
            <ProtectedRoute requiredRole="admin" fallbackPath="comment">
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Role Selection Route */}
        <Route path='/role-selection' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Direct protected routes with MainLayout */}
        <Route path='/comment' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <Comment />
            </ProtectedRoute>
          } />
        </Route>
        <Route path='/attendance' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } />
        </Route>
        <Route path='/marks' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <Marks />
            </ProtectedRoute>
          } />
        </Route>
        <Route path='/create-marks' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <CreateMarks />
            </ProtectedRoute>
          } />
        </Route>
        <Route path='/edit-marks/:marksId' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute>
              <EditMarks />
            </ProtectedRoute>
          } />
        </Route>
        <Route path='/admin' element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute requiredRole="admin" fallbackPath="/comment">
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    
    </>
  )
}

export default App