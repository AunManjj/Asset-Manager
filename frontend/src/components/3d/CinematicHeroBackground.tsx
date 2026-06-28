import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { HeroSceneLighting } from "./SceneLighting";
import { HeroCameraRig } from "./HeroCameraRig";
import { HeroAmbientShapes } from "./HeroAmbientShapes";
import { HeroGlassDecor } from "./HeroGlassDecor";
import { LightTrails } from "./LightTrails";
import { ParticleField } from "./ParticleField";
import { BRAND, loopPhase } from "./scene-constants";

function HeroGrid() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const pulse = 1 + Math.sin(loopPhase(state.clock.elapsedTime)) * 0.005;
    group.current.scale.set(pulse, 1, pulse);
  });

  return (
    <group ref={group}>
      <Grid
        infiniteGrid
        fadeDistance={30}
        fadeStrength={4.5}
        cellSize={0.9}
        cellThickness={0.32}
        sectionSize={4.5}
        sectionThickness={0.6}
        cellColor="#E87722"
        sectionColor="#F97316"
        position={[0, -1.5, -8]}
        args={[1, 1]}
      />
    </group>
  );
}

/** Cinematic login hero — luxury environment, seamless 8s loop */
export function CinematicHeroBackground({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <Canvas
      camera={{ position: [0, 1.15, 10], fov: 48 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: isDark ? BRAND.darkPanel : BRAND.beige,
        pointerEvents: "none",
      }}
    >
      {isDark ? (
        <>
          <color attach="background" args={[BRAND.darkPanel]} />
          <fog attach="fog" args={[BRAND.darkPanel, 18, 55]} />
          <ambientLight intensity={0.6} color="#FFF8F0" />
          <hemisphereLight args={["#22262B", BRAND.darkPanel, 0.5]} />
          <pointLight position={[4, 6, -6]} intensity={0.7} color={BRAND.orangeLight} distance={42} decay={2} />
          <pointLight position={[-6, 4, -10]} intensity={0.45} color={BRAND.glow} distance={38} decay={2} />
        </>
      ) : (
        <HeroSceneLighting />
      )}

      <Suspense fallback={null}>
        <HeroCameraRig />
        <HeroGrid />
        <HeroGlassDecor />
        <LightTrails />
        <ParticleField count={180} spread={24} depth={32} />
        <HeroAmbientShapes />
      </Suspense>
    </Canvas>
  );
}
