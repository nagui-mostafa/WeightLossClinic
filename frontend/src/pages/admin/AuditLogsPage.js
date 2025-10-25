import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';
const AuditLogsPage = () => {
    const notify = useNotification();
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({ action: '', actorUserId: '' });
    const [loading, setLoading] = useState(false);
    const loadLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/audit-logs', {
                params: {
                    action: filters.action || undefined,
                    actorUserId: filters.actorUserId || undefined,
                    limit: 100,
                    sort: 'createdAt:desc',
                },
            });
            setLogs(data.data ?? data ?? []);
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to load audit logs',
                message: error?.response?.data?.error?.message ?? 'Try again later.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadLogs();
    }, [filters]);
    const columns = [
        {
            key: 'createdAt',
            header: 'Timestamp',
            render: (item) => format(new Date(item.createdAt), 'dd MMM yyyy • HH:mm'),
        },
        {
            key: 'action',
            header: 'Action',
            render: (item) => _jsx(Badge, { tone: "info", children: item.action }),
        },
        {
            key: 'actorUserId',
            header: 'Actor',
            render: (item) => item.actorUserId ?? 'System',
        },
        {
            key: 'targetUserId',
            header: 'Target',
            render: (item) => item.targetUserId ?? '—',
        },
        {
            key: 'metadata',
            header: 'Metadata',
            render: (item) => (_jsx("pre", { className: "metadata-snippet", children: item.metadata ? JSON.stringify(item.metadata, null, 2) : '—' })),
        },
    ];
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: "Audit trail" }), actions: _jsxs("div", { className: "users-filters", children: [_jsx(Input, { placeholder: "Filter by action...", value: filters.action, onChange: (event) => setFilters((prev) => ({ ...prev, action: event.target.value })) }), _jsx(Input, { placeholder: "Actor user ID...", value: filters.actorUserId, onChange: (event) => setFilters((prev) => ({ ...prev, actorUserId: event.target.value })) }), _jsx(Button, { variant: "secondary", onClick: () => setFilters({ action: '', actorUserId: '' }), children: "Reset" })] }), children: _jsx(DataTable, { columns: columns, data: logs, loading: loading, emptyState: "No audit events found." }) }) }));
};
export default AuditLogsPage;
