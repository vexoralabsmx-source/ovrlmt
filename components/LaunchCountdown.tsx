"use client";

import { useEffect, useState } from "react";

function getTomorrow3PM(launchAt?: string): number {
  if (launchAt) {
    const parsed = new Date(launchAt).getTime();
    if (!isNaN(parsed) && parsed > Date.now()) return parsed;
  }
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + 1);
  target.setHours(15, 0, 0, 0);
  return target.getTime();
}

export function LaunchCountdown({ launchAt }: { launchAt?: string }) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    const target = getTomorrow3PM(launchAt);
    const tick = () => {
      setRemaining(Math.max(0, target - Date.now()));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [launchAt]);

  const seconds = Math.floor(remaining / 1000);
  const values = [
    ["DÍAS", Math.floor(seconds / 86400)],
    ["HORAS", Math.floor((seconds % 86400) / 3600)],
    ["MIN", Math.floor((seconds % 3600) / 60)],
    ["SEG", seconds % 60],
  ] as const;

  return (
    <section className="launch-countdown" aria-label="Cuenta regresiva Nayiomi.ko X OVRLMT">
      <p>NAYIOMI.KO X OVRLMT — PRÓXIMAMENTE</p>
      <div>
        {values.map(([label, value]) => (
          <span key={label}>
            <b>{mounted ? String(value).padStart(2, "0") : "00"}</b>
            <small>{label}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

