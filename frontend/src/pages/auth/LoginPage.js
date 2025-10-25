import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
const LoginPage = () => {
    const { login, user, loading } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    if (user) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };
    const handleSubmit = async (event) => {
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
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to sign in',
                message: error?.response?.data?.error?.message ?? 'Check your credentials and try again.',
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "auth-shell", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { className: "auth-brand", children: [_jsx("h1", { children: "Weight Loss Clinic" }), _jsx("p", { children: "Sign in to access your personalised care dashboard." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [_jsx(Input, { label: "Email address", name: "email", type: "email", placeholder: "you@example.com", value: form.email, onChange: handleChange, error: errors.email, icon: _jsx(Mail, { size: 16 }) }), _jsx(Input, { label: "Password", name: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: handleChange, error: errors.password, icon: _jsx(Lock, { size: 16 }) }), _jsx("div", { className: "auth-helpers", children: _jsx(Link, { to: "/auth/forgot-password", children: "Forgot password?" }) }), _jsx(Button, { type: "submit", fullWidth: true, loading: submitting || loading, children: "Sign in" })] }), _jsxs("div", { className: "auth-footer", children: [_jsx("span", { children: "Don't have an account?" }), _jsx(Link, { to: "/auth/signup", children: "Create one" })] })] }) }));
};
export default LoginPage;
