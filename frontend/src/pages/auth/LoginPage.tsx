import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';

const LoginPage: React.FC = () => {
  const { login, user, loading } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    if (!form.email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      setSubmitting(false);
      return;
    }
    if (!form.password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      setSubmitting(false);
      return;
    }

    try {
      await login(form);
      notify({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have been signed in successfully.',
      });
      navigate('/app', { replace: true });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to sign in',
        message: error?.response?.data?.error?.message ?? 'Check your credentials and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Weight Loss Clinic</h1>
          <p>Sign in to access your personalised care dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            icon={<Mail size={16} />}
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            icon={<Lock size={16} />}
            trailing={
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div className="auth-helpers">
            <Link to="/auth/forgot-password">Forgot password?</Link>
          </div>

          <Button type="submit" fullWidth loading={submitting || loading}>
            Sign in
          </Button>
        </form>

        <div className="auth-footer">
          <span>Don&apos;t have an account?</span>
          <Link to="/auth/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
