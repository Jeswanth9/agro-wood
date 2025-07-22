import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { getToken, getUserId } from '../authHelper.js';
import { apiCall } from '../api';
import endpoints from '../endpoints.js';

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
    quantity: ''
  });

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
      quantity: product.quantity || ''
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    const formData = new FormData();
    // Always send all fields in the form
    formData.append('name', editForm.name);
    formData.append('description', editForm.description || '');
    formData.append('price', editForm.price.toString());
    formData.append('unit', editForm.unit);
    formData.append('quantity', editForm.quantity ? editForm.quantity.toString() : '');

    console.log('Updating product with data:', Object.fromEntries(formData.entries()));
    try {
      await apiCall({
        url: endpoints.updateProduct(editingProduct.id),
        method: 'PUT',
        data: formData,
        // Let the browser set the Content-Type header with boundary automatically
      });
      // Refresh the products list after updating
      await fetchProcucts();
      setEditingProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
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
      quantity: ''
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
      return <p>No products listed for sale.</p>;
    }

    return (
      <div className="products-grid">
        {sellingProducts.map((product) => (
          <div key={product.id} className="product-card">
            {(
              <>
                {product.image_signed_url && (
                  <img src={product.image_signed_url} alt={product.name} />
                )}
                <div className="product-content">
                  <h3>{product.name}</h3>
                  <p className="description">{product.description}</p>
                  <p className="price">Price: ${Number(product.price).toLocaleString()}</p>
                  <p className="unit">Unit: {product.unit}</p>
                  <p className="quantity">Quantity: {product.quantity || 'N/A'}</p>
                  <button 
                    className="edit-button"
                    onClick={() => handleEditProduct(product)}
                  >
                    Edit Product
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderOrders = (orders, type) => {
    if (orders.length === 0) {
      return <p>No orders found.</p>;
    }

    return (
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-title">
                <h3>Order #{order.id}</h3>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-amount">
                <span className="amount">${order.total_price.toLocaleString()}</span>
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
                      <span>× ${Number(order.product.price).toLocaleString()}</span>
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
                      {updating ? 'Updating...' : 'Mark as Completed'}
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
    return <div>Loading...</div>;
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
    
    return (
      <div className="product-edit-dialog">
        <div className="product-edit-form">
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>Edit Product</h2>
          <form onSubmit={handleUpdateProduct}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-container">
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
