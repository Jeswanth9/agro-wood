const endpoints = {
    login: `/iam/login`,
    signup: `/iam/signup`,
    ownerProducts: (userId) => `/api/owner/${userId}/products`,
    customerOrders: (userId) => `/api/orders/customer/${userId}`,
    ownerOrders: (userId) => `/api/orders/owner/${userId}`,
    updateOrder: (orderId) => `/api/orders/${orderId}`,
    updateProduct: (productId) => `/api/products/${productId}`,
}

export default endpoints;
