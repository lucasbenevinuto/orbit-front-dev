import { Link } from 'react-router-dom'
import { useDashboardStats } from '@/services/dashboard'
import { useProjects } from '@/services/projects'
import { useAuthStore } from '@/stores/auth-store'
import {
  FolderKanban,
  Mic,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: projectsData, isLoading } = useProjects(1)
  const { data: stats_data } = useDashboardStats()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const stats = [
    {
      label: 'Projetos',
      value: projectsData?.pagination.total ?? 0,
      icon: FolderKanban,
      gradient: 'from-slate-900 to-slate-700',
    },
    {
      label: 'Reuniões este mês',
      value: stats_data?.meetings_this_month ?? '—',
      icon: FileText,
      gradient: 'from-orange-500 to-amber-400',
    },
    {
      label: 'Horas transcritas',
      value: stats_data ? `${stats_data.transcribed_hours}h` : '—',
      icon: Clock,
      gradient: 'from-violet-600 to-purple-400',
    },
    {
      label: 'Decisões registradas',
      value: stats_data?.decisions_count ?? '—',
      icon: TrendingUp,
      gradient: 'from-emerald-600 to-green-400',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting()}, {user?.name?.split(' ')[0] || 'usuário'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está um resumo da sua atividade
        </p>
      </div>

      {/* Stats grid — dark gradient cards */}
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
            to="/upload"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Mic className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Upload de áudio</p>
              <p className="text-xs text-muted-foreground">
                Envie um arquivo para transcrição
              </p>
            </div>
          </Link>

          <Link
            to="/projects"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Novo projeto</p>
              <p className="text-xs text-muted-foreground">
                Organize suas reuniões
              </p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">Integrações</p>
              <p className="text-xs text-muted-foreground">
                Conecte Zoom, Meet e mais
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Projetos recentes
          </h2>
          <Link
            to="/projects"
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
        ) : projectsData?.data.length === 0 ? (
          <div className="rounded-2xl bg-card p-12 text-center shadow-card">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum projeto criado ainda
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro projeto
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectsData?.data.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: (project.color || '#3b82f6') + '15' }}
                >
                  {project.icon || '📁'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {project.description}
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
