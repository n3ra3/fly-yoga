-- ============================================================
-- Fly Yoga Studio — полная установка базы данных
-- Запусти этот скрипт целиком в Supabase → SQL Editor → Run.
-- Создаёт все таблицы, роли (user/trainer/admin), триггеры,
-- RLS-политики и стартовые данные.
-- ============================================================

-- Функции get_my_role/get_my_trainer_id ссылаются на таблицы,
-- которые создаются ниже. Отключаем проверку тел функций при создании,
-- иначе Postgres ругается "relation does not exist".
set check_function_bodies = off;

-- ---------- Helper functions ----------

create or replace function public.get_my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_trainer_id()
returns uuid language sql stable security definer as $$
  select id from public.trainers where profile_id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text        not null default '',
  last_name   text        not null default '',
  phone       text,
  role        text        not null default 'user' check (role in ('user', 'trainer', 'admin')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Бэкфилл: создаём профили для пользователей, которые зарегистрировались
-- ДО появления таблицы profiles (триггер тогда не сработал).
insert into public.profiles (id, first_name, last_name, phone)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'first_name', ''),
  coalesce(u.raw_user_meta_data->>'last_name', ''),
  u.raw_user_meta_data->>'phone'
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "profiles: user read own" on public.profiles;
create policy "profiles: user read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: user update own" on public.profiles;
create policy "profiles: user update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all" on public.profiles
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 2. trainers   (profile_id связывает карточку тренера с аккаунтом)
-- ============================================================
create table if not exists public.trainers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid unique references public.profiles(id) on delete set null,
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

create index if not exists trainers_is_active_idx on public.trainers(is_active);
create index if not exists trainers_profile_id_idx on public.trainers(profile_id);

alter table public.trainers enable row level security;

drop policy if exists "trainers: public read active" on public.trainers;
create policy "trainers: public read active" on public.trainers
  for select using (is_active = true or public.get_my_role() = 'admin' or profile_id = auth.uid());

drop policy if exists "trainers: admin all" on public.trainers;
create policy "trainers: admin all" on public.trainers
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 3. classes
-- ============================================================
create table if not exists public.classes (
  id             uuid primary key default gen_random_uuid(),
  name_ru        text not null,
  name_ro        text not null,
  name_en        text not null,
  description_ru text,
  description_ro text,
  description_en text,
  duration_min   integer not null check (duration_min > 0),
  level          text not null check (level in ('beginner', 'intermediate', 'advanced', 'all')),
  color          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.classes enable row level security;

drop policy if exists "classes: public read active" on public.classes;
create policy "classes: public read active" on public.classes
  for select using (is_active = true or public.get_my_role() in ('admin', 'trainer'));

drop policy if exists "classes: admin all" on public.classes;
create policy "classes: admin all" on public.classes
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 4. schedule   (price_mdl — цена разового посещения этой тренировки)
-- ============================================================
create table if not exists public.schedule (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete restrict,
  trainer_id    uuid not null references public.trainers(id) on delete restrict,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  total_seats   integer not null check (total_seats > 0),
  booked_seats  integer not null default 0 check (booked_seats >= 0),
  price_mdl     numeric(10,2) not null default 0 check (price_mdl >= 0),
  location      text not null default 'Fly Yoga Studio, Chisinau',
  notes         text,
  is_cancelled  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint ends_after_starts check (ends_at > starts_at),
  constraint booked_not_exceed_total check (booked_seats <= total_seats)
);

create index if not exists schedule_starts_at_idx  on public.schedule(starts_at);
create index if not exists schedule_trainer_id_idx on public.schedule(trainer_id);

alter table public.schedule enable row level security;

drop policy if exists "schedule: public read" on public.schedule;
create policy "schedule: public read" on public.schedule
  for select using (is_cancelled = false or public.get_my_role() = 'admin' or trainer_id = public.get_my_trainer_id());

-- тренер управляет ТОЛЬКО своими тренировками
drop policy if exists "schedule: trainer manage own" on public.schedule;
create policy "schedule: trainer manage own" on public.schedule
  for all
  using (trainer_id = public.get_my_trainer_id())
  with check (trainer_id = public.get_my_trainer_id());

drop policy if exists "schedule: admin all" on public.schedule;
create policy "schedule: admin all" on public.schedule
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 5. bookings
-- ============================================================
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  schedule_id  uuid not null references public.schedule(id) on delete cascade,
  status       text not null default 'confirmed'
               check (status in ('confirmed', 'cancelled', 'attended', 'no_show')),
  booked_at    timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint one_booking_per_session unique (user_id, schedule_id)
);

create index if not exists bookings_user_id_idx     on public.bookings(user_id);
create index if not exists bookings_schedule_id_idx on public.bookings(schedule_id);

create or replace function public.update_booked_seats()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'confirmed' then
    update public.schedule set booked_seats = booked_seats + 1 where id = NEW.schedule_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.status = 'confirmed' and NEW.status = 'cancelled' then
      update public.schedule set booked_seats = greatest(booked_seats - 1, 0) where id = NEW.schedule_id;
    elsif OLD.status = 'cancelled' and NEW.status = 'confirmed' then
      update public.schedule set booked_seats = booked_seats + 1 where id = NEW.schedule_id;
    end if;
  elsif TG_OP = 'DELETE' and OLD.status = 'confirmed' then
    update public.schedule set booked_seats = greatest(booked_seats - 1, 0) where id = OLD.schedule_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists sync_booked_seats on public.bookings;
create trigger sync_booked_seats
  after insert or update or delete on public.bookings
  for each row execute procedure public.update_booked_seats();

alter table public.bookings enable row level security;

drop policy if exists "bookings: user read own" on public.bookings;
create policy "bookings: user read own" on public.bookings
  for select using (auth.uid() = user_id);

-- тренер видит записи на свои тренировки
drop policy if exists "bookings: trainer read own sessions" on public.bookings;
create policy "bookings: trainer read own sessions" on public.bookings
  for select using (
    schedule_id in (select id from public.schedule where trainer_id = public.get_my_trainer_id())
  );

drop policy if exists "bookings: user insert own" on public.bookings;
create policy "bookings: user insert own" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "bookings: user cancel own" on public.bookings;
create policy "bookings: user cancel own" on public.bookings
  for update using (auth.uid() = user_id);

drop policy if exists "bookings: admin all" on public.bookings;
create policy "bookings: admin all" on public.bookings
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 6. subscription_plans
-- ============================================================
create table if not exists public.subscription_plans (
  id             uuid primary key default gen_random_uuid(),
  name_ru        text not null,
  name_ro        text not null,
  name_en        text not null,
  description_ru text,
  description_ro text,
  description_en text,
  price_mdl      numeric(10,2) not null check (price_mdl >= 0),
  classes_count  integer,
  duration_days  integer not null check (duration_days > 0),
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

drop policy if exists "plans: public read active" on public.subscription_plans;
create policy "plans: public read active" on public.subscription_plans
  for select using (is_active = true or public.get_my_role() = 'admin');

drop policy if exists "plans: admin all" on public.subscription_plans;
create policy "plans: admin all" on public.subscription_plans
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 7. subscriptions
-- ============================================================
create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  plan_id      uuid not null references public.subscription_plans(id) on delete restrict,
  status       text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  classes_left integer,
  started_at   date not null default current_date,
  expires_at   date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_started_at_idx on public.subscriptions(started_at);

alter table public.subscriptions enable row level security;

drop policy if exists "subs: user read own" on public.subscriptions;
create policy "subs: user read own" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "subs: admin all" on public.subscriptions;
create policy "subs: admin all" on public.subscriptions
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 8. reviews
-- ============================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  body        text not null,
  is_visible  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews: public read visible" on public.reviews;
create policy "reviews: public read visible" on public.reviews
  for select using (is_visible = true or public.get_my_role() = 'admin');

drop policy if exists "reviews: user insert" on public.reviews;
create policy "reviews: user insert" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews: admin all" on public.reviews;
create policy "reviews: admin all" on public.reviews
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- 9. hall_rental_requests
-- ============================================================
create table if not exists public.hall_rental_requests (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text not null,
  email             text not null,
  event_description text not null,
  preferred_date    date not null,
  status            text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'declined')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.hall_rental_requests enable row level security;

drop policy if exists "hall: public insert" on public.hall_rental_requests;
create policy "hall: public insert" on public.hall_rental_requests
  for insert with check (true);

drop policy if exists "hall: admin all" on public.hall_rental_requests;
create policy "hall: admin all" on public.hall_rental_requests
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- updated_at triggers
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['profiles','trainers','classes','schedule','bookings',
                           'subscription_plans','subscriptions','reviews','hall_rental_requests']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute procedure public.set_updated_at()', t);
  end loop;
end $$;

-- ============================================================
-- Стартовые данные (классы и абонементы)
-- ============================================================
insert into public.classes (name_ru, name_ro, name_en, duration_min, level, color)
select * from (values
  ('Fly Yoga',        'Fly Yoga',        'Fly Yoga',        60, 'all',          '#7BA892'),
  ('Хатха-йога',      'Hatha Yoga',      'Hatha Yoga',      75, 'beginner',     '#A8C3B5'),
  ('Виньяса',         'Vinyasa',         'Vinyasa',         60, 'intermediate', '#6B9080'),
  ('Растяжка',        'Stretching',      'Stretching',      60, 'all',          '#C8D5C0')
) as v(name_ru, name_ro, name_en, duration_min, level, color)
where not exists (select 1 from public.classes);

insert into public.subscription_plans (name_ru, name_ro, name_en, price_mdl, classes_count, duration_days, sort_order)
select * from (values
  ('Разовое занятие', 'O lecție',     'Single class',  150.00, 1,    1,   0),
  ('4 занятия',       '4 lecții',     '4 classes',     500.00, 4,    30,  1),
  ('8 занятий',       '8 lecții',     '8 classes',     900.00, 8,    30,  2),
  ('Безлимит',        'Nelimitat',    'Unlimited',    1400.00, null, 30,  3)
) as v(name_ru, name_ro, name_en, price_mdl, classes_count, duration_days, sort_order)
where not exists (select 1 from public.subscription_plans);

-- ============================================================
-- ВАЖНО: сделай себя админом. Зарегистрируйся на сайте, потом запусти:
--   update public.profiles set role = 'admin' where id = (
--     select id from auth.users where email = 'ТВОЙ_EMAIL'
--   );
-- ============================================================
