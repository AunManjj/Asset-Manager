import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { HeroSceneLighting } from "./SceneLighting";
import { CursorCameraRig } from "./CursorCameraRig";
import { HeroAmbientShapes } from "./HeroAmbientShapes";
import { HeroGlassDecor } from "./HeroGlassDecor";
import { LightTrails } from "./LightTrails";
import { ParticleField } from "./ParticleField";
import { BRAND, loopPhase } from "./scene-constants";
import { useCursorPosition } from "@/hooks/useCursorPosition";

function InteractiveGrid({ cursorX }: { cursorX: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const pulse = 1 + Math.sin(loopPhase(state.clock.elapsedTime)) * 0.005;
    group.current.scale.set(pulse, 1, pulse);
    group.current.rotation.z = cursorX * 0.04;
  });

  return (
    <group ref={group}>
      <Grid
        infiniteGrid
        fadeDistance={28}
        fadeStrength={4.5}
        cellSize={0.9}
        cellThickness={0.28}
        sectionSize={4.5}
        sectionThickness={0.5}
        cellColor="#E87722"
        sectionColor="#F97316"
        position={[0, -1.5, -8]}
        args={[1, 1]}
      />
    </group>
  );
}

function CursorScene({ cursor }: { cursor: { x: number; y: number } }) {
  return (
    <>
      <HeroSceneLighting />
      <Suspense fallback={null}>
        <CursorCameraRig cursor={cursor} />
        <InteractiveGrid cursorX={cursor.x} />
        <HeroGlassDecor />
        <LightTrails />
        <ParticleField count={120} spread={22} depth={28} />
        <HeroAmbientShapes />
      </Suspense>
    </>
  );
}

/** Subtle 3D background that responds to cursor movement — used site-wide */
export function InteractiveBackground() {
  const cursor = useCursorPosition(0.1);

  return (
    <Canvas
      camera={{ position: [0, 1.15, 10], fov: 48 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.25]}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <color attach="background" args={["transparent"]} />
      <CursorScene cursor={cursor} />
    </Canvas>
  );
}

/** Login variant with solid beige backdrop */
export function InteractiveLoginBackground() {
  const cursor = useCursorPosition(0.1);

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
        background: BRAND.beige,
        pointerEvents: "none",
      }}
    >
      <color attach="background" args={[BRAND.beige]} />
      <fog attach="fog" args={[BRAND.beige, 22, 50]} />
      <CursorScene cursor={cursor} />
    </Canvas>
  );
}
