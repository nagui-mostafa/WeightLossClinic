import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    currentWeight: '',
    goalWeight: '',
};
const SignupPage = () => {
    const { signup, user, loading } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    if (user) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };
    const validate = () => {
        const nextErrors = {};
        if (!form.firstName)
            nextErrors.firstName = 'First name is required';
        if (!form.lastName)
            nextErrors.lastName = 'Last name is required';
        if (!form.email)
            nextErrors.email = 'Email is required';
        if (!form.password)
            nextErrors.password = 'Password is required';
        if (form.password && form.password.length < 12) {
            nextErrors.password = 'Password must be at least 12 characters';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate())
            return;
        setSubmitting(true);
        try {
            const payload = {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
                currentWeight: form.currentWeight ? Number(form.currentWeight) : undefined,
                goalWeight: form.goalWeight ? Number(form.goalWeight) : undefined,
            };
            const result = await signup(payload);
            if (result.requiresEmailVerification) {
                notify({
                    type: 'info',
                    title: 'Verify your email',
                    message: 'Check your inbox for a verification link to activate your account.',
                });
                navigate('/auth/login', { replace: true });
                return;
            }
            notify({
                type: 'success',
                title: 'Account created',
                message: 'You are signed in and ready to go!',
            });
            navigate('/app', { replace: true });
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to create account',
                message: error?.response?.data?.error?.message ?? 'Please review your details and try again.',
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "auth-shell", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { className: "auth-brand", children: [_jsx("h1", { children: "Join Weight Loss Clinic" }), _jsx("p", { children: "Create an account to access personalised care plans and medication tracking." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [_jsxs("div", { className: "grid-two", children: [_jsx(Input, { label: "First name", name: "firstName", placeholder: "Nagui", value: form.firstName, onChange: handleChange, error: errors.firstName, icon: _jsx(User, { size: 16 }) }), _jsx(Input, { label: "Last name", name: "lastName", placeholder: "Mostafa", value: form.lastName, onChange: handleChange, error: errors.lastName, icon: _jsx(User, { size: 16 }) })] }), _jsx(Input, { label: "Email address", name: "email", type: "email", placeholder: "you@example.com", value: form.email, onChange: handleChange, error: errors.email, icon: _jsx(Mail, { size: 16 }) }), _jsx(Input, { label: "Password", name: "password", type: "password", placeholder: "Choose a strong password", value: form.password, onChange: handleChange, error: errors.password, icon: _jsx(Lock, { size: 16 }), hint: "Minimum 12 characters with upper, lower, number & special characters." }), _jsxs("div", { className: "grid-two", children: [_jsx(Input, { label: "Phone", name: "phone", placeholder: "+20 ...", value: form.phone, onChange: handleChange, icon: _jsx(Phone, { size: 16 }) }), _jsx(Input, { label: "Current weight (kg)", name: "currentWeight", type: "number", value: form.currentWeight, onChange: handleChange })] }), _jsx(Input, { label: "Goal weight (kg)", name: "goalWeight", type: "number", value: form.goalWeight, onChange: handleChange }), _jsx(Button, { type: "submit", fullWidth: true, loading: submitting || loading, children: "Create account" })] }), _jsxs("div", { className: "auth-footer", children: [_jsx("span", { children: "Already have an account?" }), _jsx(Link, { to: "/auth/login", children: "Sign in" })] })] }) }));
};
export default SignupPage;
