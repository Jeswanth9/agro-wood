import { API_BASE_URL } from './config';
import { getToken } from './authHelper';

// Universal API calling function using fetch
export async function apiCall({ url, method = 'GET', data = null, headers = {} }) {
  const token = getToken();
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
    redirect: 'follow',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API Error');
  }
  return response.json();
}
