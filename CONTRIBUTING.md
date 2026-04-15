# Contributing to Bayit

Thank you for your interest in contributing to Bayit! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm
- A Firebase project (for backend services)

### Local Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/bayit-community.git
   cd bayit-community
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Branching Convention

- Create a branch from `main` using the format: `feature/short-description` or `fix/short-description`
- Examples:
  - `feature/add-search-filter`
  - `fix/login-validation`
  - `docs/update-readme`

## Making a Pull Request

1. Create your feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit with clear messages
3. Push to your fork: `git push origin feature/your-feature`
4. Open a Pull Request against `main`
5. Fill out the PR template checklist
6. Wait for CI checks to pass and a reviewer to approve

## Code Style

- Use consistent formatting (Prettier will be enforced via CI)
- Write meaningful commit messages
- Keep components small and focused
- Use Hebrew for user-facing text, English for code and comments

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## Questions?

Open a discussion or reach out to the maintainers. We're happy to help!
