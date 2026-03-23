import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">Orbit</h1>
          <p className="mt-2 text-primary-foreground/80">
            Inteligência para suas reuniões
          </p>
        </div>
        <div className="space-y-6">
          <blockquote className="border-l-2 border-primary-foreground/30 pl-4">
            <p className="text-lg text-primary-foreground/90">
              "Orbit transformou a forma como documentamos e acompanhamos nossas reuniões.
              Agora temos visibilidade total sobre decisões e ações."
            </p>
            <footer className="mt-2 text-sm text-primary-foreground/60">
              — Equipe de Produto
            </footer>
          </blockquote>
        </div>
        <p className="text-sm text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Orbit. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
