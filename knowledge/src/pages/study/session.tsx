import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDueFlashcards, useReviewFlashcard } from '@/services/flashcards'
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

const ratingButtons = [
  { quality: 1, label: 'Errei', color: 'bg-red-500 hover:bg-red-600' },
  { quality: 3, label: 'Difícil', color: 'bg-amber-500 hover:bg-amber-600' },
  { quality: 4, label: 'Bom', color: 'bg-teal-500 hover:bg-teal-600' },
  { quality: 5, label: 'Fácil', color: 'bg-emerald-500 hover:bg-emerald-600' },
]

export function StudySessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spaceId = searchParams.get('space_id') || undefined

  const { data: session, isLoading } = useDueFlashcards(
    spaceId ? { spaceId } : undefined
  )
  const reviewFlashcard = useReviewFlashcard()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const cards = session?.cards ?? []
  const currentCard = cards[currentIndex]
  const isComplete = currentIndex >= cards.length

  const handleReview = async (quality: number) => {
    if (!currentCard) return
    try {
      await reviewFlashcard.mutateAsync({
        flashcardId: currentCard.id,
        quality,
      })
      setReviewed((r) => r + 1)
      setFlipped(false)
      setCurrentIndex((i) => i + 1)
    } catch {
      toast.error('Erro ao registrar revisão')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Parabéns!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Não há flashcards para revisar agora.
        </p>
        <button
          onClick={() => navigate('/study')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Sessão concluída!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Você revisou {reviewed} flashcards.
        </p>
        <button
          onClick={() => navigate('/study')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Voltar ao estudo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/study')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Sair
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={cn(
          'relative mx-auto flex min-h-[300px] max-w-lg cursor-pointer items-center justify-center rounded-2xl bg-card p-8 shadow-card transition-all sm:min-h-[400px]',
          !flipped && 'hover:shadow-card-hover'
        )}
      >
        {flipped ? (
          <div className="text-center">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Resposta</p>
            <p className="text-lg text-card-foreground leading-relaxed">{currentCard.back}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Pergunta</p>
            <p className="text-lg font-semibold text-card-foreground leading-relaxed">{currentCard.front}</p>
            <p className="mt-6 text-xs text-muted-foreground">Toque para virar</p>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped ? (
        <div className="flex justify-center gap-3">
          {ratingButtons.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleReview(btn.quality)}
              disabled={reviewFlashcard.isPending}
              className={cn(
                'flex-1 max-w-[100px] rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50',
                btn.color
              )}
            >
              {reviewFlashcard.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                btn.label
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={() => setFlipped(true)}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Mostrar resposta
          </button>
        </div>
      )}
    </div>
  )
}
