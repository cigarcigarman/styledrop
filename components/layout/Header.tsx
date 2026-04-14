import Link from 'next/link'

interface HeaderProps {
  title?: string
  right?: React.ReactNode
  showBack?: boolean
  backHref?: string
}

export function Header({ title, right, showBack, backHref = '/' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link href={backHref} className="text-[var(--text2)] hover:text-[var(--text)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : null}
          {title ? (
            <span className="text-base font-semibold text-[var(--text)]">{title}</span>
          ) : (
            <Link href="/" className="text-base font-bold tracking-tight text-[var(--text)]">
              StyleDrop
            </Link>
          )}
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}
