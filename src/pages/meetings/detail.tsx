import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMeeting } from '@/services/meetings'
import { useDecisions, useCreateDecision, useDeleteDecision } from '@/services/decisions'
import { useTranscriptionByAudio, useEditTranscription } from '@/services/transcriptions'
import { formatDuration } from '@/lib/utils'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  ListChecks,
  Gavel,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

type Tab = 'summary' | 'transcription' | 'decisions' | 'actions'

function SpeakerBadge({
  label,
  displayName,
  onRename,
}: {
  label: string
  displayName: string
  onRename: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(displayName)

  const handleSave = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== displayName) {
      onRename(trimmed)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') { setValue(displayName); setEditing(false) }
          }}
          className="h-7 w-32 rounded-lg border-0 bg-secondary px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => { setValue(displayName); setEditing(true) }}
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-accent"
    >
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-muted-foreground">{displayName === label ? 'Renomear...' : displayName}</span>
    </button>
  )
}

export function MeetingDetailPage() {
  const { projectId, meetingId } = useParams<{
    projectId: string
    meetingId: string
  }>()
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [newDecision, setNewDecision] = useState('')

  const { data: meeting, isLoading } = useMeeting(projectId!, meetingId!)
  const { data: decisions } = useDecisions(meetingId!)
  const { data: transcription } = useTranscriptionByAudio(meeting?.audio_upload_id ?? undefined)
  const editTranscription = useEditTranscription()
  const createDecision = useCreateDecision(meetingId!)
  const deleteDecision = useDeleteDecision(meetingId!)

  const speakerMap = transcription?.speaker_map || {}
  const uniqueSpeakers = useMemo(() => {
    if (!transcription?.speaker_segments) return []
    const speakers = new Set<string>()
    for (const seg of transcription.speaker_segments) {
      speakers.add(seg.speaker)
    }
    return Array.from(speakers)
  }, [transcription?.speaker_segments])

  const getSpeakerName = (speaker: string) => {
    return speakerMap[speaker] || speaker
  }

  const handleRenameSpeaker = async (originalLabel: string, newName: string) => {
    if (!transcription) return
    const updatedMap = { ...speakerMap, [originalLabel]: newName }
    try {
      await editTranscription.mutateAsync({
        transcriptionId: transcription.id,
        payload: { speaker_map: updatedMap },
      })
      toast.success(`Speaker ${originalLabel} renomeado para "${newName}"`)
    } catch {
      toast.error('Erro ao renomear speaker')
    }
  }

  const handleCreateDecision = async () => {
    if (!newDecision.trim()) return
    try {
      await createDecision.mutateAsync({ content: newDecision })
      setNewDecision('')
      toast.success('Decisão adicionada')
    } catch {
      toast.error('Erro ao adicionar decisão')
    }
  }

  const handleDeleteDecision = async (id: string) => {
    try {
      await deleteDecision.mutateAsync(id)
      toast.success('Decisão removida')
    } catch {
      toast.error('Erro ao remover decisão')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Reunião não encontrada</p>
      </div>
    )
  }

  const statusInfo = {
    draft: { label: 'Rascunho', icon: FileText, className: 'text-muted-foreground bg-secondary' },
    processing: { label: 'Processando', icon: Clock, className: 'text-amber-600 bg-amber-500/10' },
    completed: { label: 'Concluída', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
    failed: { label: 'Falhou', icon: AlertCircle, className: 'text-destructive bg-destructive/10' },
  }[meeting.status]
  const StatusIcon = statusInfo.icon

  const tabs = [
    { id: 'summary' as Tab, label: 'Resumo', icon: FileText },
    { id: 'transcription' as Tab, label: 'Transcrição', icon: MessageSquare },
    { id: 'decisions' as Tab, label: 'Decisões', icon: Gavel },
    { id: 'actions' as Tab, label: 'Ações', icon: ListChecks },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to={`/projects/${projectId}`}
          className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{meeting.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(meeting.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {meeting.tags && meeting.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {meeting.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="-mx-5 px-5 md:mx-0 md:px-0">
        <div className="inline-flex gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-card">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {meeting.summary ? (
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">Resumo</h3>
                  <button
                    onClick={() => copyToClipboard(meeting.summary!)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {meeting.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-12 text-center shadow-card">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {meeting.status === 'processing'
                    ? 'O resumo está sendo gerado...'
                    : 'Nenhum resumo disponível'}
                </p>
              </div>
            )}

            {meeting.key_topics && meeting.key_topics.length > 0 && (
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <h3 className="mb-3 font-semibold text-card-foreground">
                  Tópicos Principais
                </h3>
                <ul className="space-y-2">
                  {meeting.key_topics.map((topic, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meeting.user_notes && (
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <h3 className="mb-3 font-semibold text-card-foreground">
                  Notas do Usuário
                </h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {meeting.user_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcription' && (
          <div className="space-y-4">
            {transcription ? (
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground">Transcrição</h3>
                    <p className="text-xs text-muted-foreground">
                      {transcription.word_count} palavras
                      {transcription.detected_language && ` · ${transcription.detected_language}`}
                      {transcription.processing_time_seconds && ` · ${formatDuration(transcription.processing_time_seconds)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(transcription.content)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {transcription.speaker_segments && transcription.speaker_segments.length > 0 ? (
                  <>
                    {uniqueSpeakers.length > 0 && (
                      <div className="mb-6 rounded-xl bg-secondary/60 p-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Participantes — clique para renomear
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {uniqueSpeakers.map((speaker) => (
                            <SpeakerBadge
                              key={speaker}
                              label={speaker}
                              displayName={getSpeakerName(speaker)}
                              onRename={(name) => handleRenameSpeaker(speaker, name)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {transcription.speaker_segments.map((seg, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-0.5 shrink-0 rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {getSpeakerName(seg.speaker)}
                          </span>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {seg.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {transcription.content}
                  </p>
                )}
              </div>
            ) : meeting?.status === 'processing' ? (
              <div className="rounded-2xl bg-card p-12 text-center shadow-card">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-foreground" />
                <p className="mt-4 text-muted-foreground">
                  A transcrição está sendo processada...
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-12 text-center shadow-card">
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  Nenhuma transcrição disponível
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                placeholder="Adicionar nova decisão..."
                className="flex h-11 flex-1 rounded-full border-0 bg-card px-5 py-2 text-sm shadow-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDecision()}
              />
              <button
                onClick={handleCreateDecision}
                disabled={!newDecision.trim() || createDecision.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>

            {decisions && decisions.length > 0 ? (
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <Gavel className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-card-foreground">
                        {decision.content}
                      </p>
                      {decision.context && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Contexto: {decision.context}
                        </p>
                      )}
                      {decision.made_by && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Por: {decision.made_by}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDecision(decision.id)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-8 text-center shadow-card">
                <Gavel className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhuma decisão registrada
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            {Array.isArray(meeting.action_items) && meeting.action_items.length > 0 ? (
              meeting.action_items.map((item: { point: string; context?: string; outcome?: string; type?: string }, i: number) => {
                const typeLabels: Record<string, { label: string; color: string }> = {
                  decision: { label: 'Decisão', color: 'bg-blue-500/10 text-blue-600' },
                  action: { label: 'Ação', color: 'bg-emerald-500/10 text-emerald-600' },
                  discussion: { label: 'Discussão', color: 'bg-amber-500/10 text-amber-600' },
                  information: { label: 'Informação', color: 'bg-purple-500/10 text-purple-600' },
                }
                const typeInfo = typeLabels[item.type || 'discussion'] || typeLabels.discussion
                return (
                  <div
                    key={i}
                    className="rounded-2xl bg-card p-4 shadow-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="font-medium text-card-foreground">{item.point}</p>
                    {item.context && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.context}</p>
                    )}
                    {item.outcome && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium text-foreground">Resultado: </span>
                        <span className="text-muted-foreground">{item.outcome}</span>
                      </p>
                    )}
                  </div>
                )
              })
            ) : typeof meeting.action_items === 'string' && meeting.action_items ? (
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">Itens de Ação</h3>
                  <button
                    onClick={() => copyToClipboard(meeting.action_items as string)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {meeting.action_items}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-8 text-center shadow-card">
                <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum item de ação identificado
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
