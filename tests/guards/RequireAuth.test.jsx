import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const state = vi.hoisted(() => ({ user: null, neverFire: false }));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, cb) => {
    if (!state.neverFire) cb(state.user);
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
          data: () => ({ uid: state.user.uid, role: 'member', status: 'active', name: 'Test' }),
          id,
        };
      }
      return { exists: () => false, data: () => null, id };
    }),
  },
}));

import { AuthProvider } from '../../src/contexts/AuthContext';
import RequireAuth from '../../src/components/guards/RequireAuth';

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div data-testid="protected-content">secret</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div data-testid="login-page">login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    state.user = null;
    state.neverFire = false;
  });

  it('renders children when a user is signed in', async () => {
    state.user = { uid: 'u1' };
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('redirects to /login when signed out', async () => {
    state.user = null;
    renderGuarded();
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders nothing while loading (auth state never resolves)', () => {
    state.neverFire = true;
    renderGuarded();
    // Guard returns null when loading=true, so neither destination should mount.
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
