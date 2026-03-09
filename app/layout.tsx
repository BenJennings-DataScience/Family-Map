import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Family Map',
  description: 'Keep your family connected',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased bg-slate-50 min-h-screen`}>
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="font-bold text-xl text-slate-800 hover:text-amber-600 transition-colors tracking-tight"
            >
              Family Map
            </Link>
            <div className="flex gap-1">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/map">Map</NavLink>
              <NavLink href="/photos">Photos</NavLink>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}
