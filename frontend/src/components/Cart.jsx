import { useState, useEffect } from 'react';
import { FaShoppingCart, FaBoxOpen, FaBroom, FaTrashAlt, FaArrowLeft, FaShoppingBag, FaReceipt, FaMinus, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import { getUserId } from '../authHelper';
import '../styles/Cart.css';

export default function Cart({ cart, setCart, products }) {
    const [loading, setLoading] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const navigate = useNavigate();

    // Calculate cart totals
    const cartItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        return {
            product,
            quantity,
            total: product ? product.price * quantity : 0
        };
    }).filter(item => item.product && item.quantity > 0);

    const totalPrice = cartItems.reduce((sum, item) => sum + item.total, 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const updateQuantity = (productId, newQuantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (newQuantity === 0) {
            removeFromCart(productId);
            return;
        }

        if (newQuantity > product.quantity) {
            alert(`Sorry, only ${product.quantity} ${product.unit} available in stock!`);
            return;
        }

        setCart(prevCart => ({
            ...prevCart,
            [productId]: newQuantity
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            delete newCart[productId];
            return newCart;
        });
    };

    // Manual clear with confirmation
    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            setCart({});
        }
    };

    // Silent clear for post-purchase
    const clearCartSilent = () => {
        setCart({});
    };

    const purchaseAll = async () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty! Add some products to proceed.');
            return;
        }

        setPurchasing(true);
        const customerId = parseInt(getUserId());

        try {
            // Create orders for each cart item
            const orderPromises = cartItems.map(async (item) => {
                const orderData = {
                    product_id: item.product.id,
                    customer_id: customerId,
                    quantity: item.quantity
                };

                return await apiCall({
                    url: '/api/orders',
                    method: 'POST',
                    data: orderData
                });
            });

            await Promise.all(orderPromises);

            alert(`🎉 Thank you for your purchase!\nYou bought ${totalItems} item${totalItems > 1 ? 's' : ''} for a total of ₹${totalPrice.toLocaleString('en-IN')}.\nYour order is being processed.`);
            clearCartSilent();
            navigate('/profile'); // Navigate to profile to see orders
        } catch (error) {
            console.error('Purchase failed:', error);
            alert('Oops! Something went wrong with your purchase. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-container">
                <div className="cart-header">
                    <h1><FaShoppingCart style={{ verticalAlign: 'middle', marginRight: 8 }} /> Your Shopping Cart</h1>
                    <button className="back-button" onClick={() => navigate('/')}>
                        <FaArrowLeft style={{ verticalAlign: 'middle', marginRight: 4 }} /> Back to Products
                    </button>
                </div>
                <div className="empty-cart">
                    <div className="empty-cart-icon" style={{ fontSize: '3rem' }}><FaBoxOpen /></div>
                    <h2>Your cart is feeling lonely!</h2>
                    <p>Browse our products and add your favorites to the cart.</p>
                    <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                        <FaShoppingBag style={{ verticalAlign: 'middle', marginRight: 4 }} /> Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <div className="cart-header">
                <h1><FaShoppingCart style={{ verticalAlign: 'middle', marginRight: 8 }} /> Shopping Cart <span style={{ fontSize: '1rem', color: '#888' }}>({totalItems} item{totalItems > 1 ? 's' : ''})</span></h1>
                <button className="back-button" onClick={() => navigate('/')}>
                    <FaArrowLeft style={{ verticalAlign: 'middle', marginRight: 4 }} /> Keep Shopping
                </button>
            </div>

            <div className="cart-content">
                <div className="cart-items">
                    {cartItems.map(({ product, quantity, total }) => (
                        <div key={product.id} className="cart-item">
                            <div className="item-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} />
                                ) : (
                                    <div className="no-image">No image</div>
                                )}
                            </div>

                            <div className="item-details">
                                <h3>{product.name}</h3>
                                <p className="item-description">{product.description || <span style={{ color: '#aaa' }}>No description available</span>}</p>
                                <p className="item-unit"><b>Unit:</b> {product.unit}</p>
                                <p className="item-price">₹{product.price.toLocaleString('en-IN')} <span style={{ color: '#888' }}>per {product.unit}</span></p>
                                <p className="item-stock">Available: <b>{product.quantity} {product.unit}</b></p>
                            </div>

                            <div className="quantity-controls">
                                <button
                                    className="quantity-btn"
                                    title="Decrease quantity"
                                    onClick={() => updateQuantity(product.id, quantity - 1)}
                                    disabled={quantity <= 1}
                                >
                                    <FaMinus />
                                </button>
                                <span className="quantity" style={{ fontWeight: 'bold' }}>{quantity}</span>
                                <button
                                    className="quantity-btn"
                                    title="Increase quantity"
                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                    disabled={quantity >= product.quantity}
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <div className="item-total">
                                <p className="total-price">₹{total.toLocaleString('en-IN')}</p>
                                <button
                                    className="remove-btn"
                                    title={`Remove ${product.name} from cart`}
                                    onClick={() => removeFromCart(product.id)}
                                >
                                    <FaTrashAlt style={{ verticalAlign: 'middle', marginRight: 4 }} /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <div className="summary-card">
                        <h3><FaReceipt style={{ verticalAlign: 'middle', marginRight: 6 }} /> Order Summary</h3>
                        <div className="summary-line">
                            <span>Items ({totalItems}):</span>
                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="summary-line total">
                            <span><b>Total:</b></span>
                            <span><b>₹{totalPrice.toLocaleString('en-IN')}</b></span>
                        </div>

                        <div className="cart-actions">
                            <button
                                className="clear-cart-btn"
                                onClick={clearCart}
                                disabled={purchasing}
                                title="Remove all items from cart"
                            >
                                <FaBroom style={{ verticalAlign: 'middle', marginRight: 4 }} /> Clear Cart
                            </button>
                            <button
                                className="purchase-btn"
                                onClick={purchaseAll}
                                disabled={purchasing}
                                title="Place order for all items in cart"
                            >
                                {purchasing ? 'Processing your order...' : <><FaShoppingBag style={{ verticalAlign: 'middle', marginRight: 4 }} /> Place Order</>}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '1rem' }}>Need help? <a href="mailto:support@agrowood.com">Contact support</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
