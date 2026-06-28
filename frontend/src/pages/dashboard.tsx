import { Suspense, lazy } from "react";
import { useGetDashboardSummary } from "@/api";
import { SceneNavigationProvider, useSceneNavigation, SCENE_ZONES } from "@/hooks/useSceneNavigation";

const ImmersiveScene = lazy(() =>
  import("@/components/3d/ImmersiveScene").then((m) => ({ default: m.ImmersiveScene })),
);

function LoadingFallback() {
  return (
    <div className="absolute inset-0 bg-[#F5F0E8] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E87722] to-[#F97316] opacity-20 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E87722] to-[#F97316] shadow-[0_0_40px_rgba(232,119,34,0.35)] flex items-center justify-center">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
        </div>
        <div className="text-[#0A0A0A] text-lg font-semibold">Loading your ad universe</div>
        <div className="text-[#6B6560] text-sm mt-2">Preparing cinematic dashboard…</div>
      </div>
    </div>
  );
}

function DashboardHud() {
  const { data: summary } = useGetDashboardSummary();
  const { currentZone, goToZone } = useSceneNavigation();

  const glassPanel =
    "bg-white/75 backdrop-blur-xl rounded-2xl border border-[#E87722]/25 shadow-[0_8px_32px_rgba(232,119,34,0.12)]";

  return (
    <>
      <div className="fixed top-6 left-6 z-50 pointer-events-none md:left-[17rem]">
        <div className={`${glassPanel} px-4 py-2.5`}>
          <div className="text-[#0A0A0A] font-bold text-sm tracking-tight">AgencyOS</div>
          <div className="text-[#E87722] text-xs font-semibold mt-0.5">{SCENE_ZONES[currentZone].label}</div>
          <div className="text-[10px] text-[#666666] mt-0.5">Paid ads command center · 10 zones</div>
        </div>
      </div>

      <div className="fixed top-6 right-6 z-50 pointer-events-auto">
        <div className={`${glassPanel} px-2.5 py-2.5 flex flex-col gap-1.5`}>
          {SCENE_ZONES.map((zone, i) => (
            <button
              key={zone.label}
              type="button"
              onClick={() => goToZone(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentZone
                  ? "bg-[#E87722] scale-125 shadow-[0_0_8px_rgba(232,119,34,0.6)]"
                  : "bg-[#EDE6DA] hover:bg-[#F97316]/60"
              }`}
              aria-label={`Go to ${zone.label}`}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none hidden lg:block">
        <div className={`${glassPanel} flex flex-wrap justify-center gap-x-3 gap-y-1 px-5 py-3 max-w-[90vw]`}>
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Revenue</div>
            <div className="text-sm font-bold text-[#E87722]">
              ${((summary?.totalRevenue ?? 0) / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="w-px bg-[#0A0A0A]/10 hidden sm:block" />
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Spend</div>
            <div className="text-sm font-bold text-[#F97316]">
              ${((summary?.totalSpend ?? 0) / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="w-px bg-[#0A0A0A]/10 hidden sm:block" />
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Clients</div>
            <div className="text-sm font-bold text-[#0A0A0A]">{summary?.activeClients ?? 0}</div>
          </div>
          <div className="w-px bg-[#0A0A0A]/10 hidden sm:block" />
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Campaigns</div>
            <div className="text-sm font-bold text-[#0A0A0A]">{summary?.activeCampaigns ?? 0}</div>
          </div>
          <div className="w-px bg-[#0A0A0A]/10 hidden sm:block" />
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">ROAS</div>
            <div className="text-sm font-bold text-[#E87722]">{summary?.avgRoas?.toFixed(1) ?? 0}x</div>
          </div>
          <div className="w-px bg-[#0A0A0A]/10 hidden sm:block" />
          <div className="text-center px-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider">Alerts</div>
            <div className="text-sm font-bold text-[#F97316]">{summary?.openNotifications ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className={`${glassPanel} px-3 py-2 text-[#666666] text-xs`}>
          Scroll or ↑ ↓ to explore zones
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <SceneNavigationProvider>
      <div className="absolute inset-0 -m-4 sm:-m-6 lg:-m-8 bg-ivory overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <ImmersiveScene />
        </Suspense>
        <DashboardHud />
      </div>
    </SceneNavigationProvider>
  );
}
