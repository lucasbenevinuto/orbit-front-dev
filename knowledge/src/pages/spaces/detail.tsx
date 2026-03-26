import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useSpace } from '@/services/spaces'
import { useCollections, useCreateCollection } from '@/services/collections'
import {
  ArrowLeft,
  Plus,
  Library,
  Loader2,
  FileText,
} from 'lucide-react'

export function SpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const { data: space, isLoading: spaceLoading } = useSpace(spaceId)
  const { data: collectionsData, isLoading: collectionsLoading } = useCollections(spaceId)
  const createCollection = useCreateCollection()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !spaceId) return
    try {
      await createCollection.mutateAsync({
        spaceId,
        payload: { name: newName, description: newDescription || undefined },
      })
      toast.success('Coleção criada!')
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
    } catch {
      toast.error('Erro ao criar coleção')
    }
  }

  if (spaceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/spaces"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: (space?.color || '#14b8a6') + '15' }}
            >
              {space?.icon || '📚'}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {space?.name}
              </h1>
              {space?.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {space.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova coleção</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 shadow-card">
          <Library className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{space?.collection_count ?? 0} coleções</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 shadow-card">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{space?.material_count ?? 0} materiais</span>
        </div>
      </div>

      {/* Summary */}
      {space?.summary && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-2">Resumo</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{space.summary}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-card-foreground">Criar coleção</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Capítulo 1 - Introdução"
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
                  disabled={createCollection.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {createCollection.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections list */}
      {collectionsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : collectionsData?.data.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-card">
          <Library className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma coleção neste espaço
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            Criar primeira coleção
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collectionsData?.data.map((collection) => (
            <Link
              key={collection.id}
              to={`/spaces/${spaceId}/collections/${collection.id}`}
              className="group rounded-2xl bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: (collection.color || '#14b8a6') + '15' }}
                >
                  <Library className="h-5 w-5" style={{ color: collection.color || '#14b8a6' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {collection.name}
                  </p>
                  {collection.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
