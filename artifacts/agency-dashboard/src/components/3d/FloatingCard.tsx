import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface FloatingCardProps {
  position: [number, number, number];
  title: string;
  children: React.ReactNode;
  color?: string;
  delay?: number;
}

export function FloatingCard({ position, title, children, color = "#6366f1", delay = 0 }: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime + delay;

    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.3;
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    groupRef.current.rotation.x = Math.cos(time * 0.4) * 0.02;

    floatRef.current = time;
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      {/* Card glow */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[6.2, 3.7]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Card border glow */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[6.1, 3.6]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>

      {/* HTML content overlay */}
      <Html
        transform
        occlude
        position={[0, 0, 0.01]}
        style={{
          width: "560px",
          height: "340px",
          pointerEvents: "none",
        }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden"
          style={{
            background: "rgba(19, 19, 26, 0.85)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${color}30`,
            boxShadow: `0 0 40px ${color}20, 0 0 80px ${color}10`,
          }}
        >
          <div
            className="px-4 py-2 border-b flex items-center gap-2"
            style={{ borderColor: `${color}20` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-white/80 text-xs font-medium tracking-wider uppercase">
              {title}
            </span>
          </div>
          <div className="p-3 overflow-hidden">
            {children}
          </div>
        </div>
      </Html>
    </group>
  );
}
