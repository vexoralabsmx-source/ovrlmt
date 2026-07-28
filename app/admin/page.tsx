import { AdminDashboard } from "@/components/AdminDashboard";
import { PageFrame } from "@/components/PageFrame";

export const metadata = { title: "Admin" };

export default function AdminPage() {
  return <PageFrame><AdminDashboard /></PageFrame>;
}
