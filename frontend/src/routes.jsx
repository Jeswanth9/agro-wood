import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Home from './components/Home';
import Profile from './components/Profile';

export default function AppRoutes({ user, setUser }) {
  // Redirect authenticated users away from auth pages
  const AuthRoute = ({ element }) => {
    return !user ? element : <Navigate to="/" replace />;
  };

  // Protect routes that require authentication
  const ProtectedRoute = ({ element }) => {
    return user ? element : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthRoute element={<Login onLogin={setUser} />} />} />
      <Route path="/signup" element={<AuthRoute element={<Signup onLogin={setUser} />} />} />
      <Route path="/" element={<ProtectedRoute element={<Home setUser={setUser} />} />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
    </Routes>
  );
}
