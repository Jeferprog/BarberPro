import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    // Verifica se já foi dispensado
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) return;

    // Escuta o evento de instalação
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
      <div 
        className="bg-card rounded-2xl p-4 flex items-center gap-4 border-2 border-primary/20"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div 
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Download className="h-6 w-6 text-primary-foreground" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm">Instalar BarberPro</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adicione à tela inicial para acesso rápido
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="h-9 w-9 rounded-xl bg-background flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
