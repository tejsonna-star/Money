import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card, Input, Select } from '../../components/UI'
import {
  getSession, getProfile, formatCurrency, monthlyIncome, updateProfile,
} from '../../lib/supabase'
import { CURRENCIES, getCurrencyMeta } from '../../lib/constants'
import { toastSuccess, toastError } from '../../lib/toast'

const CAREER_GOALS = [
  'Get a raise',
  'Switch jobs',
  'Pay off debt',
  'Build savings',
  'Start a business',
]

export default function Profile() {
  const [userId, setUserId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [salary, setSalary] = useState('')
  const [payFrequency, setPayFrequency] = useState('annual')
  const [careerGoal, setCareerGoal] = useState('Pay off debt')
  const [jobTitle, setJobTitle] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [city, setCity] = useState('')
  const [savings, setSavings] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [avatarUrl, setAvatarUrl] = useState('')

  const currencyMeta = getCurrencyMeta(currency)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      const profile = await getProfile(session.user.id)
      if (profile) {
        setSalary(profile.salary ? String(profile.salary) : '')
        setPayFrequency(profile.pay_frequency || 'annual')
        setCareerGoal(profile.career_goal || 'Pay off debt')
        setJobTitle(profile.job_title || '')
        setYearsExp(profile.years_experience ? String(profile.years_experience) : '')
        setCity(profile.city || '')
        setSavings(profile.savings ? String(profile.savings) : '')
        setCurrency(profile.currency || 'USD')
        setAvatarUrl(profile.avatar_url || '')
      }
    }
    load()
  }, [])

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateProfile(userId, {
        salary: Number(salary) || 0,
        pay_frequency: payFrequency,
        career_goal: careerGoal,
        job_title: jobTitle,
        years_experience: Number(yearsExp) || 0,
        city,
        savings: Number(savings) || 0,
        currency,
        avatar_url: avatarUrl || null,
      })
      setMessage('Profile saved.')
      toastSuccess('Profile saved')
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Profile" subtitle="Your salary, goals, and currency preferences">
      {message && (
        <div className="mb-6 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card className="max-w-2xl">
        <h3 className="font-heading text-lg font-semibold">Your profile</h3>
        <p className="mt-1 text-sm text-muted">Changes here update your dashboard and AI advice.</p>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <Input
            label={`Salary (${currencyMeta.symbol})`}
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="75000"
          />
          <Select label="Pay frequency" value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)}>
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="weekly">Weekly</option>
          </Select>
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
            ))}
          </Select>
          <Select label="Career goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)}>
            {CAREER_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Years of experience" type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin, TX" />
          </div>
          <Input label={`Current savings (${currencyMeta.symbol})`} type="number" value={savings} onChange={(e) => setSavings(e.target.value)} />
          <Input label="Profile picture URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          <p className="text-xs text-muted">
            Estimated monthly income: {formatCurrency(monthlyIncome(Number(salary), payFrequency), currency)}
          </p>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
        </form>
      </Card>
    </DashboardLayout>
  )
}
