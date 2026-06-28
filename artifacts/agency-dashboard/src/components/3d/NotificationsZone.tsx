import { FloatingCard } from "./FloatingCard";
import { useListNotifications } from "@workspace/api-client-react";

export function NotificationsZone({ position }: { position: [number, number, number] }) {
  const { data: notifications } = useListNotifications();

  const unread = notifications?.filter(n => !n.isRead).length ?? 0;

  const typeColors: Record<string, string> = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    alert: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Notifications" color="#ef4444">
        <div className="flex flex-col gap-2 text-white">
          {notifications?.slice(0, 4).map((n) => (
            <div key={n.id} className={`flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2 ${n.isRead ? 'opacity-60' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-gray-500' : 'bg-red-400'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{n.title}</div>
                <div className="text-xs text-gray-400 truncate">{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard position={[-4, 0.5, 1.5]} title="Unread" color="#ef4444" delay={0.5}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{unread}</div>
            <div className="text-xs text-gray-400 mt-1">Unread Notifications</div>
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
