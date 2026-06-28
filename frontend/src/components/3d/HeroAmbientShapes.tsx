import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, GLASS, METAL, loopPhase, breathe } from "./scene-constants";

const HERO_SHAPES = [
  { position: [-5.5, 2.2, -4] as const, scale: 0.75, type: "torusKnot" as const, color: BRAND.orange, phase: 0, emissive: 0.2 },
  { position: [6, 1.5, -7] as const, scale: 0.55, type: "sphere" as const, color: BRAND.orangeLight, phase: 1.5, emissive: 0.18 },
  { position: [-4, 0.5, -10] as const, scale: 0.9, type: "torus" as const, color: BRAND.beigeDark, phase: 3, emissive: 0.08 },
  { position: [5.5, 3, -12] as const, scale: 0.45, type: "icosa" as const, color: BRAND.orange, phase: 4.5, emissive: 0.22 },
  { position: [0, 4.5, -8] as const, scale: 0.35, type: "sphere" as const, color: BRAND.white, phase: 6, emissive: 0.06 },
  { position: [-6, 3.5, -6] as const, scale: 0.4, type: "disc" as const, color: BRAND.white, phase: 2, emissive: 0.04, metal: true },
  { position: [7, 4, -9] as const, scale: 0.5, type: "ribbon" as const, color: BRAND.gold, phase: 5, emissive: 0.12 },
];

function FloatingShape({
  config,
}: {
  config: (typeof HERO_SHAPES)[number] & { metal?: boolean };
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { position, scale, type, color, phase, emissive, metal } = config;

  useFrame((state) => {
    if (!ref.current) return;
    const p = loopPhase(state.clock.elapsedTime, phase);
    ref.current.rotation.x = p * 0.1;
    ref.current.rotation.y = p * 0.16;
    ref.current.position.y = position[1] + Math.sin(p) * 0.3;
    ref.current.position.x = position[0] + Math.cos(p * 0.5) * 0.12;
    ref.current.scale.setScalar(scale * breathe(state.clock.elapsedTime, phase, 0.008));
  });

  const geometry =
    type === "torus" ? (
      <torusGeometry args={[1, 0.3, 20, 48]} />
    ) : type === "sphere" ? (
      <sphereGeometry args={[0.75, 32, 32]} />
    ) : type === "icosa" ? (
      <icosahedronGeometry args={[0.8, 1]} />
    ) : type === "disc" ? (
      <cylinderGeometry args={[0.85, 0.85, 0.06, 48]} />
    ) : type === "ribbon" ? (
      <torusGeometry args={[1, 0.05, 8, 48]} />
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
          emissive={BRAND.orange}
          emissiveIntensity={0.04}
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
        opacity={type === "sphere" ? 0.48 : 0.3}
        transmission={type === "sphere" ? 0.78 : 0.42}
        ior={GLASS.ior}
        thickness={GLASS.thickness}
        roughness={GLASS.roughness}
        emissive={color}
        emissiveIntensity={emissive}
        clearcoat={GLASS.clearcoat}
        clearcoatRoughness={GLASS.clearcoatRoughness}
      />
    </mesh>
  );
}

export function HeroAmbientShapes() {
  return (
    <group>
      {HERO_SHAPES.map((shape, i) => (
        <FloatingShape key={i} config={shape} />
      ))}
    </group>
  );
}
