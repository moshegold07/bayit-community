<div align="center">

# בית (Bayit) - Startup Community

**A community-driven platform connecting entrepreneurs, founders, and innovators.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://bayit-community.vercel.app)
[![CI](https://github.com/moshegold07/bayit-community/actions/workflows/ci.yml/badge.svg)](https://github.com/moshegold07/bayit-community/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/moshegold07/bayit-community/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## About

**Bayit** (בית — "Home" in Hebrew) is an open-source platform designed to bring entrepreneurs together. Register your profile, discover other founders, and connect based on shared interests and expertise.

### Current Features

- Entrepreneur registration form (details, LinkedIn, website, areas of expertise, what you do & what you're looking for)
- Browse active entrepreneurs
- Search and filter profiles
- Profile deletion request
- Dynamic business categories (add new ones on the fly)
- **Admin panel:**
  - Approve new entrepreneur applications
  - Remove entrepreneurs
  - Edit community house rules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite |
| **Backend** | Firebase (Firestore, Auth) |
| **Hosting** | Vercel |
| **CI/CD** | GitHub Actions |
| **Linting** | ESLint 9, Prettier |
| **Testing** | Vitest, Testing Library |
| **Local Dev** | Firebase Emulators (no keys needed) |

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- Java Runtime (for Firebase Emulators) — `sudo apt install default-jre`

### Quick Start (Zero Config)

No Firebase keys needed! The app auto-connects to local emulators:

```bash
# Clone and install
git clone https://github.com/moshegold07/bayit-community.git
cd bayit-community
npm install

# Terminal 1 — Start emulators
npm run emulators

# Terminal 2 — Seed test data (run once)
npm run seed

# Terminal 3 — Start the app
npm run dev:app
```

Open [http://localhost:5173](http://localhost:5173) — the app is running with test data.

Emulator UI at [http://localhost:4000](http://localhost:4000) — browse the local DB.

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bayit.dev | admin123 |
| User | dana@bayit.dev | test1234 |
| Pending | pending@bayit.dev | test1234 |

### Connect to Production Firebase

If you have Firebase keys (from the project owner), create a `.env` file:

```bash
cp .env.example .env
# Fill in the real Firebase values
npm run dev:prod
```

The app auto-detects: no `.env` = emulators, `.env` present = production Firebase.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:app` | Start Vite dev server |
| `npm run dev:prod` | Start with real Firebase (requires .env) |
| `npm run emulators` | Start Firebase Auth + Firestore emulators |
| `npm run seed` | Populate emulators with test data |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests |
| `npm run build` | Build for production |

### Build for Production

```bash
npm run build
npm run preview
```

## Contributing

We welcome contributions from everyone! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our branching conventions, PR process, and development setup.

## Project Structure

```
bayit-community/
├── src/
│   ├── components/       # Shared UI components
│   │   ├── CategoryPicker.jsx
│   │   ├── HouseRulesModal.jsx
│   │   └── shared.jsx
│   ├── pages/            # Page-level components
│   │   ├── Admin.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EditProfile.jsx
│   │   ├── Login.jsx
│   │   ├── Pending.jsx
│   │   └── Register.jsx
│   ├── App.jsx
│   ├── firebase.js       # Auto-detects emulator vs production
│   └── main.jsx
├── scripts/
│   ├── dev.sh            # Full local dev startup script
│   └── seed-emulator.mjs # Populates emulators with test data
├── tests/
│   ├── setup.js
│   └── App.test.jsx
├── .github/
│   ├── workflows/ci.yml  # CI: format → lint → test → build
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example          # Firebase env vars template
├── eslint.config.js
├── vitest.config.js
├── firebase.json         # Emulator + hosting config
├── firestore.rules
├── CONTRIBUTING.md
└── README.md
```

## Acknowledgments & Credits

### A Huge Thank You to Amit

This project was initiated and kickstarted by **[Amit](https://github.com/amitost)** — who built the original foundation, designed the core features, and brought this idea to life. The entire community stands on the shoulders of this initial effort. Thank you, Amit, for planting the seed and trusting the community to grow it further.

### To Our Future Contributors

This project belongs to the community. Every pull request, bug report, feature idea, and code review makes Bayit better for everyone. Whether you're fixing a typo or building a major feature — **you are what makes this project a home.**

Thank you to all past, present, and future contributors. Your names will live in this project's history.

---

<div align="center">

**Built with love by the community, for the community.**

</div>
