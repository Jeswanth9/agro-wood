import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';

export default function AppRoutes({ user, setUser }) {
  const AuthRoute = ({ element }) => {
    return !user ? element : <Navigate to="/" replace />;
  };

  const ProtectedRoute = ({ element }) => {
    return user ? element : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthRoute element={<Login onLogin={setUser} />} />} />
      <Route path="/signup" element={<AuthRoute element={<Signup onLogin={setUser} />} />} />
      <Route path="/" element={<ProtectedRoute element={<div>Home Page</div>} />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
