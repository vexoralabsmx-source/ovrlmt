import { Suspense } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { PageFrame } from "@/components/PageFrame";

export const metadata = { title: "Iniciar sesion" };

export default function LoginPage() {
  return <PageFrame><Suspense fallback={null}><AuthPanel /></Suspense></PageFrame>;
}
