# Weight Loss Clinic Frontend

Modern React application that provides an elegant portal for the Weight Loss Clinic backend. The UI covers all authenticated flows (signup, login, email verification, password reset) and post-login functionality for both patients and administrators (profile management, medication records, audit logs, admin analytics).

## ✨ Features

- **Authentication:** signup, login, email verification, forgot/reset password.
- **Protected dashboards:** role-aware navigation with an immersive layout.
- **Patient tools:** profile editor, medication record CRUD.
- **Admin console:** user management, audit trail browsing, operational analytics.
- **Responsive, minimalist UI:** Inter font, soft gradients, reusable UI primitives.
- **Axios API client with automatic token refresh.**

## 🧱 Tech stack

- [React 18](https://react.dev/)
- [React Router v6](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Axios](https://axios-http.com/) for HTTP client
- Lightweight custom styling (no heavy component frameworks)

## 📦 Project structure

```
frontend/
  src/
    components/       # UI primitives & layout wrappers
    context/          # Auth & notification providers
    pages/            # Route-entry components grouped by feature
    services/         # Axios instance & API helpers
    styles/           # Global style sheet
  .env.example        # Frontend environment variables
  package.json
  vite.config.ts
```

## 🚀 Getting started

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Update `VITE_API_URL` if your backend runs at a different address.

3. **Start development server**

   ```bash
   npm run dev
   ```

   Vite launches at [http://localhost:5173](http://localhost:5173) with hot reloading.

4. **Build for production**

   ```bash
   npm run build
   npm run preview   # optional – preview the production build locally
   ```

## 🔐 Authentication notes

- Access & refresh tokens are stored in localStorage.
- Axios interceptors automatically refresh tokens when the API returns a 401.
- Logout (via the sidebar) revokes the current refresh session server-side.

## 📘 Using the app

| Route                         | Role     | Description                                        |
|------------------------------|----------|----------------------------------------------------|
| `/auth/signup`               | Public   | Create a patient account (handles email verification) |
| `/auth/login`                | Public   | Sign-in for existing patients or admins            |
| `/auth/forgot-password`      | Public   | Request password reset email                       |
| `/auth/reset-password?token` | Public   | Reset password using emailed token                 |
| `/auth/verify-email?token`   | Public   | Confirms email address                             |
| `/app`                       | Auth     | Dashboard overview                                 |
| `/app/profile`               | Auth     | View/modify profile, weight goals                  |
| `/app/records`               | Auth     | List medication records, create/update/delete      |
| `/app/records/:id`           | Auth     | Edit specific record (use `new` for creation)      |
| `/app/users`                 | Admin    | Manage users, promote/demote roles, deactivate     |
| `/app/audit`                 | Admin    | Browse audit logs                                  |
| `/app/admin/stats`           | Admin    | View top-level operational metrics                 |

## 🧰 Customisation

- **Styling:** `src/styles/global.css` contains the theme, colours, responsive rules, and UI utility classes.
- **Routes / pages:** add new pages under `src/pages/...` and register them in `src/App.tsx`.
- **API base URL:** change `VITE_API_URL` (default `http://localhost:3000/v1`).

## 🤝 Backend requirements

The frontend expects the NestJS backend in this repository (versioned `/v1` routes) with the following features enabled:

- JWT auth with refresh token rotation.
- Email verification + password reset endpoints.
- User, records, admin stats/audit endpoints.
- CORS must allow the frontend origin (`http://localhost:5173` in development).

## 📄 License

This frontend is provided for the Weight Loss Clinic project and inherits the licensing terms of the repository. Feel free to adapt it to your own organisation’s brand and workflows.
