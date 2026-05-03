import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileModalProvider } from './contexts/ProfileModalContext';
import PublicRoute from './components/guards/PublicRoute';
import RequireAuth from './components/guards/RequireAuth';
import RequireActive from './components/guards/RequireActive';
import RequireAdmin from './components/guards/RequireAdmin';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import FormClaim from './pages/FormClaim';
import Pending from './pages/Pending';
import Dashboard from './pages/Dashboard';
import Ventures from './pages/Ventures';
import VentureForm from './pages/VentureForm';
import VentureDetail from './pages/VentureDetail';
import Journey from './pages/Journey';
import Forums from './pages/Forums';
import ForumPost from './pages/ForumPost';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Matching from './pages/Matching';

// Heavy / admin-only / less-frequent routes — code-split via React.lazy
const Members = lazy(() => import('./pages/Members'));
const ForumDetail = lazy(() => import('./pages/ForumDetail'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const DevTickets = lazy(() => import('./pages/DevTickets'));
const Admin = lazy(() => import('./pages/Admin'));

const Loading = () => (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading…</div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileModalProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/form-claim"
              element={
                <PublicRoute>
                  <FormClaim />
                </PublicRoute>
              }
            />
            <Route
              path="/pending"
              element={
                <RequireAuth>
                  <Pending />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="members"
                element={
                  <Suspense fallback={<Loading />}>
                    <Members />
                  </Suspense>
                }
              />
              <Route path="ventures" element={<Ventures />} />
              <Route path="ventures/new" element={<VentureForm />} />
              <Route path="ventures/:id" element={<VentureDetail />} />
              <Route path="journey" element={<Journey />} />
              <Route path="forums" element={<Forums />} />
              <Route
                path="forums/:id"
                element={
                  <Suspense fallback={<Loading />}>
                    <ForumDetail />
                  </Suspense>
                }
              />
              <Route path="forums/:forumId/posts/:postId" element={<ForumPost />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="matching" element={<Matching />} />
              <Route
                path="dev"
                element={
                  <Suspense fallback={<Loading />}>
                    <DevTickets />
                  </Suspense>
                }
              />
              <Route
                path="edit-profile"
                element={
                  <Suspense fallback={<Loading />}>
                    <EditProfile />
                  </Suspense>
                }
              />
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<Loading />}>
                      <Admin />
                    </Suspense>
                  </RequireAdmin>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProfileModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
