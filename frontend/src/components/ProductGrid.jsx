import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductGrid.css';

export default function ProductGrid({ cart, setCart, products }) {
  const [loading] = useState(false);
  const [error] = useState(null);
  const navigate = useNavigate();

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

  // Calculate total items in cart
  const totalCartItems = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  if (!products || products.length === 0) {
    return <div className="loading">Loading products... Please wait</div>;
  }

  return (
    <div className="product-grid-container">
      {totalCartItems > 0 && (
        <div className="cart-summary-bar">
          <span>
            {totalCartItems === 1
              ? "You have 1 item in your cart."
              : `You have ${totalCartItems} items in your cart.`}
          </span>
          <button
            className="view-cart-btn"
            onClick={() => navigate('/cart')}
          >
            Go to My Cart
          </button>
        </div>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card professional-card">
            <div className="product-image">
              {product.image_signed_url ? (
                <img src={product.image_signed_url} alt={product.name} loading="lazy" />
              ) : (
                <div className="no-image">
                  <span className="no-image-icon">📸</span>
                  <span>Oops! No image yet</span>
                </div>
              )}
              {product.quantity === 0 && <div className="out-of-stock-badge">Sorry, out of stock!</div>}
            </div>
            <div className="product-info">
              <div className="product-header">
                <h3>{product.name}</h3>
                <p className="description">{product.description || 'No description for this product yet.'}</p>
              </div>
              <div className="product-content">
                <div className="product-details">
                  <div className="price-tag">
                    <span className="currency">₹</span>
                    <span className="price">{product.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="stock-info">
                    <span className="quantity-label">{product.quantity === 0 ? 'Currently unavailable' : 'Available'}</span>
                    <span className="quantity-value">{product.quantity} {product.unit}</span>
                  </div>
                </div>
                <div className="cart-actions">
                  <button
                    className={`add-to-cart-btn ${product.quantity === 0 ? 'disabled' : ''} ${cart[product.id] ? 'in-cart' : ''}`}
                    onClick={() => addToCart(product.id)}
                    disabled={product.quantity === 0}
                    aria-label={product.quantity === 0 ? `Out of stock: ${product.name}` : `Add ${product.name} to cart`}
                  >
                    {cart[product.id]
                      ? <><span className="cart-icon">🛒</span> Added! ({cart[product.id]})</>
                      : <><span className="cart-icon">➕</span> Add to Cart</>
                    }
                  </button>
                  {product.quantity === 0 && (
                    <div className="out-of-stock-message">Check back soon for restock!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <div className="no-products-message">
          <span>We couldn't find any products right now. Please check back later!</span>
        </div>
      )}
    </div>
  );
}