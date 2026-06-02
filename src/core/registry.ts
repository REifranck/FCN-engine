import type { GameConfig } from "./types";

export const GAME_REGISTRY: GameConfig[] = [
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    tagline: "Neo-Tokyo skyline, infinite neon highway.",
    skyColor: "#0a0420",
    fogColor: "#1a0a3a",
    groundColor: "#0c0820",
    ambient: 0.35,
    sunColor: "#ff3df0",
    playerColor: "#0ff0ff",
    playerEmissive: "#00e0ff",
    speed: 22,
    spawnInterval: 0.8,
    trackRender: {
      color: "#0a0a14",
      emissive: "#ff00aa",
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.5,
    },
    obstacles: [
      {
        model: "building",
        kind: "obstacle",
        weight: 3,
        render: {
          color: "#1a1030",
          emissive: "#ff1f8f",
          emissiveIntensity: 1.5,
          metalness: 0.5,
          roughness: 0.4,
        },
      },
      {
        model: "lamp",
        kind: "obstacle",
        weight: 2,
        render: {
          color: "#222233",
          emissive: "#00fff0",
          emissiveIntensity: 2,
          metalness: 0.8,
          roughness: 0.3,
        },
      },
      {
        model: "barrel",
        kind: "obstacle",
        weight: 1,
        render: {
          color: "#2a1040",
          emissive: "#a020ff",
          emissiveIntensity: 1.2,
          metalness: 0.6,
          roughness: 0.4,
        },
      },
    ],
    decor: [
      {
        model: "building",
        render: {
          color: "#0f0820",
          emissive: "#00bfff",
          emissiveIntensity: 1.2,
          metalness: 0.4,
          roughness: 0.5,
        },
      },
    ],
  },
  {
    id: "fantasy-orc",
    name: "Fantasy Orc Forest",
    tagline: "Cursed woods crawling with werewolves and dragons.",
    skyColor: "#1a2418",
    fogColor: "#2a3a28",
    groundColor: "#1f2a1a",
    ambient: 0.45,
    sunColor: "#ffd28a",
    playerColor: "#c0a060",
    playerEmissive: "#ffaa33",
    speed: 16,
    spawnInterval: 1.1,
    trackRender: {
      color: "#3a2a18",
      emissive: "#000000",
      emissiveIntensity: 0,
      metalness: 0.05,
      roughness: 0.95,
    },
    obstacles: [
      {
        model: "tree",
        kind: "obstacle",
        weight: 4,
        render: {
          color: "#2a5a2a",
          emissive: "#000000",
          emissiveIntensity: 0,
          metalness: 0,
          roughness: 1,
        },
      },
      {
        model: "orc",
        kind: "enemy",
        weight: 2,
        render: {
          color: "#4a6a30",
          emissive: "#ff2200",
          emissiveIntensity: 1.8,
          metalness: 0.1,
          roughness: 0.85,
        },
      },
      {
        model: "werewolf",
        kind: "enemy",
        weight: 2,
        render: {
          color: "#3a2a20",
          emissive: "#ffaa00",
          emissiveIntensity: 2,
          metalness: 0.1,
          roughness: 0.9,
        },
      },
      {
        model: "dragon",
        kind: "enemy",
        weight: 1,
        render: {
          color: "#5a1818",
          emissive: "#ff5500",
          emissiveIntensity: 2.2,
          metalness: 0.3,
          roughness: 0.6,
        },
      },
      {
        model: "rock",
        kind: "obstacle",
        weight: 2,
        render: {
          color: "#6a6a6a",
          emissive: "#000000",
          emissiveIntensity: 0,
          metalness: 0.1,
          roughness: 1,
        },
      },
    ],
    decor: [
      {
        model: "tree",
        render: {
          color: "#1f4a1f",
          emissive: "#000000",
          emissiveIntensity: 0,
          metalness: 0,
          roughness: 1,
        },
      },
    ],
  },
];

export function getConfig(id: string | null): GameConfig | undefined {
  return GAME_REGISTRY.find((g) => g.id === id);
}
