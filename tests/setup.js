import '@testing-library/jest-dom';

// Suppress noisy jsdom navigation warnings that surface during route assertions.
const origError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Not implemented: navigation')) return;
  origError(...args);
};
