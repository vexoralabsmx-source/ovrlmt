"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { ADMIN_EMAIL } from "@/src/lib/authConfig";
import { getBrowserSession, setBrowserSession } from "@/src/lib/sessionStorage";

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
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

    const cleanEmail = email.trim().toLowerCase();
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
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
        <h1>{mode === "login" ? "Inicia sesion." : "Crea tu cuenta."}</h1>
        <p className="auth-copy">Entra para ver tus pedidos, revisar estados y recibir actualizaciones de seguimiento.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>ENTRAR</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>REGISTRO</button>
        </div>
        {mode === "register" && <label><span>NOMBRE</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}
        <label><span>CORREO</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        <label><span>CONTRASENA</span><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {message && <p className="auth-message">{message}</p>}
        <button className="submit-btn" disabled={loading} type="submit"><span>{loading ? "PROCESANDO" : mode === "login" ? "INICIAR SESION" : "CREAR CUENTA"}</span><LogIn size={16} /></button>
      </form>
    </section>
  );
}
