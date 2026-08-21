"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export function PasswordRecoveryPanel() {
  const initialized = useRef(false);
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("access_token") || "";
    const recoveryError = hash.get("error_description");

    if (token) {
      setAccessToken(token);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setMessage(recoveryError ? recoveryError.replace(/\+/g, " ") : "El enlace no es válido o ya expiró. Solicita uno nuevo.");
    }
    setReady(true);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.ok) {
      setMessage(result.message || result.error || "No pudimos cambiar tu contraseña.");
      return;
    }

    setSuccess(true);
    setAccessToken("");
    setMessage("Tu contraseña se actualizó correctamente.");
  }

  return (
    <section className="auth-page">
      <div>
        <p className="eyebrow"><i /> OVRLMT ACCOUNT</p>
        <h1>Nueva contraseña.</h1>
        <p className="auth-copy">Crea una contraseña nueva para recuperar el acceso a tu cuenta.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        {success ? (
          <>
            <p className="auth-message success" aria-live="polite">{message}</p>
            <Link className="submit-btn" href="/login"><span>INICIAR SESIÓN</span><KeyRound size={16} /></Link>
          </>
        ) : (
          <>
            <label><span>NUEVA CONTRASEÑA</span><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={!accessToken} /></label>
            <label><span>CONFIRMAR CONTRASEÑA</span><input type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" disabled={!accessToken} /></label>
            {ready && message && <p className="auth-message" aria-live="polite">{message}</p>}
            {ready && !accessToken && <Link className="auth-retry" href="/login">SOLICITAR OTRO ENLACE</Link>}
            <button className="submit-btn" disabled={loading || !accessToken} type="submit"><span>{loading ? "ACTUALIZANDO" : "GUARDAR CONTRASEÑA"}</span><KeyRound size={16} /></button>
          </>
        )}
      </form>
    </section>
  );
}
