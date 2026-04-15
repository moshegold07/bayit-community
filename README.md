<div align="center">

# בית (Bayit) - Startup Community

**A community-driven platform connecting entrepreneurs, founders, and innovators.**

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
| **Hosting** | Firebase Hosting |
| **CI/CD** | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/moshegold07/bayit-community.git
cd bayit-community

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

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
│   ├── firebase.js
│   └── main.jsx
├── .github/
│   ├── workflows/ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
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
