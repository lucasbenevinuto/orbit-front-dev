import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { AppLayout } from '@/components/layouts/app-layout'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { DashboardPage } from '@/pages/dashboard'
import { SpacesPage } from '@/pages/spaces'
import { SpaceDetailPage } from '@/pages/spaces/detail'
import { CollectionDetailPage } from '@/pages/collections/detail'
import { MaterialDetailPage } from '@/pages/materials/detail'
import { StudyHomePage } from '@/pages/study'
import { StudySessionPage } from '@/pages/study/session'
import { ChatListPage } from '@/pages/chat'
import { ChatSessionPage } from '@/pages/chat/session'
import { SettingsPage } from '@/pages/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppInitializer>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/spaces" element={<SpacesPage />} />
              <Route path="/spaces/:spaceId" element={<SpaceDetailPage />} />
              <Route path="/spaces/:spaceId/collections/:collectionId" element={<CollectionDetailPage />} />
              <Route path="/materials/:materialId" element={<MaterialDetailPage />} />
              <Route path="/study" element={<StudyHomePage />} />
              <Route path="/study/session" element={<StudySessionPage />} />
              <Route path="/chat" element={<ChatListPage />} />
              <Route path="/chat/:sessionId" element={<ChatSessionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AppInitializer>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
