import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Space,
  SpaceDetail,
  SpaceCreate,
  SpaceUpdate,
  PaginatedResponse,
} from '@/types/api'

export function useSpaces(page: number = 1, archived?: boolean) {
  return useQuery({
    queryKey: ['spaces', { page, archived }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page }
      if (archived !== undefined) {
        params.archived = archived
      }
      const { data } = await api.get<PaginatedResponse<Space>>('/knowledge/spaces', {
        params,
      })
      return data
    },
  })
}

export function useSpace(spaceId: string | undefined) {
  return useQuery({
    queryKey: ['spaces', spaceId],
    queryFn: async () => {
      const { data } = await api.get<SpaceDetail>(
        `/knowledge/spaces/${spaceId}`
      )
      return data
    },
    enabled: !!spaceId,
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SpaceCreate) => {
      const { data } = await api.post<Space>('/knowledge/spaces', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}

export function useUpdateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      spaceId,
      payload,
    }: {
      spaceId: string
      payload: SpaceUpdate
    }) => {
      const { data } = await api.patch<Space>(
        `/knowledge/spaces/${spaceId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useDeleteSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (spaceId: string) => {
      await api.delete(`/knowledge/spaces/${spaceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}
