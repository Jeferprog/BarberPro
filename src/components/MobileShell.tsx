import type { ReactNode } from "react";

/**
 * MobileShell — container principal do app mobile.
 *
 * IMPORTANTE: NÃO usar min-h-screen, 100vh ou 100dvh aqui.
 * O iOS Safari congela a UI ao abrir o teclado quando o container
 * usa altura baseada em viewport (100vh/dvh). Em vez disso, usamos
 * height: 100% herdado do #root que já tem -webkit-fill-available
 * configurado no styles.css.
 */
export function MobileShell({ children, withBottomNav = false }: { children: ReactNode; withBottomNav?: boolean }) {
  return (
    <div className="w-full bg-background flex justify-center" style={{ minHeight: "100%" }}>
      <div
        className="relative w-full max-w-[430px] bg-background flex flex-col"
        style={{
          minHeight: "100%",
          paddingBottom: withBottomNav ? "84px" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
