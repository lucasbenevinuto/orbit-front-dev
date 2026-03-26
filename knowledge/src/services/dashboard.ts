import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { KnowledgeDashboardStats } from '@/types/api'

export function useKnowledgeDashboard() {
  return useQuery({
    queryKey: ['knowledge-dashboard'],
    queryFn: async () => {
      const { data } = await api.get<KnowledgeDashboardStats>(
        '/knowledge/dashboard/stats'
      )
      return data
    },
  })
}
