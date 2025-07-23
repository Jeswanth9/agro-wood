
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../authHelper';
import ProductGrid from './ProductGrid';
import '../styles/Home.css';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

export default function Home({ setUser, cart, setCart, products, setProducts }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="brand-title" onClick={() => navigate('/')}>AgroWood</div>
        <div className="header-actions">
          <button className="header-btn" onClick={() => navigate('/profile')} title="Profile">
            <FaUser aria-label="Profile Icon" />
          </button>
          <button className="header-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt aria-label="Logout Icon" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard">
        <section className="dashboard-header">
          <h1>Welcome to <span className="highlight">AgroWood</span></h1>
          <p className="dashboard-subtitle">Your trusted marketplace for quality agricultural products</p>
        </section>
        <div className="dashboard-content">
          <div className="dashboard-card full-width">
            <ProductGrid cart={cart} setCart={setCart} products={products} />
          </div>
        </div>
      </main>
    </div>
  );
}
