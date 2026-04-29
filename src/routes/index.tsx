import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, User, ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarberPro — Agendamento Premium para Barbearias" },
      { name: "description", content: "Agende seu corte com facilidade. App premium para clientes e barbearias." },
      { property: "og:title", content: "BarberPro — Agendamento Premium" },
      { property: "og:description", content: "App mobile-first de agendamento para barbearias." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <MobileShell>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
        <div
          className="h-20 w-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          <Scissors className="h-10 w-10 text-primary-foreground" strokeWidth={2.4} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">BarberPro</h1>
        <p className="mt-3 text-muted-foreground max-w-sm">
          Estilo, precisão e agendamento premium na palma da sua mão.
        </p>

        <div className="mt-12 w-full space-y-3">
          <Link
            to="/app"
            className="flex items-center justify-between w-full p-5 rounded-2xl bg-card hover:bg-card-elevated transition-colors"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Sou Cliente</div>
                <div className="text-xs text-muted-foreground">Agendar meu horário</div>
              </div>
            </div>
            <span className="text-primary">→</span>
          </Link>

          <Link
            to="/admin"
            className="flex items-center justify-between w-full p-5 rounded-2xl bg-card hover:bg-card-elevated transition-colors"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Sou a Barbearia</div>
                <div className="text-xs text-muted-foreground">Painel de gestão</div>
              </div>
            </div>
            <span className="text-primary">→</span>
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground">v1.0 • Desenvolvido por JDD</p>
      </div>
    </MobileShell>
  );
}
