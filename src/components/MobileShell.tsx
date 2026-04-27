import type { ReactNode } from "react";

export function MobileShell({ children, withBottomNav = false }: { children: ReactNode; withBottomNav?: boolean }) {
  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div
        className="relative w-full max-w-[430px] min-h-screen bg-background"
        style={{ paddingBottom: withBottomNav ? "84px" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
