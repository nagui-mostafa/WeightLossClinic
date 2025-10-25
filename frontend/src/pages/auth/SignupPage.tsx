import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User, Eye, EyeOff } from 'lucide-react';
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

const SignupPage: React.FC = () => {
  const { signup, user, loading } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.firstName) nextErrors.firstName = 'First name is required';
    if (!form.lastName) nextErrors.lastName = 'Last name is required';
    if (!form.email) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

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
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to create account',
        message: error?.response?.data?.error?.message ?? 'Please review your details and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Join Weight Loss Clinic</h1>
          <p>Create an account to access personalised care plans and medication tracking.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid-two">
            <Input
              label="First name"
              name="firstName"
              placeholder="Nagui"
              value={form.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon={<User size={16} />}
            />
            <Input
              label="Last name"
              name="lastName"
              placeholder="Mostafa"
              value={form.lastName}
              onChange={handleChange}
              error={errors.lastName}
              icon={<User size={16} />}
            />
          </div>
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
            placeholder="Choose a strong password"
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
          <div className="grid-two">
            <Input
              label="Phone"
              name="phone"
              placeholder="+20 ..."
              value={form.phone}
              onChange={handleChange}
              icon={<Phone size={16} />}
            />
            <Input
              label="Current weight (kg)"
              name="currentWeight"
              type="number"
              value={form.currentWeight}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Goal weight (kg)"
            name="goalWeight"
            type="number"
            value={form.goalWeight}
            onChange={handleChange}
          />

          <Button type="submit" fullWidth loading={submitting || loading}>
            Create account
          </Button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
