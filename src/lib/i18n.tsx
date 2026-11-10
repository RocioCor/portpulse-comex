import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type Lang = "en" | "es";
const dict = {
  en: {
    app: "Port Release Desk", tagline: "Customs releases, 2-hour SIM windows and storage deadlines in one place.",
    open: "Open requests", simActive: "SIM window active", dueToday: "Storage expires today", expiring: "Expiring ≤ 2 days",
    newReq: "New request", decl: "Declaration number", port: "Port / Customs office", storage: "Free storage expires",
    sim: "2-hour SIM window", auto: "Auto-send SIM pickup notice", autoHint: "Notify the team automatically when the 2-hour window opens.",
    submit: "Submit request", saved: "Request saved", savedMsg: "has been added to the dashboard.",
    all: "All", search: "Search declaration or port", status: "Stage", none: "No requests match these filters.",
    notified: "Notice sent", autoOn: "Auto on", autoOff: "Auto off", left: "left", windowClosed: "Window expired",
    days: "days", today: "Expires today", expired: "Storage expired", reqs: "Requests", required: "Required",
    st: { pending: "Pending customs check", sim_active: "SIM pickup window active", ready: "Ready for port pickup", completed: "Completed" },
    w: { not_open: "Not open", open: "Open", closed: "Closed" },
  },
  es: {
    app: "Mesa de Liberación Portuaria", tagline: "Liberaciones aduaneras, ventanas SIM de 2 horas y plazos de almacenaje en un solo lugar.",
    open: "Solicitudes abiertas", simActive: "Ventana SIM activa", dueToday: "Almacenaje vence hoy", expiring: "Vence en ≤ 2 días",
    newReq: "Nueva solicitud", decl: "Número de declaración", port: "Puerto / Aduana", storage: "Vence almacenaje libre",
    sim: "Ventana SIM de 2 horas", auto: "Enviar aviso SIM automáticamente", autoHint: "Avisar al equipo automáticamente cuando se abra la ventana de 2 horas.",
    submit: "Enviar solicitud", saved: "Solicitud guardada", savedMsg: "se agregó al panel.",
    all: "Todas", search: "Buscar declaración o puerto", status: "Etapa", none: "No hay solicitudes con estos filtros.",
    notified: "Aviso enviado", autoOn: "Auto activo", autoOff: "Auto apagado", left: "restante", windowClosed: "Ventana vencida",
    days: "días", today: "Vence hoy", expired: "Almacenaje vencido", reqs: "Solicitudes", required: "Obligatorio",
    st: { pending: "Revisión aduanera pendiente", sim_active: "Ventana SIM activa", ready: "Listo para retiro en puerto", completed: "Completado" },
    w: { not_open: "No abierta", open: "Abierta", closed: "Cerrada" },
  },
};
export type Dict = typeof dict.en;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({ lang: "es", setLang: () => {}, t: dict.es });
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");
  useEffect(() => { const s = localStorage.getItem("lang"); if (s === "en" || s === "es") setLang(s); }, []);
  const set = (l: Lang) => { setLang(l); localStorage.setItem("lang", l); document.documentElement.lang = l; };
  return <Ctx.Provider value={{ lang, setLang: set, t: dict[lang] as Dict }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
