import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
const AdminStatsPage = () => {
    const notify = useNotification();
    const [stats, setStats] = useState(null);
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats(data);
            }
            catch (error) {
                notify({
                    type: 'error',
                    title: 'Unable to load analytics',
                    message: error?.response?.data?.error?.message ?? 'Try again later.',
                });
            }
        };
        load();
    }, [notify]);
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: "Organisation overview" }), children: _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { children: "Total users" }), _jsx("strong", { children: stats?.totalUsers ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Active users" }), _jsx("strong", { children: stats?.activeUsers ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Total records" }), _jsx("strong", { children: stats?.totalRecords ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "New users (7 days)" }), _jsx("strong", { children: stats?.newUsersLast7Days ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "New users (30 days)" }), _jsx("strong", { children: stats?.newUsersLast30Days ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Records created (7 days)" }), _jsx("strong", { children: stats?.recordsCreatedLast7Days ?? '—' })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { children: "Records created (30 days)" }), _jsx("strong", { children: stats?.recordsCreatedLast30Days ?? '—' })] })] }) }) }));
};
export default AdminStatsPage;
