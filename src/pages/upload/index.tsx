import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAudioUploads, useInitiateUpload, useConfirmUpload, useDeleteAudioUpload, uploadFileToS3 } from '@/services/audio'
import { useStartTranscription } from '@/services/transcriptions'
import { useProjects } from '@/services/projects'
import { useAuthStore } from '@/stores/auth-store'
import { formatFileSize } from '@/lib/utils'
import {
  Upload,
  Mic,
  FileAudio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FolderKanban,
  Trash2,
  Download,
  Wand2,
  Save,
} from 'lucide-react'

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac', '.aac', '.wma', '.opus']
const MAX_SIZE = 500 * 1024 * 1024

type UploadState = 'idle' | 'uploading' | 'confirming' | 'done' | 'error'

const STEPS = [
  { key: 'queued', label: 'Na fila', icon: Clock },
  { key: 'downloading', label: 'Baixando áudio', icon: Download },
  { key: 'validating', label: 'Validando formato', icon: CheckCircle2 },
  { key: 'transcribing', label: 'Transcrevendo com IA', icon: Wand2 },
  { key: 'saving', label: 'Salvando resultado', icon: Save },
  { key: 'completed', label: 'Concluído', icon: CheckCircle2 },
] as const

function TranscriptionTracker({ upload }: { upload: { id: string; original_filename: string; status: string; error_message: string | null } }) {
  const getStepIndex = (): number => {
    if (upload.status === 'transcribed') return 5
    if (upload.status === 'failed') return -1
    if (upload.status === 'processing') return 3
    if (upload.status === 'uploaded') return 0
    if (upload.status === 'uploading') return 0
    return 0
  }

  const currentStep = getStepIndex()
  const isFailed = upload.status === 'failed'
  const isCompleted = currentStep === 5
  const isProcessing = !isFailed && !isCompleted

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <FileAudio className="h-5 w-5 text-foreground" />
        <span className="font-medium text-card-foreground">{upload.original_filename}</span>
      </div>

      {isFailed ? (
        <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Transcrição falhou</p>
            <p className="text-sm text-muted-foreground">
              {upload.error_message || 'Ocorreu um erro durante o processamento.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isDone = index < currentStep
            const isActive = index === currentStep && isProcessing
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : isActive
                    ? 'bg-foreground/10 text-foreground'
                    : 'bg-secondary text-muted-foreground/40'
                }`}>
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className={`text-sm ${
                  isDone
                    ? 'text-emerald-600'
                    : isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground/40'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-muted-foreground">(em andamento...)</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function UploadPage() {
  const user = useAuthStore((s) => s.user)
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [enableDiarization, setEnableDiarization] = useState(false)

  const { data: uploads, isLoading } = useAudioUploads(1)
  const { data: projectsData } = useProjects(1)
  const initiateUpload = useInitiateUpload()
  const confirmUpload = useConfirmUpload()
  const deleteAudioUpload = useDeleteAudioUpload()
  const startTranscription = useStartTranscription()

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Formato não suportado. Use: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
    if (file.size > MAX_SIZE) {
      return `Arquivo muito grande. Máximo: ${formatFileSize(MAX_SIZE)}`
    }
    return null
  }

  const handleUpload = useCallback(async (file: File) => {
    if (!selectedProjectId) {
      toast.error('Selecione um projeto antes de enviar o arquivo')
      return
    }
    const error = validateFile(file)
    if (error) { toast.error(error); return }

    setSelectedFile(file)
    setUploadState('uploading')
    setUploadProgress(0)

    try {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      const result = await initiateUpload.mutateAsync({
        original_filename: file.name,
        file_extension: ext,
        file_size_bytes: file.size,
        content_type: file.type,
      })
      await uploadFileToS3(result.upload_url, file, (progress) => { setUploadProgress(progress) })
      setUploadState('confirming')
      await confirmUpload.mutateAsync(result.upload_id)
      setUploadState('done')
      try {
        await startTranscription.mutateAsync({
          audio_upload_id: result.upload_id,
          project_id: selectedProjectId,
          enable_diarization: enableDiarization,
        })
        toast.success('Transcrição iniciada! Acompanhe o progresso abaixo.')
      } catch { toast.error('Upload OK, mas erro ao iniciar transcrição automática') }
    } catch { setUploadState('error'); toast.error('Erro no upload do arquivo') }
  }, [initiateUpload, confirmUpload, startTranscription, selectedProjectId, enableDiarization])

  const handleDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file) },
    [handleUpload]
  )
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleUpload(file) }
  const resetUpload = () => { setUploadState('idle'); setUploadProgress(0); setSelectedFile(null) }

  const handleDeleteUpload = async (id: string, filename: string) => {
    if (!confirm(`Excluir "${filename}"?`)) return
    try { await deleteAudioUpload.mutateAsync(id); toast.success('Upload excluído') }
    catch { toast.error('Erro ao excluir upload') }
  }

  const statusConfig = {
    uploading: { label: 'Enviando', icon: Clock, className: 'text-amber-600 bg-amber-500/10' },
    uploaded: { label: 'Na fila', icon: Clock, className: 'text-blue-600 bg-blue-500/10' },
    processing: { label: 'Processando', icon: Loader2, className: 'text-purple-600 bg-purple-500/10' },
    transcribed: { label: 'Transcrito', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
    failed: { label: 'Falhou', icon: AlertCircle, className: 'text-destructive bg-destructive/10' },
  }

  const projects = projectsData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload de Áudio</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Envie arquivos de áudio para transcrição e análise por IA
          </p>
        </div>
        {user && user.transcription_credits_limit_cents != null && (
          <div className="rounded-2xl bg-card p-4 shadow-card sm:text-right">
            <p className="text-xs text-muted-foreground">Créditos de transcrição</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              ${((user.transcription_credits_limit_cents! - (user.transcription_credits_used_cents || 0)) / 100).toFixed(2)}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:w-32">
              <div
                className={`h-full rounded-full transition-all ${
                  ((user.transcription_credits_used_cents || 0) / user.transcription_credits_limit_cents!) > 0.8
                    ? 'bg-destructive'
                    : 'bg-foreground'
                }`}
                style={{ width: `${Math.min(((user.transcription_credits_used_cents || 0) / user.transcription_credits_limit_cents!) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              ${((user.transcription_credits_used_cents || 0) / 100).toFixed(2)} / ${(user.transcription_credits_limit_cents! / 100).toFixed(2)} usado
            </p>
          </div>
        )}
      </div>

      {/* Project selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Projeto</label>
        <div className="relative">
          <FolderKanban className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex h-11 w-full rounded-xl border-0 bg-card pl-10 pr-4 py-2 text-sm shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
          >
            <option value="">Selecione um projeto...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.icon || '📁'} {project.name}
              </option>
            ))}
          </select>
        </div>
        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum projeto encontrado. Crie um projeto primeiro.
          </p>
        )}
      </div>

      {/* Diarization toggle */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-card sm:max-w-md">
        <div>
          <p className="text-sm font-medium text-foreground">Identificar participantes</p>
          <p className="text-xs text-muted-foreground">
            {enableDiarization
              ? 'IA avançada para separar falas (mais lento)'
              : 'Transcrição rápida sem separação'}
          </p>
        </div>
        <button
          onClick={() => setEnableDiarization(!enableDiarization)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
            enableDiarization ? 'bg-foreground' : 'bg-secondary'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              enableDiarization ? 'translate-x-6' : 'translate-x-1'
            } mt-1`}
          />
        </button>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-12 ${
          dragActive
            ? 'border-foreground bg-foreground/5'
            : !selectedProjectId
            ? 'border-border opacity-50'
            : 'border-border hover:border-foreground/30'
        } ${uploadState !== 'idle' ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploadState === 'idle' ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Upload className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              {selectedProjectId
                ? 'Arraste um arquivo de áudio aqui'
                : 'Selecione um projeto acima para continuar'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">ou clique para selecionar</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {ALLOWED_EXTENSIONS.join(', ')} | Máx: {formatFileSize(MAX_SIZE)}
            </p>
            {selectedProjectId && (
              <input
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/5">
              <FileAudio className="h-7 w-7 text-foreground" />
            </div>
            <p className="font-medium text-foreground">{selectedFile?.name}</p>
            <p className="text-sm text-muted-foreground">{selectedFile && formatFileSize(selectedFile.size)}</p>

            {uploadState === 'uploading' && (
              <div className="mx-auto max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Enviando... {uploadProgress}%</p>
              </div>
            )}
            {uploadState === 'confirming' && (
              <div className="flex items-center justify-center gap-2 text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Confirmando upload...</span>
              </div>
            )}
            {uploadState === 'done' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Upload concluído!</span>
                </div>
                <button onClick={resetUpload} className="rounded-full bg-card px-5 py-2.5 text-sm font-medium shadow-card hover:shadow-card-hover transition-shadow">
                  Enviar outro arquivo
                </button>
              </div>
            )}
            {uploadState === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Erro no upload</span>
                </div>
                <button onClick={resetUpload} className="rounded-full bg-card px-5 py-2.5 text-sm font-medium shadow-card hover:shadow-card-hover transition-shadow">
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active transcription trackers */}
      {(() => {
        const processingUploads = uploads?.data.filter((u) => u.status === 'processing' || u.status === 'uploaded') ?? []
        if (processingUploads.length === 0) return null
        return (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Transcrições em andamento</h2>
            {processingUploads.map((upload) => (
              <TranscriptionTracker key={upload.id} upload={upload} />
            ))}
          </div>
        )
      })()}

      {/* Upload history */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Histórico de Uploads</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-card shadow-card" />
            ))}
          </div>
        ) : !uploads?.data.length ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card">
            <Mic className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum upload realizado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uploads.data.map((upload) => {
              const status = statusConfig[upload.status]
              const StatusIcon = status.icon
              return (
                <div
                  key={upload.id}
                  className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{upload.original_filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file_size_bytes)} · {new Date(upload.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                      <StatusIcon className={`h-3.5 w-3.5 ${upload.status === 'processing' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </div>
                    <button
                      onClick={() => handleDeleteUpload(upload.id, upload.original_filename)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Excluir upload"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
