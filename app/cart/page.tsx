import { Suspense } from "react";
import { CartPage } from "@/components/CartPage";
import { PageFrame } from "@/components/PageFrame";
import { TrustSection } from "@/components/CommerceSections";

export const metadata = {
  title: "Checkout",
  description: "Finaliza tu pedido OVRLMT con tarjeta de crédito, débito o transferencia.",
};

export default function Cart() {
  return (
    <PageFrame>
      <Suspense fallback={<section className="cart-page cart-page-empty"><p className="eyebrow">SECURE CHECKOUT / LOADING</p></section>}>
        <CartPage />
      </Suspense>
      <TrustSection />
    </PageFrame>
  );
}
