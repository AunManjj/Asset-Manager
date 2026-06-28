import { FloatingCard } from "./FloatingCard";
import { useListReports } from "@/api";

export function ReportsZone({ position }: { position: [number, number, number] }) {
  const { data: reports } = useListReports();

  const statusColors: Record<string, string> = {
    ready: "bg-primary",
    pending: "bg-[#F97316]",
    generating: "bg-[#E87722]",
    failed: "bg-red-400",
  };

  const counts = {
    ready: reports?.filter((r) => r.status === "ready").length ?? 0,
    pending: reports?.filter((r) => r.status === "pending").length ?? 0,
    generating: reports?.filter((r) => r.status === "generating").length ?? 0,
  };

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Reports" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="grid grid-cols-3 gap-2">
            {(["ready", "pending", "generating"] as const).map((status) => (
              <div key={status} className="bg-[#F5F0E8] rounded-lg p-2 text-center border border-[#EDE6DA]">
                <div className="text-lg font-bold text-[#E87722]">{counts[status]}</div>
                <div className="text-[10px] text-[#6B6560] capitalize">{status}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {reports?.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-2 border border-[#EDE6DA]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[r.status] || "bg-gray-400"}`} />
                  <span className="text-sm font-medium truncate max-w-[200px]">{r.title}</span>
                </div>
                <span className={`text-xs shrink-0 ${r.status === "ready" ? "text-[#E87722]" : "text-[#6B6560]"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
