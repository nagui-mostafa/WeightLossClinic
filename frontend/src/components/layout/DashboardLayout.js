import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { Activity, Archive, BarChart2, LogOut, NotebookPen, Settings, Shield, UserCircle2, Users, } from 'lucide-react';
const navItems = [
    { to: '/app', label: 'Overview', icon: _jsx(Activity, { size: 18 }) },
    { to: '/app/profile', label: 'Profile', icon: _jsx(UserCircle2, { size: 18 }) },
    { to: '/app/records', label: 'My Records', icon: _jsx(NotebookPen, { size: 18 }) },
    { to: '/app/audit', label: 'Audit Logs', icon: _jsx(Archive, { size: 18 }), adminOnly: true },
    { to: '/app/users', label: 'User Directory', icon: _jsx(Users, { size: 18 }), adminOnly: true },
    { to: '/app/admin/stats', label: 'Admin Analytics', icon: _jsx(BarChart2, { size: 18 }), adminOnly: true },
];
const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const role = user?.role ?? 'PATIENT';
    return (_jsxs("div", { className: "dashboard-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "sidebar-header", children: [_jsx(Shield, { size: 28 }), _jsxs("div", { children: [_jsx("h1", { children: "Weight Loss Clinic" }), _jsx("span", { children: "Care Portal" })] })] }), _jsx("nav", { className: "sidebar-nav", children: navItems
                            .filter((item) => !item.adminOnly || role === 'ADMIN')
                            .map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => `nav-entry ${isActive || location.pathname === item.to ? 'nav-entry-active' : ''}`, children: [_jsx("span", { className: "nav-icon", children: item.icon }), item.label] }, item.to))) }), _jsxs("div", { className: "sidebar-footer", children: [_jsxs("div", { className: "sidebar-user", children: [_jsx("div", { className: "avatar", children: user?.firstName?.[0] }), _jsxs("div", { children: [_jsxs("strong", { children: [user?.firstName, " ", user?.lastName] }), _jsx("span", { className: "sidebar-role", children: user?.role })] })] }), _jsx(Button, { variant: "ghost", fullWidth: true, leftIcon: _jsx(LogOut, { size: 16 }), onClick: () => logout(), children: "Sign out" })] })] }), _jsxs("main", { className: "dashboard-main", children: [_jsxs("header", { className: "dashboard-topbar", children: [_jsxs("div", { className: "topbar-left", children: [_jsxs("h2", { children: ["Welcome back, ", user?.firstName, " \uD83D\uDC4B"] }), _jsx("p", { className: "topbar-subtle", children: "Stay on top of your care plan, track progress, and keep your clinical data tidy." })] }), _jsx("div", { className: "topbar-actions", children: _jsx(Button, { variant: "secondary", leftIcon: _jsx(Settings, { size: 16 }), children: "Account Settings" }) })] }), _jsx("section", { className: "dashboard-content", children: _jsx(Outlet, {}) })] })] }));
};
export default DashboardLayout;
