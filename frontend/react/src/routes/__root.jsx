import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import Logo from '../components/Logo'
import { buttonClasses } from '../components/ui/button-styles'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-8 sm:px-6">
      <Logo />
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">404</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className={buttonClasses({ className: 'mt-8' })}>
          Back to home
        </Link>
      </div>
    </div>
  )
}
