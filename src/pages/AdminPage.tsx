import { useEffect, useMemo, useState } from 'react'
import { Users, UserPlus, Ticket, Wallet, TrendingUp, PhoneCall, Download, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── типы сырых данных ──
interface Sub {
  user_id: string
  started_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  subscription_plans: { name_ru: string; price_mdl: number } | null
}
interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
}
interface Req {
  status: string
  service: string | null
  created_at: string
}

const MONTHS_BACK = 6
const monthKey = (iso: string) => String(iso).slice(0, 7) // YYYY-MM
const nf = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n))

export function AdminPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [subs, setSubs] = useState<Sub[]>([])
  const [reqs, setReqs] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, s, r] = await Promise.all([
        supabase.from('profiles').select('id,first_name,last_name,phone,created_at').eq('role', 'user'),
        supabase
          .from('subscriptions')
          .select('user_id,started_at,expires_at,status,subscription_plans(name_ru,price_mdl)')
          .order('started_at', { ascending: false }),
        supabase.from('individual_requests').select('status,service,created_at'),
      ])
      setClients((c.data as unknown as Client[]) ?? [])
      setSubs((s.data as unknown as Sub[]) ?? [])
      setReqs((r.data as unknown as Req[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── производные показатели ──
  const data = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const priceOf = (x: Sub) => Number(x.subscription_plans?.price_mdl ?? 0)

    const revenueTotal = subs.reduce((a, s) => a + priceOf(s), 0)
    const revenueMonth = subs.filter((s) => monthKey(s.started_at) === thisMonth).reduce((a, s) => a + priceOf(s), 0)
    const activeSubs = subs.filter((s) => s.status === 'active').length
    const newClientsMonth = clients.filter((c) => monthKey(c.created_at) === thisMonth).length
    const requestsNew = reqs.filter((r) => r.status === 'new').length

    // помесячные ряды
    const months: { key: string; label: string }[] = []
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('ru-RU', { month: 'short' }),
      })
    }
    const revByMonth = new Map<string, number>()
    const subsByMonth = new Map<string, number>()
    const clientsByMonth = new Map<string, number>()
    subs.forEach((s) => {
      const k = monthKey(s.started_at)
      revByMonth.set(k, (revByMonth.get(k) ?? 0) + priceOf(s))
      subsByMonth.set(k, (subsByMonth.get(k) ?? 0) + 1)
    })
    clients.forEach((c) => {
      const k = monthKey(c.created_at)
      clientsByMonth.set(k, (clientsByMonth.get(k) ?? 0) + 1)
    })
    const monthly = months.map((m) => ({
      label: m.label,
      key: m.key,
      revenue: revByMonth.get(m.key) ?? 0,
      subs: subsByMonth.get(m.key) ?? 0,
      clients: clientsByMonth.get(m.key) ?? 0,
    }))

    // по типам абонементов
    const planMap = new Map<string, { count: number; revenue: number }>()
    subs.forEach((s) => {
      const name = s.subscription_plans?.name_ru ?? '—'
      const cur = planMap.get(name) ?? { count: 0, revenue: 0 }
      cur.count += 1
      cur.revenue += priceOf(s)
      planMap.set(name, cur)
    })
    const byPlan = [...planMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)

    return {
      revenueTotal,
      revenueMonth,
      activeSubs,
      newClientsMonth,
      requestsNew,
      monthly,
      byPlan,
    }
  }, [clients, subs, reqs])

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const byId = new Map(clients.map((c) => [c.id, c]))
    const wb = XLSX.utils.book_new()

    const summary = [
      ['Fly Yoga — отчёт'],
      ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
      [],
      ['Показатель', 'Значение'],
      ['Клиентов всего', clients.length],
      ['Новых клиентов за месяц', data.newClientsMonth],
      ['Активных абонементов', data.activeSubs],
      ['Оборот за месяц, MDL', data.revenueMonth],
      ['Оборот всего, MDL', data.revenueTotal],
      ['Новых заявок', data.requestsNew],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Сводка')

    const monthlyRows = [
      ['Месяц', 'Оборот, MDL', 'Абонементов продано', 'Новых клиентов'],
      ...data.monthly.map((m) => [m.key, m.revenue, m.subs, m.clients]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlyRows), 'По месяцам')

    const planRows = [
      ['Абонемент', 'Продано', 'Сумма, MDL'],
      ...data.byPlan.map((p) => [p.name, p.count, p.revenue]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(planRows), 'Абонементы')

    const salesRows = [
      ['Клиент', 'Телефон', 'Абонемент', 'Цена, MDL', 'Начало', 'Действует до', 'Статус'],
      ...subs.map((s) => {
        const c = byId.get(s.user_id)
        return [
          c ? `${c.first_name} ${c.last_name}` : '—',
          c?.phone ?? '',
          s.subscription_plans?.name_ru ?? '—',
          Number(s.subscription_plans?.price_mdl ?? 0),
          s.started_at,
          s.expires_at,
          s.status,
        ]
      }),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesRows), 'Продажи')

    const clientRows = [
      ['Имя', 'Телефон', 'Регистрация'],
      ...clients
        .slice()
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((c) => [`${c.first_name} ${c.last_name}`, c.phone ?? '', String(c.created_at).slice(0, 10)]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clientRows), 'Клиенты')

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `fly-yoga-отчёт-${today}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Обзор студии</h1>
          <p className="mt-1 text-sm text-muted-foreground">Клиенты, абонементы и оборот</p>
        </div>
        <button
          onClick={exportExcel}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download size={15} /> Экспорт в Excel
        </button>
      </div>

      {/* KPI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard Icon={Users} label="Клиентов всего" value={nf(clients.length)} />
        <StatCard Icon={UserPlus} label="Новых за месяц" value={nf(data.newClientsMonth)} />
        <StatCard Icon={Ticket} label="Активных абонементов" value={nf(data.activeSubs)} />
        <StatCard Icon={Wallet} label="Оборот за месяц" value={`${nf(data.revenueMonth)} MDL`} highlight />
        <StatCard Icon={TrendingUp} label="Оборот всего" value={`${nf(data.revenueTotal)} MDL`} />
        <StatCard Icon={PhoneCall} label="Новых заявок" value={nf(data.requestsNew)} />
      </div>

      {/* Графики: оборот и клиенты */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Оборот по месяцам, MDL">
          <BarChart data={data.monthly.map((m) => ({ label: m.label, value: m.revenue }))} fmt={nf} />
        </ChartCard>
        <ChartCard title="Новые клиенты по месяцам">
          <BarChart data={data.monthly.map((m) => ({ label: m.label, value: m.clients }))} />
        </ChartCard>
      </div>

      {/* Абонементы по типам */}
      <div className="mt-4">
        <ChartCard title="Абонементы по типам">
          {data.byPlan.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Пока нет проданных абонементов</p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {data.byPlan.map((p) => {
                const max = Math.max(1, ...data.byPlan.map((x) => x.revenue))
                return (
                  <div key={p.name}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">
                        {nf(p.count)} шт · {nf(p.revenue)} MDL
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(p.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Последние продажи */}
      <h2 className="mt-10 text-lg font-semibold">Последние абонементы</h2>
      {subs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Продаж пока нет</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {subs.slice(0, 10).map((s, i) => {
                const c = clients.find((x) => x.id === s.user_id)
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{c ? `${c.first_name} ${c.last_name}` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.subscription_plans?.name_ru ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{nf(Number(s.subscription_plans?.price_mdl ?? 0))} MDL</td>
                    <td className="px-4 py-3 text-right text-muted-foreground/70">{String(s.started_at).slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── графики ──
function BarChart({ data, fmt }: { data: { label: string; value: number }[]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div>
      <div className="flex items-end gap-2 pt-5" style={{ height: 180 }}>
        {data.map((d, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-[42px] rounded-t-md bg-primary/85 transition-all"
              style={{ height: max ? `${(d.value / max) * 100}%` : 0, minHeight: d.value ? 3 : 0 }}
            />
            {d.value > 0 && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] font-medium text-foreground/70">
                {fmt ? fmt(d.value) : d.value}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[11px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-2 text-sm font-semibold text-foreground/80">{title}</h3>
      {children}
    </div>
  )
}

function StatCard({
  Icon,
  label,
  value,
  highlight,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className={highlight ? 'rounded-2xl border border-primary/30 bg-primary/5 p-5' : 'rounded-2xl border border-border bg-card p-5'}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={16} className={highlight ? 'text-primary' : ''} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
