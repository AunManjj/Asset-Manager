import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAND, LOOP_DURATION, loopPhase } from "./scene-constants";

interface ParticleFieldProps {
  count?: number;
  spread?: number;
  depth?: number;
}

export function ParticleField({ count = 320, spread = 58, depth = 120 }: ParticleFieldProps) {
  const mesh = useRef<THREE.Points>(null);

  const { positions, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = [
      new THREE.Color(BRAND.white),
      new THREE.Color(BRAND.orange),
      new THREE.Color(BRAND.orangeLight),
      new THREE.Color(BRAND.glow),
      new THREE.Color(BRAND.gold),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth - depth * 0.35;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      speeds[i] = 0.25 + Math.random() * 0.55;
    }

    return { positions, colors, speeds };
  }, [count, spread, depth]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    const p = loopPhase(t);
    mesh.current.rotation.y = t * 0.008 + Math.sin(p * 0.5) * 0.002;

    const posAttr = mesh.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const phase = (t * speeds[i]) % LOOP_DURATION;
      const drift = (phase / LOOP_DURATION) * 6;
      posAttr.setY(
        i,
        positions[i * 3 + 1] + Math.sin(t * 0.35 + i * 0.1) * 0.12 + drift * 0.04,
      );
      posAttr.setX(i, positions[i * 3] + Math.cos(t * 0.2 + i) * 0.08);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.38}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
