import { requireManager } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const manager = await requireManager();
  return <AppShell managerName={manager.name}>{children}</AppShell>;
}
