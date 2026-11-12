export default function SectionHeading({ eyebrow, title, text, align = 'center' }) {
  const centered = align === 'center'
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-slate-600 text-pretty">{text}</p>}
    </div>
  )
}
