import { FloatingCard } from "./FloatingCard";
import { useListClients } from "@/api";

export function ClientsZone({ position }: { position: [number, number, number] }) {
  const { data: clients } = useListClients();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Clients" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="bg-[#F5F0E8] rounded-lg p-3 text-center border border-[#EDE6DA]">
            <div className="text-3xl font-bold text-[#E87722]">{clients?.length ?? 0}</div>
            <div className="text-xs text-[#6B6560] mt-0.5">Active Clients in Portfolio</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {clients?.slice(0, 5).map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between bg-[#F5F0E8] rounded-lg px-3 py-2 border border-[#EDE6DA]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${client.status === "active" ? "bg-primary" : "bg-gray-400"}`}
                  />
                  <span className="text-sm font-medium truncate max-w-[180px]">{client.name}</span>
                </div>
                <span className="text-xs text-[#6B6560] shrink-0">{client.industry}</span>
              </div>
            ))}
            {clients && clients.length > 5 && (
              <div className="text-center text-xs text-[#6B6560]">+{clients.length - 5} more</div>
            )}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
