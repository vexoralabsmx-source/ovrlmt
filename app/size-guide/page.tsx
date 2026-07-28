import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Size Guide" };
const rows = [["S","55","70","53","22"],["M","58","73","56","23"],["L","61","76","59","24"],["XL","64","79","62","25"],["XXL","67","82","65","26"]];
export default function SizeGuide() { return <PageFrame>
  <section className="page-hero size-hero"><p className="eyebrow">GARMENT SYSTEM / FIT DATA</p><h1>SIZE<br />GUIDE</h1><div className="page-intro"><p>PREMIUM FIT.<br />MEDIDAS EN CENTÍMETROS.</p><span>GS/01 — UNISEX</span></div></section>
  <section className="size-section section-pad"><Reveal><div className="size-note"><span>FIT NOTE / 001</span><p>Corte premium pensado para uso diario, con presencia limpia y estructura cómoda. Revisa las medidas antes de confirmar tu talla.</p></div></Reveal>
  <Reveal delay={.1}><div className="table-wrap"><table><thead><tr><th>TALLA</th><th>PECHO</th><th>LARGO</th><th>HOMBRO</th><th>MANGA</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}>{r.map((v,i) => <td key={i}>{i === 0 ? v : `${v} CM`}</td>)}</tr>)}</tbody></table></div></Reveal>
  <div className="measure-grid"><div><span>A</span><p>PECHO</p><small>DE AXILA A AXILA</small></div><div><span>B</span><p>LARGO</p><small>HOMBRO A TERMINACIÓN</small></div><div><span>C</span><p>HOMBRO</p><small>COSTURA A COSTURA</small></div><div><span>D</span><p>MANGA</p><small>HOMBRO A PUÑO</small></div></div></section>
</PageFrame> }
