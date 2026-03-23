import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/api'
import type {
  AudioUpload,
  AudioUploadCreate,
  AudioUploadPresigned,
  PaginatedResponse,
} from '@/types/api'

export function useAudioUploads(page: number = 1) {
  return useQuery({
    queryKey: ['audio-uploads', { page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AudioUpload>>(
        '/audio-uploads',
        { params: { page } }
      )
      return data
    },
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.data?.some(
        (u) => u.status === 'processing' || u.status === 'uploading' || u.status === 'uploaded'
      )
      return hasProcessing ? 5000 : false
    },
  })
}

export function useAudioUpload(uploadId: string | undefined) {
  return useQuery({
    queryKey: ['audio-uploads', uploadId],
    queryFn: async () => {
      const { data } = await api.get<AudioUpload>(
        `/audio-uploads/${uploadId}`
      )
      return data
    },
    enabled: !!uploadId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'transcribed' || status === 'failed') return false
      return 3000 // Poll every 3s while not terminal
    },
  })
}

export function useInitiateUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AudioUploadCreate) => {
      const { data } = await api.post<AudioUploadPresigned>(
        '/audio-uploads/initiate',
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-uploads'] })
    },
  })
}

export function useConfirmUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uploadId: string) => {
      const { data } = await api.post<AudioUpload>(
        `/audio-uploads/${uploadId}/confirm`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-uploads'] })
    },
  })
}

export function useDeleteAudioUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uploadId: string) => {
      await api.delete(`/audio-uploads/${uploadId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-uploads'] })
    },
  })
}

export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(percent)
      }
    },
  })
}
