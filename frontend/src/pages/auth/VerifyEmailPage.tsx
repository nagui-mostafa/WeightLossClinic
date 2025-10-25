import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notify = useNotification();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        notify({
          type: 'success',
          title: 'Email verified',
          message: 'You can now sign in with your credentials.',
        });
      } catch (error: any) {
        setStatus('error');
        notify({
          type: 'error',
          title: 'Verification failed',
          message: error?.response?.data?.error?.message ?? 'Request a new verification link.',
        });
      }
    })();
  }, [searchParams, notify]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {status === 'pending' && (
          <div className="verify-state">
            <Loader2 className="spin" size={32} />
            <h2>Verifying your email...</h2>
            <p>This should only take a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-state">
            <h2>Email verified 🎉</h2>
            <p>You can now continue to your dashboard.</p>
            <Button fullWidth onClick={() => navigate('/auth/login')}>
              Continue to login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-state">
            <h2>We couldn&apos;t verify your email</h2>
            <p>The link may be expired or invalid. Request a new one from the login page.</p>
            <Button fullWidth onClick={() => navigate('/auth/login')}>
              Return to login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
