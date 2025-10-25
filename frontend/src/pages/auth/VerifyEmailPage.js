import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const notify = useNotification();
    const [status, setStatus] = useState('pending');
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
            }
            catch (error) {
                setStatus('error');
                notify({
                    type: 'error',
                    title: 'Verification failed',
                    message: error?.response?.data?.error?.message ?? 'Request a new verification link.',
                });
            }
        })();
    }, [searchParams, notify]);
    return (_jsx("div", { className: "auth-shell", children: _jsxs("div", { className: "auth-card", children: [status === 'pending' && (_jsxs("div", { className: "verify-state", children: [_jsx(Loader2, { className: "spin", size: 32 }), _jsx("h2", { children: "Verifying your email..." }), _jsx("p", { children: "This should only take a moment." })] })), status === 'success' && (_jsxs("div", { className: "verify-state", children: [_jsx("h2", { children: "Email verified \uD83C\uDF89" }), _jsx("p", { children: "You can now continue to your dashboard." }), _jsx(Button, { fullWidth: true, onClick: () => navigate('/auth/login'), children: "Continue to login" })] })), status === 'error' && (_jsxs("div", { className: "verify-state", children: [_jsx("h2", { children: "We couldn't verify your email" }), _jsx("p", { children: "The link may be expired or invalid. Request a new one from the login page." }), _jsx(Button, { fullWidth: true, onClick: () => navigate('/auth/login'), children: "Return to login" })] }))] }) }));
};
export default VerifyEmailPage;
