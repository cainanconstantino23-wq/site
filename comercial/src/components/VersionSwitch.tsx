import { Link, useLocation } from "react-router-dom";

const versions = [
  { path: "/", label: "v1 · cinematic" },
  { path: "/v2", label: "v2 · minimal" },
  { path: "/v3", label: "v3 · alive" },
];

export const VersionSwitch = () => {
  const { pathname } = useLocation();
  const current = pathname === "/" ? "/" : pathname;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-1 p-1 backdrop-blur-md border rounded-full"
      style={{
        background: "rgba(20,20,20,0.85)",
        borderColor: "rgba(255,255,255,0.12)",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      {versions.map((v) => {
        const active = current === v.path;
        return (
          <Link
            key={v.path}
            to={v.path}
            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded-full transition-all"
            style={{
              background: active ? "#F4F0E8" : "transparent",
              color: active ? "#161616" : "rgba(244,240,232,0.7)",
            }}
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
};
