import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';

interface RecordItem {
  id: string;
  medicationName: string;
  medicationType: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

interface DashboardStats {
  totalRecords: number;
  activeMedications: number;
  lastUpdated: string;
  weightProgress?: {
    currentWeight?: number | null;
    goalWeight?: number | null;
  };
}

const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
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
        activeMedications: recordsResponse.data?.filter((r: any) => !r.endDate).length ?? 0,
        lastUpdated: new Date().toISOString(),
        weightProgress: {
          currentWeight: profile.currentWeight,
          goalWeight: profile.goalWeight,
        },
      });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to load dashboard data',
        message: error?.response?.data?.error?.message ?? 'Try again shortly.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recordColumns: Array<Column<RecordItem>> = [
    {
      key: 'medicationName',
      header: 'Medication',
    },
    {
      key: 'medicationType',
      header: 'Type',
      render: (item) => <Badge tone="info">{item.medicationType}</Badge>,
    },
    {
      key: 'startDate',
      header: 'Active Window',
      render: (item) =>
        `${format(new Date(item.startDate), 'dd MMM yyyy')} — ${
          item.endDate ? format(new Date(item.endDate), 'dd MMM yyyy') : 'present'
        }`,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => item.notes ?? '—',
    },
  ];

  return (
    <div className="dashboard-grid">
      <Card header={<h3>Care summary</h3>}>
        <div className="stats-grid">
          <div className="stat">
            <span>Total records</span>
            <strong>{stats?.totalRecords ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Active medications</span>
            <strong>{stats?.activeMedications ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Current weight</span>
            <strong>{stats?.weightProgress?.currentWeight ?? '—'} kg</strong>
          </div>
          <div className="stat">
            <span>Goal weight</span>
            <strong>{stats?.weightProgress?.goalWeight ?? '—'} kg</strong>
          </div>
        </div>
      </Card>

      <Card
        header={<h3>Recent medication records</h3>}
        actions={
          <Button variant="ghost" onClick={() => loadData()}>
            Refresh
          </Button>
        }
      >
        <DataTable
          columns={recordColumns}
          data={records}
          loading={loading}
          emptyState="No medication records captured yet."
        />
      </Card>

      {user?.role === 'ADMIN' && (
        <Card header={<h3>Admin quick tasks</h3>}>
          <div className="quick-actions">
            <Button variant="secondary" onClick={() => navigate('/app/users')}>
              Manage users
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/audit')}>
              Review audit logs
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/admin/stats')}>
              View analytics
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OverviewPage;
