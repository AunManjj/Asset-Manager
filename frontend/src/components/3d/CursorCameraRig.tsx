import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loopPhase } from "./scene-constants";
import type { CursorPosition } from "@/hooks/useCursorPosition";

export function CursorCameraRig({ cursor }: { cursor: CursorPosition }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 0.5, -6));
  const smoothCursor = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    smoothCursor.current.x += (cursor.x - smoothCursor.current.x) * 0.06;
    smoothCursor.current.y += (cursor.y - smoothCursor.current.y) * 0.06;

    const p = loopPhase(state.clock.elapsedTime);
    const parallaxX = Math.sin(p * 0.5) * 0.4;
    const parallaxY = Math.cos(p * 0.35) * 0.16 + 1.15;
    const dolly = Math.sin(p * 0.25) * 0.5;
    const orbit = Math.sin(p * 0.4) * 0.2;

    const cx = smoothCursor.current.x;
    const cy = smoothCursor.current.y;

    camera.position.set(
      parallaxX + orbit * 0.25 + cx * 1.2,
      parallaxY + cy * 0.6,
      10 + dolly - cy * 0.4,
    );

    lookTarget.current.set(cx * 0.8, 0.5 + cy * 0.4, -6 + cx * 0.3);
    camera.lookAt(lookTarget.current);
    camera.rotation.x += Math.sin(p * 0.3) * 0.012 + cy * 0.008;
    camera.rotation.z += Math.cos(p * 0.45) * 0.006 + cx * 0.005;
  });

  return null;
}
