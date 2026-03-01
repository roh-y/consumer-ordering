# Frontend

Mobile-responsive React SPA for browsing and purchasing wireless plans.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **Zustand** for state management (auth tokens)
- **TanStack Query** for server state (API data fetching/caching)
- **React Router v7** for navigation
- **Axios** for HTTP requests

## Pages

| Page | Route | Auth Required | Description |
|------|-------|--------------|-------------|
| Login | `/login` | No | Email/password sign-in |
| Register | `/register` | No | Sign-up + email verification |
| Plans | `/plans` | No | Browse wireless plans |
| Profile | `/profile` | Yes | View/edit user profile |

## Running Locally

```bash
npm install
npm run dev
```

App starts on http://localhost:5173. API requests proxy to http://localhost:8081.

## Running Tests

```bash
npm test          # Watch mode
npm test -- --run # Single run
```

## Building

```bash
npm run build     # Output in dist/
npm run preview   # Preview production build
```

## Directory Structure

```
src/
├── pages/           — Full-page components (LoginPage, PlansPage, etc.)
├── components/      — Shared components (Layout, ProtectedRoute)
├── services/        — API client and service functions
├── store/           — Zustand auth store
├── types/           — TypeScript interfaces
├── hooks/           — Custom React hooks (future)
├── utils/           — Utility functions (future)
└── test/            — Test setup and test files
```
