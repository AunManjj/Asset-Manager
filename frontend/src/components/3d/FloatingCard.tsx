import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BRAND, GLASS, loopPhase, breathe } from "./scene-constants";

interface FloatingCardProps {
  position: [number, number, number];
  title: string;
  children: React.ReactNode;
  color?: string;
  delay?: number;
  width?: number;
  height?: number;
}

export function FloatingCard({
  position,
  title,
  children,
  color = BRAND.orange,
  delay = 0,
  width = 420,
  height = 280,
}: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = loopPhase(state.clock.elapsedTime, delay);
    groupRef.current.position.y = position[1] + Math.sin(p) * 0.1;
    groupRef.current.rotation.x = 0.07 + Math.sin(p * 0.5) * 0.025;
    groupRef.current.rotation.y = -0.04 + Math.sin(p * 0.4) * 0.03;
    groupRef.current.scale.setScalar(breathe(state.clock.elapsedTime, delay, 0.007));

    if (glowRef.current) {
      const pulse = 1 + Math.sin(p * 2) * 0.025;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <mesh ref={glowRef} position={[0, 0, -0.22]}>
        <planeGeometry args={[width / 82 + 0.9, height / 82 + 0.65]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>

      <mesh position={[0, 0, -0.15]} rotation={[0.07, -0.04, 0]}>
        <planeGeometry args={[width / 88 + 0.45, height / 88 + 0.32]} />
        <meshPhysicalMaterial
          color={BRAND.white}
          transparent
          opacity={0.22}
          transmission={0.65}
          ior={GLASS.ior}
          roughness={GLASS.roughness}
          clearcoat={GLASS.clearcoat}
          emissive={color}
          emissiveIntensity={0.035}
        />
      </mesh>

      <Html
        transform
        center
        distanceFactor={6}
        position={[0, 0, 0]}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: "none",
          transform: "perspective(900px) rotateX(4deg) rotateY(-2deg)",
        }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden select-none"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1.5px solid ${color}40`,
            borderRadius: "16px",
            boxShadow: `
              0 24px 64px ${BRAND.shadow},
              0 8px 24px rgba(10, 10, 10, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.95)
            `,
          }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${color}14, rgba(255,255,255,0.65))`,
              borderBottom: `1px solid ${color}28`,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 10px ${color}70` }}
            />
            <span
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: BRAND.black, fontFamily: "'DM Sans', sans-serif" }}
            >
              {title}
            </span>
          </div>
          <div className="p-4 overflow-hidden h-[calc(100%-44px)]">{children}</div>
        </div>
      </Html>
    </group>
  );
}
