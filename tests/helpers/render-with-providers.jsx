import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';

/**
 * Wraps a component in MemoryRouter + AuthProvider.
 *
 * NOTE: AuthProvider listens to the real `auth.onAuthStateChanged`. Tests must
 * mock '../../src/firebase' BEFORE calling this helper so the provider receives
 * the desired user. See `createFirebaseMock` in tests/helpers/firebase-mock.js.
 *
 * @param {ReactElement} ui     The component under test (rendered at `route`).
 * @param {Object} options
 * @param {string}        options.route               Initial URL (default '/')
 * @param {Array<string>} options.initialEntries      Override full router stack
 * @param {Array<{path:string, element:ReactNode}>} options.extraRoutes  Routes
 *        that the guard might redirect to (so we can assert on URL/markers).
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    initialEntries,
    extraRoutes = [
      { path: '/login', element: <div data-testid="login-page">login</div> },
      { path: '/pending', element: <div data-testid="pending-page">pending</div> },
      { path: '/', element: <div data-testid="home-page">home</div> },
    ],
  } = options;

  const entries = initialEntries || [route];

  return render(
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <Routes>
          <Route path="/protected" element={ui} />
          {extraRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}
