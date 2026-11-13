import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import portHeader from "@/assets/port-header.jpg";

const input = "w-full h-14 rounded-lg border-2 border-input bg-card px-4 text-lg focus:border-primary outline-none";

const L = {
  es: { welcome: "Bienvenido a PortPulse", about: "Controlá en un solo lugar los despachos librados plaza, los turnos de terminal cada 2 horas y los vencimientos de almacenaje y naviera, con avisos a tiempo para evitar tarifas extra por vencimientos.", in: "Entra para ver las operaciones del equipo.", up: "Crea tu cuenta del equipo.", google: "Continuar con Google", email: "Correo", pw: "Contraseña", enter: "Entrar", create: "Crear cuenta", toUp: "¿No tienes cuenta? Crear una", toIn: "Ya tengo cuenta", bad: "Correo o contraseña incorrectos.", check: "Revisa tu correo y confirma tu cuenta para entrar.", gErr: "No se pudo entrar con Google." },
  en: { welcome: "Welcome to PortPulse", about: "Track customs releases, 2-hour terminal slots and storage and shipping line deadlines in one place, with timely alerts to avoid extra fees from expired deadlines.", in: "Sign in to see the team's operations.", up: "Create your team account.", google: "Continue with Google", email: "Email", pw: "Password", enter: "Sign in", create: "Create account", toUp: "No account? Create one", toIn: "I already have an account", bad: "Wrong email or password.", check: "Check your email and confirm your account to sign in.", gErr: "Could not sign in with Google." },
};

export function Login() {
  const { lang, setLang } = useI18n(); const l = L[lang];
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    if (mode === "in") { const { error } = await supabase.auth.signInWithPassword({ email, password: pw }); if (error) setMsg(l.bad); }
    else { const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } }); setMsg(error ? error.message : l.check); }
    setBusy(false);
  };
  const google = async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } }); if (r.error) setMsg(l.gErr); };
  return (
    <div className="relative min-h-screen bg-navy text-navy-foreground flex items-center justify-center p-4 overflow-hidden">
      <img src={portHeader} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-navy/75" aria-hidden="true" />
      <div className="absolute top-4 right-4 flex gap-2">
        {(["es", "en"] as const).map((k) => <button key={k} type="button" onClick={() => setLang(k)} aria-pressed={lang === k} className={"w-20 rounded-md px-3 py-2 text-sm font-semibold border border-navy-foreground/40 " + (lang === k ? "bg-navy-foreground text-navy" : "bg-navy/40")}>{k === "es" ? "Español" : "English"}</button>)}
      </div>
      <div className="relative w-full max-w-md space-y-6">
      <div className="text-center space-y-2 drop-shadow-lg">
        <h1 className="text-3xl font-bold">⚓ {l.welcome}</h1>
        <p className="text-base opacity-95">{l.about}</p>
      </div>
      <div className="w-full rounded-xl shadow-2xl bg-card text-foreground p-6 space-y-4">
        <p className="text-muted-foreground">{mode === "in" ? l.in : l.up}</p>
        <button type="button" onClick={google} className="w-full h-14 rounded-lg border flex items-center justify-center gap-[10px] px-3 font-medium" style={{ background: "#FFFFFF", borderColor: "#747775", color: "#1F1F1F" }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          {l.google}
        </button>
        <form onSubmit={submit} className="space-y-3">
          <label className="block font-medium">{l.email}<input required type="email" className={input + " mt-1"} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block font-medium">{l.pw}<input required type="password" minLength={6} className={input + " mt-1"} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <Button type="submit" disabled={busy} className="w-full h-14 text-lg">{mode === "in" ? l.enter : l.create}</Button>
        </form>
        {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
        <button type="button" className="text-sm underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>{mode === "in" ? l.toUp : l.toIn}</button>
      </div>
      </div>
    </div>
  );
}
