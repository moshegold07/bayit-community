import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock firebase/auth at module level. The factory below pulls the current
// "user" from a vi.hoisted holder so each test can override it before render.
const state = vi.hoisted(() => ({ user: null }));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, cb) => {
    cb(state.user);
    return () => {};
  },
}));

vi.mock('../../src/firebase', () => {
  return {
    auth: {
      get currentUser() {
        return state.user;
      },
    },
    db: {
      getDoc: vi.fn(async (col, id) => {
        if (col === 'users' && state.user && id === state.user.uid) {
          return {
            exists: () => true,
            data: () => ({
              uid: state.user.uid,
              role: state.user.role,
              status: state.user.status,
              name: 'Test',
            }),
            id,
          };
        }
        return { exists: () => false, data: () => null, id };
      }),
    },
  };
});

import { AuthProvider } from '../../src/contexts/AuthContext';
import RequireAdmin from '../../src/components/guards/RequireAdmin';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <div data-testid="admin-content">admin-only</div>
              </RequireAdmin>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">login</div>} />
          <Route path="/pending" element={<div data-testid="pending-page">pending</div>} />
          <Route path="/" element={<div data-testid="home-page">home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RequireAdmin', () => {
  beforeEach(() => {
    state.user = null;
  });

  it('renders children when user is an active admin', async () => {
    state.user = { uid: 'u1', role: 'admin', status: 'active' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('redirects regular (non-admin) active users to home', async () => {
    state.user = { uid: 'u2', role: 'member', status: 'active' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', async () => {
    state.user = null;
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects an admin whose status is not active to /pending', async () => {
    state.user = { uid: 'u3', role: 'admin', status: 'pending' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});
