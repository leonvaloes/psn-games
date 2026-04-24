# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PSN Games is a full-stack web app for browsing PlayStation games, tracking achievements, managing favorites, and writing/reading platinum guides. It uses RAWG as the game data source.

**Stack:**
- **Backend:** Node.js + Express + Mongoose (MongoDB), JWT auth, ESM modules
- **Frontend:** Vue 3 + Vite + Vue Router, axios for API calls
- **E2E Tests:** Playwright
- **Deployment:** Docker Compose (mongo + backend + frontend via nginx)

## Environment Setup

Copy `.env.example` to `.env` in the root and in `backend/`:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/psn-games
RAWG_API_KEY=<your key from rawg.io>
JWT_SECRET=<random secret>
CORS_ORIGIN=http://localhost:5173
```

## Commands

### Backend (from `backend/`)
```bash
npm run dev    # node --watch (auto-restart on changes)
npm start      # production
```
Requires MongoDB running locally or via Docker.

### Frontend (from `frontend/`)
```bash
npm run dev    # Vite dev server at http://localhost:5173
npm run build  # production build
```
The Vite dev server proxies `/api` to `http://localhost:3000` (see `vite.config.js`).

### E2E Tests (from `e2e/`)
```bash
npm test                  # run all Playwright tests
npx playwright test tests/auth.spec.js   # run a single test file
npm run test:report       # open HTML report
```
Tests expect the full stack running. Set `BASE_URL` env var to target a different host (defaults to `http://localhost`).

## Testing Requirements

- Before reporting back on any feature implementation or bug fix, you must validate that feature with tests relevant to the change.
- Do not provide a completion status based only on code inspection; execute tests whenever the environment allows it.
- Prioritize adding or running both unit and E2E tests for the affected behavior whenever applicable.
- Stress-test critical flows, especially stateful interactions such as voting, toggles, retries, concurrency, and repeated user actions.
- When a bug involves inconsistent state, race conditions, or repeated interactions, test the happy path, toggling back and forth, rapid repeated actions, and multi-user style sequences.
- If tests cannot be executed because the environment is missing dependencies, services, or configuration, explicitly state that limitation in the final report.

### Mandatory Validation Checklist Per Feature

Before giving a final response about a feature, fix, or refactor, complete this checklist whenever applicable:

- Run or add unit tests covering the changed logic.
- Run or add E2E tests covering the user-visible flow.
- For every new feature, actively execute these tests instead of only proposing them.
- Exercise the feature manually or through automated repeated interactions when the change involves UI state or async behavior.
- Stress-test repeated actions to catch race conditions, duplicated requests, toggle inconsistencies, stale UI state, and multi-user transition issues.
- Verify the main success path.
- Verify important edge cases.
- Verify rollback/toggle behavior when the feature supports reversing state.
- Report exactly which tests were run.
- Report exactly which scenarios were validated.
- If any part was not tested, state what was skipped and why.

### Minimum Stress-Test Scenarios

For interactive features, validate at least these scenarios when relevant:

- Single action once.
- Same action repeated quickly multiple times.
- Toggle from one state to another and back again.
- Two users affecting the same entity in sequence.
- Refresh/reload after the action to confirm persistence.
- Sorting/order updates after state changes, when the UI depends on ranking or counts.

### Execution Rule

- For each new feature, bug fix, or behavioral change, you must execute the relevant tests before reporting completion whenever the environment supports it.
- This includes unit tests, E2E tests, and stress/repetition scenarios appropriate to the feature.
- If execution is blocked, state exactly what prevented the tests from running and what remains unverified.

### Full Stack via Docker
```bash
docker compose up --build          # runs mongo + backend + frontend
docker compose --profile test up   # also runs e2e tests
```

## Architecture

### Backend (`backend/src/`)
- `server.js` — connects to MongoDB, then starts Express
- `app.js` — registers routes and middleware (CORS, JSON, health check at `/health`)
- `routes/` — `games.js`, `auth.js`, `user.js`, `guides.js` mounted under `/api/*`
- `services/rawgService.js` — wraps RAWG API (`searchGames`, `getGame`, `getGameAchievements`)
- `middleware/auth.js` — `requireAuth` verifies JWT and sets `req.userId`
- `models/` — Mongoose schemas: `User`, `Favorite`, `UserAchievement`, `Game`, `Guide`

### Frontend (`frontend/src/`)
- `services/api.js` — single axios instance (baseURL `/api`) with request interceptor for Bearer token; exports `searchGames`, `getGame`, `getAchievements`, `authApi`, `userApi`, `guidesApi`
- `composables/useAuth.js` — reactive auth state; `composables/useFavorites.js` — favorites state
- `router/index.js` — client-side routing; protected routes (`/favorites`, guide create/edit) use `beforeEnter: requireAuth` which checks `localStorage.getItem('token')`
- `views/` — page-level components; `components/` — reusable cards (GameCard, GuideCard, TrophyCard, SearchBar)

### Data Flow
Games are fetched on-demand from RAWG via the backend proxy (no game data stored in MongoDB). User-specific data (favorites, achievement tracking, guides) is stored in MongoDB.
