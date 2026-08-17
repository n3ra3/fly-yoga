# Telegram-бот для заявок — настройка

Бот получает новые заявки с сайта и позволяет менять их статус кнопками.
Связь двусторонняя: кнопка в боте меняет статус на сайте, а изменение статуса
на сайте перерисовывает сообщение в боте.

Всё настраивается через **дашборд Supabase** и **Telegram** — командная строка не нужна.
Код функций лежит в `supabase/functions/request-notify` и `supabase/functions/telegram-bot`.

Project ref: **ilafpwzerlfckyncquip**

---

## Шаг 0. Прогнать SQL

Прогони `docs/setup.sql` ещё раз — он добавит в заявки поля `tg_chat_id` и `tg_message_id`
(нужны для связи сообщения бота с заявкой).

---

## Шаг 1. Создать бота в Telegram

1. Открой в Telegram **@BotFather** → команда **/newbot** → задай имя и username.
2. BotFather пришлёт **токен** вида `123456789:AAExxxxxxxx`. Сохрани — это `TELEGRAM_BOT_TOKEN`.
3. Открой своего нового бота и нажми **Start** (иначе он не сможет тебе писать).
4. Узнай свой **chat_id**: напиши боту **@userinfobot** — он пришлёт твой числовой ID.
   Это `TELEGRAM_CHAT_ID`.

> Хочешь, чтобы заявки видели несколько человек? Создай группу, добавь туда бота,
> и возьми chat_id группы (обычно с минусом, напр. `-1001234567890`).

---

## Шаг 2. Придумать два секрета

Просто придумай две случайные строки (например, набери по 20 случайных символов):
- `WEBHOOK_SECRET` — общий секрет для вебхука базы
- `TELEGRAM_WEBHOOK_SECRET` — секрет для вебхука Telegram

---

## Шаг 3. Задеплоить две функции

Supabase → **Edge Functions** → **Create a new function**.

1. Функция **`request-notify`**:
   - Вставь код из `supabase/functions/request-notify/index.ts`
   - **Выключи** «Verify JWT» (Enforce JWT verification) — её вызывает база, не пользователь
   - Deploy
2. Функция **`telegram-bot`**:
   - Вставь код из `supabase/functions/telegram-bot/index.ts`
   - **Выключи** «Verify JWT» — её вызывает Telegram
   - Deploy

URL функций получатся такие:
- `https://ilafpwzerlfckyncquip.supabase.co/functions/v1/request-notify`
- `https://ilafpwzerlfckyncquip.supabase.co/functions/v1/telegram-bot`

---

## Шаг 4. Задать секреты функций

Edge Functions → **Secrets** (Manage secrets) → добавь:

| Имя | Значение |
|-----|----------|
| `TELEGRAM_BOT_TOKEN` | токен из BotFather |
| `TELEGRAM_CHAT_ID` | твой chat_id |
| `WEBHOOK_SECRET` | секрет из шага 2 |
| `TELEGRAM_WEBHOOK_SECRET` | второй секрет из шага 2 |

> `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` уже доступны функциям автоматически — их добавлять не нужно.

---

## Шаг 5. Подключить бота к функции (Telegram webhook)

Открой в браузере такую ссылку (подставь свой токен и второй секрет):

```
https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://ilafpwzerlfckyncquip.supabase.co/functions/v1/telegram-bot&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Должно ответить `{"ok":true,...}`. Теперь нажатия кнопок в боте будут долетать до функции.

---

## Шаг 6. Настроить вебхуки базы (Database Webhooks)

Supabase → **Database → Webhooks** → **Create a new hook**. Сделай **два** хука:

**Хук 1 — новые заявки:**
- Table: `individual_requests`
- Events: **Insert**
- Type: **HTTP Request** → POST
- URL: `https://ilafpwzerlfckyncquip.supabase.co/functions/v1/request-notify`
- HTTP Headers: добавь `x-webhook-secret` = `WEBHOOK_SECRET` (из шага 2)

**Хук 2 — изменение статуса:**
- То же самое, но Events: **Update** (URL и заголовок те же)

---

## Шаг 7. Проверить

1. Зайди на сайт → «Записаться» → оставь тестовую заявку.
2. В Telegram придёт сообщение с именем, телефоном, «что интересует» и кнопками.
3. Нажми **«Позвонил(а)»** — статус в сообщении сменится, и в админке сайта
   (вкладка «Заявки») он тоже станет «Звонили».
4. Поменяй статус в админке сайта — сообщение в боте обновится.

Если что-то не приходит — смотри Edge Functions → выбранная функция → **Logs**,
там будет ошибка.

---

## Как это устроено (кратко)
- Новая заявка → Database Webhook (Insert) → `request-notify` шлёт сообщение с кнопками,
  запоминает `tg_message_id`.
- Кнопка в боте → `telegram-bot` меняет `status` в базе.
- Любое изменение статуса → Database Webhook (Update) → `request-notify` редактирует
  то же сообщение. Поэтому сайт и бот всегда синхронны.
