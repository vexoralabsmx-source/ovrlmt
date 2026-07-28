"use client";

import { useEffect, useState } from "react";

export function InitialLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("ovrlmt-loader-seen")) return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("ovrlmt-loader-seen", "1");
      setVisible(false);
    }, 950);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <div className="initial-loader" aria-label="Cargando OVRLMT">
    <div className="loader-frame">
      <span>OVRLMT</span>
      <b>BOOTING DROP TELEMETRY</b>
      <i />
      <small>AD/001 · SPEED INDEX · 99.7</small>
    </div>
  </div>;
}
