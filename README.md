<div align="center">

# בית (Bayit) - Startup Community

**פלטפורמה קהילתית שמחברת יזמים, מייסדים ואנשי חדשנות.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://www.bayit-community.com)
[![CI](https://github.com/moshegold07/bayit-community/actions/workflows/ci.yml/badge.svg)](https://github.com/moshegold07/bayit-community/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/moshegold07/bayit-community/pulls)

</div>

---

## What is Bayit?

**Bayit** (בית — "Home" in Hebrew) is an open-source platform for entrepreneur communities. Members register, discover other founders, and connect based on shared interests and expertise.

### Features

- Entrepreneur registration with profile details (LinkedIn, website, expertise, what you do & need)
- Browse and search active members by name, domain, or city
- Admin panel: approve members, manage house rules, remove profiles
- Profile editing and deletion requests
- Dynamic business categories

---

## Quick Start (for contributors)

**No Firebase keys needed.** The app runs locally with Firebase Emulators.

### Prerequisites

- **Node.js** (v18+)
- **Java Runtime** — required by Firebase Emulators
  ```bash
  # Ubuntu/Debian
  sudo apt install default-jre

  # macOS
  brew install openjdk
  ```

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/bayit-community.git
cd bayit-community
npm install
```

### 2. Start Local Dev Environment

Open **3 terminals**:

```bash
# Terminal 1 — Start Firebase Emulators
npm run emulators

# Terminal 2 — Seed test data (only needed once)
npm run seed

# Terminal 3 — Start the app
npm run dev:app
```

### 3. Open in Browser

- **App:** [http://localhost:5173](http://localhost:5173)
- **Emulator UI:** [http://localhost:4000](http://localhost:4000) (browse the local DB)

### Test Accounts (local emulator)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bayit.dev | admin123 |
| User | dana@bayit.dev | test1234 |
| Pending | pending1@bayit.dev | test1234 |

---

## How to Contribute

### Workflow

```
Fork → Clone → Branch → Code → Test → Push → Pull Request
```

### Step by Step

1. **Fork** this repo on GitHub
2. **Clone** your fork locally
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** — write code, test locally
5. **Run checks** before pushing:
   ```bash
   npm run format      # Auto-format code
   npm run lint        # Check for issues
   npm test            # Run tests
   npm run build       # Make sure it builds
   ```
6. **Commit & push:**
   ```bash
   git add .
   git commit -m "feat: description of what you did"
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub against `main`
8. CI will run automatically (format → lint → test → build)
9. Once approved — your code gets merged and auto-deployed to production

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| New feature | `feature/short-description` | `feature/add-search-filter` |
| Bug fix | `fix/short-description` | `fix/login-validation` |
| Docs | `docs/short-description` | `docs/update-readme` |
| Refactor | `refactor/short-description` | `refactor/split-dashboard` |

### Code Style

- **Prettier** handles formatting — just run `npm run format`
- **ESLint** catches issues — run `npm run lint`
- Hebrew for user-facing text, English for code and comments
- Keep components small and focused (one file = one component)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:app` | Start Vite dev server (localhost:5173) |
| `npm run emulators` | Start Firebase Auth + Firestore emulators |
| `npm run seed` | Populate emulators with test entrepreneurs |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting (used in CI) |
| `npm test` | Run tests |
| `npm run build` | Build for production |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite |
| **Backend** | Firebase Auth + Firestore REST API |
| **Hosting** | Vercel (auto-deploy from GitHub) |
| **CI/CD** | GitHub Actions |
| **Linting** | ESLint 9, Prettier |
| **Testing** | Vitest, Testing Library |
| **Local Dev** | Firebase Emulators |

---

## Project Structure

```
bayit-community/
├── src/
│   ├── components/          # Shared UI components
│   │   ├── CategoryPicker.jsx
│   │   ├── HouseRulesModal.jsx
│   │   └── shared.jsx       # Common styles and layout
│   ├── pages/               # Page components
│   │   ├── Admin.jsx        # Admin panel (approve users, house rules)
│   │   ├── Dashboard.jsx    # Main member directory
│   │   ├── EditProfile.jsx  # Edit your profile
│   │   ├── Login.jsx        # Login page
│   │   ├── Pending.jsx      # Waiting for approval screen
│   │   └── Register.jsx     # Registration form
│   ├── App.jsx              # Main app + routing logic
│   ├── firebase.js          # Firebase Auth + Firestore REST wrapper
│   └── main.jsx             # Entry point
├── scripts/
│   └── seed-emulator.mjs    # Seed test data for local dev
├── tests/
│   ├── setup.js
│   └── App.test.jsx
├── .github/
│   ├── workflows/ci.yml     # CI pipeline
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example             # Environment variables template
├── firebase.json            # Emulator config
├── firestore.rules          # Firestore security rules
└── package.json
```

---

## Deployment

The app auto-deploys to [www.bayit-community.com](https://www.bayit-community.com) when code is merged to `main`.

- **Domain:** `bayit-community.com` (managed via Cloudflare DNS)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Backend:** Firebase Auth + Firestore (production keys in Vercel env vars)
- Contributors don't need production keys — local dev uses emulators

---

## Reporting Bugs

[Open an issue](https://github.com/moshegold07/bayit-community/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if relevant

---

## Credits

This project was started by **[Amit](https://github.com/amitost)** who built the original foundation and core features. The community continues to grow it.

**Every contribution matters** — whether it's fixing a typo, adding a feature, or reviewing code. Thank you to all past, present, and future contributors.

---

<div align="center">

**Built with love by the community, for the community.**

</div>
