import { FloatingCard } from "./FloatingCard";
import { useListClients } from "@workspace/api-client-react";

export function ClientsZone({ position }: { position: [number, number, number] }) {
  const { data: clients } = useListClients();

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Clients" color="#10b981">
        <div className="flex flex-col gap-2 text-white overflow-hidden">
          {clients?.slice(0, 5).map((client) => (
            <div key={client.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium truncate max-w-[180px]">{client.name}</span>
              </div>
              <span className="text-xs text-gray-400">{client.industry}</span>
            </div>
          ))}
          {clients && clients.length > 5 && (
            <div className="text-center text-xs text-gray-500">+{clients.length - 5} more</div>
          )}
        </div>
      </FloatingCard>

      {/* Decorative floating client count */}
      <FloatingCard position={[4, -1, 2]} title="Portfolio" color="#10b981" delay={0.5}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400">{clients?.length ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">Active Clients</div>
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
