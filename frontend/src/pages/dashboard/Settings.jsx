import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card } from '../../components/UI'
import ThemeToggle from '../../components/ThemeToggle'
import {
  getSession, getProfile, updateProfile, deleteUserData,
  getAccounts, getTransactions, getGoals, getDebts,
} from '../../lib/supabase'
import { exportUserDataJson, exportTransactionsCsv } from '../../lib/financeUtils'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Settings() {
  const [userId, setUserId] = useState(null)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      const profile = await getProfile(session.user.id)
      if (profile) {
        setBudgetAlerts(profile.notification_prefs?.budget_alerts !== false)
        setWeeklySummary(profile.notification_prefs?.weekly_summary !== false)
      }
    }
    load()
  }, [])

  async function saveNotifications(nextBudget, nextWeekly) {
    if (!userId) return
    setSaving(true)
    try {
      await updateProfile(userId, {
        notification_prefs: { budget_alerts: nextBudget, weekly_summary: nextWeekly },
      })
      toastSuccess('Preferences saved')
    } catch (err) {
      toastError(err.message || 'Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Settings" subtitle="Appearance, notifications, and data">
      <div className="grid max-w-2xl gap-6">
        <Card>
          <h3 className="font-heading text-lg font-semibold">Appearance</h3>
          <p className="mt-1 text-sm text-muted">Dark or light mode</p>
          <div className="mt-4"><ThemeToggle variant="pill" /></div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Notifications</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={budgetAlerts}
                onChange={(e) => {
                  setBudgetAlerts(e.target.checked)
                  saveNotifications(e.target.checked, weeklySummary)
                }}
                disabled={saving}
              />
              Budget over-limit alerts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => {
                  setWeeklySummary(e.target.checked)
                  saveNotifications(budgetAlerts, e.target.checked)
                }}
                disabled={saving}
              />
              Weekly summary on dashboard
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Data export</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={async () => {
              if (!userId) return
              const data = {
                profile: await getProfile(userId),
                accounts: await getAccounts(userId),
                transactions: await getTransactions(userId),
                goals: await getGoals(userId),
                debts: await getDebts(userId),
              }
              const blob = new Blob([exportUserDataJson(data)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'upshift-export.json'
              a.click()
              toastSuccess('JSON exported')
            }}>Export JSON</Button>
            <Button variant="secondary" size="sm" onClick={async () => {
              if (!userId) return
              const tx = await getTransactions(userId)
              const blob = new Blob([exportTransactionsCsv(tx)], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'upshift-transactions.csv'
              a.click()
              toastSuccess('CSV exported')
            }}>Export CSV</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-danger">Delete account</h3>
          <p className="mt-1 text-sm text-muted">Permanently delete your data.</p>
          <Button variant="danger" className="mt-4" onClick={async () => {
            if (!userId || !window.confirm('Delete all your data? This cannot be undone.')) return
            try {
              await deleteUserData(userId)
              toastSuccess('Account data deleted')
              window.location.href = '/'
            } catch (err) {
              toastError(err.message)
            }
          }}>Delete my data</Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
