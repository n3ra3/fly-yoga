// Edge Function: telegram-bot
// Вебхук Telegram. Обрабатывает:
//  • кнопки под заявками (статус new/contacted/done) — меняет статус в базе;
//  • команду /clients — поиск клиента и присвоение абонемента.
// Доступ только из чата администратора (TELEGRAM_CHAT_ID).

const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const ADMIN = Deno.env.get('TELEGRAM_CHAT_ID') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TG_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''

const TG = `https://api.telegram.org/bot${TG_TOKEN}`

// deno-lint-ignore no-explicit-any
function tg(method: string, body: any) {
  return fetch(`${TG}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())
}

function sb(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}

const ok = () => new Response('ok', { status: 200 })

// deno-lint-ignore no-explicit-any
async function searchClients(q: string): Promise<any[]> {
  const clean = q.replace(/[(),]/g, ' ').trim()
  const enc = encodeURIComponent(`*${clean}*`)
  const orParts = [`first_name.ilike.${enc}`, `last_name.ilike.${enc}`, `phone.ilike.${enc}`]
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(clean)) orParts.push(`id.eq.${clean}`)
  const url = `profiles?role=eq.user&or=(${orParts.join(',')})&select=id,first_name,last_name,phone&limit=8`
  return await sb(url).then((r) => r.json())
}

// deno-lint-ignore no-explicit-any
async function showClientCard(chatId: number, messageId: number, userId: string) {
  const [c] = await sb(`profiles?id=eq.${userId}&select=first_name,last_name,phone`).then((r) => r.json())
  const [sub] = await sb(
    `subscriptions?user_id=eq.${userId}&status=eq.active&select=classes_left,expires_at,subscription_plans(name_ru)`,
  ).then((r) => r.json())
  const plans = await sb('subscription_plans?is_active=eq.true&order=sort_order&select=code,name_ru,price_mdl').then(
    (r) => r.json(),
  )

  let text = `👤 <b>${c?.first_name ?? ''} ${c?.last_name ?? ''}</b>\nТелефон: ${c?.phone ?? '—'}\n`
  if (sub) {
    text += `Абонемент: ${sub.subscription_plans?.name_ru ?? '—'}`
    if (sub.classes_left != null) text += ` (осталось ${sub.classes_left})`
    text += ` · до ${sub.expires_at}\n`
  } else {
    text += 'Абонемент: нет\n'
  }
  text += '\nВыберите абонемент для присвоения:'

  // deno-lint-ignore no-explicit-any
  const kb = plans.map((p: any) => [
    { text: `${p.name_ru} · ${p.price_mdl} MDL`, callback_data: `assign:${p.code}:${userId}` },
  ])
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: kb },
  })
}

async function assignPlan(chatId: number, messageId: number, code: string, userId: string) {
  const [plan] = await sb(
    `subscription_plans?code=eq.${code}&select=id,name_ru,duration_days,classes_count`,
  ).then((r) => r.json())
  if (!plan) return

  const started = new Date()
  const expires = new Date(started.getTime() + plan.duration_days * 86400000)
  // завершаем прошлый активный абонемент
  await sb(`subscriptions?user_id=eq.${userId}&status=eq.active`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'expired' }),
  })
  await sb('subscriptions', {
    method: 'POST',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      plan_id: plan.id,
      started_at: started.toISOString().slice(0, 10),
      expires_at: expires.toISOString().slice(0, 10),
      classes_left: plan.classes_count,
      status: 'active',
    }),
  })

  const [c] = await sb(`profiles?id=eq.${userId}&select=first_name,last_name`).then((r) => r.json())
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: `✅ <b>${c?.first_name ?? ''} ${c?.last_name ?? ''}</b>\nПрисвоен абонемент: <b>${plan.name_ru}</b> · до ${expires.toISOString().slice(0, 10)}`,
    parse_mode: 'HTML',
  })
}

Deno.serve(async (req) => {
  if (TG_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== TG_SECRET) {
    return new Response('forbidden', { status: 401 })
  }
  const update = await req.json().catch(() => null)
  if (!update) return ok()

  // ── обычные сообщения / команды ──
  if (update.message) {
    const msg = update.message
    if (ADMIN && String(msg.chat.id) !== ADMIN) return ok() // только админ
    const text = String(msg.text || '').trim()

    if (text.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: msg.chat.id,
        text: 'Бот Fly Yoga.\n\n/clients <имя, телефон или id> — найти клиента и присвоить абонемент.\nМожно просто отправить имя или телефон для поиска.',
      })
      return ok()
    }

    let query = ''
    if (text.startsWith('/clients')) query = text.replace('/clients', '').trim()
    else if (!text.startsWith('/')) query = text
    else return ok()

    if (!query) {
      await tg('sendMessage', { chat_id: msg.chat.id, text: 'Введите имя, телефон или id клиента:' })
      return ok()
    }

    const clients = await searchClients(query)
    if (!clients.length) {
      await tg('sendMessage', { chat_id: msg.chat.id, text: 'Никого не нашёл. Попробуйте другой запрос.' })
      return ok()
    }
    await tg('sendMessage', {
      chat_id: msg.chat.id,
      text: `Найдено: ${clients.length}. Выберите клиента:`,
      reply_markup: {
        inline_keyboard: clients.map((c) => [
          { text: `${c.first_name} ${c.last_name} · ${c.phone ?? '—'}`, callback_data: `client:${c.id}` },
        ]),
      },
    })
    return ok()
  }

  // ── нажатия кнопок ──
  if (update.callback_query) {
    const cq = update.callback_query
    const chatId = cq.message?.chat?.id
    if (ADMIN && String(chatId) !== ADMIN) {
      await tg('answerCallbackQuery', { callback_query_id: cq.id })
      return ok()
    }
    const parts = String(cq.data || '').split(':')
    const kind = parts[0]
    let toast = 'Готово'

    if (['new', 'contacted', 'done', 'declined'].includes(kind) && parts[1]) {
      // смена статуса заявки → сообщение перерисует триггер request-notify
      await sb(`individual_requests?id=eq.${parts[1]}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({ status: kind }),
      })
      toast = 'Статус обновлён'
    } else if (kind === 'client' && parts[1]) {
      await showClientCard(chatId, cq.message.message_id, parts[1])
      toast = ''
    } else if (kind === 'assign' && parts[1] && parts[2]) {
      await assignPlan(chatId, cq.message.message_id, parts[1], parts[2])
      toast = 'Абонемент присвоен'
    }

    await tg('answerCallbackQuery', { callback_query_id: cq.id, ...(toast ? { text: toast } : {}) })
    return ok()
  }

  return ok()
})
