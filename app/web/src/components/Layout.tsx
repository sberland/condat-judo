import { Outlet } from '@tanstack/react-router'
import { EnvBanner } from './EnvBanner'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <EnvBanner />
    </div>
  )
}
