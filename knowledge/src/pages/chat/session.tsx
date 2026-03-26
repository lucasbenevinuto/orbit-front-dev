import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useChatSession, useChatMessages, useSendMessage } from '@/services/chat'
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
} from 'lucide-react'

export function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { data: session } = useChatSession(sessionId)
  const { data: messagesData, isLoading } = useChatMessages(sessionId)
  const sendMessage = useSendMessage()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = messagesData?.data ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !sessionId) return
    const content = input.trim()
    setInput('')
    try {
      await sendMessage.mutateAsync({
        sessionId,
        payload: { content },
      })
    } catch {
      toast.error('Erro ao enviar mensagem')
      setInput(content)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link
          to="/chat"
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            {session?.title || 'Chat'}
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              Faça uma pergunta sobre seus materiais de estudo
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-foreground text-background'
                    : 'bg-card shadow-card'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border/20 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">Fontes:</p>
                    {message.sources.map((source, i) => (
                      <Link
                        key={i}
                        to={`/materials/${source.material_id}`}
                        className="block text-xs text-primary hover:underline"
                      >
                        {source.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                  <User className="h-4 w-4 text-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {sendMessage.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl bg-card px-4 py-3 shadow-card">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-border">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre seus materiais..."
          disabled={sendMessage.isPending}
          className="flex h-11 flex-1 rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMessage.isPending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
