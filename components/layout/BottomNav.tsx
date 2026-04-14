'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: '갤러리',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="3" width="7" height="7" rx="2"
          fill={active ? 'var(--accent)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
        <rect
          x="14" y="3" width="7" height="7" rx="2"
          fill={active ? 'var(--accent)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
        <rect
          x="3" y="14" width="7" height="7" rx="2"
          fill={active ? 'var(--accent)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
        <rect
          x="14" y="14" width="7" height="7" rx="2"
          fill={active ? 'var(--accent)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    href: '/studio',
    label: '만들기',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
        <line
          x1="12" y1="8" x2="12" y2="16"
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5" strokeLinecap="round"
        />
        <line
          x1="8" y1="12" x2="16" y2="12"
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/my',
    label: '내 계정',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5"
        />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? 'var(--accent)' : 'var(--text2)'}
          strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-[var(--surface)] border-t border-[var(--border)] z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const active = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-3"
            >
              {tab.icon(active)}
              <span
                className="text-[10px]"
                style={{ color: active ? 'var(--accent)' : 'var(--text2)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
