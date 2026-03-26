import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useSpaces, useCreateSpace } from '@/services/spaces'
import { Plus, FolderOpen, Loader2 } from 'lucide-react'

export function SpacesPage() {
  const { data: spacesData, isLoading } = useSpaces(1)
  const createSpace = useCreateSpace()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createSpace.mutateAsync({ name: newName, description: newDescription || undefined })
      toast.success('Espaço criado!')
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
    } catch {
      toast.error('Erro ao criar espaço')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Espaços</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Organize seus materiais de estudo por tema
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo espaço</span>
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">Criar espaço</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Biologia Molecular"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Uma breve descrição"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSpace.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {createSpace.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spaces grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : spacesData?.data.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-card">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum espaço criado ainda
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro espaço
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spacesData?.data.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="group rounded-2xl bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: (space.color || '#14b8a6') + '15' }}
                >
                  {space.icon || '📚'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {space.name}
                  </p>
                  {space.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {space.description}
                    </p>
                  )}
                </div>
              </div>
              {space.summary && (
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  {space.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
