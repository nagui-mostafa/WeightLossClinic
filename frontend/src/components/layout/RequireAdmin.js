import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const RequireAdmin = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return _jsx("div", { className: "page-loading", children: "Loading session..." });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/auth/login", replace: true });
    }
    if (user.role !== 'ADMIN') {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    return _jsx(Outlet, {});
};
export default RequireAdmin;
