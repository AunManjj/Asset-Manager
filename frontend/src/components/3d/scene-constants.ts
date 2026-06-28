/** Seamless loop duration (seconds) — all ambient motion aligns to this period */
export const LOOP_DURATION = 8;

export const BRAND = {
  beige: "#F7F4EF",
  beigeDark: "#F2ECE3",
  orange: "#E87722",
  orangeLight: "#F97316",
  orangeHover: "#F28C3A",
  white: "#FFFFFF",
  black: "#0A0A0A",
  textSecondary: "#5B5B5B",
  glow: "#FFB366",
  gold: "#D9A441",
  darkPanel: "#111315",
  shadow: "rgba(232,119,34,0.18)",
} as const;

/** Premium glass material preset — IOR 1.5, clearcoat 1, roughness 0.12 */
export const GLASS = {
  transmission: 0.88,
  ior: 1.5,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  roughness: 0.12,
  thickness: 0.5,
  metalness: 0.04,
  opacity: 0.85,
} as const;

export const METAL = {
  roughness: 0.18,
  metalness: 0.85,
  clearcoat: 0.6,
  clearcoatRoughness: 0.15,
} as const;

/** Normalized loop phase 0 → 2π for seamless animation */
export function loopPhase(elapsed: number, offset = 0): number {
  return (((elapsed + offset) % LOOP_DURATION) / LOOP_DURATION) * Math.PI * 2;
}

/** Organic breathe factor for scale / drift (returns ~0.992–1.008) */
export function breathe(elapsed: number, offset = 0, amount = 0.008): number {
  return 1 + Math.sin(loopPhase(elapsed, offset)) * amount;
}
