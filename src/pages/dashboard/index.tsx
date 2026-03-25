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
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Reuniões este mês',
      value: stats_data?.meetings_this_month ?? '—',
      icon: FileText,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: 'Horas transcritas',
      value: stats_data ? `${stats_data.transcribed_hours}h` : '—',
      icon: Clock,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      label: 'Decisões registradas',
      value: stats_data?.decisions_count ?? '—',
      icon: TrendingUp,
      color: 'text-orange-500 bg-orange-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(' ')[0] || 'usuário'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo da sua atividade
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-md p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Ações rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/upload"
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-md bg-primary/10 p-3">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-card-foreground">
                Upload de áudio
              </p>
              <p className="text-sm text-muted-foreground">
                Envie um arquivo de áudio para transcrição
              </p>
            </div>
          </Link>

          <Link
            to="/projects"
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-md bg-green-500/10 p-3">
              <Plus className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-card-foreground">Novo projeto</p>
              <p className="text-sm text-muted-foreground">
                Crie um projeto para organizar reuniões
              </p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-md bg-purple-500/10 p-3">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-card-foreground">Integrações</p>
              <p className="text-sm text-muted-foreground">
                Conecte Zoom, Google Meet e mais
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Projetos recentes
          </h2>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>
        ) : projectsData?.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum projeto criado ainda
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro projeto
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsData?.data.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md text-lg"
                    style={{ backgroundColor: (project.color || '#3b82f6') + '20' }}
                  >
                    {project.icon || '📁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-card-foreground">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
