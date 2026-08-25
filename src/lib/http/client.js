import axios from 'axios';
import { API_BASE } from '@/lib/http/baseUrl';

export const http = axios.create({
  baseURL: API_BASE || undefined,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
