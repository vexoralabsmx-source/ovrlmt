import { PageFrame } from "@/components/PageFrame";
import { SizeGuideContent } from "@/components/SizeGuideContent";
export const metadata = {
  title: "Guía de tallas",
  description:
    "Cómo medirte y elegir CH, M, G o XG en playeras y sudaderas OVRLMT.",
  alternates: { canonical: "/size-guide" },
};
export default function SizeGuide() {
  return (
    <PageFrame>
      <section className="page-hero size-hero">
        <p className="eyebrow">OVRLMT / ENCUENTRA TU FIT</p>
        <h1>
          GUÍA DE
          <br />
          TALLAS.
        </h1>
      </section>
      <section className="size-section section-pad">
        <SizeGuideContent />
      </section>
    </PageFrame>
  );
}
