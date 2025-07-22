export const productEndpoints = {
    listProducts: '/api/products',
    getProduct: (id) => `/api/products/${id}`,
    getOwnerProducts: (userId) => `/api/owner/${userId}/products`,
    createProduct: '/api/products',
    updateProduct: (id) => `/api/products/${id}`,
};
