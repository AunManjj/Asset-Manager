import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { SCENE_ZONES, useSceneNavigation } from "@/hooks/useSceneNavigation";
import { useCursorPosition } from "@/hooks/useCursorPosition";
import { loopPhase } from "./scene-constants";

export function CameraRig() {
  const { camera } = useThree();
  const { currentZone } = useSceneNavigation();
  const cursor = useCursorPosition(0.08);
  const smoothCursor = useRef({ x: 0, y: 0 });
  const lookTarget = useRef(new THREE.Vector3(0, 1.5, 0));
  const basePosition = useRef({ x: 0, y: 2.5, z: 14 });
  const travelTilt = useRef({ x: 0, roll: 0 });
  const isAnimating = useRef(false);

  useEffect(() => {
    const zone = SCENE_ZONES[currentZone];
    isAnimating.current = true;

    gsap.to(basePosition.current, {
      x: 0,
      y: 2.5,
      z: zone.z + 6,
      duration: 1.8,
      ease: "power2.inOut",
      onComplete: () => {
        isAnimating.current = false;
      },
    });

    gsap.to(lookTarget.current, {
      x: 0,
      y: 1.5,
      z: zone.z,
      duration: 1.8,
      ease: "power2.inOut",
    });

    gsap.fromTo(
      travelTilt.current,
      { x: 0, roll: 0 },
      {
        x: 0.045,
        roll: 0.012,
        duration: 0.9,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1,
      },
    );
  }, [currentZone]);

  useFrame((state) => {
    smoothCursor.current.x += (cursor.x - smoothCursor.current.x) * 0.06;
    smoothCursor.current.y += (cursor.y - smoothCursor.current.y) * 0.06;

    const p = loopPhase(state.clock.elapsedTime);
    const parallaxX = Math.sin(p * 0.5) * 0.3;
    const parallaxY = Math.cos(p * 0.35) * 0.1;
    const dolly = Math.sin(p * 0.25) * 0.35;
    const orbit = Math.sin(p * 0.4) * 0.15;
    const cx = smoothCursor.current.x;
    const cy = smoothCursor.current.y;

    if (isAnimating.current) {
      camera.position.set(
        basePosition.current.x + cx * 0.5,
        basePosition.current.y + cy * 0.25,
        basePosition.current.z,
      );
    } else {
      camera.position.set(
        basePosition.current.x + parallaxX + orbit * 0.3 + cx * 0.8,
        basePosition.current.y + parallaxY + cy * 0.4,
        basePosition.current.z + dolly - cy * 0.2,
      );
    }

    lookTarget.current.x = cx * 0.4;
    lookTarget.current.y = 1.5 + cy * 0.25;
    camera.lookAt(lookTarget.current);
    camera.rotation.x += travelTilt.current.x + cy * 0.006;
    camera.rotation.z += travelTilt.current.roll + cx * 0.004;
  });

  return null;
}

export { SCENE_ZONES };
