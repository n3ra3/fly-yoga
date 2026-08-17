// Edge Function: telegram-bot
// Вебхук Telegram. Приходит, когда в боте нажали кнопку под заявкой.
// Обновляет статус заявки в базе. Изменение статуса тянет за собой
// Database Webhook -> request-notify, который перерисует сообщение.

const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// секрет, который Telegram шлёт в заголовке (задаётся при setWebhook)
const TG_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''

const ALLOWED = ['new', 'contacted', 'done', 'declined']

Deno.serve(async (req) => {
  if (TG_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== TG_SECRET) {
    return new Response('forbidden', { status: 401 })
  }

  const update = await req.json().catch(() => null)
  const cq = update?.callback_query
  if (!cq) return new Response('ok', { status: 200 })

  const [action, id] = String(cq.data || '').split(':')

  if (ALLOWED.includes(action) && id) {
    await fetch(`${SUPABASE_URL}/rest/v1/individual_requests?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: action }),
    })
  }

  // убираем «часики» на кнопке
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ callback_query_id: cq.id, text: 'Обновлено ✅' }),
  })

  return new Response('ok', { status: 200 })
})
