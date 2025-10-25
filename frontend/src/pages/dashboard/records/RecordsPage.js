import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
const RecordsPage = () => {
    const { user } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadRecords = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/records', {
                params: {
                    limit: 50,
                    sort: 'startDate:desc',
                },
            });
            setRecords(data.data ?? data ?? []);
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to fetch records',
                message: error?.response?.data?.error?.message ?? 'Try again later.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (recordId) => {
        if (!window.confirm('Delete this medication record?'))
            return;
        try {
            await api.delete(`/records/${recordId}`);
            notify({
                type: 'success',
                title: 'Record deleted',
            });
            loadRecords();
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to delete record',
                message: error?.response?.data?.error?.message ?? 'Unexpected error occurred.',
            });
        }
    };
    useEffect(() => {
        loadRecords();
    }, []);
    const columns = [
        { key: 'medicationName', header: 'Medication' },
        {
            key: 'medicationType',
            header: 'Type',
            render: (item) => _jsx(Badge, { tone: "info", children: item.medicationType }),
        },
        {
            key: 'startDate',
            header: 'Start',
            render: (item) => format(new Date(item.startDate), 'dd MMM yyyy'),
        },
        {
            key: 'endDate',
            header: 'End',
            render: (item) => (item.endDate ? format(new Date(item.endDate), 'dd MMM yyyy') : '—'),
        },
        ...(user?.role === 'ADMIN'
            ? [
                {
                    key: 'user',
                    header: 'Patient',
                    render: (item) => item.user ? `${item.user.firstName} ${item.user.lastName}` : '—',
                },
            ]
            : []),
        {
            key: 'actions',
            header: '',
            render: (item) => (_jsxs("div", { className: "table-actions", children: [_jsx(Button, { variant: "ghost", onClick: () => navigate(`/app/records/${item.id}`), children: "View" }), _jsx(Button, { variant: "ghost", onClick: () => handleDelete(item.id), children: "Delete" })] })),
        },
    ];
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: "Medication records" }), actions: _jsx(Button, { onClick: () => navigate('/app/records/new'), children: "Add record" }), children: _jsx(DataTable, { columns: columns, data: records, loading: loading, emptyState: "No medication records available." }) }) }));
};
export default RecordsPage;
