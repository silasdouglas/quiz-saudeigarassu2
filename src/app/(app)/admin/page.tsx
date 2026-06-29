import { requireAdmin } from "@/lib/dal";
import { fetchAdminStatsAction } from "@/app/(app)/admin/actions";
import { AdminDashboardLive } from "@/components/admin/dashboard-live";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const initialStats = await fetchAdminStatsAction();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      </div>
      <AdminDashboardLive initialStats={initialStats} />
    </div>
  );
}
