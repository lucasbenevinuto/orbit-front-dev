import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Material,
  MaterialDetail,
  MaterialCreateText,
  MaterialImportYouTube,
  MaterialUpdate,
  PaginatedResponse,
} from '@/types/api'

export function useMaterials(collectionId: string | undefined, page: number = 1) {
  return useQuery({
    queryKey: ['materials', { collectionId, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Material>>(
        `/knowledge/collections/${collectionId}/materials`,
        { params: { page } }
      )
      return data
    },
    enabled: !!collectionId,
  })
}

export function useMaterial(materialId: string | undefined) {
  return useQuery({
    queryKey: ['materials', materialId],
    queryFn: async () => {
      const { data } = await api.get<MaterialDetail>(
        `/knowledge/materials/${materialId}`
      )
      return data
    },
    enabled: !!materialId,
  })
}

export function useCreateTextMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collectionId,
      payload,
    }: {
      collectionId: string
      payload: MaterialCreateText
    }) => {
      const { data } = await api.post<Material>(
        `/knowledge/collections/${collectionId}/materials/text`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}

export function useUploadMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collectionId,
      file,
      title,
    }: {
      collectionId: string
      file: File
      title?: string
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (title) formData.append('title', title)

      const { data } = await api.post<Material>(
        `/knowledge/collections/${collectionId}/materials/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}

export function useImportYouTube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collectionId,
      payload,
    }: {
      collectionId: string
      payload: MaterialImportYouTube
    }) => {
      const { data } = await api.post<Material>(
        `/knowledge/collections/${collectionId}/materials/youtube`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      materialId,
      payload,
    }: {
      materialId: string
      payload: MaterialUpdate
    }) => {
      const { data } = await api.patch<Material>(
        `/knowledge/materials/${materialId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (materialId: string) => {
      await api.delete(`/knowledge/materials/${materialId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-dashboard'] })
    },
  })
}
