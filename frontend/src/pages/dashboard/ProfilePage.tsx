import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ProfilePage: React.FC = () => {
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
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
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to update profile',
        message: error?.response?.data?.error?.message ?? 'Try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <Card header={<h3>Personal information</h3>}>
        <form onSubmit={handleSubmit} className="profile-grid">
          <Input
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
          />
          <Input
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
          />
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Input label="Role" value={user?.role ?? ''} disabled />
          <Input
            label="Phone"
            name="phone"
            placeholder="+1..."
            value={form.phone}
            onChange={handleChange}
          />
          <Input
            label="Current weight"
            name="currentWeight"
            type="number"
            value={form.currentWeight}
            onChange={handleChange}
          />
          <Input
            label="Goal weight"
            name="goalWeight"
            type="number"
            value={form.goalWeight}
            onChange={handleChange}
          />
          <div className="profile-actions">
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
