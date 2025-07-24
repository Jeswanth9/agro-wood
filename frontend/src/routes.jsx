import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Home from './components/Home';
import Profile from './components/Profile';
import Cart from './components/Cart';

export default function AppRoutes({ user, setUser, cart, setCart, products, setProducts }) {
  // wrapper to ensure user is not logged in to access auth routes
  const AuthRoute = ({ element }) => {
    return !user ? element : <Navigate to="/" replace />;
  };

  // protected route to ensure logout if user is not auth
  const ProtectedRoute = ({ element }) => {
    return user ? element : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthRoute element={<Login onLogin={setUser} />} />} />
      <Route path="/signup" element={<AuthRoute element={<Signup onLogin={setUser} />} />} />
      <Route path="/" element={<ProtectedRoute element={<Home setUser={setUser} cart={cart} setCart={setCart} products={products} setProducts={setProducts} />} />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/cart" element={<ProtectedRoute element={<Cart cart={cart} setCart={setCart} products={products} />} />} />
    </Routes>
  );
}
