import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useProject } from '@/services/projects'
import { useMeetings, useCreateMeeting } from '@/services/meetings'
import type { MeetingCreate, MeetingStatus } from '@/types/api'
import {
  ArrowLeft,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react'

const statusConfig: Record<MeetingStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  draft: { label: 'Rascunho', icon: FileText, className: 'text-muted-foreground bg-secondary' },
  processing: { label: 'Processando', icon: Clock, className: 'text-amber-600 bg-amber-500/10' },
  completed: { label: 'Concluída', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
  failed: { label: 'Falhou', icon: AlertCircle, className: 'text-destructive bg-destructive/10' },
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings(projectId!, page)
  const createMeeting = useCreateMeeting(projectId!)

  const { register, handleSubmit, reset } = useForm<MeetingCreate>()

  const onCreateMeeting = async (data: MeetingCreate) => {
    try {
      await createMeeting.mutateAsync(data)
      toast.success('Reunião criada!')
      setShowCreate(false)
      reset()
    } catch {
      toast.error('Erro ao criar reunião')
    }
  }

  if (projectLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Link to="/projects" className="mt-4 text-foreground font-medium hover:underline">
          Voltar para projetos
        </Link>
      </div>
    )
  }

  const filteredMeetings = meetingsData?.data.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Link
            to="/projects"
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: (project.color || '#3b82f6') + '15' }}
              >
                {project.icon || '📁'}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{project.name}</h1>
                {project.description && (
                  <p className="truncate text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova Reunião
        </button>
      </div>

      {/* Create meeting modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card p-6 shadow-lg sm:max-w-md sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-card-foreground">Nova Reunião</h2>
            <form onSubmit={handleSubmit(onCreateMeeting)} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  {...register('title', { required: true })}
                  placeholder="Título da reunião"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  {...register('user_notes')}
                  placeholder="Notas opcionais"
                  rows={3}
                  className="flex w-full rounded-xl border-0 bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); reset() }}
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMeeting.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {createMeeting.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar reuniões..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-full border-0 bg-card pl-10 pr-4 py-2 text-sm shadow-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Meetings list */}
      {meetingsLoading ? (
        <div className="space-y-3 max-w-xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : filteredMeetings?.length === 0 ? (
        <div className="max-w-xl rounded-2xl bg-card p-12 text-center shadow-card">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma reunião encontrada</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-xl">
          {filteredMeetings?.map((meeting) => {
            const status = statusConfig[meeting.status]
            const date = new Date(meeting.created_at)
            const day = date.getDate().toString().padStart(2, '0')
            const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
            return (
              <Link
                key={meeting.id}
                to={`/projects/${projectId}/meetings/${meeting.id}`}
                className="flex items-center gap-3.5 rounded-2xl bg-card p-3 shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* Date block */}
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary">
                  <span className="text-base font-bold leading-none text-foreground">{day}</span>
                  <span className="mt-0.5 text-[10px] font-medium uppercase leading-none text-muted-foreground">{month}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      meeting.status === 'completed' ? 'bg-emerald-500' :
                      meeting.status === 'processing' ? 'bg-amber-500 animate-pulse' :
                      meeting.status === 'failed' ? 'bg-red-500' :
                      'bg-muted-foreground/30'
                    }`} />
                    <h3 className="truncate text-sm font-semibold text-card-foreground">
                      {meeting.title}
                    </h3>
                  </div>
                  {meeting.summary ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {meeting.summary}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {status.label}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {meeting.tags && meeting.tags.length > 0 && (
                  <div className="hidden shrink-0 gap-1 sm:flex">
                    {meeting.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meetingsData && meetingsData.pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-3 text-sm text-muted-foreground">
            {page} / {meetingsData.pagination.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meetingsData.pagination.total_pages, p + 1))}
            disabled={page === meetingsData.pagination.total_pages}
            className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
