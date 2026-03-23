import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Decision,
  DecisionCreate,
  DecisionUpdate,
} from '@/types/api'

export function useDecisions(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['decisions', meetingId],
    queryFn: async () => {
      const { data } = await api.get<Decision[]>(
        `/meetings/${meetingId}/decisions`
      )
      return data
    },
    enabled: !!meetingId,
  })
}

export function useCreateDecision(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: DecisionCreate) => {
      const { data } = await api.post<Decision>(
        `/meetings/${meetingId}/decisions`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['decisions', meetingId],
      })
    },
  })
}

export function useUpdateDecision(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      decisionId,
      payload,
    }: {
      decisionId: string
      payload: DecisionUpdate
    }) => {
      const { data } = await api.patch<Decision>(
        `/meetings/${meetingId}/decisions/${decisionId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['decisions', meetingId],
      })
    },
  })
}

export function useDeleteDecision(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (decisionId: string) => {
      await api.delete(`/meetings/${meetingId}/decisions/${decisionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['decisions', meetingId],
      })
    },
  })
}
