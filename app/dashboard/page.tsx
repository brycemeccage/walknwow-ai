import { Dashboard } from "@/components/dashboard";
import { AppShell } from "@/components/layout/AppShell";
import { Footer } from "@/components/layout/Footer";

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
      <Footer />
    </AppShell>
  );
}
