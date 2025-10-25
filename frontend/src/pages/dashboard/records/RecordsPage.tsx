import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import DataTable, { Column } from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';

interface RecordModel {
  id: string;
  medicationName: string;
  medicationType: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordModel[]>([]);
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
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to fetch records',
        message: error?.response?.data?.error?.message ?? 'Try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('Delete this medication record?')) return;

    try {
      await api.delete(`/records/${recordId}`);
      notify({
        type: 'success',
        title: 'Record deleted',
      });
      loadRecords();
    } catch (error: any) {
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

  const columns: Array<Column<RecordModel>> = [
    { key: 'medicationName', header: 'Medication' },
    {
      key: 'medicationType',
      header: 'Type',
      render: (item) => <Badge tone="info">{item.medicationType}</Badge>,
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
            render: (item: RecordModel) =>
              item.user ? `${item.user.firstName} ${item.user.lastName}` : '—',
          } as Column<RecordModel>,
        ]
      : []),
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="table-actions">
          <Button variant="ghost" onClick={() => navigate(`/app/records/${item.id}`)}>
            View
          </Button>
          <Button variant="ghost" onClick={() => handleDelete(item.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-grid">
      <Card
        header={<h3>Medication records</h3>}
        actions={
          <Button onClick={() => navigate('/app/records/new')}>
            Add record
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          emptyState="No medication records available."
        />
      </Card>
    </div>
  );
};

export default RecordsPage;
