import Link from "next/link";
import type { ReactNode } from "react";
import { PageFrame } from "@/components/PageFrame";

export function PolicyPage({ code, title, intro, items, children }: { code: string; title: string; intro: string; items: string[]; children?: ReactNode }) {
  return <PageFrame><section className="policy-page"><p className="eyebrow">{code}</p><h1>{title}</h1><p className="policy-intro">{intro}</p><div className="policy-list">{items.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></article>)}</div>{children}<div className="policy-actions"><Link className="btn primary" href="/drop">VER DROP</Link><Link className="btn ghost" href="/contact">CONTACTAR</Link></div></section></PageFrame>;
}
