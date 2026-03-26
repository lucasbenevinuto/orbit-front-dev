import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Brain,
  MessageCircle,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/spaces', icon: FolderOpen, label: 'Espaços' },
  { to: '/spaces?action=create', icon: PlusCircle, label: 'Criar', isAdd: true },
  { to: '/study', icon: Brain, label: 'Estudar' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-[0_-1px_12px_rgb(0_0_0/0.06)] md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                item.isAdd
                  ? 'text-primary'
                  : isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground active:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                  item.isAdd
                    ? 'bg-primary/10'
                    : isActive && 'bg-foreground/10'
                )}>
                  <item.icon className={cn(
                    'h-[18px] w-[18px]',
                    item.isAdd ? 'h-6 w-6 stroke-[2]' : isActive && 'stroke-[2.5]'
                  )} />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
