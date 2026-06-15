# Fly Yoga Studio — Session Handoff

> Временный файл для быстрого возобновления работы. Описывает состояние проекта,
> чтобы не перебирать весь код заново. Обновляй по ходу. Дата: 2026-06-14.

## Стек
Vite + React 19 + TypeScript (strict) + TailwindCSS v3 + shadcn-паттерн +
Supabase (Auth/DB/Storage) + i18next (RU по умолчанию, RO, EN).
Единственный бэкенд — Supabase, своего сервера нет.
`src/lib/supabase.ts` использует `createClient<any>` (обход бага типов).

---

## ✅ Что готово и работает

### Публичная часть
- **Главная** (`HomePage`) — 6 секций (hero, направления, преимущества, тренеры, отзывы, CTA)
- **Контакты** (`ContactPage`) — карта OpenStreetMap (координаты `47.0300758945097, 28.818675748781875`), часы работы с подсветкой «сегодня»
- **Шапка** (`Navbar`) — высота `h-20`, лого `h-16` (лотос + «Fly Yoga / STUDIO»), полное меню от `lg` (≥1024px), ниже — бургер. Без подрезок.
- **Лого** (`components/Logo.tsx`) — прозрачный PNG `public/logo.png`, проп `imgClassName` для размера, `showText`, `variant` dark/light
- Login / Register / Profile (с загрузкой аватара в Storage)

### Система 3 ролей (СДЕЛАНА В ЭТОЙ СЕССИИ) — роли `user` / `trainer` / `admin`
- **Клиент**: `SchedulePage` — запись/отмена на тренировки; `BookingsPage` — мои записи (предстоящие + история)
- **Тренер** (`/trainer`, `pages/trainer/TrainerSchedulePage.tsx`): создаёт тренировки (направление/дата/время/места/цена), видит записавшихся, отменяет. Видит только свои (через RLS).
- **Админ** (`/admin`, `AdminPage.tsx`): дашборд — клиенты, тренеры, тренировок сегодня, записей сегодня, **выручка за день и всего** (абонементы + разовые оплаты). `/admin/trainers` (`pages/admin/AdminTrainersPage.tsx`) — повышение `user` → `trainer`.
- `AuthContext` отдаёт `role / isAdmin / isTrainer / trainerId`
- Layout'ы: `TrainerLayout` (guard трейнер/админ), `AdminLayout` (guard админ, nav: Обзор + Тренеры)
- Утилиты `lib/utils.ts`: `formatDate / formatTime / formatMoney / toDateKey / isSameDay`

### База данных
- **`docs/setup.sql`** — ОДИН скрипт, создаёт всё с нуля: 9 таблиц, роли, триггеры, RLS, сид-данные (4 направления + 4 абонемента). Идемпотентный, можно перезапускать.
  - Особенности: `set check_function_bodies = off` (иначе ошибка про `profiles does not exist`), бэкфилл профилей для существующих `auth.users`, `trainers.profile_id` (связь тренер↔аккаунт), `schedule.price_mdl` (цена разового), хелперы `get_my_role()` / `get_my_trainer_id()`.
- Модель тренера: админ повышает → создаётся строка в `trainers` с `profile_id`. Демоут → `profile_id=null, is_active=false` (доступ тренера пропадает).
- Выручка: `subscriptions` × `subscription_plans.price_mdl` + оплаченные `bookings` × `schedule.price_mdl`.

---

## ⏳ Что должен сделать ПОЛЬЗОВАТЕЛЬ (вне кода)
1. **Запустить `docs/setup.sql`** в Supabase → SQL Editor → Run. (creds в `.env`, проект `ilafpwzerlfckyncquip`)
2. **Сделать себя админом** (аккаунт уже есть, бэкфилл создаст профиль):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'твой-email');
   ```
3. **Создать Storage bucket `avatars`** (Public) — для фото профиля.

> На момент хендоффа таблицы в БД ещё НЕ созданы (REST отдаёт 404). Поэтому в превью
> страницы показывают пустые состояния — это нормально, заработает после шага 1.

---

## 🔜 Что осталось построить (приоритет сверху вниз)
1. Заглушки-страницы: `TrainersPage`, `ServicesPage`, `GalleryPage`, `HallRentalPage` (сейчас просто заголовок)
2. Админ-управление: абонементы (оформить клиенту), отзывы (модерация), заявки на аренду зала — роуты убраны из nav, не построены
3. Карточки тренеров на публичной `TrainersPage` из таблицы `trainers`
4. Отметка посещаемости (`attendance`) тренером/админом

---

## Команды
```powershell
cd C:\Users\nervblyati\Desktop\FlyYogaStudio
npm run dev      # дев-сервер (порт из PORT env)
npm run build    # tsc -b && vite build — проверка типов
```
Превью обновляется автоматически при сохранении (HMR), перезагрузка не нужна.

## Заметки
- Превью на `/contact` иногда тормозит из-за iframe карты — скриншоты могут таймаутить.
- i18next: `fallbackLng: 'ru'`, ключи есть во всех 3 языках для новых страниц.
- Сборка проходит чисто на момент хендоффа.
