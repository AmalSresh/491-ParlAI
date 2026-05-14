import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginWithGoogle, isAuthenticated } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  // Handle redirect in effect to prevent render warnings
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  async function handleLogin(providerFn) {
    try {
      setError('');
      setSubmitting(true);
      await providerFn();
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-[420px] bg-sb-card border border-sb-border rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-6">
          <h1 className="text-[1.75rem] font-bold text-sb-blue mb-2 tracking-wide">
            Sign In
          </h1>
          <p className="text-sb-muted text-[0.95rem]">
            Welcome! Sign in to place your bets.
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg py-3 px-4 text-[0.9rem] mb-4 border border-red-500/50 text-sb-error bg-[rgba(220,53,69,0.15)]"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-3 py-3 px-5 text-base font-semibold rounded-lg bg-white text-[#333] border border-sb-border hover:bg-gray-100 disabled:opacity-70 cursor-pointer transition-colors"
          onClick={() => handleLogin(loginWithGoogle)}
          disabled={submitting}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
