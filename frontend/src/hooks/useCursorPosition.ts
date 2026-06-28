import { useEffect, useRef, useState } from "react";

export type CursorPosition = { x: number; y: number };

/** Normalized cursor position (-1..1), smoothed for parallax effects */
export function useCursorPosition(smoothing = 0.08) {
  const target = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const raf = useRef<number>();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    const tick = () => {
      setPosition((prev) => ({
        x: prev.x + (target.current.x - prev.x) * smoothing,
        y: prev.y + (target.current.y - prev.y) * smoothing,
      }));
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [smoothing]);

  return position;
}
