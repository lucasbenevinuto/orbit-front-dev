import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useChatSessions, useCreateChatSession, useDeleteChatSession } from '@/services/chat'
import {
  MessageCircle,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react'

export function ChatListPage() {
  const navigate = useNavigate()
  const { data: sessionsData, isLoading } = useChatSessions()
  const createSession = useCreateChatSession()
  const deleteSession = useDeleteChatSession()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      const session = await createSession.mutateAsync({ title: 'Nova conversa' })
      navigate(`/chat/${session.id}`)
    } catch {
      toast.error('Erro ao criar conversa')
    }
  }

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(sessionId)
    try {
      await deleteSession.mutateAsync(sessionId)
      toast.success('Conversa removida')
    } catch {
      toast.error('Erro ao remover conversa')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chat</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Converse com IA sobre seus materiais
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createSession.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {createSession.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Nova conversa</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-card shadow-card" />
          ))}
        </div>
      ) : sessionsData?.data.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-card">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma conversa ainda
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            Iniciar conversa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionsData?.data.map((session) => (
            <Link
              key={session.id}
              to={`/chat/${session.id}`}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.message_count} mensagens ·{' '}
                    {new Date(session.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                disabled={deleting === session.id}
                className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                {deleting === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
