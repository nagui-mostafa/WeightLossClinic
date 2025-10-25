import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
const ResetPasswordPage = () => {
    const notify = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const token = searchParams.get('token');
    const handleSubmit = async (event) => {
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
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to reset password',
                message: error?.response?.data?.error?.message ?? 'Request a new reset link.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "auth-shell", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { className: "auth-brand", children: [_jsx("h1", { children: "Create a new password" }), _jsx("p", { children: "Please choose a strong password you haven\u2019t used before." })] }), _jsxs("form", { className: "auth-form", onSubmit: handleSubmit, children: [_jsx(Input, { label: "New password", type: "password", name: "password", placeholder: "New secure password", value: password, onChange: (event) => setPassword(event.target.value), icon: _jsx(Lock, { size: 16 }) }), _jsx(Input, { label: "Confirm password", type: "password", name: "confirm", placeholder: "Re-enter your password", value: confirm, onChange: (event) => setConfirm(event.target.value), icon: _jsx(Lock, { size: 16 }) }), _jsx(Button, { type: "submit", fullWidth: true, loading: loading, disabled: !token, children: "Update password" })] }), _jsxs("div", { className: "auth-footer", children: [_jsx("span", { children: "Need help?" }), _jsx(Link, { to: "/auth/forgot-password", children: "Request another reset link" })] })] }) }));
};
export default ResetPasswordPage;
