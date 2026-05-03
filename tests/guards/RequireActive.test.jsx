import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const state = vi.hoisted(() => ({ user: null }));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, cb) => {
    cb(state.user);
    return () => {};
  },
}));

vi.mock('../../src/firebase', () => ({
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
            role: state.user.role || 'member',
            status: state.user.status,
            name: 'Test',
          }),
          id,
        };
      }
      return { exists: () => false, data: () => null, id };
    }),
  },
}));

import { AuthProvider } from '../../src/contexts/AuthContext';
import RequireActive from '../../src/components/guards/RequireActive';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireActive>
                <div data-testid="active-content">members-only</div>
              </RequireActive>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">login</div>} />
          <Route path="/pending" element={<div data-testid="pending-page">pending</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RequireActive', () => {
  beforeEach(() => {
    state.user = null;
  });

  it('renders children for an active user', async () => {
    state.user = { uid: 'u1', role: 'member', status: 'active' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('active-content')).toBeInTheDocument();
    });
  });

  it('redirects pending users to /pending', async () => {
    state.user = { uid: 'u2', role: 'member', status: 'pending' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('active-content')).not.toBeInTheDocument();
  });

  it('redirects users with non-active status (e.g. inactive) to /pending', async () => {
    state.user = { uid: 'u3', role: 'member', status: 'inactive' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('active-content')).not.toBeInTheDocument();
  });
});
