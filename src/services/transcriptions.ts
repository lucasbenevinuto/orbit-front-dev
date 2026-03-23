import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Transcription,
  TranscriptionJobResponse,
  TranscriptionStartRequest,
  PaginatedResponse,
} from '@/types/api'

export function useTranscription(transcriptionId: string | undefined) {
  return useQuery({
    queryKey: ['transcriptions', transcriptionId],
    queryFn: async () => {
      const { data } = await api.get<Transcription>(
        `/transcriptions/${transcriptionId}`
      )
      return data
    },
    enabled: !!transcriptionId,
  })
}

export function useTranscriptionByAudio(audioUploadId: string | undefined) {
  return useQuery({
    queryKey: ['transcriptions', 'by-audio', audioUploadId],
    queryFn: async () => {
      const { data } = await api.get<Transcription>(
        `/transcriptions/by-audio/${audioUploadId}`
      )
      return data
    },
    enabled: !!audioUploadId,
    retry: false,
  })
}

export function useTranscriptions(page: number = 1) {
  return useQuery({
    queryKey: ['transcriptions', { page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Transcription>>(
        '/transcriptions',
        { params: { page } }
      )
      return data
    },
  })
}

export function useStartTranscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TranscriptionStartRequest) => {
      const { data } = await api.post<TranscriptionJobResponse>(
        '/transcriptions',
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] })
      queryClient.invalidateQueries({ queryKey: ['audio-uploads'] })
    },
  })
}

export function useTranscriptionJobStatus(jobId: string | undefined) {
  return useQuery({
    queryKey: ['transcription-job', jobId],
    queryFn: async () => {
      const { data } = await api.get<TranscriptionJobResponse>(
        `/transcriptions/job/${jobId}`
      )
      return data
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'complete' || status === 'not_found') return false
      return 3000
    },
  })
}

export function useEditTranscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transcriptionId,
      payload,
    }: {
      transcriptionId: string
      payload: { content?: string; speaker_map?: Record<string, string> }
    }) => {
      const { data } = await api.patch<Transcription>(
        `/transcriptions/${transcriptionId}/edit`,
        payload
      )
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transcriptions', variables.transcriptionId],
      })
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] })
    },
  })
}

export function subscribeToTranscriptionProgress(
  audioUploadId: string,
  onEvent: (event: MessageEvent) => void
): () => void {
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1'
  const eventSource = new EventSource(
    `${baseUrl}/transcriptions/stream/${audioUploadId}`
  )

  eventSource.onmessage = onEvent

  eventSource.onerror = () => {
    eventSource.close()
  }

  return () => {
    eventSource.close()
  }
}
