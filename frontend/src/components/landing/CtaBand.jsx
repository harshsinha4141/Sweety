import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { buttonClasses } from '../ui/button-styles'

export default function CtaBand() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-rose-500 via-rose-600 to-pink-700 px-6 py-16 text-center shadow-2xl shadow-rose-900/20 sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-pink-300/25 blur-3xl" aria-hidden="true" />

          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
            Start your first reading today
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-rose-50/90 text-pretty">
            It takes a minute to sign up. Tomorrow you'll have your first daily report.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className={buttonClasses({ variant: 'light', size: 'lg' })}>
              Create free account
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </Link>
            <Link to="/login" className={buttonClasses({ variant: 'outlineLight', size: 'lg' })}>
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
