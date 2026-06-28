import { FloatingCard } from "./FloatingCard";
import { useListNotifications } from "@/api";

export function NotificationsZone({ position }: { position: [number, number, number] }) {
  const { data: notifications } = useListNotifications();
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <group position={position}>
      <FloatingCard position={[0, 0, 0]} title="Notifications" color="#E87722" width={440} height={300}>
        <div className="flex flex-col gap-3 text-[#0A0A0A]">
          <div className="bg-[#F5F0E8] rounded-lg p-3 text-center border border-[#EDE6DA]">
            <div className="text-3xl font-bold text-[#E87722]">{unread}</div>
            <div className="text-xs text-[#6B6560] mt-0.5">Unread Notifications</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {notifications?.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-2 bg-[#F5F0E8] rounded-lg px-3 py-2 border border-[#EDE6DA] ${n.isRead ? "opacity-60" : ""}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.isRead ? "bg-gray-400" : "bg-[#E87722]"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-[#6B6560] truncate">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingCard>
    </group>
  );
}
