import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
const UsersPage = () => {
    const notify = useNotification();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
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
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to load users',
                message: error?.response?.data?.error?.message ?? 'Try again shortly.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadUsers();
    }, [filters]);
    const handleRoleChange = async (targetId, role) => {
        try {
            await api.patch(`/users/${targetId}/role`, { role });
            notify({ type: 'success', title: 'Role updated' });
            loadUsers();
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Could not update role',
                message: error?.response?.data?.error?.message ?? 'Operation prohibited.',
            });
        }
    };
    const handleStatusChange = async (targetId, isActive) => {
        try {
            await api.patch(`/users/${targetId}/status`, { isActive });
            notify({ type: 'success', title: 'Status updated' });
            loadUsers();
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to update status',
                message: error?.response?.data?.error?.message ?? 'Unexpected error occurred.',
            });
        }
    };
    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (item) => `${item.firstName} ${item.lastName}`,
        },
        { key: 'email', header: 'Email' },
        {
            key: 'role',
            header: 'Role',
            render: (item) => _jsx(Badge, { tone: item.role === 'ADMIN' ? 'warning' : 'neutral', children: item.role }),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => (_jsx(Badge, { tone: item.isActive ? 'success' : 'danger', children: item.isActive ? 'Active' : 'Inactive' })),
        },
        {
            key: 'verified',
            header: 'Email',
            render: (item) => item.isEmailVerified ? _jsx(Badge, { tone: "success", children: "Verified" }) : _jsx(Badge, { tone: "danger", children: "Pending" }),
        },
        {
            key: 'actions',
            header: '',
            render: (item) => (_jsxs("div", { className: "table-actions", children: [_jsx(Button, { variant: "ghost", disabled: item.id === user?.id || item.role === 'ADMIN', onClick: () => handleRoleChange(item.id, 'ADMIN'), children: "Promote" }), _jsx(Button, { variant: "ghost", disabled: item.id === user?.id || item.role === 'PATIENT', onClick: () => handleRoleChange(item.id, 'PATIENT'), children: "Demote" }), _jsx(Button, { variant: "ghost", onClick: () => handleStatusChange(item.id, !item.isActive), children: item.isActive ? 'Deactivate' : 'Activate' })] })),
        },
    ];
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: "User management" }), actions: _jsxs("div", { className: "users-filters", children: [_jsx(Input, { placeholder: "Search by email...", value: filters.email, onChange: (event) => setFilters((prev) => ({ ...prev, email: event.target.value })) }), _jsxs("select", { value: filters.role, onChange: (event) => setFilters((prev) => ({ ...prev, role: event.target.value })), className: "select-field", children: [_jsx("option", { value: "all", children: "All roles" }), _jsx("option", { value: "PATIENT", children: "Patients" }), _jsx("option", { value: "ADMIN", children: "Admins" })] }), _jsx(Button, { variant: "secondary", onClick: () => setFilters({ email: '', role: 'all' }), children: "Reset" })] }), children: _jsx(DataTable, { columns: columns, data: users, loading: loading, emptyState: "No users found." }) }) }));
};
export default UsersPage;
