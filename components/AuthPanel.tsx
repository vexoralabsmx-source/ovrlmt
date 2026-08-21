"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LogIn, Mail } from "lucide-react";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { getBrowserSession, setBrowserSession } from "@/src/lib/sessionStorage";

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getBrowserSession();
    if (!session) return;
    router.replace(session.email.toLowerCase() === ADMIN_EMAIL ? "/admin" : "/cuenta");
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    const endpoint = mode === "login"
      ? "/api/auth/login"
      : mode === "register"
        ? "/api/auth/register"
        : "/api/auth/forgot-password";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password, name }),
    });
    const auth = await response.json();

    setLoading(false);
    if (!response.ok || !auth.ok) {
      setMessage(auth.message || "No pudimos autenticarte.");
      return;
    }

    if (mode === "forgot") {
      setMessage(auth.message);
      setMessageSuccess(true);
      return;
    }

    setBrowserSession({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      email: auth.email,
      isAdmin: Boolean(auth.isAdmin),
    });

    const redirect = searchParams.get("next");
    router.replace(redirect || (auth.isAdmin ? "/admin" : "/cuenta"));
  }

  return (
    <section className="auth-page">
      <div>
        <p className="eyebrow"><i /> OVRLMT ACCOUNT</p>
        <h1>{mode === "login" ? "Inicia sesión." : mode === "register" ? "Crea tu cuenta." : "Recupera tu acceso."}</h1>
        <p className="auth-copy">{mode === "forgot" ? "Te enviaremos un enlace seguro para crear una nueva contraseña." : "Entra para ver tus pedidos, revisar estados y recibir actualizaciones de seguimiento."}</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        {mode === "forgot" ? (
          <button type="button" className="auth-back" onClick={() => { setMode("login"); setMessage(""); setMessageSuccess(false); }}><ArrowLeft size={14} /> VOLVER A INICIAR SESIÓN</button>
        ) : (
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); setMessageSuccess(false); }}>ENTRAR</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); setMessageSuccess(false); }}>REGISTRO</button>
          </div>
        )}
        {mode === "register" && <label><span>NOMBRE</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}
        <label><span>CORREO</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        {mode !== "forgot" && <label><span>CONTRASEÑA</span><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>}
        {mode === "login" && <button type="button" className="auth-forgot" onClick={() => { setMode("forgot"); setMessage(""); setMessageSuccess(false); }}>¿OLVIDASTE TU CONTRASEÑA?</button>}
        {message && <p className={`auth-message${messageSuccess ? " success" : ""}`} aria-live="polite">{message}</p>}
        <button className="submit-btn" disabled={loading} type="submit"><span>{loading ? "PROCESANDO" : mode === "login" ? "INICIAR SESIÓN" : mode === "register" ? "CREAR CUENTA" : "ENVIAR ENLACE"}</span>{mode === "forgot" ? <Mail size={16} /> : <LogIn size={16} />}</button>
      </form>
    </section>
  );
}
