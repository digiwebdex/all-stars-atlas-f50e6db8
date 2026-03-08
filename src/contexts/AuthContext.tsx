import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, type ApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'super_admin';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  adminLogin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser) as User;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isAdmin: user.role === 'admin' || user.role === 'super_admin',
        });
      } catch {
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Listen for forced logout
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const setAuth = (data: AuthResponse) => {
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      isAdmin: data.user.role === 'admin' || data.user.role === 'super_admin',
    });
  };

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, payload);
    setAuth(data);
  }, []);

  const adminLogin = useCallback(async (payload: LoginPayload) => {
    const data = await api.post<AuthResponse>(API_ENDPOINTS.ADMIN_LOGIN, payload);
    if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
      throw { message: 'Access denied. Admin privileges required.', status: 403 } as ApiError;
    }
    setAuth(data);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<AuthResponse>(API_ENDPOINTS.AUTH_REGISTER, payload);
    setAuth(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setState({ user: null, isAuthenticated: false, isLoading: false, isAdmin: false });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<string> => {
    const response = await api.post<{ message: string; resetToken: string }>(API_ENDPOINTS.AUTH_VERIFY_OTP, { email, otp });
    return response.resetToken;
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await api.post(API_ENDPOINTS.AUTH_RESET_PASSWORD, { token, password });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const updated = await api.patch<User>(`${API_ENDPOINTS.DASHBOARD_SETTINGS}/profile`, data);
    const newUser = { ...state.user, ...updated } as User;
    localStorage.setItem('user', JSON.stringify(newUser));
    setState(prev => ({ ...prev, user: newUser }));
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      adminLogin,
      register,
      logout,
      forgotPassword,
      verifyOtp,
      resetPassword,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
