
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { isAuthenticated } from './authHelper';
import { apiCall } from './api';
import { productEndpoints } from './api/productEndpoints';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setUser(isAuth ? { isAuthenticated: true } : null);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch products when user is authenticated
  useEffect(() => {
    const fetchProducts = async () => {
      if (user?.isAuthenticated) {
        try {
          const data = await apiCall({
            url: productEndpoints.listProducts,
            method: 'GET'
          });
          setProducts(data);
        } catch (err) {
          console.error('Error fetching products:', err);
        }
      }
    };

    fetchProducts();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <AppRoutes
        user={user}
        setUser={setUser}
        cart={cart}
        setCart={setCart}
        products={products}
        setProducts={setProducts}
      />
    </BrowserRouter>
  );
}

export default App
