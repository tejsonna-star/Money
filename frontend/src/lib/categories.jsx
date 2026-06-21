export const CATEGORY_META = {
  Rent: { color: '#6C63FF', icon: '🏠' },
  Food: { color: '#FF4D6A', icon: '🍔' },
  Transportation: { color: '#4DA6FF', icon: '🚗' },
  Subscriptions: { color: '#FFB020', icon: '📱' },
  Utilities: { color: '#8888AA', icon: '💡' },
  Insurance: { color: '#00B87A', icon: '🛡️' },
  Entertainment: { color: '#FF6B9D', icon: '🎬' },
  Other: { color: '#5C5C72', icon: '📦' },
  Salary: { color: '#00B87A', icon: '💰' },
  Freelance: { color: '#6C63FF', icon: '💼' },
  Bonus: { color: '#FFB020', icon: '🎁' },
  Investment: { color: '#4DA6FF', icon: '📈' },
  Household: { color: '#8888AA', icon: '🧹' },
}

export function getCategoryMeta(name) {
  return CATEGORY_META[name] || { color: '#6C63FF', icon: '🏷️' }
}

export function CategoryBadge({ category, size = 'sm' }) {
  const meta = getCategoryMeta(category)
  const cls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cls}`}
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
    >
      <span>{meta.icon}</span>
      {category}
    </span>
  )
}
