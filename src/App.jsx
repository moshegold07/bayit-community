import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Pending from './pages/Pending';
import EditProfile from './pages/EditProfile';

export default function App() {
  const [page, setPage] = useState('login');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        setPage('login');
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        setPage('login');
        setLoading(false);
        return;
      }
      const data = { uid: user.uid, ...snap.data() };
      setUserData(data);
      if (data.role === 'admin') setPage('admin');
      else if (data.status === 'pending') setPage('pending');
      else setPage('dashboard');
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          color: '#888',
        }}
      >
        טוען...
      </div>
    );

  const nav = (p) => setPage(p);

  if (page === 'register') return <Register onLogin={() => nav('login')} />;
  if (page === 'login')
    return (
      <Login
        onRegister={() => nav('register')}
        onSuccess={(data) => {
          setUserData(data);
          nav(
            data.role === 'admin' ? 'admin' : data.status === 'pending' ? 'pending' : 'dashboard',
          );
        }}
      />
    );
  if (page === 'pending')
    return (
      <Pending
        onLogout={() => {
          auth.signOut();
          nav('login');
        }}
      />
    );
  if (page === 'dashboard')
    return (
      <Dashboard
        user={userData}
        onLogout={() => {
          auth.signOut();
          nav('login');
        }}
        onAdmin={() => nav('admin')}
        onEditProfile={() => nav('edit')}
      />
    );
  if (page === 'edit')
    return (
      <EditProfile
        user={userData}
        onBack={() => nav('dashboard')}
        onSaved={(updated) => {
          setUserData(updated);
          nav('dashboard');
        }}
      />
    );
  if (page === 'admin')
    return (
      <Admin
        user={userData}
        onLogout={() => {
          auth.signOut();
          nav('login');
        }}
        onDashboard={() => nav('dashboard')}
      />
    );
  return null;
}
