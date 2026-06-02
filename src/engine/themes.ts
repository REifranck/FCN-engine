import type { RenderComponent } from "../core/types";

export type SkyTheme = "day" | "cyber" | "forest";
export type Genre = "runner" | "jumper";
export type SpeedTier = "slow" | "medium" | "fast";

export interface ThemeData {
  id: SkyTheme;
  name: string;
  emoji: string;
  sky: string;
  fog: string;
  ground: string;
  sun: string;
  ambient: number;
  track: RenderComponent;
}

export const THEMES: Record<SkyTheme, ThemeData> = {
  day: {
    id: "day",
    name: "Daytime",
    emoji: "☀️",
    sky: "#87ceeb",
    fog: "#b8e0f0",
    ground: "#6ab04c",
    sun: "#fff4d0",
    ambient: 0.7,
    track: { color: "#5a4a38", emissive: "#000000", emissiveIntensity: 0, metalness: 0.1, roughness: 0.9 },
  },
  cyber: {
    id: "cyber",
    name: "Cyber Night",
    emoji: "🌃",
    sky: "#0a0420",
    fog: "#1a0a3a",
    ground: "#0c0820",
    sun: "#ff3df0",
    ambient: 0.35,
    track: { color: "#0a0a14", emissive: "#ff00aa", emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.5 },
  },
  forest: {
    id: "forest",
    name: "Magic Forest",
    emoji: "🌲",
    sky: "#1a2418",
    fog: "#2a3a28",
    ground: "#1f2a1a",
    sun: "#ffd28a",
    ambient: 0.5,
    track: { color: "#3a2a18", emissive: "#000000", emissiveIntensity: 0, metalness: 0.05, roughness: 0.95 },
  },
};

export const SPEED_VALUES: Record<SpeedTier, number> = { slow: 10, medium: 16, fast: 24 };
