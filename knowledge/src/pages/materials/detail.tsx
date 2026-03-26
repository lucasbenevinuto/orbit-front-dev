import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMaterial } from '@/services/materials'
import { useFlashcards, useGenerateFlashcards, useDeleteFlashcard } from '@/services/flashcards'
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Brain,
  BookOpen,
  Lightbulb,
  Loader2,
  Trash2,
} from 'lucide-react'

type Tab = 'content' | 'summary' | 'concepts' | 'flashcards'

export function MaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>()
  const { data: material, isLoading: materialLoading } = useMaterial(materialId)
  const { data: flashcardsData } = useFlashcards(materialId)
  const generateFlashcards = useGenerateFlashcards()
  const deleteFlashcard = useDeleteFlashcard()

  const [activeTab, setActiveTab] = useState<Tab>('content')

  const handleGenerate = async () => {
    if (!materialId) return
    try {
      const result = await generateFlashcards.mutateAsync(materialId)
      toast.success(`${result.count} flashcards gerados!`)
    } catch {
      toast.error('Erro ao gerar flashcards')
    }
  }

  const handleDeleteFlashcard = async (flashcardId: string) => {
    try {
      await deleteFlashcard.mutateAsync(flashcardId)
      toast.success('Flashcard removido')
    } catch {
      toast.error('Erro ao remover flashcard')
    }
  }

  if (materialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const tabs = [
    { id: 'content' as Tab, label: 'Conteúdo', icon: BookOpen },
    { id: 'summary' as Tab, label: 'Resumo', icon: FileText },
    { id: 'concepts' as Tab, label: 'Conceitos', icon: Lightbulb },
    { id: 'flashcards' as Tab, label: `Flashcards (${material?.flashcard_count ?? 0})`, icon: Brain },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={-1 as unknown as string}
          onClick={(e) => { e.preventDefault(); window.history.back() }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {material?.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {material?.material_type.toUpperCase()} · {material?.status === 'ready' ? 'Processado' : material?.status}
        </p>
      </div>

      {/* Tabs */}
      <div className="-mx-5 px-5 md:mx-0 md:px-0">
        <nav className="inline-flex gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-card md:rounded-2xl md:p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-[36px] shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all md:rounded-xl md:px-3 md:py-2.5',
                activeTab === tab.id
                  ? 'bg-foreground text-background shadow-sm md:bg-accent md:text-accent-foreground md:shadow-none'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === 'content' && (
          <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
            {material?.content_text ? (
              <div className="prose prose-sm max-w-none text-card-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {material.content_text}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {material?.status === 'processing'
                  ? 'O conteúdo está sendo processado...'
                  : 'Conteúdo não disponível'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
            {material?.summary ? (
              <p className="text-sm text-card-foreground whitespace-pre-line leading-relaxed">
                {material.summary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {material?.status === 'processing'
                  ? 'O resumo está sendo gerado...'
                  : 'Resumo não disponível'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
            {material?.concepts && material.concepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {material.concepts.map((concept, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {material?.status === 'processing'
                  ? 'Os conceitos estão sendo extraídos...'
                  : 'Nenhum conceito extraído'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {flashcardsData?.data.length ?? 0} flashcards
              </p>
              <button
                onClick={handleGenerate}
                disabled={generateFlashcards.isPending || material?.status !== 'ready'}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {generateFlashcards.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar com IA
              </button>
            </div>

            {flashcardsData?.data.length === 0 ? (
              <div className="rounded-2xl bg-card p-12 text-center shadow-card">
                <Brain className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum flashcard ainda. Gere automaticamente com IA!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {flashcardsData?.data.map((card) => (
                  <div key={card.id} className="rounded-2xl bg-card p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-card-foreground">{card.front}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{card.back}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFlashcard(card.id)}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        card.status === 'new' && 'bg-blue-500/10 text-blue-600',
                        card.status === 'learning' && 'bg-amber-500/10 text-amber-600',
                        card.status === 'review' && 'bg-emerald-500/10 text-emerald-600',
                      )}>
                        {card.status === 'new' ? 'Novo' : card.status === 'learning' ? 'Aprendendo' : 'Revisão'}
                      </span>
                      {card.is_ai_generated && (
                        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
                          IA
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
