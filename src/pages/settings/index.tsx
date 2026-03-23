import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie seu perfil e preferências
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <nav className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="max-w-lg space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Informações do Perfil
                </h3>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="mt-4 space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <input
                      {...profileForm.register('name')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fuso Horário</label>
                    <select
                      {...profileForm.register('timezone')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Alterar Senha
                </h3>
                {user?.auth_provider === 'google' ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sua conta está vinculada ao Google. A senha é gerenciada pela sua conta Google.
                  </p>
                ) : (
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="mt-4 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Senha Atual</label>
                      <input
                        type="password"
                        {...passwordForm.register('current_password', { required: true })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nova Senha</label>
                      <input
                        type="password"
                        {...passwordForm.register('new_password', { required: true, minLength: 8 })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        {...passwordForm.register('confirm_password', { required: true })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                <h3 className="text-lg font-semibold text-foreground">
                  Sessões Ativas
                </h3>
                <button
                  onClick={handleRevokeAll}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar todas
                </button>
              </div>

              {sessionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions?.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.user_agent)
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                      >
                        <div className="flex items-center gap-3">
                          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-card-foreground">
                              {session.device_name || 'Dispositivo desconhecido'}
                              {session.is_current && (
                                <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                                  Atual
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.ip_address && `IP: ${session.ip_address} · `}
                              Último acesso:{' '}
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
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
