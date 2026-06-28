import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_ZONES } from "@/hooks/useSceneNavigation";
import { BRAND, GLASS, loopPhase, breathe } from "./scene-constants";

function Platform({ z, phase }: { z: number; phase: number }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const p = loopPhase(state.clock.elapsedTime, phase);
    group.current.position.y = -0.6 + Math.sin(p) * 0.08;
    group.current.rotation.y = Math.sin(p * 0.3) * 0.02;
    group.current.scale.setScalar(breathe(state.clock.elapsedTime, phase, 0.006));

    if (ring.current) {
      ring.current.rotation.z = p * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, 0, z]}>
      {/* White ceramic disc platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[3.2, 64]} />
        <meshPhysicalMaterial
          color={BRAND.white}
          roughness={0.12}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={BRAND.beige}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Curved glass strip accent */}
      <mesh position={[2.8, 0.15, 0]} rotation={[0, -0.4, 0.15]}>
        <planeGeometry args={[2.4, 0.5]} />
        <meshPhysicalMaterial
          color={BRAND.white}
          transparent
          opacity={0.35}
          transmission={GLASS.transmission}
          ior={GLASS.ior}
          thickness={0.3}
          roughness={GLASS.roughness}
          clearcoat={GLASS.clearcoat}
          clearcoatRoughness={GLASS.clearcoatRoughness}
          emissive={BRAND.orange}
          emissiveIntensity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Thin illuminated orange ring */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[3.5, 0.025, 8, 96]} />
        <meshBasicMaterial color={BRAND.orange} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

/** Floating architectural platforms beneath each business zone */
export function ArchitecturalPlatforms() {
  return (
    <group>
      {SCENE_ZONES.map((zone, i) => (
        <Platform key={zone.label} z={zone.z} phase={i * 0.8} />
      ))}
    </group>
  );
}
