import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CadeiraCheia — Agendamento Premium" },
      {
        name: "description",
        content: "Sistema completo de agendamento e gestao para barbearias.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/app" });
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        {/* Logo / Icon */}
        <div className="animate-pulse">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/30">
            <Scissors className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Brand */}
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-foreground">
          Cadeira<span className="text-primary">Cheia</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Agendamento premium para barbearias
        </p>

        {/* Loading indicator */}
        <div className="mt-12 flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </MobileShell>
  );
}
