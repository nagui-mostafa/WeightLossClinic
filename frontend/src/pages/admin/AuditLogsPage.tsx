import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}

const AuditLogsPage: React.FC = () => {
  const notify = useNotification();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
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
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to load audit logs',
        message: error?.response?.data?.error?.message ?? 'Try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const columns: Array<Column<AuditLogRow>> = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (item) => format(new Date(item.createdAt), 'dd MMM yyyy • HH:mm'),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item) => <Badge tone="info">{item.action}</Badge>,
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
      render: (item) => (
        <pre className="metadata-snippet">
          {item.metadata ? JSON.stringify(item.metadata, null, 2) : '—'}
        </pre>
      ),
    },
  ];

  return (
    <div className="dashboard-grid">
      <Card
        header={<h3>Audit trail</h3>}
        actions={
          <div className="users-filters">
            <Input
              placeholder="Filter by action..."
              value={filters.action}
              onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
            />
            <Input
              placeholder="Actor user ID..."
              value={filters.actorUserId}
              onChange={(event) => setFilters((prev) => ({ ...prev, actorUserId: event.target.value }))}
            />
            <Button variant="secondary" onClick={() => setFilters({ action: '', actorUserId: '' })}>
              Reset
            </Button>
          </div>
        }
      >
        <DataTable columns={columns} data={logs} loading={loading} emptyState="No audit events found." />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
