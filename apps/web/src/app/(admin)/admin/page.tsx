import { getAdminStats, getAdminSystemHealth } from '@/lib/api';
import { AdminDashboard } from '@/components/admin-dashboard';

export default async function AdminHome() {
  const [stats, health] = await Promise.all([
    getAdminStats(),
    getAdminSystemHealth(),
  ]);

  return (
    <main className="shell-page space-y-6">
      <header className="shell-header" style={{ marginBottom: '32px' }}>
        <span className="ui-eyebrow">PLATFORM</span>
        <h1>Administration & System Oversight</h1>
        <p>
          High-level operational health, cross-tenant telemetry, recent security audit events,
          and audited support elevation management.
        </p>
      </header>

      <AdminDashboard stats={stats} health={health} />
    </main>
  );
}
