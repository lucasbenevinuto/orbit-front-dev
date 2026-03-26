import { Link } from 'react-router-dom'
import { useKnowledgeDashboard } from '@/services/dashboard'
import { useFlashcardStats } from '@/services/flashcards'
import { useSpaces } from '@/services/spaces'
import { useAuthStore } from '@/stores/auth-store'
import {
  FolderOpen,
  Library,
  FileText,
  Brain,
  Plus,
  ArrowRight,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: dashStats } = useKnowledgeDashboard()
  const { data: flashcardStats } = useFlashcardStats()
  const { data: spacesData, isLoading } = useSpaces(1)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const stats = [
    {
      label: 'Espaços',
      value: dashStats?.total_spaces ?? 0,
      icon: FolderOpen,
      gradient: 'from-teal-600 to-emerald-400',
    },
    {
      label: 'Coleções',
      value: dashStats?.total_collections ?? 0,
      icon: Library,
      gradient: 'from-cyan-600 to-teal-400',
    },
    {
      label: 'Materiais prontos',
      value: dashStats?.materials_ready ?? 0,
      icon: FileText,
      gradient: 'from-violet-600 to-purple-400',
    },
    {
      label: 'Flashcards p/ hoje',
      value: flashcardStats?.due_today ?? dashStats?.flashcards_due_today ?? 0,
      icon: Brain,
      gradient: 'from-orange-500 to-amber-400',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting()}, {user?.name?.split(' ')[0] || 'usuário'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está um resumo da sua base de conhecimento
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-soft sm:p-5`}
          >
            <stat.icon className="absolute -right-2 -top-2 h-16 w-16 opacity-10 sm:h-20 sm:w-20" />
            <p className="text-xs font-medium text-white/70 sm:text-sm">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/spaces?action=create"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
              <Plus className="h-5 w-5 text-teal-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Novo espaço</p>
              <p className="text-xs text-muted-foreground">
                Organize seus materiais
              </p>
            </div>
          </Link>

          <Link
            to="/study"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <Brain className="h-5 w-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Estudar flashcards</p>
              <p className="text-xs text-muted-foreground">
                {flashcardStats?.due_today
                  ? `${flashcardStats.due_today} cards para revisar`
                  : 'Revise seus flashcards'}
              </p>
            </div>
          </Link>

          <Link
            to="/chat"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
              <MessageCircle className="h-5 w-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Chat com IA</p>
              <p className="text-xs text-muted-foreground">
                Converse sobre seus materiais
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent spaces */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Espaços recentes
          </h2>
          <Link
            to="/spaces"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-card shadow-card"
              />
            ))}
          </div>
        ) : spacesData?.data.length === 0 ? (
          <div className="rounded-2xl bg-card p-12 text-center shadow-card">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum espaço criado ainda
            </p>
            <Link
              to="/spaces?action=create"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro espaço
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {spacesData?.data.slice(0, 6).map((space) => (
              <Link
                key={space.id}
                to={`/spaces/${space.id}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: (space.color || '#14b8a6') + '15' }}
                >
                  {space.icon || '📚'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {space.name}
                  </p>
                  {space.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {space.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
