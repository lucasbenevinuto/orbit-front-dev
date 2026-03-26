import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Collection,
  CollectionDetail,
  CollectionCreate,
  CollectionUpdate,
  PaginatedResponse,
} from '@/types/api'

export function useCollections(spaceId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['collections', { spaceId, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Collection>>(
        `/knowledge/spaces/${spaceId}/collections`,
        { params: { page } }
      )
      return data
    },
    enabled: !!spaceId,
  })
}

export function useCollection(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collections', collectionId],
    queryFn: async () => {
      const { data } = await api.get<CollectionDetail>(
        `/knowledge/collections/${collectionId}`
      )
      return data
    },
    enabled: !!collectionId,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      spaceId,
      payload,
    }: {
      spaceId: string
      payload: CollectionCreate
    }) => {
      const { data } = await api.post<Collection>(
        `/knowledge/spaces/${spaceId}/collections`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collectionId,
      payload,
    }: {
      collectionId: string
      payload: CollectionUpdate
    }) => {
      const { data } = await api.patch<Collection>(
        `/knowledge/collections/${collectionId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (collectionId: string) => {
      await api.delete(`/knowledge/collections/${collectionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}
