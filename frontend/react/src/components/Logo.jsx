import { Link } from '@tanstack/react-router'

export function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sweety-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sweety-logo)" />
      <path d="M16 6.5c3.6 4.6 6.5 8.3 6.5 11.7a6.5 6.5 0 0 1-13 0c0-3.4 2.9-7.1 6.5-11.7z" fill="#fff" />
      <path
        d="M12.5 19h2l1.2-2.4 1.6 4.4 1.2-2h1.9"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-500"
    >
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Sweety
      </span>
    </Link>
  )
}
