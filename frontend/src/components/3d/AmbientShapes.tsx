import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, GLASS, METAL, loopPhase, breathe } from "./scene-constants";

type ShapeConfig = {
  position: [number, number, number];
  scale: number;
  type: "torus" | "sphere" | "icosa" | "torusKnot" | "roundedCube" | "disc" | "ribbon";
  color: string;
  phase: number;
  emissive: number;
  metal?: boolean;
};

const SHAPES: ShapeConfig[] = [
  { position: [-9, 3.5, -4], scale: 1.1, type: "torusKnot", color: BRAND.orange, phase: 0, emissive: 0.18 },
  { position: [10, 2.5, -14], scale: 0.85, type: "sphere", color: BRAND.orangeLight, phase: 1, emissive: 0.15 },
  { position: [-7, 1.2, -26], scale: 1.2, type: "torus", color: BRAND.beigeDark, phase: 2, emissive: 0.06 },
  { position: [8, 4.2, -38], scale: 0.65, type: "icosa", color: BRAND.orange, phase: 3, emissive: 0.18 },
  { position: [-11, 2.8, -50], scale: 0.55, type: "roundedCube", color: BRAND.white, phase: 4, emissive: 0.04, metal: true },
  { position: [6, 1.8, -62], scale: 0.9, type: "sphere", color: BRAND.white, phase: 5, emissive: 0.04 },
  { position: [-5, 5, -74], scale: 0.7, type: "disc", color: BRAND.white, phase: 6, emissive: 0.03, metal: true },
  { position: [12, 3, -86], scale: 1.0, type: "torusKnot", color: BRAND.orangeLight, phase: 7, emissive: 0.14 },
  { position: [-8, 2, -98], scale: 1.3, type: "torus", color: BRAND.orange, phase: 8, emissive: 0.12 },
  { position: [9, 4.5, -108], scale: 0.6, type: "ribbon", color: BRAND.gold, phase: 9, emissive: 0.1 },
  { position: [-12, 1.5, -58], scale: 0.45, type: "icosa", color: BRAND.orangeLight, phase: 4.5, emissive: 0.16 },
  { position: [5, 6, -32], scale: 0.8, type: "disc", color: BRAND.beigeDark, phase: 2.5, emissive: 0.05 },
];

function FloatingShape({ config }: { config: ShapeConfig }) {
  const ref = useRef<THREE.Mesh>(null);
  const { position, scale, type, color, phase, emissive, metal } = config;

  useFrame((state) => {
    if (!ref.current) return;
    const p = loopPhase(state.clock.elapsedTime, phase);
    ref.current.rotation.x = p * 0.1;
    ref.current.rotation.y = p * 0.14;
    ref.current.position.y = position[1] + Math.sin(p) * 0.35;
    ref.current.position.x = position[0] + Math.cos(p * 0.5) * 0.15;
    ref.current.scale.setScalar(scale * breathe(state.clock.elapsedTime, phase, 0.007));
  });

  const geometry =
    type === "torus" ? (
      <torusGeometry args={[1, 0.28, 24, 64]} />
    ) : type === "sphere" ? (
      <sphereGeometry args={[0.75, 32, 32]} />
    ) : type === "icosa" ? (
      <icosahedronGeometry args={[0.8, 1]} />
    ) : type === "roundedCube" ? (
      <boxGeometry args={[1, 1, 1]} />
    ) : type === "disc" ? (
      <cylinderGeometry args={[0.9, 0.9, 0.08, 48]} />
    ) : type === "ribbon" ? (
      <torusGeometry args={[1.2, 0.06, 8, 48]} />
    ) : (
      <torusKnotGeometry args={[0.6, 0.2, 64, 12]} />
    );

  if (metal) {
    return (
      <mesh ref={ref} position={position}>
        {geometry}
        <meshPhysicalMaterial
          color={color}
          roughness={METAL.roughness}
          metalness={METAL.metalness}
          clearcoat={METAL.clearcoat}
          clearcoatRoughness={METAL.clearcoatRoughness}
          emissive={BRAND.orange}
          emissiveIntensity={emissive * 0.5}
        />
      </mesh>
    );
  }

  return (
    <mesh ref={ref} position={position}>
      {geometry}
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={type === "sphere" ? 0.42 : 0.28}
        transmission={type === "sphere" ? 0.75 : 0.4}
        ior={GLASS.ior}
        thickness={GLASS.thickness}
        roughness={GLASS.roughness}
        metalness={0.15}
        emissive={color}
        emissiveIntensity={emissive}
        clearcoat={GLASS.clearcoat}
        clearcoatRoughness={GLASS.clearcoatRoughness}
      />
    </mesh>
  );
}

export function AmbientShapes() {
  return (
    <group>
      {SHAPES.map((shape, i) => (
        <FloatingShape key={i} config={shape} />
      ))}
    </group>
  );
}
