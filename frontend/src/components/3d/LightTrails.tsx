import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, LOOP_DURATION, loopPhase } from "./scene-constants";

const TRAIL_COUNT = 16;

export function LightTrails() {
  const group = useRef<THREE.Group>(null);

  const trails = useMemo(
    () =>
      Array.from({ length: TRAIL_COUNT }, (_, i) => ({
        x: (Math.random() - 0.5) * 32,
        y: 1.2 + Math.random() * 9,
        z: -8 - Math.random() * 100,
        length: 2 + Math.random() * 3.5,
        phase: (i / TRAIL_COUNT) * LOOP_DURATION,
        curve: (Math.random() - 0.5) * 0.4,
        color: i % 3 === 0 ? BRAND.gold : i % 2 === 0 ? BRAND.orange : BRAND.orangeLight,
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.children.forEach((child, i) => {
      const trail = trails[i];
      const cycle = ((t + trail.phase) % LOOP_DURATION) / LOOP_DURATION;
      const z = trail.z - cycle * 108;
      const curve = Math.sin(t * 0.25 + i) * trail.curve;
      child.position.set(
        trail.x + Math.sin(t * 0.2 + i) * 0.6,
        trail.y + Math.sin(t * 0.35 + i) * 0.25,
        z,
      );
      child.rotation.set(curve * 0.3, Math.sin(t * 0.15 + i) * 0.1, curve);
    });
  });

  return (
    <group ref={group}>
      {trails.map((trail, i) => (
        <mesh key={i} position={[trail.x, trail.y, trail.z]}>
          <boxGeometry args={[0.025, 0.025, trail.length]} />
          <meshBasicMaterial color={trail.color} transparent opacity={0.28} />
        </mesh>
      ))}
    </group>
  );
}
