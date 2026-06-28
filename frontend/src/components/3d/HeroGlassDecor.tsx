import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, GLASS, loopPhase, breathe } from "./scene-constants";

const HERO_DECOR = [
  { position: [-7, 3, -6] as const, scale: [3.2, 2, 0.06] as const, rotation: [0.12, 0.3, 0.04] as const, phase: 0, type: "panel" as const },
  { position: [7.5, 2.5, -9] as const, scale: [2.5, 4, 0.05] as const, rotation: [-0.08, -0.2, 0.06] as const, phase: 2, type: "panel" as const },
  { position: [0, 5.5, -11] as const, scale: [5.5, 5.5, 0.04] as const, rotation: [1.1, 0, 0.25] as const, phase: 4, type: "ring" as const },
  { position: [-5, 1.5, -8] as const, scale: [2.8, 0.5, 0.05] as const, rotation: [0.2, 0.4, 0.08] as const, phase: 3, type: "strip" as const },
  { position: [8, 4.5, -7] as const, scale: [2, 3, 0.05] as const, rotation: [-0.1, -0.35, 0.04] as const, phase: 5.5, type: "panel" as const },
];

export function HeroGlassDecor() {
  return (
    <group>
      {HERO_DECOR.map((item, i) => (
        <GlassItem key={i} item={item} />
      ))}
    </group>
  );
}

function GlassItem({ item }: { item: (typeof HERO_DECOR)[number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const p = loopPhase(state.clock.elapsedTime, item.phase);
    ref.current.position.y = item.position[1] + Math.sin(p) * 0.18;
    ref.current.scale.set(
      item.scale[0] * breathe(state.clock.elapsedTime, item.phase, 0.006),
      item.scale[1] * breathe(state.clock.elapsedTime, item.phase + 0.5, 0.006),
      item.scale[2],
    );
  });

  if (item.type === "ring") {
    return (
      <mesh ref={ref} position={item.position} rotation={item.rotation} scale={item.scale[0]}>
        <torusGeometry args={[1, 0.032, 8, 72]} />
        <meshBasicMaterial color={BRAND.orange} transparent opacity={0.18} />
      </mesh>
    );
  }

  if (item.type === "strip") {
    return (
      <mesh ref={ref} position={item.position} rotation={item.rotation} scale={item.scale}>
        <planeGeometry />
        <meshPhysicalMaterial
          color={BRAND.white}
          transparent
          opacity={0.28}
          transmission={0.92}
          ior={GLASS.ior}
          roughness={0.06}
          clearcoat={1}
          emissive={BRAND.orange}
          emissiveIntensity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  return (
    <mesh ref={ref} position={item.position} rotation={item.rotation} scale={item.scale}>
      <planeGeometry />
      <meshPhysicalMaterial
        color={BRAND.white}
        transparent
        opacity={0.36}
        transmission={GLASS.transmission}
        ior={GLASS.ior}
        thickness={GLASS.thickness}
        roughness={GLASS.roughness}
        clearcoat={GLASS.clearcoat}
        emissive={BRAND.orange}
        emissiveIntensity={0.06}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
