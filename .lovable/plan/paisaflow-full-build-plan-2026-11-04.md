# PaisaFlow — Full Build Plan

Build PaisaFlow from scratch on this blank template (there is no existing PaisaFlow app in this project yet). Premium white fintech theme, italic typography, desktop + mobile, full auth, seven pages, PKR currency.

## Design system (src/styles.css)

- White/off-white theme only — no dark mode, no toggle.
- Fonts: DM Sans (variable, complete italic range) loaded via `<link>` in `src/routes/__root.tsx` head; everything rendered italic (`font-style: italic` on headings, labels, buttons, figures).
- Deep navy accent (`--primary`) for primary buttons with white italic text; white secondary buttons with subtle borders; charcoal-navy typography; subtle grey borders; soft realistic shadows; generous whitespace.
- Tailwind v4 tokens in `@theme inline` + `:root`; no hardcoded color utilities in components.
- Button variants: primary (navy), secondary (white/bordered), destructive; hover lift + press scale, elegant shadows.

## Backend — Lovable Cloud

- Enable Lovable Cloud. Email/password auth (call `enable_email_auth` in the same turn).
- Migration (schema + GRANTs + RLS + trigger + seed categories) with tables:
  - `profiles` (id → auth.users, full_name, currency default 'PKR') — auto-created on signup via trigger; user reads/updates own row.
  - `categories` (user-owned; name, kind income/expense, icon, color) — seeded with common defaults (Food, Transport, Utilities, Shopping, Health, Entertainment, Salary, Freelance…).
  - `transactions` (user-owned; type, amount numeric, category_id, date, note) — the core ledger for all pages.
  - `budgets` (user-owned; category_id, monthly limit, month) — budget progress + budget page.
  - `savings_goals` (user-owned; name, target, saved amount, icon) — savings page.
- RLS: every table scoped to `auth.uid()`; explicit GRANTs per table (authenticated + service_role).
- All reads/writes via `createServerFn` with `requireSupabaseAuth`; no unauthenticated access to financial data.

## Routes

- `/` — session-aware: redirect signed-in users to `/dashboard`; otherwise redirect to `/auth` (single route file, never `_authenticated/index.tsx`).
- `/auth` — Sign In (email, password, show/hide, forgot password link, friendly errors, loading states, duplicate-email handling).
- `/auth/sign-up` — full name, email, password, confirm, show/hide, validation, terms acknowledgement; "check your email to confirm" state.
- `/forgot-password` and `/reset-password` — full recovery flow (`redirectTo: /reset-password`, `updateUser({ password })`).
- `/_authenticated/route.tsx` (integration-managed gate) with children:
  - `/dashboard` — greeting by local time ("Good morning, Hassan!"), stat cards (Total Balance, Monthly Income, Monthly Expenses, Budget used), cash-flow chart, spending breakdown donut, recent transactions.
  - `/income` and `/expenses` — full transaction lists with filters, add/edit forms (mobile bottom sheets, desktop dialogs).
  - `/analytics` — charts by category, monthly trends, income vs expense comparison.
  - `/budgets` — monthly budget per category, progress bars, over-budget warnings.
  - `/savings` — savings goals with progress and contribute action.
  - `/reports` — generate report for a date range: summary + breakdown, printable/copyable.
- Each content route gets its own `head()` with unique title/description/og tags.

## Layout: desktop + mobile (not a scaled-down copy)

- Desktop: elegant fixed left sidebar (logo, Dashboard, Income, Expenses, Analytics, Budgets, Savings, Reports, Logout), wide content, multi-column card grids, comfortable max width.
- Mobile (< md): compact header with greeting/avatar, bottom navigation (Home, Insights, Budgets, Profile) + floating navy quick-add button, single-column cards, full-width forms, touch-friendly buttons, no horizontal overflow (grid + min-w-0 + shrink-0 patterns).
- Test widths: 360 / 390 / 430 / tablet / 1366 / 1920.

## Personalized welcome experience

- After each successful login (once per session, sessionStorage flag): animated welcome modal — "Welcome back, {full name from profile}!" + tagline + "Let's Get Started" button, subtle overlay, close icon. Never before auth, never on page navigation.
- Persistent time-based greeting on the dashboard header from the profile's name.

## Animations (respect `prefers-reduced-motion`)

- framer-motion for the welcome modal, page/card entrances, number counters; tw-animate-css for hovers; chart entrance animations; loading skeletons; smooth route transitions.

## Icons/charts

- lucide-react icons; recharts for bar/line/donut charts (install if missing).

## Technical notes

- No `src/App.tsx`, no `src/pages/`; pages under `src/routes/`, reusable components under `src/components/`.
- Mount `<Toaster />` (sonner) once in `__root.tsx`.
- `index.tsx` placeholder replaced (redirect route) — no blank placeholder remains.

## Verification

- Run existing tests, then Playwright against the dev server: complete signup → verify → dashboard journey, add income/expense, check desktop (1366) and mobile (390/360) layouts, welcome modal once-per-session behavior, and logout. Fix anything observed before reporting done.
