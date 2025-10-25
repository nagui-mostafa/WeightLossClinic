import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface StatsPayload {
  totalUsers: number;
  activeUsers: number;
  totalRecords: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  recordsCreatedLast7Days: number;
  recordsCreatedLast30Days: number;
}

const AdminStatsPage: React.FC = () => {
  const notify = useNotification();
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (error: any) {
        notify({
          type: 'error',
          title: 'Unable to load analytics',
          message: error?.response?.data?.error?.message ?? 'Try again later.',
        });
      }
    };

    load();
  }, [notify]);

  return (
    <div className="dashboard-grid">
      <Card header={<h3>Organisation overview</h3>}>
        <div className="stats-grid">
          <div className="stat">
            <span>Total users</span>
            <strong>{stats?.totalUsers ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Active users</span>
            <strong>{stats?.activeUsers ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Total records</span>
            <strong>{stats?.totalRecords ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>New users (7 days)</span>
            <strong>{stats?.newUsersLast7Days ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>New users (30 days)</span>
            <strong>{stats?.newUsersLast30Days ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Records created (7 days)</span>
            <strong>{stats?.recordsCreatedLast7Days ?? '—'}</strong>
          </div>
          <div className="stat">
            <span>Records created (30 days)</span>
            <strong>{stats?.recordsCreatedLast30Days ?? '—'}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminStatsPage;
