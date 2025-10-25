import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';

interface RecordPayload {
  medicationName: string;
  medicationType: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  userId?: string;
}

const medicationTypes = ['injectable', 'oral', 'topical', 'other'];

const EditRecordPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isCreating = !id || id === 'new';
  const { user } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();
  const [form, setForm] = useState<RecordPayload>({
    medicationName: '',
    medicationType: 'oral',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: undefined,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const loadRecord = async () => {
    if (isCreating || !id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/records/${id}`);
      setForm({
        medicationName: data.medicationName,
        medicationType: data.medicationType.toLowerCase(),
        startDate: data.startDate.substring(0, 10),
        endDate: data.endDate ? data.endDate.substring(0, 10) : undefined,
        notes: data.notes ?? '',
        userId: data.userId,
      });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to load record',
        message: error?.response?.data?.error?.message ?? 'Record might not exist.',
      });
      navigate('/app/records', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.medicationName) {
      notify({ type: 'warning', title: 'Medication name is required' });
      return;
    }
    setLoading(true);
    try {
      if (isCreating) {
        await api.post('/records', {
          ...form,
          medicationType: form.medicationType.toUpperCase(),
          endDate: form.endDate || null,
        });
        notify({ type: 'success', title: 'Record created' });
      } else {
        await api.patch(`/records/${id}`, {
          ...form,
          medicationType: form.medicationType.toUpperCase(),
          endDate: form.endDate || null,
        });
        notify({ type: 'success', title: 'Record updated' });
      }
      navigate('/app/records', { replace: true });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Unable to save record',
        message: error?.response?.data?.error?.message ?? 'Check your inputs and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <Card header={<h3>{isCreating ? 'Add new medication record' : 'Update record'}</h3>}>
        <form className="record-form" onSubmit={handleSubmit}>
          <Input
            label="Medication name"
            name="medicationName"
            value={form.medicationName}
            onChange={handleChange}
            required
          />
          <label className="form-control">
            <span className="form-label">Medication type</span>
            <select name="medicationType" value={form.medicationType} onChange={handleChange} className="select-field">
              {medicationTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <div className="grid-two">
            <Input
              label="Start date"
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
            />
            <Input
              label="End date"
              type="date"
              name="endDate"
              value={form.endDate ?? ''}
              onChange={handleChange}
            />
          </div>
          <label className="form-control">
            <span className="form-label">Notes</span>
            <textarea
              name="notes"
              rows={4}
              className="textarea-field"
              placeholder="Additional notes, dosage, etc."
              value={form.notes ?? ''}
              onChange={handleChange}
            />
          </label>
          {user?.role === 'ADMIN' && form.userId ? (
            <Badge tone="info">Linked to patient #{form.userId}</Badge>
          ) : null}
          <Button type="submit" loading={loading}>
            {isCreating ? 'Create record' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default EditRecordPage;
