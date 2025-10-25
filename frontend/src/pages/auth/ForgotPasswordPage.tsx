import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ForgotPasswordPage: React.FC = () => {
  const notify = useNotification();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      notify({
        type: 'info',
        title: 'Password reset link sent',
        message: 'If that address is registered we have emailed reset instructions.',
      });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to send reset email',
        message: error?.response?.data?.error?.message ?? 'Try again in a few minutes.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Reset your password</h1>
          <p>We will send a secure link to help you choose a new password.</p>
        </div>

        {submitted ? (
          <div className="card-body">
            <p>Check your inbox for a reset email. The link expires after 15 minutes.</p>
            <Link to="/auth/login">Return to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail size={16} />}
            />
            <Button type="submit" fullWidth loading={loading} disabled={!email}>
              Send reset link
            </Button>
          </form>
        )}

        <div className="auth-footer">
          <span>Remembered your password?</span>
          <Link to="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
