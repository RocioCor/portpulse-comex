import { useEffect, useState } from "react";

export function SailingShip() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden">
      <div className="absolute bottom-1 animate-sail">
        <svg width="120" height="48" viewBox="0 0 120 48" className="animate-bob">
          <rect x="22" y="8" width="16" height="10" fill="var(--danger)" />
          <rect x="39" y="8" width="16" height="10" fill="var(--success)" />
          <rect x="56" y="8" width="16" height="10" fill="var(--warning)" />
          <rect x="30" y="-2" width="16" height="10" fill="var(--warning)" />
          <rect x="47" y="-2" width="16" height="10" fill="var(--danger)" />
          <rect x="78" y="2" width="10" height="16" fill="currentColor" opacity=".9" />
          <path d="M8 18 H112 L100 34 H18 Z" fill="currentColor" />
        </svg>
      </div>
      <svg className="absolute bottom-0 h-3 w-[200%] animate-wave opacity-40" viewBox="0 0 200 10" preserveAspectRatio="none">
        <path d="M0 5 Q5 0 10 5 T20 5 T30 5 T40 5 T50 5 T60 5 T70 5 T80 5 T90 5 T100 5 T110 5 T120 5 T130 5 T140 5 T150 5 T160 5 T170 5 T180 5 T190 5 T200 5 V10 H0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const f = () => setShow(window.scrollY > 400); f(); window.addEventListener("scroll", f); return () => window.removeEventListener("scroll", f); }, []);
  if (!show) return null;
  return (
    <button aria-label="Volver arriba" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-navy text-navy-foreground text-xl font-bold shadow-lg transition hover:scale-110">↑</button>
  );
}
