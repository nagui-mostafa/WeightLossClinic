import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';
const OverviewPage = () => {
    const { user } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadData = async () => {
        try {
            const [{ data: recordsResponse }, { data: profile }] = await Promise.all([
                api.get('/records', { params: { limit: 5 } }),
                api.get('/auth/me'),
            ]);
            setRecords(recordsResponse.data ?? recordsResponse ?? []);
            setStats({
                totalRecords: recordsResponse.meta?.totalItems ?? recordsResponse.length ?? 0,
                activeMedications: recordsResponse.data?.filter((r) => !r.endDate).length ?? 0,
                lastUpdated: new Date().toISOString(),
                weightProgress: {
                    currentWeight: profile.currentWeight,
                    goalWeight: profile.goalWeight,
                },
            });
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to load dashboard data',
                message: error?.response?.data?.error?.message ?? 'Try again shortly.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const recordColumns = [
        {
            key: 'medicationName',
            header: 'Medication',
        },
        {
            key: 'medicationType',
            header: 'Type',
            render: (item) => _jsx(Badge, { tone: "info", children: item.medicationType }),
        },
        {
            key: 'startDate',
            header: 'Active Window',
            render: (item) => `${format(new Date(item.startDate), 'dd MMM yyyy')} — ${item.endDate ? format(new Date(item.endDate), 'dd MMM yyyy') : 'present'}`,
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (item) => item.notes ?? '—',
        },
    ];
    return (_jsxs("div", { className: "dashboard-grid", children: [_jsx(Card, { header: _jsx("h3", { children: "Care summary" }), children: _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { children: "Total records" }), _jsx("strong", { children: stats?.totalRecords ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Active medications" }), _jsx("strong", { children: stats?.activeMedications ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Current weight" }), _jsxs("strong", { children: [stats?.weightProgress?.currentWeight ?? '—', " kg"] })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Goal weight" }), _jsxs("strong", { children: [stats?.weightProgress?.goalWeight ?? '—', " kg"] })] })] }) }), _jsx(Card, { header: _jsx("h3", { children: "Recent medication records" }), actions: _jsx(Button, { variant: "ghost", onClick: () => loadData(), children: "Refresh" }), children: _jsx(DataTable, { columns: recordColumns, data: records, loading: loading, emptyState: "No medication records captured yet." }) }), user?.role === 'ADMIN' && (_jsx(Card, { header: _jsx("h3", { children: "Admin quick tasks" }), children: _jsxs("div", { className: "quick-actions", children: [_jsx(Button, { variant: "secondary", onClick: () => navigate('/app/users'), children: "Manage users" }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/app/audit'), children: "Review audit logs" }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/app/admin/stats'), children: "View analytics" })] }) }))] }));
};
export default OverviewPage;
