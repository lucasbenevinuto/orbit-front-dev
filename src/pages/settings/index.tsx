import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@/services/sessions'
import { api } from '@/lib/api'
import {
  User,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Loader2,
  Trash2,
  LogOut,
} from 'lucide-react'

type Tab = 'profile' | 'security' | 'sessions'

interface ProfileForm {
  name: string
  timezone: string
}

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { user, refreshUser } = useAuthStore()
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const revokeSession = useRevokeSession()
  const revokeAll = useRevokeAllSessions()

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      timezone: user?.timezone || 'America/Sao_Paulo',
    },
  })

  const passwordForm = useForm<PasswordForm>()

  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileSaving(true)
    try {
      await api.patch('/auth/me', data)
      await refreshUser()
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setProfileSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('As senhas não coincidem')
      return
    }
    setPasswordSaving(true)
    try {
      await api.post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      passwordForm.reset()
      toast.success('Senha alterada com sucesso!')
    } catch {
      toast.error('Erro ao alterar senha. Verifique a senha atual.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId)
      toast.success('Sessão revogada')
    } catch {
      toast.error('Erro ao revogar sessão')
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Revogar todas as outras sessões? Você permanecerá logado apenas neste dispositivo.')) return
    try {
      await revokeAll.mutateAsync()
      toast.success('Todas as sessões foram revogadas')
    } catch {
      toast.error('Erro ao revogar sessões')
    }
  }

  const tabs = [
    { id: 'profile' as Tab, label: 'Perfil', icon: User },
    { id: 'security' as Tab, label: 'Segurança', icon: Shield },
    { id: 'sessions' as Tab, label: 'Sessões', icon: Monitor },
  ]

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return Monitor
    if (/mobile|android|iphone/i.test(userAgent)) return Smartphone
    if (/bot|crawler/i.test(userAgent)) return Globe
    return Monitor
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie seu perfil e preferências
        </p>
      </div>

      {/* Pill tabs on mobile, sidebar on desktop */}
      <div className="flex flex-col md:flex-row md:gap-8">
        <div className="-mx-5 px-5 md:mx-0 md:w-48 md:px-0">
          <nav className="inline-flex gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-card md:flex md:w-full md:flex-col md:rounded-2xl md:p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex min-h-[36px] shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all md:w-full md:rounded-xl md:px-3 md:py-2.5',
                  activeTab === tab.id
                    ? 'bg-foreground text-background shadow-sm md:bg-accent md:text-accent-foreground md:shadow-none'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-5 flex-1 md:mt-0">
          {activeTab === 'profile' && (
            <div className="max-w-lg space-y-6">
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <h3 className="text-base font-semibold text-card-foreground">
                  Informações do Perfil
                </h3>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="mt-5 space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <input
                      {...profileForm.register('name')}
                      className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fuso Horário</label>
                    <select
                      {...profileForm.register('timezone')}
                      className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                      <option value="America/Manaus">Manaus (UTC-4)</option>
                      <option value="America/Belem">Belém (UTC-3)</option>
                      <option value="America/Fortaleza">Fortaleza (UTC-3)</option>
                      <option value="America/Recife">Recife (UTC-3)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                      <option value="Europe/London">London (UTC+0)</option>
                      <option value="Europe/Lisbon">Lisboa (UTC+0)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >
                    {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-lg space-y-6">
              <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
                <h3 className="text-base font-semibold text-card-foreground">
                  Alterar Senha
                </h3>
                {user?.auth_provider === 'google' ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sua conta está vinculada ao Google. A senha é gerenciada pela sua conta Google.
                  </p>
                ) : (
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="mt-5 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Senha Atual</label>
                      <input
                        type="password"
                        {...passwordForm.register('current_password', { required: true })}
                        className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nova Senha</label>
                      <input
                        type="password"
                        {...passwordForm.register('new_password', { required: true, minLength: 8 })}
                        className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        {...passwordForm.register('confirm_password', { required: true })}
                        className="flex h-11 w-full rounded-xl border-0 bg-secondary px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                    >
                      {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Alterar Senha
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Sessões Ativas
                </h3>
                <button
                  onClick={handleRevokeAll}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar todas
                </button>
              </div>

              {sessionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-card shadow-card" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions?.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.user_agent)
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">
                              {session.device_name || 'Dispositivo desconhecido'}
                              {session.is_current && (
                                <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                  Atual
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.ip_address && `${session.ip_address} · `}
                              {new Date(session.last_active_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        {!session.is_current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
