# Architecture — Fly Yoga Studio

## Overview

Fly Yoga Studio is a single-location yoga studio website based in Chisinau, Moldova.
The project is a frontend-only React application backed entirely by Supabase (database, auth, storage).
There is no custom backend server. All business logic that requires persistence runs through Supabase APIs and is protected by Row Level Security policies.

---

## Goals

- Attract new clients to the studio.
- Allow users to browse the schedule and book yoga classes.
- Allow users to submit hall rental requests.
- Provide a user dashboard for managing bookings and subscriptions.
- Provide an admin panel for studio management.

---

## Technology Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| UI Framework   | React 18 + TypeScript             |
| Build Tool     | Vite                              |
| Routing        | React Router v6                   |
| Styling        | TailwindCSS + shadcn/ui           |
| Backend        | Supabase (BaaS)                   |
| Database       | PostgreSQL (managed by Supabase)  |
| Auth           | Supabase Auth                     |
| File Storage   | Supabase Storage                  |
| i18n           | i18next                           |
| Package Manager| npm                               |
| Hosting        | Vercel (frontend)                 |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│  React + TypeScript (Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │         │
│       └─────────────┴──────┬──────┘         │
│                            │                │
│              ┌─────────────▼──────────┐     │
│              │      Services / lib     │     │
│              │  (Supabase JS client)   │     │
│              └─────────────┬──────────┘     │
└────────────────────────────┼────────────────┘
                             │ HTTPS
              ┌──────────────▼──────────────┐
              │           Supabase           │
              │  ┌────────┐  ┌───────────┐  │
              │  │  Auth  │  │ PostgreSQL │  │
              │  └────────┘  └───────────┘  │
              │  ┌────────┐  ┌───────────┐  │
              │  │Storage │  │    RLS    │  │
              │  └────────┘  └───────────┘  │
              └──────────────────────────────┘
```

---

## Frontend Structure

```
src/
├── assets/          # Static images, fonts, icons
├── components/      # Shared, reusable UI components
├── contexts/        # React context providers (auth, language, etc.)
├── features/        # Feature-scoped modules (booking, rental, admin, etc.)
├── hooks/           # Custom React hooks
├── i18n/            # Translation files (ru, ro, en) and i18next config
├── layouts/         # Page layout wrappers (PublicLayout, DashboardLayout, AdminLayout)
├── lib/             # Third-party client setup (Supabase client, i18n init)
├── pages/           # Route-level page components
├── services/        # Data-access functions that call Supabase
└── types/           # Shared TypeScript type and interface definitions
```

### Key Conventions

- **No business logic inside UI components.** Pages and components call hooks or services; they do not query Supabase directly.
- **Services** are plain async functions that interact with `supabase-js`. Each entity (bookings, classes, trainers…) has its own service file.
- **Custom hooks** encapsulate stateful logic (data fetching, form state, auth state) and expose clean APIs to components.
- **Contexts** hold global state — authenticated user, current language, etc.
- Components are kept under 300 lines. Large components are split into smaller composables.

---

## Routing

React Router v6 is used for client-side routing.

| Route                    | Description                        | Access          |
| ------------------------ | ---------------------------------- | --------------- |
| `/`                      | Home / Landing page                | Public          |
| `/schedule`              | Class schedule + booking           | Public          |
| `/trainers`              | Trainer profiles                   | Public          |
| `/services`              | Services overview                  | Public          |
| `/gallery`               | Photo gallery                      | Public          |
| `/hall-rental`           | Hall rental request form           | Public          |
| `/contact`               | Contact information                | Public          |
| `/login`                 | Login page                         | Guest only      |
| `/register`              | Registration page                  | Guest only      |
| `/dashboard`             | User dashboard                     | Authenticated   |
| `/dashboard/bookings`    | User's bookings                    | Authenticated   |
| `/dashboard/profile`     | Edit profile                       | Authenticated   |
| `/admin`                 | Admin panel                        | Admin role only |
| `/admin/trainers`        | Manage trainers                    | Admin role only |
| `/admin/schedule`        | Manage class schedule              | Admin role only |
| `/admin/bookings`        | Manage bookings                    | Admin role only |
| `/admin/subscriptions`   | Manage subscription plans          | Admin role only |
| `/admin/reviews`         | Manage reviews                     | Admin role only |
| `/admin/hall-rental`     | Manage hall rental requests        | Admin role only |

Protected routes redirect unauthenticated users to `/login`. Admin routes additionally check the user's role stored in the `profiles` table.

---

## Authentication

Supabase Auth handles all authentication. No passwords are stored in application code.

Supported flows:
- Email + password registration
- Email + password login
- Password reset via email link

After registration, a corresponding row is inserted into the `profiles` table with `first_name`, `last_name`, `phone`, and `role` (`user` or `admin`).

The `AuthContext` exposes the current session, user object, and helper functions (`signIn`, `signOut`, `signUp`) to the entire application.

---

## Database

PostgreSQL is managed entirely by Supabase. Schema migrations are applied via the Supabase Dashboard or Supabase CLI.

### Core Tables

| Table                  | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `profiles`             | Extended user data (name, phone, role)              |
| `trainers`             | Trainer profiles (name, bio, photo, specialization) |
| `classes`              | Class types (name, description, duration, level)    |
| `schedule`             | Specific class sessions (date, time, trainer, seats)|
| `bookings`             | User bookings for schedule sessions                 |
| `subscriptions`        | User's active subscription                          |
| `subscription_plans`   | Available subscription plan definitions             |
| `attendance`           | Attendance records per booking                      |
| `reviews`              | User reviews / testimonials                         |
| `hall_rental_requests` | Hall rental inquiry submissions                     |

All tables use foreign keys. Indexes are added for frequently queried columns (e.g., `schedule.date`, `bookings.user_id`).

### Row Level Security (RLS)

RLS is enabled on every table. Policies enforce:
- Users can only read and modify their own rows (`profiles`, `bookings`, `subscriptions`).
- Public tables (`trainers`, `classes`, `schedule`, `reviews`) are readable by everyone.
- Hall rental requests can be inserted by anyone but only read/managed by admins.
- Admin role (checked via `profiles.role`) has full access to all tables.

---

## File Storage

Supabase Storage is used for all media assets:

| Bucket       | Contents                            | Access   |
| ------------ | ----------------------------------- | -------- |
| `gallery`    | Studio and class photos             | Public   |
| `trainers`   | Trainer profile photos              | Public   |
| `avatars`    | User profile pictures               | Auth     |

Public buckets are served via Supabase CDN URLs. During development, placeholder images are used.

---

## Internationalization

i18next is used for all translations. Russian is the default language.

```
src/i18n/
├── index.ts          # i18next initialization and language detection
└── locales/
    ├── ru/           # Russian translations (default)
    ├── ro/           # Romanian translations
    └── en/           # English translations
```

- Every visible string in the UI goes through `t('key')` — no hardcoded text in components.
- Language preference is persisted in `localStorage`.
- The language switcher is available in the navigation bar.

---

## Design System

The visual design follows a **minimalistic, premium wellness** aesthetic.

- **UI library:** shadcn/ui (built on Radix UI primitives + TailwindCSS)
- **Colors:** White, Beige, Cream, Light Gray, Soft Green
- **Typography:** Large, spacious, elegant
- **Layout:** Clean sections, generous whitespace, smooth transitions
- **Responsive:** Mobile-first; breakpoints for tablet, laptop, and desktop

Inspired by Apple, Airbnb, Calm, Headspace, and Alo Yoga.

---

## Security

| Concern              | Solution                                                  |
| -------------------- | --------------------------------------------------------- |
| Auth                 | Supabase Auth; JWTs; no manual password storage           |
| Data access          | RLS policies on all Supabase tables                       |
| Route protection     | React Router guards based on session and user role        |
| Input validation     | Client-side validation + Supabase constraints             |
| Secrets              | Environment variables only; never committed to git        |
| API keys             | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` |

---

## Deployment

| Service  | Platform         | Notes                                          |
| -------- | ---------------- | ---------------------------------------------- |
| Frontend | Vercel           | Auto-deploy from `main` branch; free plan      |
| Backend  | Supabase         | Managed PostgreSQL + Auth + Storage; free plan |

Environment variables are configured in Vercel project settings. The `.env` file is git-ignored.

SEO requirements (meta tags, Open Graph, sitemap, robots.txt) are handled at the Vite/React level.

---

## Key Constraints

- **No custom backend.** Supabase is the only server-side layer.
- **Solo developer.** Solutions must be simple, readable, and easy to maintain.
- **Free tier.** The project must operate within Supabase and Vercel free plans.
- **Mobile-first.** All pages are designed for mobile before larger screens.
