import axios from 'axios';
import { store } from '../../store';
import { setCurrentUser } from '../../features/users/slice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      store.dispatch(setCurrentUser(null));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth response interface
interface AuthResponse {
  token: string;
  user: User;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(email: string, password: string, name: string): Promise<User> {
    const response = await apiClient.post<{ success: boolean; user: User }>(
      '/api/auth/register',
      { email, password, name }
    );
    
    const user = response.data.user;
    
    // Automatically log in after registration
    await this.login(email, password);
    
    return user;
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      { email, password }
    );
    
    const { token, user } = response.data;
    
    // Store token and user in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update Redux store
    store.dispatch(setCurrentUser(user));
    
    return response.data;
  }

  /**
   * Logout the current user
   */
  static async signOut(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    store.dispatch(setCurrentUser(null));
  }

  /**
   * Get current authenticated user from API
   */
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/api/auth/me');
    return response.data.user;
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get stored user from localStorage
   */
  static getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Initialize auth state from localStorage
   * Call this on app startup
   */
  static initializeAuth(): void {
    const user = this.getUser();
    if (user && this.isAuthenticated()) {
      store.dispatch(setCurrentUser(user));
    }
  }
}
