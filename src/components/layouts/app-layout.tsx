import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

function MobileHeader() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="flex h-14 items-center justify-between bg-card px-5 shadow-card md:hidden">
      <h1 className="text-lg font-bold tracking-tight text-foreground">Orbit</h1>
      {user && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
        </div>
      )}
    </header>
  )
}

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-5 py-6 pb-24 md:px-6 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
