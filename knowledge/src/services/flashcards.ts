import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Flashcard,
  FlashcardCreate,
  FlashcardReviewResponse,
  FlashcardStudySession,
  FlashcardStats,
  PaginatedResponse,
} from '@/types/api'

export function useFlashcards(materialId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['flashcards', { materialId, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Flashcard>>(
        `/knowledge/materials/${materialId}/flashcards`,
        { params: { page } }
      )
      return data
    },
    enabled: !!materialId,
  })
}

export function useDueFlashcards(scope?: { spaceId?: string; collectionId?: string }) {
  return useQuery({
    queryKey: ['flashcards', 'due', scope],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (scope?.spaceId) params.space_id = scope.spaceId
      if (scope?.collectionId) params.collection_id = scope.collectionId

      const { data } = await api.get<FlashcardStudySession>(
        '/knowledge/flashcards/due',
        { params }
      )
      return data
    },
  })
}

export function useFlashcardStats() {
  return useQuery({
    queryKey: ['flashcards', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<FlashcardStats>(
        '/knowledge/flashcards/stats'
      )
      return data
    },
  })
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      materialId,
      payload,
    }: {
      materialId: string
      payload: FlashcardCreate
    }) => {
      const { data } = await api.post<Flashcard>(
        `/knowledge/materials/${materialId}/flashcards`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      flashcardId,
      quality,
    }: {
      flashcardId: string
      quality: number
    }) => {
      const { data } = await api.post<FlashcardReviewResponse>(
        `/knowledge/flashcards/${flashcardId}/review`,
        { quality }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
    },
  })
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (materialId: string) => {
      const { data } = await api.post<{ count: number }>(
        `/knowledge/flashcards/materials/${materialId}`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (flashcardId: string) => {
      await api.delete(`/knowledge/flashcards/${flashcardId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}
