import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { getToken, getUserId, removeToken } from '../authHelper.js';
import { apiCall } from '../api';
import endpoints from '../endpoints.js';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('selling');
  const [sellingProducts, setSellingProducts] = useState([]);
  const [buyingProducts, setBuyingProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    quantity: '',
    image: null
  });
  const navigate = useNavigate();

  // Header actions
  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleUpdateOrder = async (orderId) => {
    setUpdating(true);
    try {
      await apiCall({
        url: endpoints.updateOrder(orderId),
        method: 'PUT',
        data: {
          status: 'completed'
        }
      });
      // Refresh the orders list after updating
      await fetchOwnerOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit,
      quantity: product.quantity || '',
      image: null
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('description', editForm.description || '');
    formData.append('price', editForm.price.toString());
    formData.append('unit', editForm.unit);
    formData.append('quantity', editForm.quantity ? editForm.quantity.toString() : '');
    if (editForm.image) {
      formData.append('image', editForm.image);
    }

    try {
      if (editingProduct && editingProduct.id) {
        // Update existing product
        await apiCall({
          url: endpoints.updateProduct(editingProduct.id),
          method: 'PUT',
          data: formData,
        });
      } else {
        // Add new product
        formData.append('user_id', getUserId());
        await apiCall({
          url: endpoints.createProduct,
          method: 'POST',
          data: formData,
        });
      }
      await fetchProcucts();
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      unit: '',
      quantity: '',
      image: null
    });
  };

  const fetchProcucts = async () => {
    try {
      const response = await apiCall({
        url: endpoints.ownerProducts(getUserId()),
        method: 'GET',
      });
      console.log(response);
      setSellingProducts(response || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      // setError(err.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }
  const fetchCustomerOrders = async () => {
    try {
      const response = await apiCall({
        url: endpoints.customerOrders(getUserId()),
        method: 'GET',
      });
      console.log(response);
      setBuyingProducts(response || []);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchOwnerOrders = async () => {
    try {
      const response = await apiCall({
        url: endpoints.ownerOrders(getUserId()),
        method: 'GET',
      });
      console.log(response);
      setSellerOrders(response || []);
    } catch (err) {
      console.error('Error fetching owner orders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProcucts();
    fetchCustomerOrders();
    fetchOwnerOrders();
  }, []);

  const renderSellingProducts = () => {
    if (sellingProducts.length === 0) {
      return (
        <div className="empty-products-container">
          <div className="empty-products-content">
            <span className="empty-icon">🏪</span>
            <h2>You haven't listed any products yet!</h2>
            <p>Ready to start selling? Add your very first product below.</p>
            <button
              className="add-product-btn"
              onClick={() => {
                setEditingProduct({ id: null });
                setEditForm({
                  name: '',
                  description: '',
                  price: '',
                  unit: '',
                  quantity: '',
                  image: null
                });
              }}
            >
              <span role="img" aria-label="add">➕</span> Add My First Product
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="products-grid-wrapper">
        <div className="products-grid-header">
          <button
            className="add-product-btn"
            onClick={() => {
              setEditingProduct({ id: null });
              setEditForm({
                name: '',
                description: '',
                price: '',
                unit: '',
                quantity: '',
                image: null
              });
            }}
          >
            <span role="img" aria-label="add">➕</span> Add New Product
          </button>
        </div>
        <div className="products-grid">
          {sellingProducts.map((product) => (
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
                      <span className="price">{Number(product.price).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="stock-info">
                      <span className="quantity-label">{product.quantity === 0 ? 'Currently unavailable' : 'Available'}</span>
                      <span className="quantity-value">{product.quantity} {product.unit}</span>
                    </div>
                  </div>
                  <div className="cart-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditProduct(product)}
                    >
                      ✏️ Edit Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrders = (orders, type) => {
    if (orders.length === 0) {
      return (
        <div className="empty-orders-container">
          <span className="empty-icon">📦</span>
          <h2>No orders here yet!</h2>
          <p>{type === 'buying' ? "You haven't made any purchases yet." : "No one has ordered your products yet. Keep going!"}</p>
        </div>
      );
    }

    return (
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-title">
                <h3>Order #{order.id}</h3>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status === 'pending' ? '⏳ Pending' : order.status === 'completed' ? '✅ Completed' : order.status}
                </span>
              </div>
              <div className="order-amount">
                <span className="amount">₹{order.total_price.toLocaleString()}</span>
              </div>
            </div>
            <div className="order-content">
              <div className="product-details">
                <h4>Product Details</h4>
                <div className="product-info">
                  {order.product.image_url && (
                    <img src={order.product.image_url} alt={order.product.name} className="product-thumbnail" />
                  )}
                  <div className="product-text">
                    <p className="product-name">{order.product.name}</p>
                    <p className="product-desc">{order.product.description}</p>
                    <p className="quantity-price">
                      <span>{order.quantity} {order.product.unit}</span>
                      <span>× ₹{Number(order.product.price).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="order-meta">
                <div className="meta-group">
                  <h4>Order Information</h4>
                  <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
                  {order.status === 'completed' && (
                    <p><strong>Completed:</strong> {new Date(order.updated_at).toLocaleString()}</p>
                  )}
                </div>
                <div className="meta-group">
                  <h4>{type === 'buying' ? 'Seller' : 'Customer'} Details</h4>
                  <p><strong>Name:</strong> {type === 'buying' ? order.owner.username : order.customer.username}</p>
                  <p><strong>Email:</strong> {type === 'buying' ? order.owner.email : order.customer.email}</p>
                </div>
                {type === 'selling' && order.status === 'pending' && (
                  <div className="order-actions">
                    <button
                      className="complete-button"
                      onClick={() => handleUpdateOrder(order.id)}
                      disabled={updating}
                    >
                      {updating ? 'Marking as Completed...' : '✔️ Mark as Completed'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBuyingProducts = () => renderOrders(buyingProducts, 'buying');
  const renderSellerOrders = () => renderOrders(sellerOrders, 'selling');

  if (loading) {
    return <div className="loading-profile">Loading your profile, please wait...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'selling':
        return renderSellingProducts();
      case 'buying':
        return renderBuyingProducts();
      case 'orders':
        return renderSellerOrders();
      default:
        return null;
    }
  };

  const renderEditDialog = () => {
    if (!editingProduct) return null;

    const isNew = !editingProduct.id;

    return (
      <div className="product-edit-dialog">
        <div className="product-edit-form">
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>{isNew ? 'Add New Product' : 'Edit Product Details'}</h2>
          <form onSubmit={handleUpdateProduct}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                placeholder="Enter product name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe your product"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  required
                  placeholder="e.g. 100"
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  required
                  placeholder="e.g. kg, piece"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                placeholder="How many available?"
              />
            </div>
            <div className="form-group">
              <label>Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setEditForm({ ...editForm, image: e.target.files[0] })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button" disabled={updating}>
                {updating ? (isNew ? 'Adding product...' : 'Saving your changes...') : (isNew ? '➕ Add Product' : '💾 Save Changes')}
              </button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                Nevermind
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-container">
      {/* Header Bar */}
      <header className="profile-header">
        <div className="brand-title" onClick={() => getToken() ? navigate('/') : navigate('/login')}>AgroWood</div>
        <div className="header-actions">
          <button className="header-btn" onClick={() => getToken() ? navigate('/') : navigate('/login')} title="Home">
            <FaHome />
          </button>
          <button className="header-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </header>
      {renderEditDialog()}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => setActiveTab('selling')}
        >
          My Products
        </button>
        <button
          className={`tab ${activeTab === 'buying' ? 'active' : ''}`}
          onClick={() => setActiveTab('buying')}
        >
          My Purchases
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Incoming Orders
        </button>
      </div>
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Profile;
