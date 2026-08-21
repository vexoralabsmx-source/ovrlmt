import { PasswordRecoveryPanel } from "@/components/PasswordRecoveryPanel";
import { PageFrame } from "@/components/PageFrame";

export const metadata = { title: "Recuperar contraseña" };

export default function PasswordRecoveryPage() {
  return <PageFrame><PasswordRecoveryPanel /></PageFrame>;
}
