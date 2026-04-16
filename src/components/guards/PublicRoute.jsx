import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.status === 'active') return <Navigate to="/" replace />;
  if (user && user.status === 'pending') return <Navigate to="/" replace />;
  return children;
}
