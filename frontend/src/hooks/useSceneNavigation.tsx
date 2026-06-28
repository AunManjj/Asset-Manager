import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export const SCENE_ZONES = [
  { z: 0, label: "Dashboard" },
  { z: -12, label: "Clients" },
  { z: -24, label: "Campaigns" },
  { z: -36, label: "Facebook Ads" },
  { z: -48, label: "Setters" },
  { z: -60, label: "Closers" },
  { z: -72, label: "Revenue" },
  { z: -84, label: "AI Insights" },
  { z: -96, label: "Reports" },
  { z: -108, label: "Notifications" },
] as const;

interface SceneNavigationContextValue {
  currentZone: number;
  goToZone: (index: number) => void;
  nextZone: () => void;
  prevZone: () => void;
}

const SceneNavigationContext = createContext<SceneNavigationContextValue | null>(null);

export function SceneNavigationProvider({ children }: { children: ReactNode }) {
  const [currentZone, setCurrentZone] = useState(0);

  const goToZone = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SCENE_ZONES.length - 1, index));
    setCurrentZone(clamped);
  }, []);

  const nextZone = useCallback(() => {
    setCurrentZone((z) => Math.min(SCENE_ZONES.length - 1, z + 1));
  }, []);

  const prevZone = useCallback(() => {
    setCurrentZone((z) => Math.max(0, z - 1));
  }, []);

  useEffect(() => {
    let wheelAccumulator = 0;
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case "ArrowRight":
          e.preventDefault();
          nextZone();
          break;
        case "ArrowUp":
        case "PageUp":
        case "ArrowLeft":
          e.preventDefault();
          prevZone();
          break;
        default:
          break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccumulator += e.deltaY;

      if (wheelTimeout) clearTimeout(wheelTimeout);

      wheelTimeout = setTimeout(() => {
        if (Math.abs(wheelAccumulator) > 40) {
          if (wheelAccumulator > 0) nextZone();
          else prevZone();
        }
        wheelAccumulator = 0;
      }, 120);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [nextZone, prevZone]);

  return (
    <SceneNavigationContext.Provider value={{ currentZone, goToZone, nextZone, prevZone }}>
      {children}
    </SceneNavigationContext.Provider>
  );
}

export function useSceneNavigation() {
  const ctx = useContext(SceneNavigationContext);
  if (!ctx) throw new Error("useSceneNavigation must be used within SceneNavigationProvider");
  return ctx;
}
