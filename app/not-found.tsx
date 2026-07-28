import Link from "next/link";

export default function NotFound() { return <main className="not-found"><p className="eyebrow">ERROR SYSTEM / 404</p><span>404</span><h1>FUERA DEL<br /><em>LÍMITE.</em></h1><p>Esta ruta no existe o fue movida. Vuelve al inicio o entra directamente al drop activo.</p><div><Link className="btn primary" href="/">VOLVER AL INICIO</Link><Link className="btn ghost" href="/drop">VER DROP</Link></div></main>; }
