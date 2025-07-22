import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../authHelper';
import ProductGrid from './ProductGrid';
import '../styles/Home.css';

export default function Home({ setUser }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="home-container">
      <button 
        className="drawer-toggle"
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Drawer */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <button 
            className="close-drawer"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="drawer-content">
          <button className="drawer-button" onClick={() => navigate('/profile')}>
            <span className="button-icon">👤</span>
            Profile
          </button>
          <button className="drawer-button" onClick={handleLogout}>
            <span className="button-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard">
        <h1>Welcome to AgroWood</h1>
        <div className="dashboard-content">
          <div className="dashboard-card full-width">
            <ProductGrid />
          </div>
        </div>
      </div>

      {/* Overlay for drawer on mobile */}
      {isDrawerOpen && (
        <div 
          className="drawer-overlay"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}
