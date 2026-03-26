import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFlashcardStats } from '@/services/flashcards'
import { useSpaces } from '@/services/spaces'
import { Brain, Flame, BookOpen, BarChart3 } from 'lucide-react'

export function StudyHomePage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useFlashcardStats()
  const { data: spacesData } = useSpaces(1)
  const [selectedScope, setSelectedScope] = useState<'all' | string>('all')

  const handleStartSession = () => {
    const params = new URLSearchParams()
    if (selectedScope !== 'all') {
      params.set('space_id', selectedScope)
    }
    navigate(`/study/session?${params.toString()}`)
  }

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Novos', value: stats?.new ?? 0, icon: Brain, color: 'text-teal-500 bg-teal-500/10' },
    { label: 'Aprendendo', value: stats?.learning ?? 0, icon: BarChart3, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Para hoje', value: stats?.due_today ?? 0, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Estudar</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Revise seus flashcards usando repetição espaçada
        </p>
      </div>

      {/* Streak */}
      {stats && stats.streak_days > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-4 text-white shadow-soft">
          <Flame className="h-8 w-8" />
          <div>
            <p className="text-lg font-bold">{stats.streak_days} dias de sequência!</p>
            <p className="text-sm text-white/80">Continue estudando para manter sua streak</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-card p-4 shadow-card sm:p-5">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scope picker */}
      <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Escopo de estudo</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary cursor-pointer transition-colors">
            <input
              type="radio"
              name="scope"
              value="all"
              checked={selectedScope === 'all'}
              onChange={() => setSelectedScope('all')}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">Todos os flashcards</span>
          </label>
          {spacesData?.data.map((space) => (
            <label
              key={space.id}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="scope"
                value={space.id}
                checked={selectedScope === space.id}
                onChange={() => setSelectedScope(space.id)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium">{space.icon || '📚'} {space.name}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleStartSession}
          disabled={!stats || stats.due_today === 0}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          <Brain className="h-5 w-5" />
          {stats?.due_today
            ? `Começar sessão (${stats.due_today} cards)`
            : 'Nenhum card para revisar'}
        </button>
      </div>
    </div>
  )
}
