import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "La marca", description: "Built After Dark: la historia de OVRLMT, streetwear nacido en Puebla.", alternates: { canonical: "/story" } };
const chapters = [
  { n: "01", title: "BUILT AFTER DARK", copy: "OVRLMT nace de la ciudad después de medianoche: del asfalto, las luces rojas y el ruido de quienes siguen avanzando cuando todo se apaga." },
  { n: "02", title: "LIMITS ARE FICTION", copy: "No es solo ropa. Es una mentalidad: vivir fuera del margen, construir tu propio camino y no pedir permiso para destacar." },
  { n: "03", title: "MADE IN MEXICO", copy: "Diseñado desde Puebla. Construido con identidad local, ambición global y respeto por cada detalle de la prenda." },
  { n: "04", title: "DROP CULTURE", copy: "Cada drop captura una etapa del movimiento: nuevos gráficos, colaboraciones y formas de llevar la noche." },
];
export default function Story() { return <PageFrame>
  <section className="page-hero story-hero"><p className="eyebrow">BRAND FILE / 000</p><h1>WE EXIST<br />BEYOND THE<br /><em>LIMIT.</em></h1><p>OVRLMT / EST. 2026<br />PUEBLA, MEXICO</p></section>
  <section className="chapters section-pad">{chapters.map((c,i) => <Reveal key={c.n}><article className="chapter"><div className="chapter-art"><span>{c.n}</span><div className={`orb orb-${i}`} /></div><div className="chapter-copy"><span>CHAPTER / {c.n}</span><h2>{c.title}</h2><p>{c.copy}</p></div></article></Reveal>)}</section>
</PageFrame> }
