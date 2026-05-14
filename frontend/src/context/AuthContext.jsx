import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { apiFetch, setToken, clearToken, getToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // Try JWT first
      if (getToken()) {
        const res = await apiFetch('/api/user/me');
        if (res.ok) {
          const dbUser = await res.json();
          setUser({
            id: dbUser.id,
            name: dbUser.nickname,
            email: dbUser.email,
            provider: 'email',
            onboardingStage: dbUser.onboardingStage,
            balance: dbUser.balance,
          });
          setLoading(false);
          return;
        }
        // Token invalid/expired — clear it
        clearToken();
      }

      // Fall back to SWA Google OAuth
      const swaRes = await fetch('/.auth/me', { cache: 'no-store' });
      if (!swaRes.ok) throw new Error();
      const data = await swaRes.json();
      const principal = data?.clientPrincipal;
      if (!principal) throw new Error();

      const userRes = await fetch('/api/user/me');
      const dbUser = await userRes.json();

      setUser({
        id: dbUser.id,
        name: dbUser.nickname,
        email: dbUser.email,
        provider: principal.identityProvider,
        onboardingStage: dbUser.onboardingStage,
        balance: dbUser.balance,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function login(email, password) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    setToken(data.token);
    setUser({
      id: data.user.id,
      name: data.user.nickname,
      email: data.user.email,
      provider: 'email',
      onboardingStage: data.user.onboardingStage,
      balance: data.user.balance,
    });
  }

  async function register(email, password, nickname) {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    setToken(data.token);
    setUser({
      id: data.user.id,
      name: data.user.nickname,
      email: data.user.email,
      provider: 'email',
      onboardingStage: data.user.onboardingStage,
      balance: data.user.balance,
    });
  }

  function loginWithGoogle() {
    window.location.href =
      '/.auth/login/google?post_login_redirect_uri=' +
      encodeURIComponent(window.location.origin + '/');
  }

  function logout() {
    if (getToken()) {
      clearToken();
      setUser(null);
      window.location.href = '/login';
    } else {
      window.location.href = '/.auth/logout?post_logout_redirect_uri=/login';
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    setUser,
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
