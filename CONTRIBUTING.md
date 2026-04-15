# Contributing to Bayit

Thank you for helping build Bayit! Here's everything you need to know.

## Setup (5 minutes)

### Prerequisites

- Node.js v18+
- Java Runtime (`sudo apt install default-jre`)

### Install & Run

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/bayit-community.git
cd bayit-community
npm install

# 2. Start emulators (Terminal 1)
npm run emulators

# 3. Seed test data — only once (Terminal 2)
npm run seed

# 4. Start dev server (Terminal 3)
npm run dev:app
```

App: http://localhost:5173 | Emulator UI: http://localhost:4000

No Firebase keys needed — the app auto-connects to local emulators.

### Test Accounts (local)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bayit.dev | admin123 |
| User | dana@bayit.dev | test1234 |

## Making Changes

### 1. Create a branch

```bash
git checkout -b feature/your-feature
```

Naming: `feature/...`, `fix/...`, `docs/...`, `refactor/...`

### 2. Write code

- Components go in `src/components/` or `src/pages/`
- Hebrew for UI text, English for code
- Keep files small and focused

### 3. Run checks before pushing

```bash
npm run format     # Auto-format
npm run lint       # Check lint
npm test           # Run tests
npm run build      # Verify build
```

All four must pass — CI will reject the PR otherwise.

### 4. Commit

Write clear commit messages:

```bash
git commit -m "feat: add city filter to dashboard"
git commit -m "fix: phone validation on register page"
git commit -m "docs: update setup instructions"
```

### 5. Push & open a PR

```bash
git push origin feature/your-feature
```

Go to GitHub and open a Pull Request against `main`. Fill out the template checklist.

## What Happens After You Open a PR

1. **CI runs automatically** — format check → lint → tests → build
2. **Maintainer reviews** your code
3. **Merge** — code is auto-deployed to production via Vercel

## Code Guidelines

- **Formatting**: Prettier handles it. Just run `npm run format`.
- **Linting**: ESLint catches issues. Run `npm run lint:fix` for auto-fixes.
- **Components**: One component per file. Use functional components with hooks.
- **Styles**: Inline styles (following existing pattern in `shared.jsx`).
- **State**: React `useState`/`useEffect`. No external state management.
- **Database**: All Firestore calls go through `db` in `src/firebase.js`.

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- What you expected vs what happened
- Browser + OS
- Screenshots if relevant

## Questions?

Open a GitHub issue or discussion. We're happy to help!
