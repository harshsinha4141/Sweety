import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { requireGuest, safeRedirect } from '../lib/guards'
import { homeFor } from '../lib/roles'

export const Route = createFileRoute('/login')({
  validateSearch: (search) => ({ redirect: safeRedirect(search.redirect) }),
  beforeLoad: requireGuest,
  component: LoginPage,
})

// "Priya Sharma" → "Priya"; "Dr. Anil Kapoor" → "Dr. Anil" (keep a title with the name).
function firstName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'there'
  return /^(dr|doctor)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0]
}

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email'
  if (!password) errors.password = 'Enter your password'
  return errors
}

function LoginPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const user = await login(form.email.trim(), form.password)
      toast.success(`Welcome back, ${firstName(user.full_name)}!`)
      // A redirect into the other role's area is bounced home by that area's guard.
      router.history.push(redirect || homeFor(user.role))
    } catch (error) {
      toast.error(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to record today's readings and see your reports."
      footer={
        <>
          New to Sweety?{' '}
          <Link to="/register" className="font-semibold text-rose-600 hover:text-rose-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />
        <Button type="submit" size="lg" full loading={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
