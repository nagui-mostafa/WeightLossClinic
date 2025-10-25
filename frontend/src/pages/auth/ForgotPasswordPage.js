import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
const ForgotPasswordPage = () => {
    const notify = useNotification();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!email)
            return;
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            notify({
                type: 'info',
                title: 'Password reset link sent',
                message: 'If that address is registered we have emailed reset instructions.',
            });
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to send reset email',
                message: error?.response?.data?.error?.message ?? 'Try again in a few minutes.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "auth-shell", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { className: "auth-brand", children: [_jsx("h1", { children: "Reset your password" }), _jsx("p", { children: "We will send a secure link to help you choose a new password." })] }), submitted ? (_jsxs("div", { className: "card-body", children: [_jsx("p", { children: "Check your inbox for a reset email. The link expires after 15 minutes." }), _jsx(Link, { to: "/auth/login", children: "Return to login" })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [_jsx(Input, { label: "Email address", type: "email", name: "email", placeholder: "you@example.com", value: email, onChange: (event) => setEmail(event.target.value), icon: _jsx(Mail, { size: 16 }) }), _jsx(Button, { type: "submit", fullWidth: true, loading: loading, disabled: !email, children: "Send reset link" })] })), _jsxs("div", { className: "auth-footer", children: [_jsx("span", { children: "Remembered your password?" }), _jsx(Link, { to: "/auth/login", children: "Sign in" })] })] }) }));
};
export default ForgotPasswordPage;
