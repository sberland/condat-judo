import { Link, Outlet } from '@tanstack/react-router'
import { EnvBanner } from './EnvBanner'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Judo Condat
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground">
        Judo Condat · v{__APP_VERSION__}
      </footer>

      <EnvBanner />
    </div>
  )
}
