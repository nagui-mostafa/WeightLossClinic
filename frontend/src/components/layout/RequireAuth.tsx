import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
