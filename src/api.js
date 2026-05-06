import axios from 'axios';

const API_BASE_URL =  'http://192.168.1.98:8000'; // Update with your API base URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const loginGuard = async (email, password) => {
  console.log(email,password);
  
  const response = await apiClient.post('/auth/login/', { email, password });
  return response.data;
};

export const scanOrderByNumber = async (orderNumber) => {
  const response = await apiClient.post('/scan/order-qr/', {
    order_number: orderNumber,
  });
  return response.data;
};

export const getUserOrders = async (userId) => {
  const response = await apiClient.get(`/user/orders/${userId}`);
  return response.data;
};
