import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  function switchMode(next) {
    setMode(next);
    setError('');
    setEmail('');
    setPassword('');
    setNickname('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'register' && !nickname.trim()) {
      setError('Please choose a display name.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, nickname.trim());
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sb-blue/15 border border-sb-blue/30 mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-2xl font-extrabold text-sb-text tracking-tight">
            Parl Sports Betting App
          </h1>
          <p className="text-sb-muted text-sm mt-1">Virtual-currency sports betting simulator</p>
        </div>

        {/* Card */}
        <div className="bg-sb-card border border-sb-border rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Tab Toggle */}
          <div className="flex rounded-lg border border-sb-border overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-sb-blue text-sb-nav'
                  : 'text-sb-muted hover:text-sb-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-sb-blue text-sb-nav'
                  : 'text-sb-muted hover:text-sb-text'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="rounded-lg py-3 px-4 text-sm mb-4 border border-red-500/40 text-red-300 bg-red-500/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-sb-text mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. SportsFan42"
                  autoComplete="username"
                  className="w-full rounded-lg border border-sb-border bg-sb-bg px-4 py-3 text-sb-text text-sm outline-none transition focus:border-sb-blue focus:ring-1 focus:ring-sb-blue/40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-sb-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-sb-border bg-sb-bg px-4 py-3 text-sb-text text-sm outline-none transition focus:border-sb-blue focus:ring-1 focus:ring-sb-blue/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sb-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-sb-border bg-sb-bg px-4 py-3 pr-12 text-sb-text text-sm outline-none transition focus:border-sb-blue focus:ring-1 focus:ring-sb-blue/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sb-muted hover:text-sb-text transition-colors text-xs font-medium select-none"
                  tabIndex={-1}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-sb-blue text-sb-nav font-bold text-sm tracking-wide hover:bg-sb-blue-light active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting
                ? mode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>


          {mode === 'register' && (
            <p className="text-xs text-sb-muted text-center mt-4 leading-relaxed">
              New accounts start with <span className="text-sb-text font-semibold">$1,000</span> in virtual currency. No real money involved.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
