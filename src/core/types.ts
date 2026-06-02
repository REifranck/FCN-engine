export type ModelType =
  | "house"
  | "barrel"
  | "tree"
  | "rock"
  | "building"
  | "lamp"
  | "fence"
  | "track"
  | "werewolf"
  | "orc"
  | "cow"
  | "horse"
  | "dragon";

export interface RenderComponent {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
}

export type EntityKind = "obstacle" | "enemy" | "decor" | "pickup";

export interface Entity {
  id: string;
  model: ModelType;
  kind: EntityKind;
  render: RenderComponent;
  position: [number, number, number];
  scale?: number;
  rotation?: number;
  size?: [number, number, number];
}

export interface GameConfig {
  id: string;
  name: string;
  tagline: string;
  skyColor: string;
  fogColor: string;
  groundColor: string;
  ambient: number;
  sunColor: string;
  playerColor: string;
  playerEmissive: string;
  speed: number;
  spawnInterval: number;
  trackRender: RenderComponent;
  obstacles: { model: ModelType; kind: EntityKind; render: RenderComponent; weight: number }[];
  decor: { model: ModelType; render: RenderComponent }[];
}

export type GameStatus = "menu" | "playing" | "gameover";

export interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  lane: number; // -1, 0, 1
  configId: string | null;
}
