import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { loopPhase } from "./scene-constants";

/** Infinite orange digital grid — subtle pulse, perspective fade, almost invisible */
export function DigitalGrid() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const p = loopPhase(state.clock.elapsedTime);
    const pulse = 1 + Math.sin(p) * 0.004;
    group.current.scale.set(pulse, 1, pulse);
  });

  return (
    <group ref={group}>
      <Grid
        infiniteGrid
        fadeDistance={48}
        fadeStrength={5.5}
        cellSize={1.1}
        cellThickness={0.35}
        sectionSize={5.5}
        sectionThickness={0.65}
        cellColor="#E87722"
        sectionColor="#F97316"
        position={[0, -1.2, -54]}
        args={[1, 1]}
      />
    </group>
  );
}
