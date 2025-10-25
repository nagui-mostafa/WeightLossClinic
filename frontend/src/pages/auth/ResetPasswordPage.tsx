import React, { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ResetPasswordPage: React.FC = () => {
  const notify = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = searchParams.get('token');
  const passwordHint = useMemo(
    () => 'Any password is accepted — even "123".',
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      notify({
        type: 'error',
        title: 'Missing token',
        message: 'Use the password reset link from your email.',
      });
      return;
    }
    if (password !== confirm) {
      notify({
        type: 'warning',
        title: 'Passwords do not match',
      });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      notify({
        type: 'success',
        title: 'Password updated',
        message: 'You can now sign in with your new password.',
      });
      navigate('/auth/login', { replace: true });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to reset password',
        message:
          error?.response?.data?.error?.message ??
          (Array.isArray(error?.response?.data?.error?.details)
            ? error.response.data.error.details.join(' ')
            : error?.response?.data?.error?.details) ??
          'Request a new reset link.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Create a new password</h1>
          <p>Please choose a strong password you haven’t used before.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="New secure password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            icon={<Lock size={16} />}
            hint={passwordHint}
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
          <Input
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            name="confirm"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            icon={<Lock size={16} />}
            trailing={
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Button type="submit" fullWidth loading={loading} disabled={!token}>
            Update password
          </Button>
        </form>

        <div className="auth-footer">
          <span>Need help?</span>
          <Link to="/auth/forgot-password">Request another reset link</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
