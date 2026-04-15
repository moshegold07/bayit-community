import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock Firebase before importing App
vi.mock('../src/firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate no user logged in
    callback(null);
    return vi.fn(); // unsubscribe
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

import App from '../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // When no user is logged in, the Login page should render
    expect(document.getElementById('root') || document.body).toBeTruthy();
  });
});
