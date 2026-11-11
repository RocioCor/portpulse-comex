import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type Lang = "en" | "es";
const dict = {
  en: {
    app: "Port Release Desk", tagline: "Customs releases, 2-hour terminal slots and storage deadlines in one place.",
    open: "Open requests", simActive: "Terminal slot in progress", dueToday: "Storage expires today", expiring: "Expiring ≤ 2 days",
    newReq: "New request", decl: "Declaration number", port: "Port / Customs office", storage: "Terminal storage deadline",
    storageHint: "Last date and time to collect cargo from the port or bonded warehouse without storage charges.",
    demurrage: "Demurrage / shipping line deadline", demurrageHint: "Last date and time to return the empty container without daily equipment charges. Use the deadline agreed with the shipping line (usually 7–14 free days).",
    alertHint: "Dashboard alerts 48 hours before terminal storage and 24 hours before container return. No external messages are sent yet.",
    storageAlert: "Terminal alerts ≤ 48h", demurrageAlert: "Shipping line alerts ≤ 48h",
    collect: "Collect cargo", returnEmpty: "Return empty container", deadlineMissing: "Deadline not entered", deadlineExpired: "Deadline expired", deadlineSoon: "Expires within 48h", deadlineOk: "Within free period",
    sim: "Terminal slot (2 h)", auto: "Auto-send pickup notice", autoHint: "Notify the team automatically when the 2-hour terminal slot starts.",
    submit: "Submit request", saved: "Request saved", savedMsg: "has been added to the dashboard.",
    all: "All", search: "Search declaration or port", status: "Stage", none: "No requests match these filters.",
    notified: "Notice sent", autoOn: "Auto on", autoOff: "Auto off", left: "left", windowClosed: "Window expired",
    days: "days", today: "Expires today", expired: "Storage expired", reqs: "Requests", required: "Required",
    released: "Slot requests due", turnDue: "Request terminal pickup slot", turnN: "Reminder #", turnNext: "Next reminder in", min: "min", booked: "Slot booked", rebook: "Slot failed – request again", bookedAt: "Slot booked at", freeLeft: "free days left", demurrageAlert24: "Shipping line alerts ≤ 24h", soon24: "Expires within 24h – avoid rental charges",
    st: { pending: "Pending customs check", released: "Released by customs", sim_active: "Terminal slot in progress", ready: "Ready for port pickup", completed: "Completed" },
    w: { not_open: "Request urgently", open: "Requested", closed: "Slot finished" },
  },
  es: {
    app: "Mesa de Liberación Portuaria", tagline: "Liberaciones aduaneras, turnos de terminal de 2 horas y plazos de almacenaje en un solo lugar.",
    open: "Solicitudes abiertas", simActive: "Turno terminal en curso", dueToday: "Almacenaje vence hoy", expiring: "Vence en ≤ 2 días",
    newReq: "Nueva solicitud", decl: "Número de declaración", port: "Puerto / Aduana", storage: "Vencimiento de almacenaje en terminal",
    storageHint: "Fecha y hora límite para retirar la carga del puerto o depósito fiscal sin cobro de estadías por espacio.",
    demurrage: "Vencimiento demurrage / naviera", demurrageHint: "Fecha y hora límite para devolver el contenedor vacío sin cobro diario del equipo. Ingresa el plazo acordado con la naviera (habitualmente 7 a 14 días libres).",
    alertHint: "Alertas en el panel 48 horas antes del almacenaje y 24 horas antes de la devolución del contenedor. Aún no se envían mensajes externos.",
    storageAlert: "Alertas terminal ≤ 48 h", demurrageAlert: "Alertas naviera ≤ 48 h",
    collect: "Retirar carga", returnEmpty: "Devolver contenedor vacío", deadlineMissing: "Fecha no ingresada", deadlineExpired: "Plazo vencido", deadlineSoon: "Vence en 48 h o menos", deadlineOk: "Dentro del plazo libre",
    sim: "Turno terminal (2 h)", auto: "Enviar aviso de retiro automáticamente", autoHint: "Avisar al equipo automáticamente cuando comience el turno de 2 horas en la terminal.",
    submit: "Enviar solicitud", saved: "Solicitud guardada", savedMsg: "se agregó al panel.",
    all: "Todas", search: "Buscar declaración o puerto", status: "Etapa", none: "No hay solicitudes con estos filtros.",
    notified: "Aviso enviado", autoOn: "Auto activo", autoOff: "Auto apagado", left: "restante", windowClosed: "Ventana vencida",
    days: "días", today: "Vence hoy", expired: "Almacenaje vencido", reqs: "Solicitudes", required: "Obligatorio",
    released: "Turnos por pedir", turnDue: "Pedir turno en terminal para retiro", turnN: "Aviso n.º", turnNext: "Próximo aviso en", min: "min", booked: "Turno reservado", rebook: "Turno falló – volver a pedir", bookedAt: "Turno reservado a las", freeLeft: "días libres restantes", demurrageAlert24: "Alertas naviera ≤ 24 h", soon24: "Vence en menos de 24 h – evitar cobro de alquiler",
    st: { pending: "Revisión aduanera pendiente", released: "Librado por aduana", sim_active: "Turno terminal en curso", ready: "Listo para retiro en puerto", completed: "Completado" },
    w: { not_open: "Pedir urgente", open: "Pedido", closed: "Turno cumplido" },
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
