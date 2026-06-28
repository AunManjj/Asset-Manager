import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, GLASS, loopPhase, breathe } from "./scene-constants";

type DecorItem = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  phase: number;
  type: "panel" | "ring" | "strip";
};

const DECOR: DecorItem[] = [
  { position: [-12, 4, -10], scale: [4.5, 2.8, 0.08], rotation: [0.15, 0.35, 0.05], phase: 0, type: "panel" },
  { position: [11, 3.5, -28], scale: [3.2, 5, 0.06], rotation: [-0.1, -0.25, 0.08], phase: 1.2, type: "panel" },
  { position: [-10, 2, -44], scale: [5, 1.8, 0.07], rotation: [0.2, 0.5, -0.05], phase: 2.4, type: "panel" },
  { position: [13, 5, -58], scale: [3.8, 3.8, 0.05], rotation: [0.4, 0.1, 0.15], phase: 3.6, type: "ring" },
  { position: [0, 6, -36], scale: [6.5, 6.5, 0.04], rotation: [1.2, 0, 0.3], phase: 4.8, type: "ring" },
  { position: [-8, 1.5, -72], scale: [4.2, 4.2, 0.04], rotation: [0.8, 0.4, 0], phase: 6, type: "ring" },
  { position: [10, 3, -88], scale: [4, 0.6, 0.05], rotation: [0.3, -0.5, 0.1], phase: 5.2, type: "strip" },
  { position: [-11, 4.5, -102], scale: [3.5, 4.5, 0.05], rotation: [-0.15, 0.3, 0.05], phase: 7, type: "panel" },
  { position: [7, 2, -108], scale: [5, 5, 0.04], rotation: [1.0, 0.2, 0.2], phase: 7.5, type: "ring" },
];

function GlassPanel({ item }: { item: DecorItem }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const p = loopPhase(state.clock.elapsedTime, item.phase);
    ref.current.position.y = item.position[1] + Math.sin(p) * 0.2;
    ref.current.rotation.z = item.rotation[2] + Math.sin(p * 0.5) * 0.025;
    ref.current.scale.set(
      item.scale[0] * breathe(state.clock.elapsedTime, item.phase, 0.005),
      item.scale[1] * breathe(state.clock.elapsedTime, item.phase + 1, 0.005),
      item.scale[2],
    );
  });

  if (item.type === "ring") {
    return (
      <mesh ref={ref} position={item.position} rotation={item.rotation}>
        <torusGeometry args={[1, 0.035, 8, 80]} />
        <meshBasicMaterial color={BRAND.orange} transparent opacity={0.16} />
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
          opacity={0.3}
          transmission={0.9}
          ior={GLASS.ior}
          thickness={0.25}
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
        opacity={0.32}
        transmission={GLASS.transmission}
        ior={GLASS.ior}
        thickness={GLASS.thickness}
        roughness={GLASS.roughness}
        metalness={GLASS.metalness}
        clearcoat={GLASS.clearcoat}
        clearcoatRoughness={GLASS.clearcoatRoughness}
        emissive={BRAND.orange}
        emissiveIntensity={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function GlassDecor() {
  return (
    <group>
      {DECOR.map((item, i) => (
        <GlassPanel key={i} item={item} />
      ))}
    </group>
  );
}
