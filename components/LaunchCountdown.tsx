"use client";

import { useEffect, useState } from "react";

const DEFAULT_LAUNCH_AT = "2026-08-09T15:00:00-06:00";

function getLaunchTime(launchAt?: string): number {
  const parsed = new Date(launchAt ?? DEFAULT_LAUNCH_AT).getTime();
  return Number.isNaN(parsed) ? new Date(DEFAULT_LAUNCH_AT).getTime() : parsed;
}

export function LaunchCountdown({ launchAt }: { launchAt?: string }) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    const target = getLaunchTime(launchAt);
    const initialRemaining = Math.max(0, target - Date.now());

    setRemaining(initialRemaining);
    if (initialRemaining === 0) return;

    const tick = () => {
      const nextRemaining = Math.max(0, target - Date.now());
      setRemaining(nextRemaining);

      if (nextRemaining === 0) window.clearInterval(interval);
    };
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
