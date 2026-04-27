import { jsx } from "react/jsx-runtime";
function MobileShell({ children, withBottomNav = false }) {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen w-full bg-background flex justify-center", children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "relative w-full max-w-[430px] min-h-screen bg-background",
      style: { paddingBottom: withBottomNav ? "84px" : void 0 },
      children
    }
  ) });
}
export {
  MobileShell as M
};
