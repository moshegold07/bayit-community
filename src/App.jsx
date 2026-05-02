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
import Members from './pages/Members';
import Ventures from './pages/Ventures';
import VentureForm from './pages/VentureForm';
import VentureDetail from './pages/VentureDetail';
import Journey from './pages/Journey';
import EditProfile from './pages/EditProfile';
import Admin from './pages/Admin';
import Forums from './pages/Forums';
import ForumDetail from './pages/ForumDetail';
import ForumPost from './pages/ForumPost';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import DevTickets from './pages/DevTickets';
import Notifications from './pages/Notifications';
import Matching from './pages/Matching';

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
              <Route path="members" element={<Members />} />
              <Route path="ventures" element={<Ventures />} />
              <Route path="ventures/new" element={<VentureForm />} />
              <Route path="ventures/:id" element={<VentureDetail />} />
              <Route path="journey" element={<Journey />} />
              <Route path="forums" element={<Forums />} />
              <Route path="forums/:id" element={<ForumDetail />} />
              <Route path="forums/:forumId/posts/:postId" element={<ForumPost />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="matching" element={<Matching />} />
              <Route path="dev" element={<DevTickets />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <Admin />
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
