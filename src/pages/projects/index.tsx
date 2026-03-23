import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useProjects, useCreateProject, useDeleteProject } from '@/services/projects'
import type { ProjectCreate } from '@/types/api'
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'

export function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useProjects(page)
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const { register, handleSubmit, reset } = useForm<ProjectCreate>()

  const onCreateSubmit = async (formData: ProjectCreate) => {
    try {
      await createProject.mutateAsync(formData)
      toast.success('Projeto criado com sucesso!')
      setShowCreate(false)
      reset()
    } catch {
      toast.error('Erro ao criar projeto')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${name}"?`)) return
    try {
      await deleteProject.mutateAsync(id)
      toast.success('Projeto excluído')
    } catch {
      toast.error('Erro ao excluir projeto')
    }
  }

  const filteredProjects = data?.data.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
          <p className="mt-1 text-muted-foreground">
            Organize suas reuniões por projetos
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Projeto
        </button>
      </div>

      {/* Create project modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-foreground">
              Novo Projeto
            </h2>
            <form
              onSubmit={handleSubmit(onCreateSubmit)}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <input
                  {...register('name', { required: true })}
                  placeholder="Nome do projeto"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  {...register('description')}
                  placeholder="Descrição opcional"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <input
                  {...register('color')}
                  type="color"
                  defaultValue="#3b82f6"
                  className="h-10 w-20 cursor-pointer rounded-md border border-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    reset()
                  }}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createProject.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
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
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-muted"
            />
          ))}
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado ainda'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <Link to={`/projects/${project.id}`} className="block">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg"
                    style={{
                      backgroundColor: (project.color || '#3b82f6') + '20',
                    }}
                  >
                    {project.icon || '📁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-card-foreground">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Criado em{' '}
                    {new Date(project.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </Link>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(project.id, project.name)
                }}
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {data.pagination.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
            disabled={page === data.pagination.total_pages}
            className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
