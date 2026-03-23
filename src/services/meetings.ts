import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Meeting,
  MeetingCreate,
  MeetingUpdate,
  MeetingStatus,
  PaginatedResponse,
} from '@/types/api'

export function useMeetings(
  projectId: string | undefined,
  page: number = 1,
  status?: MeetingStatus
) {
  return useQuery({
    queryKey: ['meetings', projectId, { page, status }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page }
      if (status) {
        params.status = status
      }
      const { data } = await api.get<PaginatedResponse<Meeting>>(
        `/projects/${projectId}/meetings`,
        { params }
      )
      return data
    },
    enabled: !!projectId,
  })
}

export function useMeeting(
  projectId: string | undefined,
  meetingId: string | undefined
) {
  return useQuery({
    queryKey: ['meetings', projectId, meetingId],
    queryFn: async () => {
      const { data } = await api.get<Meeting>(
        `/projects/${projectId}/meetings/${meetingId}`
      )
      return data
    },
    enabled: !!projectId && !!meetingId,
  })
}

export function useCreateMeeting(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MeetingCreate) => {
      const { data } = await api.post<Meeting>(
        `/projects/${projectId}/meetings`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings', projectId],
      })
    },
  })
}

export function useUpdateMeeting(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      meetingId,
      payload,
    }: {
      meetingId: string
      payload: MeetingUpdate
    }) => {
      const { data } = await api.patch<Meeting>(
        `/projects/${projectId}/meetings/${meetingId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings', projectId],
      })
    },
  })
}

export function useDeleteMeeting(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (meetingId: string) => {
      await api.delete(`/projects/${projectId}/meetings/${meetingId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings', projectId],
      })
    },
  })
}
