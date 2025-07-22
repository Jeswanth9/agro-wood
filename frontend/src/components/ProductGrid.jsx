import { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { productEndpoints } from '../api/productEndpoints';
import '../styles/ProductGrid.css';

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});

  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentInCart = cart[productId] || 0;
    if (currentInCart >= product.quantity) {
      alert(`Sorry, only ${product.quantity} ${product.unit} available in stock!`);
      return;
    }

    setCart(prevCart => ({
      ...prevCart,
      [productId]: (prevCart[productId] || 0) + 1
    }));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiCall({ 
          url: productEndpoints.listProducts,
          method: 'GET'
        });
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="loading">Loading products... Please wait</div>;
  }

  if (error) {
    return <div className="error">⚠️ Error: {error}</div>;
  }

  if (products.length === 0) {
    return <div className="loading">No products available at the moment</div>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <div className="product-image">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} loading="lazy" />
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                color: '#6b7280'
              }}>
                No image available
              </div>
            )}
          </div>
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="description">{product.description || 'No description available'}</p>
            <div className="product-details">
              <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="quantity">Available: {product.quantity} {product.unit}</span>
            </div>
            <div className="cart-actions">
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(product.id)}
                disabled={product.quantity === 0}
              >
                {cart[product.id] ? `In Cart (${cart[product.id]})` : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
