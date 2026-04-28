import type { ReactNode } from "react";

export function MobileShell({ children, withBottomNav = false }: { children: ReactNode; withBottomNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div
        className="relative w-full max-w-[430px] min-h-[100dvh] bg-background"
        style={{ paddingBottom: withBottomNav ? "84px" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
