import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PATIENT';
  isActive: boolean;
  isEmailVerified: boolean;
}

const UsersPage: React.FC = () => {
  const notify = useNotification();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ email: '', role: 'all' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: {
          email: filters.email || undefined,
          role: filters.role !== 'all' ? filters.role : undefined,
        },
      });
      setUsers(data.data ?? data ?? []);
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to load users',
        message: error?.response?.data?.error?.message ?? 'Try again shortly.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleRoleChange = async (targetId: string, role: 'ADMIN' | 'PATIENT') => {
    try {
      await api.patch(`/users/${targetId}/role`, { role });
      notify({ type: 'success', title: 'Role updated' });
      loadUsers();
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Could not update role',
        message: error?.response?.data?.error?.message ?? 'Operation prohibited.',
      });
    }
  };

  const handleStatusChange = async (targetId: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${targetId}/status`, { isActive });
      notify({ type: 'success', title: 'Status updated' });
      loadUsers();
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to update status',
        message: error?.response?.data?.error?.message ?? 'Unexpected error occurred.',
      });
    }
  };

  const columns: Array<Column<UserRow>> = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => `${item.firstName} ${item.lastName}`,
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (item) => <Badge tone={item.role === 'ADMIN' ? 'warning' : 'neutral'}>{item.role}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge tone={item.isActive ? 'success' : 'danger'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Email',
      render: (item) =>
        item.isEmailVerified ? <Badge tone="success">Verified</Badge> : <Badge tone="danger">Pending</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            disabled={item.id === user?.id || item.role === 'ADMIN'}
            onClick={() => handleRoleChange(item.id, 'ADMIN')}
          >
            Promote
          </Button>
          <Button
            variant="ghost"
            disabled={item.id === user?.id || item.role === 'PATIENT'}
            onClick={() => handleRoleChange(item.id, 'PATIENT')}
          >
            Demote
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleStatusChange(item.id, !item.isActive)}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-grid">
      <Card
        header={<h3>User management</h3>}
        actions={
          <div className="users-filters">
            <Input
              placeholder="Search by email..."
              value={filters.email}
              onChange={(event) => setFilters((prev) => ({ ...prev, email: event.target.value }))}
            />
            <select
              value={filters.role}
              onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
              className="select-field"
            >
              <option value="all">All roles</option>
              <option value="PATIENT">Patients</option>
              <option value="ADMIN">Admins</option>
            </select>
            <Button variant="secondary" onClick={() => setFilters({ email: '', role: 'all' })}>
              Reset
            </Button>
          </div>
        }
      >
        <DataTable columns={columns} data={users} loading={loading} emptyState="No users found." />
      </Card>
    </div>
  );
};

export default UsersPage;
