import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ZONES = [
  { z: 0, label: "Dashboard" },
  { z: -12, label: "Clients" },
  { z: -24, label: "Campaigns" },
  { z: -36, label: "Setters" },
  { z: -48, label: "Closers" },
  { z: -60, label: "Revenue" },
  { z: -72, label: "Insights" },
  { z: -84, label: "Reports" },
  { z: -96, label: "Notifications" },
];

export function CameraRig() {
  const { camera } = useThree();
  const state = useRef({
    currentZone: 0,
    zoneProgress: 0,
    pauseTimer: 0,
    isPaused: false,
    speed: 0.8,
  });

  useFrame((_state, delta) => {
    const s = state.current;
    const zone = ZONES[s.currentZone];
    const nextZone = ZONES[s.currentZone + 1] ?? ZONES[0];

    if (s.isPaused) {
      s.pauseTimer += delta;
      if (s.pauseTimer >= 2.5) {
        s.isPaused = false;
        s.pauseTimer = 0;
      }
      return;
    }

    // Move forward through current zone
    s.zoneProgress += delta * s.speed;

    // Camera sway for cinematic feel
    const time = _state.clock.elapsedTime;
    const sway = Math.sin(time * 0.4) * 0.8;
    const bob = Math.sin(time * 0.6) * 0.4;

    // Interpolate between current and next zone
    const targetZ = THREE.MathUtils.lerp(zone.z, nextZone.z, Math.min(s.zoneProgress, 1));

    // Smooth camera movement
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, sway, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.5 + bob, 0.03);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ + 8, 0.02);

    // Look ahead
    const lookTarget = new THREE.Vector3(sway * 0.3, 2, targetZ - 3);
    camera.lookAt(lookTarget);

    // Zone transition detection
    if (s.zoneProgress >= 1) {
      s.isPaused = true;
      s.zoneProgress = 0;
      s.currentZone = (s.currentZone + 1) % ZONES.length;
    }
  });

  return null;
}
