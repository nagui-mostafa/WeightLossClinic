import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
const ProfilePage = () => {
    const { user, refreshProfile } = useAuth();
    const notify = useNotification();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        currentWeight: '',
        goalWeight: '',
    });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                phone: user.phone ?? '',
                currentWeight: user?.currentWeight ? String(user.currentWeight) : '',
                goalWeight: user?.goalWeight ? String(user.goalWeight) : '',
            });
        }
    }, [user]);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user)
            return;
        setLoading(true);
        try {
            await api.patch(`/users/${user.id}`, {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone || null,
                currentWeight: form.currentWeight ? Number(form.currentWeight) : null,
                goalWeight: form.goalWeight ? Number(form.goalWeight) : null,
            });
            await refreshProfile();
            notify({
                type: 'success',
                title: 'Profile updated',
                message: 'Your profile details were saved successfully.',
            });
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to update profile',
                message: error?.response?.data?.error?.message ?? 'Try again later.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: "Personal information" }), children: _jsxs("form", { onSubmit: handleSubmit, className: "profile-grid", children: [_jsx(Input, { label: "First name", name: "firstName", value: form.firstName, onChange: handleChange }), _jsx(Input, { label: "Last name", name: "lastName", value: form.lastName, onChange: handleChange }), _jsx(Input, { label: "Email", value: user?.email ?? '', disabled: true }), _jsx(Input, { label: "Role", value: user?.role ?? '', disabled: true }), _jsx(Input, { label: "Phone", name: "phone", placeholder: "+1...", value: form.phone, onChange: handleChange }), _jsx(Input, { label: "Current weight", name: "currentWeight", type: "number", value: form.currentWeight, onChange: handleChange }), _jsx(Input, { label: "Goal weight", name: "goalWeight", type: "number", value: form.goalWeight, onChange: handleChange }), _jsx("div", { className: "profile-actions", children: _jsx(Button, { type: "submit", loading: loading, children: "Save changes" }) })] }) }) }));
};
export default ProfilePage;
