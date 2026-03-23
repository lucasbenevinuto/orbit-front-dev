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
  draft: { label: 'Rascunho', icon: FileText, className: 'text-muted-foreground bg-muted' },
  processing: { label: 'Processando', icon: Clock, className: 'text-yellow-600 bg-yellow-500/10' },
  completed: { label: 'Concluída', icon: CheckCircle2, className: 'text-green-600 bg-green-500/10' },
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Link to="/projects" className="mt-4 text-primary hover:underline">
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
      <div className="flex items-start gap-4">
        <Link
          to="/projects"
          className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-lg"
              style={{ backgroundColor: (project.color || '#3b82f6') + '20' }}
            >
              {project.icon || '📁'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Reunião
        </button>
      </div>

      {/* Create meeting modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Nova Reunião</h2>
            <form onSubmit={handleSubmit(onCreateMeeting)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  {...register('title', { required: true })}
                  placeholder="Título da reunião"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  {...register('user_notes')}
                  placeholder="Notas opcionais"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); reset() }}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMeeting.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar reuniões..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Meetings list */}
      {meetingsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : filteredMeetings?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Nenhuma reunião encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings?.map((meeting) => {
            const status = statusConfig[meeting.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={meeting.id}
                to={`/projects/${projectId}/meetings/${meeting.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-card-foreground">
                    {meeting.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {new Date(meeting.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {meeting.tags && meeting.tags.length > 0 && (
                      <div className="flex gap-1">
                        {meeting.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
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
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {meetingsData.pagination.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meetingsData.pagination.total_pages, p + 1))}
            disabled={page === meetingsData.pagination.total_pages}
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
