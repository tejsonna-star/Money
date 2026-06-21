import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#6C63FF', '#00B87A', '#FF4D6A', '#FFB020', '#4DA6FF', '#FF6B9D', '#8888AA']

function chartTooltipStyle() {
  const light = document.documentElement.getAttribute('data-theme') === 'light'
  return {
    background: light ? '#FFFFFF' : '#16161F',
    border: `1px solid ${light ? '#E2E2EE' : '#1E1E2E'}`,
    borderRadius: '8px',
    color: light ? '#0A0A0F' : '#F0F0F5',
  }
}

export default function DonutChart({ data, size = 200 }) {
  if (!data?.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height: size }}
      >
        No data yet — add transactions to see spending
      </div>
    )
  }

  const aggregated = aggregateChartData(data)

  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={aggregated}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.3}
          outerRadius={size * 0.4}
          paddingAngle={2}
          dataKey="value"
        >
          {aggregated.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chartTooltipStyle()}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function aggregateChartData(data) {
  const map = {}
  data.forEach(({ name, value }) => {
    map[name] = (map[name] || 0) + Number(value)
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

export function CategoryLegend({ data }) {
  const aggregated = aggregateChartData(data)
  const total = aggregated.reduce((s, d) => s + d.value, 0)
  return (
    <div className="space-y-2">
      {aggregated.map((item, i) => (
        <div key={item.name} className="flex items-center justify-between gap-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-muted">{item.name}</span>
          </div>
          <span className="shrink-0 font-medium">
            ${item.value.toLocaleString()}
            <span className="ml-1 text-muted">
              ({total ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function LineTrendChart({ data, dataKey = 'spending', color = '#6C63FF', height = 220 }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={chartTooltipStyle()}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MultiLineTrendChart({ data, height = 220 }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        No history yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={chartTooltipStyle()}
          formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === 'netWorth' ? 'Net worth' : name]}
        />
        <Line type="monotone" dataKey="netWorth" name="Net worth" stroke="#6C63FF" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export { COLORS }
