// Edge Function: request-notify
// Вызывается Database Webhook при INSERT/UPDATE в individual_requests.
// INSERT  -> отправляет в Telegram сообщение с кнопками, сохраняет message_id.
// UPDATE  -> редактирует уже отправленное сообщение (статус + кнопки).
// Так сайт и бот всегда показывают одинаковый статус.

const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TG_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// необязательный общий секрет с Database Webhook
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''

const SERVICE_LABEL: Record<string, string> = {
  trial: 'Пробное (группа)',
  group: 'Групповая',
  individual: 'Индивидуальная',
}
const STATUS_LABEL: Record<string, string> = {
  new: '🟡 Новая',
  contacted: '🔵 Звонили',
  done: '🟢 Готово',
  declined: '⚪️ Отклонена',
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// deno-lint-ignore no-explicit-any
function buildText(r: any) {
  const lines = [
    '📞 <b>Заявка на звонок</b>',
    '',
    `<b>Имя:</b> ${esc(r.name || '—')}`,
    `<b>Телефон:</b> ${esc(r.phone)}`,
    `<b>Интересует:</b> ${SERVICE_LABEL[r.service] || '—'}`,
  ]
  if (r.comment) lines.push(`<b>Комментарий:</b> ${esc(r.comment)}`)
  lines.push('', `<b>Статус:</b> ${STATUS_LABEL[r.status] || r.status}`)
  return lines.join('\n')
}

// deno-lint-ignore no-explicit-any
function buildKeyboard(r: any) {
  let row
  if (r.status === 'new') {
    row = [
      { text: '📞 Позвонил(а)', callback_data: `contacted:${r.id}` },
      { text: '✅ Готово', callback_data: `done:${r.id}` },
    ]
  } else if (r.status === 'contacted') {
    row = [
      { text: '✅ Готово', callback_data: `done:${r.id}` },
      { text: '↩️ В новые', callback_data: `new:${r.id}` },
    ]
  } else {
    row = [{ text: '↩️ В новые', callback_data: `new:${r.id}` }]
  }
  return { inline_keyboard: [row] }
}

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 401 })
  }

  const payload = await req.json().catch(() => null)
  const r = payload?.record
  const old = payload?.old_record
  const type = payload?.type
  if (!r) return new Response('no record', { status: 200 })

  // на UPDATE реагируем только если поменялся статус (иначе лишние правки и циклы)
  if (type === 'UPDATE' && old && old.status === r.status) {
    return new Response('no status change', { status: 200 })
  }

  const text = buildText(r)
  const reply_markup = buildKeyboard(r)

  if (!r.tg_message_id) {
    // новое сообщение
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', reply_markup }),
    })
    const data = await res.json()
    if (data.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/individual_requests?id=eq.${r.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_KEY,
          authorization: `Bearer ${SERVICE_KEY}`,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          tg_message_id: data.result.message_id,
          tg_chat_id: String(data.result.chat.id),
        }),
      })
    }
  } else {
    // редактируем существующее сообщение
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: r.tg_chat_id || TG_CHAT,
        message_id: r.tg_message_id,
        text,
        parse_mode: 'HTML',
        reply_markup,
      }),
    })
  }

  return new Response('ok', { status: 200 })
})
