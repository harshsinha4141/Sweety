import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChartColumn, Droplet, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../auth/useAuth'
import Logo from '../components/Logo'
import Button from '../components/ui/Button'
import { requireAuth } from '../lib/guards'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardPage,
})

// Placeholder until readings and reports are built.
function DashboardPage() {
  const { user, loadingUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await navigate({ to: '/' })
    logout()
    toast.info('You have been logged out.')
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {loadingUser ? (
          <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        ) : (
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Hi, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
        )}
        <p className="mt-2 text-slate-500">Your readings and reports will live here.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            { icon: Droplet, title: "Today's readings", text: 'Logging up to 4 readings a day is coming next.' },
            { icon: ChartColumn, title: 'Reports', text: 'Daily and monthly reports are on the way.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
