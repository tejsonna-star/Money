import { Link } from 'react-router-dom'
import { Logo } from '../components/UI'
import { ThemeToggleBar } from '../components/ThemeToggle'

function LegalLayout({ title, children }) {
  return (
    <div className="relative min-h-screen bg-bg">
      <ThemeToggleBar />
      <header className="border-b border-border px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="text-sm text-muted hover:text-text">Back to home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 21, 2026</p>
        <article className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-text/90 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </article>
        <footer className="mt-16 border-t border-border pt-8 text-sm text-muted">
          <Link to="/terms" className="hover:text-text">Terms of Service</Link>
          {' · '}
          <Link to="/privacy" className="hover:text-text">Privacy Policy</Link>
          {' · '}
          <a href="mailto:support@upshift.app" className="hover:text-text">support@upshift.app</a>
        </footer>
      </main>
    </div>
  )
}

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Upshift (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Upshift personal finance web application
        at <a href="https://money-five-ecru.vercel.app" className="text-accent hover:underline">money-five-ecru.vercel.app</a>.
        This Privacy Policy explains how we collect, use, and protect your information when you use our service.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address and password (stored and authenticated by Supabase Auth).</li>
        <li><strong>Profile data:</strong> salary, pay frequency, career goals, job title, years of experience, city, savings, currency preference, avatar URL, and notification preferences.</li>
        <li><strong>Financial data you enter:</strong> debts, expenses, transactions (including recurring rules), bank-style accounts, savings goals, budget limits, net worth snapshots, and side income records.</li>
        <li><strong>Usage data:</strong> financial health score, activity streaks, badges, onboarding checklist progress, and in-app settings such as theme preference (stored locally in your browser).</li>
        <li><strong>Billing data:</strong> Stripe customer ID, subscription status, and plan tier. Payment card details are collected and processed directly by Stripe — we do not store full card numbers.</li>
        <li><strong>AI interactions:</strong> prompts you send and financial context needed to generate insights or chat replies are sent to Google Gemini for processing.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>Provide budgeting, debt tracking, goals, accounts, and career planning features.</li>
        <li>Generate AI-powered insights, reports, and chat responses tailored to your data.</li>
        <li>Process subscriptions and manage billing through Stripe.</li>
        <li>Send budget alerts and weekly summaries when you enable those notifications.</li>
        <li>Improve reliability, security, and product experience.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>We use trusted providers to run Upshift. Each receives only the data needed for their function:</p>
      <ul>
        <li><strong>Supabase</strong> — PostgreSQL database, authentication, and row-level security for your data.</li>
        <li><strong>Vercel</strong> — hosting for the Upshift frontend and serverless API routes.</li>
        <li><strong>Stripe</strong> — subscription checkout, billing portal, and payment processing.</li>
        <li><strong>Google Gemini</strong> — AI insights, chat, career coaching, and financial reports.</li>
        <li><strong>Google Fonts</strong> — Inter and Syne typefaces loaded from Google&apos;s CDN.</li>
      </ul>

      <h2>Data storage and security</h2>
      <p>
        Your data is stored in Supabase (PostgreSQL) with row-level security so each user can only access their own records.
        Connections use HTTPS. API routes on Vercel validate your session before reading or writing data.
        No system is 100% secure, but we follow industry-standard practices to protect your information.
      </p>

      <h2>Data export and deletion</h2>
      <p>
        You can export your data as JSON from Settings at any time. Plus subscribers can also export transactions as CSV.
        You can delete your profile and associated financial data from Settings. Deleting data signs you out;
        contact us if you also need your Supabase Auth account removed.
      </p>

      <h2>Retention</h2>
      <p>
        We retain your data while your account is active. If you delete your data or close your account,
        we remove your profile and related records from our database. Stripe may retain billing records as required by law.
      </p>

      <h2>Children</h2>
      <p>
        Upshift is not intended for users under 18. We do not knowingly collect personal information from children.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as Upshift evolves. Material changes will be reflected by updating the date above.
        Continued use after changes means you accept the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email <a href="mailto:support@upshift.app" className="text-accent hover:underline">support@upshift.app</a>.
      </p>
    </LegalLayout>
  )
}
