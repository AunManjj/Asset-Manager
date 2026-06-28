import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "./CameraRig";
import { ParticleField } from "./ParticleField";
import { DashboardZone } from "./DashboardZone";
import { ClientsZone } from "./ClientsZone";
import { CampaignsZone } from "./CampaignsZone";
import { SettersZone } from "./SettersZone";
import { ClosersZone } from "./ClosersZone";
import { RevenueZone } from "./RevenueZone";
import { InsightsZone } from "./InsightsZone";
import { ReportsZone } from "./ReportsZone";
import { NotificationsZone } from "./NotificationsZone";

export function ImmersiveScene() {
  return (
    <Canvas
      camera={{ position: [0, 5, 20], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#0a0a0f" }}
    >
      <fog attach="fog" args={["#0a0a0f", 15, 50]} />
      <ambientLight intensity={0.3} color="#6366f1" />
      <directionalLight position={[10, 20, 10]} intensity={1} color="#8b5cf6" />
      <pointLight position={[0, 10, 0]} intensity={2} color="#6366f1" distance={40} />

      <Suspense fallback={null}>
        <CameraRig />
        <ParticleField count={800} />

        <DashboardZone position={[0, 2, 0]} />
        <ClientsZone position={[0, 2, -12]} />
        <CampaignsZone position={[0, 2, -24]} />
        <SettersZone position={[0, 2, -36]} />
        <ClosersZone position={[0, 2, -48]} />
        <RevenueZone position={[0, 2, -60]} />
        <InsightsZone position={[0, 2, -72]} />
        <ReportsZone position={[0, 2, -84]} />
        <NotificationsZone position={[0, 2, -96]} />
      </Suspense>
    </Canvas>
  );
}
