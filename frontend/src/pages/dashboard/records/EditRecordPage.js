import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
const medicationTypes = ['injectable', 'oral', 'topical', 'other'];
const EditRecordPage = () => {
    const { id } = useParams();
    const isCreating = !id || id === 'new';
    const { user } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        medicationName: '',
        medicationType: 'oral',
        startDate: new Date().toISOString().substring(0, 10),
        endDate: undefined,
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const loadRecord = async () => {
        if (isCreating || !id)
            return;
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
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to load record',
                message: error?.response?.data?.error?.message ?? 'Record might not exist.',
            });
            navigate('/app/records', { replace: true });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadRecord();
    }, [id]);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (event) => {
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
            }
            else {
                await api.patch(`/records/${id}`, {
                    ...form,
                    medicationType: form.medicationType.toUpperCase(),
                    endDate: form.endDate || null,
                });
                notify({ type: 'success', title: 'Record updated' });
            }
            navigate('/app/records', { replace: true });
        }
        catch (error) {
            notify({
                type: 'error',
                title: 'Unable to save record',
                message: error?.response?.data?.error?.message ?? 'Check your inputs and try again.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "dashboard-grid", children: _jsx(Card, { header: _jsx("h3", { children: isCreating ? 'Add new medication record' : 'Update record' }), children: _jsxs("form", { className: "record-form", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Medication name", name: "medicationName", value: form.medicationName, onChange: handleChange, required: true }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "form-label", children: "Medication type" }), _jsx("select", { name: "medicationType", value: form.medicationType, onChange: handleChange, className: "select-field", children: medicationTypes.map((type) => (_jsx("option", { value: type, children: type.toUpperCase() }, type))) })] }), _jsxs("div", { className: "grid-two", children: [_jsx(Input, { label: "Start date", type: "date", name: "startDate", value: form.startDate, onChange: handleChange, required: true }), _jsx(Input, { label: "End date", type: "date", name: "endDate", value: form.endDate ?? '', onChange: handleChange })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "form-label", children: "Notes" }), _jsx("textarea", { name: "notes", rows: 4, className: "textarea-field", placeholder: "Additional notes, dosage, etc.", value: form.notes ?? '', onChange: handleChange })] }), user?.role === 'ADMIN' && form.userId ? (_jsxs(Badge, { tone: "info", children: ["Linked to patient #", form.userId] })) : null, _jsx(Button, { type: "submit", loading: loading, children: isCreating ? 'Create record' : 'Save changes' })] }) }) }));
};
export default EditRecordPage;
