import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "./CameraRig";
import { ParticleField } from "./ParticleField";
import { DashboardZone } from "./DashboardZone";
import { ClientsZone } from "./ClientsZone";
import { CampaignsZone } from "./CampaignsZone";
import { FacebookAdsZone } from "./FacebookAdsZone";
import { SettersZone } from "./SettersZone";
import { ClosersZone } from "./ClosersZone";
import { RevenueZone } from "./RevenueZone";
import { InsightsZone } from "./InsightsZone";
import { ReportsZone } from "./ReportsZone";
import { NotificationsZone } from "./NotificationsZone";
import { AmbientShapes } from "./AmbientShapes";
import { DigitalGrid } from "./DigitalGrid";
import { GlassDecor } from "./GlassDecor";
import { LightTrails } from "./LightTrails";
import { ArchitecturalPlatforms } from "./ArchitecturalPlatforms";
import { SceneLighting } from "./SceneLighting";
import { BRAND } from "./scene-constants";

export function ImmersiveScene() {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 14], fov: 46 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: BRAND.beige,
      }}
    >
      <SceneLighting />

      <Suspense fallback={null}>
        <CameraRig />
        <DigitalGrid />
        <ArchitecturalPlatforms />
        <GlassDecor />
        <LightTrails />
        <ParticleField count={320} spread={58} depth={120} />
        <AmbientShapes />

        <DashboardZone position={[0, 1.5, 0]} />
        <ClientsZone position={[0, 1.5, -12]} />
        <CampaignsZone position={[0, 1.5, -24]} />
        <FacebookAdsZone position={[0, 1.5, -36]} />
        <SettersZone position={[0, 1.5, -48]} />
        <ClosersZone position={[0, 1.5, -60]} />
        <RevenueZone position={[0, 1.5, -72]} />
        <InsightsZone position={[0, 1.5, -84]} />
        <ReportsZone position={[0, 1.5, -96]} />
        <NotificationsZone position={[0, 1.5, -108]} />
      </Suspense>
    </Canvas>
  );
}
