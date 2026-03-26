import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useCollection } from '@/services/collections'
import { useMaterials, useCreateTextMaterial, useUploadMaterial, useImportYouTube } from '@/services/materials'
import { formatFileSize } from '@/lib/utils'
import {
  ArrowLeft,
  Plus,
  FileText,
  Upload,
  Youtube,
  Type,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react'
import type { MaterialStatus } from '@/types/api'

function StatusBadge({ status }: { status: MaterialStatus }) {
  const config = {
    ready: { icon: CheckCircle2, label: 'Pronto', className: 'bg-emerald-500/10 text-emerald-600' },
    processing: { icon: Clock, label: 'Processando', className: 'bg-amber-500/10 text-amber-600' },
    pending: { icon: Clock, label: 'Pendente', className: 'bg-blue-500/10 text-blue-600' },
    failed: { icon: AlertCircle, label: 'Erro', className: 'bg-red-500/10 text-red-600' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

type CreateMode = 'text' | 'file' | 'youtube' | null

export function CollectionDetailPage() {
  const { spaceId, collectionId } = useParams<{ spaceId: string; collectionId: string }>()
  const { data: collection, isLoading: collectionLoading } = useCollection(collectionId)
  const { data: materialsData, isLoading: materialsLoading } = useMaterials(collectionId)
  const createText = useCreateTextMaterial()
  const uploadFile = useUploadMaterial()
  const importYT = useImportYouTube()

  const [createMode, setCreateMode] = useState<CreateMode>(null)
  const [title, setTitle] = useState('')
  const [contentText, setContentText] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const resetForm = () => {
    setCreateMode(null)
    setTitle('')
    setContentText('')
    setYoutubeUrl('')
    setSelectedFile(null)
  }

  const handleCreateText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !contentText.trim() || !collectionId) return
    try {
      await createText.mutateAsync({
        collectionId,
        payload: { title, content_text: contentText },
      })
      toast.success('Material criado!')
      resetForm()
    } catch {
      toast.error('Erro ao criar material')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !collectionId) return
    try {
      await uploadFile.mutateAsync({
        collectionId,
        file: selectedFile,
        title: title || undefined,
      })
      toast.success('Arquivo enviado!')
      resetForm()
    } catch {
      toast.error('Erro ao enviar arquivo')
    }
  }

  const handleImportYT = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim() || !title.trim() || !collectionId) return
    try {
      await importYT.mutateAsync({
        collectionId,
        payload: { title, source_url: youtubeUrl },
      })
      toast.success('YouTube importado!')
      resetForm()
    } catch {
      toast.error('Erro ao importar YouTube')
    }
  }

  if (collectionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isPending = createText.isPending || uploadFile.isPending || importYT.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao espaço
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {collection?.name}
            </h1>
            {collection?.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add material buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCreateMode('text')}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Type className="h-4 w-4" />
          Texto
        </button>
        <button
          onClick={() => setCreateMode('file')}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Upload className="h-4 w-4" />
          Arquivo
        </button>
        <button
          onClick={() => setCreateMode('youtube')}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Youtube className="h-4 w-4" />
          YouTube
        </button>
      </div>

      {/* Create form */}
      {createMode && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-card-foreground">
              {createMode === 'text' && 'Adicionar texto'}
              {createMode === 'file' && 'Enviar arquivo'}
              {createMode === 'youtube' && 'Importar do YouTube'}
            </h3>
            <button onClick={resetForm} className="rounded-full p-1 hover:bg-secondary">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {createMode === 'text' && (
            <form onSubmit={handleCreateText} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do material"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Cole ou digite o conteúdo aqui..."
                  rows={8}
                  className="flex w-full rounded-xl border-0 bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Adicionar
              </button>
            </form>
          )}

          {createMode === 'file' && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título (opcional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do material"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivo</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar (PDF, DOCX, PPTX)'}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.pptx,.txt,.md"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending || !selectedFile}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar
              </button>
            </form>
          )}

          {createMode === 'youtube' && (
            <form onSubmit={handleImportYT} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do material"
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do YouTube</label>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Importar
              </button>
            </form>
          )}
        </div>
      )}

      {/* Materials list */}
      {materialsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : materialsData?.data.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-card">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum material nesta coleção
          </p>
          <button
            onClick={() => setCreateMode('text')}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            Adicionar material
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materialsData?.data.map((material) => (
            <Link
              key={material.id}
              to={`/materials/${material.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {material.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {material.material_type.toUpperCase()}
                    {material.file_size_bytes ? ` · ${formatFileSize(material.file_size_bytes)}` : ''}
                  </p>
                </div>
              </div>
              <StatusBadge status={material.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
