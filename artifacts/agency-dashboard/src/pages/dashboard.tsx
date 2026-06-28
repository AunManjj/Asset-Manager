import { Suspense, lazy } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

const ImmersiveScene = lazy(() => import("@/components/3d/ImmersiveScene").then(m => ({ default: m.ImmersiveScene })));

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl animate-pulse" />
        <div className="text-white text-lg font-medium">Loading AgencyOS 3D...</div>
        <div className="text-gray-500 text-sm mt-2">Preparing your data universe</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      {/* 3D Scene */}
      <Suspense fallback={<LoadingFallback />}>
        <ImmersiveScene />
      </Suspense>

      {/* HUD Overlay */}
      <div className="fixed top-6 left-6 z-50 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
          <div className="text-white font-bold text-sm">AgencyOS</div>
          <div className="text-gray-400 text-xs">Cinematic Mode</div>
        </div>
      </div>

      {/* Live KPI strip */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex gap-3 bg-black/40 backdrop-blur-xl rounded-2xl px-5 py-2.5 border border-white/10">
          <div className="text-center px-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Revenue</div>
            <div className="text-sm font-bold text-emerald-400">
              ${((summary?.totalRevenue ?? 0) / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center px-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Clients</div>
            <div className="text-sm font-bold text-indigo-400">{summary?.activeClients ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center px-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Campaigns</div>
            <div className="text-sm font-bold text-amber-400">{summary?.activeCampaigns ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center px-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">ROAS</div>
            <div className="text-sm font-bold text-violet-400">{summary?.avgRoas?.toFixed(1) ?? 0}x</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center px-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Alerts</div>
            <div className="text-sm font-bold text-red-400">{summary?.openNotifications ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 text-gray-400 text-xs">
          Arrow keys to navigate manually
        </div>
      </div>
    </div>
  );
}
