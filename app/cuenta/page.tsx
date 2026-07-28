import { AccountDashboard } from "@/components/AccountDashboard";
import { PageFrame } from "@/components/PageFrame";

export const metadata = { title: "Mi cuenta" };

export default function AccountPage() {
  return <PageFrame><AccountDashboard /></PageFrame>;
}
