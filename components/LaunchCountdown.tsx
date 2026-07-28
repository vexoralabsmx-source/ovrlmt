"use client";

import { useEffect, useState } from "react";

export function LaunchCountdown({ launchAt }: { launchAt?: string }) {
  const target = launchAt ? new Date(launchAt).getTime() : 0;
  const [remaining, setRemaining] = useState(Math.max(0, target - Date.now()));
  useEffect(() => {
    if (!target) return;
    const interval = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => window.clearInterval(interval);
  }, [target]);
  if (!target || remaining <= 0) return null;
  const seconds = Math.floor(remaining / 1000);
  const values = [
    ["DÍAS", Math.floor(seconds / 86400)],
    ["HORAS", Math.floor(seconds % 86400 / 3600)],
    ["MIN", Math.floor(seconds % 3600 / 60)],
    ["SEG", seconds % 60],
  ] as const;
  return <section className="launch-countdown" aria-label="Cuenta regresiva para el próximo lanzamiento"><p>PRÓXIMO DROP EN</p><div>{values.map(([label, value]) => <span key={label}><b>{String(value).padStart(2, "0")}</b><small>{label}</small></span>)}</div></section>;
}
