import type { RenderComponent } from "../core/types";

export type SkyTheme = "day" | "cyber" | "forest";
export type Genre =
  | "race"
  | "rpg"
  | "fight"
  | "platform"
  | "open-world"
  | "horror"
  | "shooter"
  | "sandbox"
  | "medieval"
  | "futuristic";
export type SpeedTier = "slow" | "medium" | "fast";
export type WeatherType = "clear" | "rain" | "fog" | "night" | "storm";
export type TerrainBrush = "track" | "height" | "smooth" | "water" | "sand" | "snow" | "dirt" | "mountain";

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

export interface GenreTemplate {
  id: Genre;
  label: string;
  emoji: string;
  camera: "follow" | "topdown" | "side" | "free" | "arena";
  physics: "vehicle" | "adventure" | "combat" | "platform" | "sandbox";
  controls: "lanes" | "move" | "jump" | "combat" | "aim" | "build";
  tools: TerrainBrush[];
  assets: string[];
}

export const GENRE_TEMPLATES: Record<Genre, GenreTemplate> = {
  race: { id: "race", label: "Corrida", emoji: "🏁", camera: "follow", physics: "vehicle", controls: "lanes", tools: ["track", "height", "smooth", "water", "sand", "snow", "dirt", "mountain"], assets: ["Pistas", "Rampas", "Pontes", "Túneis", "Arquibancadas", "Cones", "Placas", "Carros"] },
  rpg: { id: "rpg", label: "RPG", emoji: "🧙", camera: "free", physics: "adventure", controls: "move", tools: ["dirt", "height", "smooth", "water", "mountain", "track"], assets: ["Vilas", "Castelos", "Cavernas", "NPCs", "Quests", "Dragões", "Portais", "Crafting"] },
  fight: { id: "fight", label: "Luta", emoji: "🥊", camera: "arena", physics: "combat", controls: "combat", tools: ["dirt", "smooth", "height", "track"], assets: ["Arenas", "Ringues", "Ninjas", "Robôs", "Guerreiros", "Combos", "Impactos", "Ragdoll"] },
  platform: { id: "platform", label: "Plataforma", emoji: "🕹️", camera: "side", physics: "platform", controls: "jump", tools: ["height", "smooth", "water", "mountain", "dirt"], assets: ["Blocos", "Moedas", "Rampas", "Pontes", "Portais", "Inimigos", "Checkpoints", "Fogo"] },
  "open-world": { id: "open-world", label: "Mundo Aberto", emoji: "🌍", camera: "free", physics: "adventure", controls: "move", tools: ["height", "smooth", "water", "sand", "snow", "dirt", "mountain"], assets: ["Cidades", "Florestas", "Rios", "Animais", "Veículos", "NPCs", "Portais", "Missões"] },
  horror: { id: "horror", label: "Terror", emoji: "🕯️", camera: "follow", physics: "adventure", controls: "move", tools: ["dirt", "height", "water", "mountain", "smooth"], assets: ["Casas", "Florestas", "Criaturas", "Névoa", "Luzes", "Sons", "Portais", "Sombras"] },
  shooter: { id: "shooter", label: "Shooter", emoji: "🎯", camera: "follow", physics: "combat", controls: "aim", tools: ["track", "height", "smooth", "dirt", "sand"], assets: ["Coberturas", "Robôs", "Arena", "Luzes", "Partículas", "Explosões", "Muros", "Torres"] },
  sandbox: { id: "sandbox", label: "Sandbox", emoji: "🧱", camera: "free", physics: "sandbox", controls: "build", tools: ["height", "smooth", "water", "sand", "snow", "dirt", "mountain", "track"], assets: ["Todos assets", "Construção", "IA", "Física", "Timeline", "Layers", "Console", "Profiler"] },
  medieval: { id: "medieval", label: "Medieval", emoji: "🏰", camera: "free", physics: "adventure", controls: "move", tools: ["dirt", "height", "smooth", "water", "mountain"], assets: ["Castelos", "Cavaleiros", "Orcs", "Dragões", "Vilas", "Pontes", "Magias", "Quests"] },
  futuristic: { id: "futuristic", label: "Futurista", emoji: "🚀", camera: "follow", physics: "sandbox", controls: "aim", tools: ["track", "height", "smooth", "water", "sand"], assets: ["Neon", "Robôs", "Torres", "Portais", "Veículos", "Luzes", "Hologramas", "Partículas"] },
};
