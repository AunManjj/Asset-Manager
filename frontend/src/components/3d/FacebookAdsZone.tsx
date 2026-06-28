import { FloatingCard } from "./FloatingCard";
import { DEMO_AD_CAMPAIGNS } from "@/lib/demo-ads-data";

export function FacebookAdsZone({ position }: { position: [number, number, number] }) {
  const active = DEMO_AD_CAMPAIGNS.filter((c) => c.status === "active");
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const avgCtr = active.length ? active.reduce((s, c) => s + c.ctr, 0) / active.length : 0;
  const avgRoas = active.length ? active.reduce((s, c) => s + c.roas, 0) / active.length : 0;
  const totalConversions = active.reduce((s, c) => s + c.conversions, 0);

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Facebook Ads" color="#E87722" width={440} height={300} delay={1.5}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#F5F0E8] rounded-xl p-2.5 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Meta Spend</div>
              <div className="text-xl font-bold text-[#E87722]">${(totalSpend / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-2.5 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Avg CTR</div>
              <div className="text-xl font-bold text-[#F97316]">{avgCtr.toFixed(2)}%</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-2.5 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Conversions</div>
              <div className="text-xl font-bold text-[#0A0A0A]">{totalConversions}</div>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-2.5 border border-[#EDE6DA]">
              <div className="text-[10px] text-[#666666] uppercase font-medium">Avg ROAS</div>
              <div className="text-xl font-bold text-[#0A0A0A]">{avgRoas.toFixed(1)}x</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {active.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-xl px-3 py-2 border border-[#EDE6DA]"
              >
                <span className="text-sm font-medium truncate max-w-[200px]">{c.name}</span>
                <div className="flex gap-2 text-xs shrink-0">
                  <span className="text-[#E87722] font-semibold">{c.ctr}% CTR</span>
                  <span className="text-[#666666]">{c.roas}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
