import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StyleDrop',
  description: '좋아하는 작가 화풍으로 AI 이미지 만들기',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StyleDrop',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex flex-col items-center bg-[var(--bg)]">
          <div className="w-full max-w-app flex flex-col min-h-screen relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
