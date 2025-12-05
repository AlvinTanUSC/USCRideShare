import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Rides from './pages/Rides';
import NewRide from './pages/NewRide';
import RideDetail from './pages/RideDetail';

// Protected Route component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/rides"
          element={
            <ProtectedRoute>
              <Rides />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/new"
          element={
            <ProtectedRoute>
              <NewRide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/:id"
          element={
            <ProtectedRoute>
              <RideDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/rides" replace />} />
        <Route path="*" element={<Navigate to="/rides" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
