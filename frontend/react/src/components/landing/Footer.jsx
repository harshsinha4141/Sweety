import Logo from '../Logo'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-slate-500">A simple blood glucose diary for patients and their doctors.</p>
          </div>
          <nav aria-label="Footer" className="flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#doctors" className="hover:text-slate-900">For doctors</a>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Sweety. All rights reserved.</p>
          <p className="max-w-lg sm:text-right">
            Sweety is a record-keeping tool, not a medical device, and does not give medical advice. Always follow your
            doctor's guidance.
          </p>
        </div>
      </div>
    </footer>
  )
}
