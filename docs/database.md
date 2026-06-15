# Database — Fly Yoga Studio

## Overview

The database is PostgreSQL, managed by Supabase.  
All schema changes are applied via the Supabase Dashboard SQL editor or the Supabase CLI (`supabase db push`).  
Row Level Security (RLS) is **enabled on every table**. No table is left unprotected.

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    └──< profiles (1:1)
            │
            ├──< bookings >──< schedule >──< classes
            │        │               │
            │        └──< attendance  └──< trainers
            │
            ├──< subscriptions >──< subscription_plans
            │
            └──< reviews

hall_rental_requests  (standalone, no user FK required)
```

---

## Helper Function

Used inside RLS policies to check the current user's role without a subquery on every row.

```sql
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;
```

---

## Tables

### 1. profiles

Extends `auth.users` with application-level data. Created automatically via a trigger on sign-up.

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text        not null,
  last_name   text        not null,
  phone       text,
  role        text        not null default 'user' check (role in ('user', 'admin')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

**Trigger — auto-create profile on registration:**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Indexes:**

```sql
create index profiles_role_idx on public.profiles(role);
```

**RLS:**

```sql
alter table public.profiles enable row level security;

-- Users read their own profile
create policy "profiles: user read own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users update their own profile
create policy "profiles: user update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins have full access
create policy "profiles: admin all"
  on public.profiles for all
  using (public.get_my_role() = 'admin');
```

---

### 2. trainers

Public-facing trainer profiles.

```sql
create table public.trainers (
  id              uuid primary key default gen_random_uuid(),
  first_name      text        not null,
  last_name       text        not null,
  bio             text,
  specialization  text[],
  photo_url       text,
  instagram_url   text,
  is_active       boolean     not null default true,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

**Indexes:**

```sql
create index trainers_is_active_idx on public.trainers(is_active);
create index trainers_sort_order_idx on public.trainers(sort_order);
```

**RLS:**

```sql
alter table public.trainers enable row level security;

-- Anyone can read active trainers
create policy "trainers: public read active"
  on public.trainers for select
  using (is_active = true);

-- Admins have full access
create policy "trainers: admin all"
  on public.trainers for all
  using (public.get_my_role() = 'admin');
```

---

### 3. classes

Defines the types of classes offered (Fly Yoga, Vinyasa, etc.).

```sql
create table public.classes (
  id           uuid primary key default gen_random_uuid(),
  name_ru      text        not null,
  name_ro      text        not null,
  name_en      text        not null,
  description_ru text,
  description_ro text,
  description_en text,
  duration_min integer     not null check (duration_min > 0),
  level        text        not null check (level in ('beginner', 'intermediate', 'advanced', 'all')),
  color        text,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

**Indexes:**

```sql
create index classes_is_active_idx on public.classes(is_active);
create index classes_level_idx on public.classes(level);
```

**RLS:**

```sql
alter table public.classes enable row level security;

-- Anyone can read active classes
create policy "classes: public read active"
  on public.classes for select
  using (is_active = true);

-- Admins have full access
create policy "classes: admin all"
  on public.classes for all
  using (public.get_my_role() = 'admin');
```

---

### 4. schedule

Individual class sessions: a specific class, at a specific time, with a specific trainer.

```sql
create table public.schedule (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid        not null references public.classes(id) on delete restrict,
  trainer_id      uuid        not null references public.trainers(id) on delete restrict,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  total_seats     integer     not null check (total_seats > 0),
  booked_seats    integer     not null default 0 check (booked_seats >= 0),
  location        text        not null default 'Fly Yoga Studio, Chisinau',
  notes           text,
  is_cancelled    boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint ends_after_starts check (ends_at > starts_at),
  constraint booked_not_exceed_total check (booked_seats <= total_seats)
);
```

**Indexes:**

```sql
create index schedule_starts_at_idx    on public.schedule(starts_at);
create index schedule_class_id_idx     on public.schedule(class_id);
create index schedule_trainer_id_idx   on public.schedule(trainer_id);
create index schedule_is_cancelled_idx on public.schedule(is_cancelled);
```

**RLS:**

```sql
alter table public.schedule enable row level security;

-- Anyone can read non-cancelled sessions
create policy "schedule: public read"
  on public.schedule for select
  using (is_cancelled = false);

-- Admins have full access
create policy "schedule: admin all"
  on public.schedule for all
  using (public.get_my_role() = 'admin');
```

---

### 5. bookings

Links a user to a schedule session.

```sql
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  schedule_id     uuid        not null references public.schedule(id) on delete cascade,
  status          text        not null default 'confirmed'
                              check (status in ('confirmed', 'cancelled', 'attended', 'no_show')),
  booked_at       timestamptz not null default now(),
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint one_booking_per_session unique (user_id, schedule_id)
);
```

**Trigger — keep `schedule.booked_seats` in sync:**

```sql
create or replace function public.update_booked_seats()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'confirmed' then
    update public.schedule
    set booked_seats = booked_seats + 1
    where id = NEW.schedule_id;

  elsif TG_OP = 'UPDATE' then
    -- cancelled: free up a seat
    if OLD.status = 'confirmed' and NEW.status = 'cancelled' then
      update public.schedule
      set booked_seats = booked_seats - 1
      where id = NEW.schedule_id;
    -- re-confirmed: take a seat
    elsif OLD.status = 'cancelled' and NEW.status = 'confirmed' then
      update public.schedule
      set booked_seats = booked_seats + 1
      where id = NEW.schedule_id;
    end if;

  elsif TG_OP = 'DELETE' and OLD.status = 'confirmed' then
    update public.schedule
    set booked_seats = booked_seats - 1
    where id = OLD.schedule_id;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create trigger sync_booked_seats
  after insert or update or delete on public.bookings
  for each row execute procedure public.update_booked_seats();
```

**Indexes:**

```sql
create index bookings_user_id_idx     on public.bookings(user_id);
create index bookings_schedule_id_idx on public.bookings(schedule_id);
create index bookings_status_idx      on public.bookings(status);
create index bookings_booked_at_idx   on public.bookings(booked_at desc);
```

**RLS:**

```sql
alter table public.bookings enable row level security;

-- Users read their own bookings
create policy "bookings: user read own"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Users create their own bookings
create policy "bookings: user insert own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users can cancel their own bookings (status update only)
create policy "bookings: user cancel own"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (status = 'cancelled');

-- Admins have full access
create policy "bookings: admin all"
  on public.bookings for all
  using (public.get_my_role() = 'admin');
```

---

### 6. subscription_plans

Defines the subscription products available for purchase (e.g., 4 classes/month, 8 classes/month, unlimited).

```sql
create table public.subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  name_ru       text        not null,
  name_ro       text        not null,
  name_en       text        not null,
  description_ru text,
  description_ro text,
  description_en text,
  price_mdl     numeric(10, 2) not null check (price_mdl >= 0),
  classes_count integer,       -- null means unlimited
  duration_days integer     not null check (duration_days > 0),
  is_active     boolean     not null default true,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

**Indexes:**

```sql
create index subscription_plans_is_active_idx on public.subscription_plans(is_active);
```

**RLS:**

```sql
alter table public.subscription_plans enable row level security;

-- Anyone can read active plans
create policy "subscription_plans: public read active"
  on public.subscription_plans for select
  using (is_active = true);

-- Admins have full access
create policy "subscription_plans: admin all"
  on public.subscription_plans for all
  using (public.get_my_role() = 'admin');
```

---

### 7. subscriptions

Tracks which plan a user is subscribed to and how many classes remain.

```sql
create table public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  plan_id         uuid        not null references public.subscription_plans(id) on delete restrict,
  status          text        not null default 'active'
                              check (status in ('active', 'expired', 'cancelled')),
  classes_left    integer,    -- null when plan is unlimited
  started_at      date        not null default current_date,
  expires_at      date        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

**Indexes:**

```sql
create index subscriptions_user_id_idx   on public.subscriptions(user_id);
create index subscriptions_status_idx    on public.subscriptions(status);
create index subscriptions_expires_at_idx on public.subscriptions(expires_at);
```

**RLS:**

```sql
alter table public.subscriptions enable row level security;

-- Users read their own subscriptions
create policy "subscriptions: user read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Admins have full access
create policy "subscriptions: admin all"
  on public.subscriptions for all
  using (public.get_my_role() = 'admin');
```

---

### 8. attendance

Records whether a user actually attended a booked class. Created by the admin after each session.

```sql
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid        not null references public.bookings(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  schedule_id uuid        not null references public.schedule(id) on delete cascade,
  attended    boolean     not null default false,
  marked_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),

  constraint attendance_booking_unique unique (booking_id)
);
```

**Indexes:**

```sql
create index attendance_user_id_idx     on public.attendance(user_id);
create index attendance_schedule_id_idx on public.attendance(schedule_id);
create index attendance_attended_idx    on public.attendance(attended);
```

**RLS:**

```sql
alter table public.attendance enable row level security;

-- Users can view their own attendance records
create policy "attendance: user read own"
  on public.attendance for select
  using (auth.uid() = user_id);

-- Admins have full access
create policy "attendance: admin all"
  on public.attendance for all
  using (public.get_my_role() = 'admin');
```

---

### 9. reviews

User testimonials displayed on the website.

```sql
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        references public.profiles(id) on delete set null,
  author_name text        not null,
  rating      integer     not null check (rating between 1 and 5),
  body        text        not null,
  is_visible  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

> Reviews are hidden by default (`is_visible = false`). An admin must approve each review before it appears on the site.

**Indexes:**

```sql
create index reviews_is_visible_idx on public.reviews(is_visible);
create index reviews_user_id_idx    on public.reviews(user_id);
create index reviews_created_at_idx on public.reviews(created_at desc);
```

**RLS:**

```sql
alter table public.reviews enable row level security;

-- Anyone can read approved reviews
create policy "reviews: public read visible"
  on public.reviews for select
  using (is_visible = true);

-- Authenticated users can submit a review
create policy "reviews: user insert"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- Admins have full access
create policy "reviews: admin all"
  on public.reviews for all
  using (public.get_my_role() = 'admin');
```

---

### 10. hall_rental_requests

Inquiry form submissions for renting the studio hall. No user account is required.

```sql
create table public.hall_rental_requests (
  id                uuid primary key default gen_random_uuid(),
  name              text        not null,
  phone             text        not null,
  email             text        not null,
  event_description text        not null,
  preferred_date    date        not null,
  status            text        not null default 'new'
                                check (status in ('new', 'contacted', 'confirmed', 'declined')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

**Indexes:**

```sql
create index hall_rental_status_idx      on public.hall_rental_requests(status);
create index hall_rental_preferred_date_idx on public.hall_rental_requests(preferred_date);
create index hall_rental_created_at_idx  on public.hall_rental_requests(created_at desc);
```

**RLS:**

```sql
alter table public.hall_rental_requests enable row level security;

-- Anyone can submit a request (no login required)
create policy "hall_rental: public insert"
  on public.hall_rental_requests for insert
  with check (true);

-- Only admins can read and manage requests
create policy "hall_rental: admin all"
  on public.hall_rental_requests for all
  using (public.get_my_role() = 'admin');
```

---

## Relationships Summary

| Table                  | Foreign Keys                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `profiles`             | `id` → `auth.users(id)`                                             |
| `schedule`             | `class_id` → `classes(id)`, `trainer_id` → `trainers(id)`          |
| `bookings`             | `user_id` → `profiles(id)`, `schedule_id` → `schedule(id)`         |
| `subscriptions`        | `user_id` → `profiles(id)`, `plan_id` → `subscription_plans(id)`   |
| `attendance`           | `booking_id` → `bookings(id)`, `user_id` → `profiles(id)`, `schedule_id` → `schedule(id)` |
| `reviews`              | `user_id` → `profiles(id)` (nullable)                               |
| `hall_rental_requests` | — (standalone)                                                       |

---

## RLS Policy Summary

| Table                  | Anon read | Auth read | Auth write         | Admin        |
| ---------------------- | :-------: | :-------: | :----------------: | :----------: |
| `profiles`             | —         | own row   | own row            | all          |
| `trainers`             | active    | active    | —                  | all          |
| `classes`              | active    | active    | —                  | all          |
| `schedule`             | active    | active    | —                  | all          |
| `bookings`             | —         | own rows  | insert + cancel    | all          |
| `subscription_plans`   | active    | active    | —                  | all          |
| `subscriptions`        | —         | own rows  | —                  | all          |
| `attendance`           | —         | own rows  | —                  | all          |
| `reviews`              | visible   | visible   | insert own         | all          |
| `hall_rental_requests` | —         | —         | insert (anon too)  | all          |

---

## Conventions

- All primary keys are `uuid` generated with `gen_random_uuid()`.
- All tables have `created_at` and, where relevant, `updated_at` with `default now()`.
- Soft-delete is used where appropriate (`is_active`, `is_cancelled`, `is_visible`) instead of physical deletion.
- Enum-like values use `text` columns with `CHECK` constraints rather than PostgreSQL `ENUM` types, making future migrations simpler.
- `updated_at` should be kept current via an `update_updated_at` trigger (one generic trigger function applied to all tables that have the column).

**Generic `updated_at` trigger:**

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply to every table that has updated_at:
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.trainers
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.classes
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.schedule
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.bookings
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.subscription_plans
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.reviews
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.hall_rental_requests
  for each row execute procedure public.set_updated_at();
```
