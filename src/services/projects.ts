import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Project,
  ProjectDetail,
  ProjectCreate,
  ProjectUpdate,
  PaginatedResponse,
} from '@/types/api'

export function useProjects(page: number = 1, archived?: boolean) {
  return useQuery({
    queryKey: ['projects', { page, archived }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page }
      if (archived !== undefined) {
        params.archived = archived
      }
      const { data } = await api.get<PaginatedResponse<Project>>('/projects', {
        params,
      })
      return data
    },
  })
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const { data } = await api.get<ProjectDetail>(
        `/projects/${projectId}`
      )
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProjectCreate) => {
      const { data } = await api.post<Project>('/projects', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string
      payload: ProjectUpdate
    }) => {
      const { data } = await api.patch<Project>(
        `/projects/${projectId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
