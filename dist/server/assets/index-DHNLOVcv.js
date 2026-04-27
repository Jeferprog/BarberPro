import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Scissors, User, ShieldCheck } from "lucide-react";
import { M as MobileShell } from "./MobileShell-CjviHgqT.js";
function Landing() {
  return /* @__PURE__ */ jsx(MobileShell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "h-20 w-20 rounded-3xl flex items-center justify-center mb-6", style: {
      background: "var(--gradient-gold)",
      boxShadow: "var(--shadow-gold)"
    }, children: /* @__PURE__ */ jsx(Scissors, { className: "h-10 w-10 text-primary-foreground", strokeWidth: 2.4 }) }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "BarberPro" }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-sm", children: "Estilo, precisão e agendamento premium na palma da sua mão." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-12 w-full space-y-3", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/app", className: "flex items-center justify-between w-full p-5 rounded-2xl bg-card hover:bg-card-elevated transition-colors", style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Sou Cliente" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Agendar meu horário" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "→" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "flex items-center justify-between w-full p-5 rounded-2xl bg-card hover:bg-card-elevated transition-colors", style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Sou a Barbearia" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Painel de gestão" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "→" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-12 text-xs text-muted-foreground", children: "v1.0 • Demo com dados mockados" })
  ] }) });
}
export {
  Landing as component
};
