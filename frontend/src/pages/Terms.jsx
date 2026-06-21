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

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Upshift, a personal finance and career planning
        application operated at <a href="https://money-five-ecru.vercel.app" className="text-accent hover:underline">money-five-ecru.vercel.app</a>.
        By creating an account or using Upshift, you agree to these Terms.
      </p>

      <h2>Description of service</h2>
      <p>
        Upshift helps you track debts, budgets, transactions, accounts, goals, and career progress.
        Features vary by plan (Free, Plus, and Pro). AI features use Google Gemini to generate insights and suggestions
        based on data you provide.
      </p>

      <h2>Not financial or legal advice</h2>
      <p>
        Upshift is an informational tool only. AI-generated insights, salary benchmarks, debt strategies,
        and career suggestions are estimates — not professional financial, tax, investment, or legal advice.
        Always consult qualified professionals before making major financial decisions.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must provide a valid email and keep your password secure.</li>
        <li>You are responsible for all activity under your account.</li>
        <li>You must be at least 18 years old to use Upshift.</li>
        <li>Do not share your account or use Upshift for unlawful purposes.</li>
      </ul>

      <h2>Subscriptions and billing</h2>
      <ul>
        <li><strong>Free plan</strong> — core tracking features at no cost.</li>
        <li><strong>Plus ($9/month)</strong> — AI insights, spending charts, recurring transactions, CSV export, and weekly summaries.</li>
        <li><strong>Pro ($15/month)</strong> — everything in Plus plus unlimited AI chat, Career Coach, what-if scenarios, anomaly alerts, and net worth predictions.</li>
        <li>Paid plans are billed through Stripe. Plus and Pro include a 7-day free trial when billing is enabled.</li>
        <li>You can cancel or change plans via the Stripe billing portal in Subscription settings.</li>
        <li>Prices are in USD. We may change pricing with reasonable notice; existing subscribers are notified before changes take effect.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to access other users&apos; data or bypass security controls.</li>
        <li>Reverse-engineer, scrape, or overload our systems or third-party integrations.</li>
        <li>Use Upshift to store or transmit malicious code or illegal content.</li>
        <li>Misrepresent AI-generated content as guaranteed financial outcomes.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        You retain ownership of the financial and profile data you enter. You grant us a limited license to store,
        process, and display that data solely to provide the service — including sending relevant context to
        Google Gemini for AI features. See our <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link> for details.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Upshift&apos;s name, design, code, and branding are our property. You may not copy or redistribute
        the application except as permitted by these Terms.
      </p>

      <h2>Termination</h2>
      <p>
        You may delete your data and stop using Upshift at any time from Settings.
        We may suspend or terminate accounts that violate these Terms or pose a security risk.
        Upon termination, your right to use Upshift ends; data deletion follows our Privacy Policy.
      </p>

      <h2>Disclaimers and limitation of liability</h2>
      <p>
        Upshift is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted service,
        accuracy of AI outputs, or specific financial results. To the fullest extent permitted by law,
        Upshift and its operators are not liable for indirect, incidental, or consequential damages arising
        from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms as the product changes. The &quot;Last updated&quot; date reflects the current version.
        Material changes may be communicated in-app or by email. Continued use after changes constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email <a href="mailto:support@upshift.app" className="text-accent hover:underline">support@upshift.app</a>.
      </p>
    </LegalLayout>
  )
}
