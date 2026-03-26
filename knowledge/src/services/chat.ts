import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  ChatSession,
  ChatMessage,
  ChatSessionCreate,
  ChatMessageSend,
  PaginatedResponse,
} from '@/types/api'

export function useChatSessions(page: number = 1) {
  return useQuery({
    queryKey: ['chat-sessions', { page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ChatSession>>(
        '/knowledge/chat/sessions',
        { params: { page } }
      )
      return data
    },
  })
}

export function useChatSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['chat-sessions', sessionId],
    queryFn: async () => {
      const { data } = await api.get<ChatSession>(
        `/knowledge/chat/sessions/${sessionId}`
      )
      return data
    },
    enabled: !!sessionId,
  })
}

export function useChatMessages(sessionId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['chat-messages', { sessionId, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ChatMessage>>(
        `/knowledge/chat/sessions/${sessionId}/messages`,
        { params: { page } }
      )
      return data
    },
    enabled: !!sessionId,
  })
}

export function useCreateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ChatSessionCreate) => {
      const { data } = await api.post<ChatSession>(
        '/knowledge/chat/sessions',
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      payload,
    }: {
      sessionId: string
      payload: ChatMessageSend
    }) => {
      const { data } = await api.post<ChatMessage>(
        `/knowledge/chat/sessions/${sessionId}/messages`,
        payload
      )
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', { sessionId: variables.sessionId }],
      })
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
  })
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/knowledge/chat/sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
  })
}
