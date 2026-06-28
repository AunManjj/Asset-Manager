import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loopPhase } from "./scene-constants";

export function HeroCameraRig() {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 0.5, -6));

  useFrame((state) => {
    const p = loopPhase(state.clock.elapsedTime);
    const parallaxX = Math.sin(p * 0.5) * 0.4;
    const parallaxY = Math.cos(p * 0.35) * 0.16 + 1.15;
    const dolly = Math.sin(p * 0.25) * 0.5;
    const orbit = Math.sin(p * 0.4) * 0.2;

    camera.position.set(parallaxX + orbit * 0.25, parallaxY, 10 + dolly);
    camera.lookAt(lookTarget.current);
    camera.rotation.x += Math.sin(p * 0.3) * 0.015;
    camera.rotation.z += Math.cos(p * 0.45) * 0.008;
  });

  return null;
}
