import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#6C63FF', '#00E5A0', '#FF4D6A', '#FFB020', '#4DA6FF', '#FF6B9D', '#8888AA']

export default function DonutChart({ data, size = 200 }) {
  if (!data?.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height: size }}
      >
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.3}
          outerRadius={size * 0.4}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#16161F',
            border: '1px solid #1E1E2E',
            borderRadius: '8px',
            color: '#F0F0F5',
          }}
          formatter={(value) => [`$${value.toLocaleString()}`, '']}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function CategoryLegend({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted">{item.name}</span>
          </div>
          <span className="font-medium">
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
