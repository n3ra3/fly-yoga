# Деплой Fly Yoga Studio на Vercel

Стек: Vite + React (SPA). Хостинг: Vercel (бесплатно). Бэкенд: Supabase.

---

## 1. Залить код на GitHub

git уже инициализирован, первый коммит сделан. Осталось создать репозиторий и запушить.

```powershell
# Вариант А — через gh CLI (если установлен и залогинен):
gh repo create fly-yoga-studio --private --source=. --push

# Вариант Б — вручную:
# 1) Создай пустой репозиторий на github.com (без README)
# 2) Подключи и запушь:
git remote add origin https://github.com/ТВОЙ_ЛОГИН/fly-yoga-studio.git
git branch -M main
git push -u origin main
```

> `.env` НЕ попадёт в репозиторий (он в `.gitignore`) — ключи зададим в Vercel.

---

## 2. Подключить к Vercel

1. Зайди на **vercel.com** → войди через GitHub.
2. **Add New → Project** → выбери репозиторий `fly-yoga-studio`.
3. Vercel сам определит Vite (Build: `npm run build`, Output: `dist`). Менять не нужно.
4. Разверни **Environment Variables** и добавь две (значения возьми из своего `.env`):
   - `VITE_SUPABASE_URL` = `https://ilafpwzerlfckyncquip.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<твой anon-ключ>`
5. **Deploy**. Через ~1 минуту получишь ссылку вида `fly-yoga-studio.vercel.app`.

Дальше каждый `git push` в `main` будет автоматически пересобирать и обновлять сайт.

---

## 3. Прописать прод-URL в Supabase (важно для авторизации)

Иначе ссылки сброса пароля/подтверждения будут вести на localhost.

Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://fly-yoga-studio.vercel.app` (твой реальный адрес)
- **Redirect URLs**: добавь `https://fly-yoga-studio.vercel.app/**`

---

## 4. Keep-alive (чтобы Supabase не засыпал)

Бесплатный Supabase ставится на паузу после 7 дней без запросов.
В репозитории уже есть воркфлоу `.github/workflows/keepalive.yml` — он раз в день
пингует базу. Нужно добавить два секрета:

GitHub → репозиторий → **Settings → Secrets and variables → Actions → New repository secret**:
- `SUPABASE_URL` = `https://ilafpwzerlfckyncquip.supabase.co`
- `SUPABASE_ANON_KEY` = `<твой anon-ключ>`

Проверить: вкладка **Actions → Supabase keep-alive → Run workflow** — должен быть HTTP 200.

> Альтернатива без GitHub Action: бесплатный сервис cron-job.org / UptimeRobot,
> который раз в день дёргает `https://ilafpwzerlfckyncquip.supabase.co/rest/v1/classes?select=id&limit=1`
> с заголовком `apikey: <anon-ключ>`.

---

## Чек-лист перед запуском
- [ ] Таблицы созданы (`docs/setup.sql` выполнен в Supabase)
- [ ] Свой аккаунт сделан админом
- [ ] Bucket `avatars` (Public) создан
- [ ] Env-переменные заданы в Vercel
- [ ] Site URL / Redirect URLs прописаны в Supabase
- [ ] Секреты для keep-alive добавлены в GitHub

## Заметки
- Anon-ключ Supabase публичный по дизайну (он и так в бандле клиента) — попадание его
  в переменные/секреты безопасно. Защищают данные не ключом, а RLS-политиками.
- Скрытый минус GitHub Actions: cron отключается, если в репо 60 дней нет активности.
  Любой коммит/деплой сбрасывает этот счётчик.
