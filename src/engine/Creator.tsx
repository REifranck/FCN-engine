import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { ModelType, RenderComponent } from "../core/types";
import { SFX, startMusic, stopMusic } from "./audio";
import { GENRE_TEMPLATES, SPEED_VALUES, THEMES, type Genre, type SkyTheme, type SpeedTier, type TerrainBrush, type WeatherType } from "./themes";
import { modelElement } from "./models";

const LazyCanvas = lazy(async () => ({ default: CreatorCanvas }));
const LANE_X = [-2.4, 0, 2.4];
const PLAYER_Z = 4;
const STORAGE_KEY = "fcn-next-engine-creator-project-v4";

type Mode = "template" | "edit" | "play";
type ToolId = "select" | "track" | "terrain" | "asset" | "npc" | "quest" | "combat" | "lighting" | "weather" | "ai" | "timeline" | "console";
type PaintCell = { row: number; lane: -1 | 0 | 1; brush: TerrainBrush; height: number };
type LogLevel = "ok" | "warn" | "error";
type LogEntry = { level: LogLevel; text: string };

interface Placed {
  id: string;
  model: ModelType;
  lane: -1 | 0 | 1;
  z: number;
  render: RenderComponent;
  category: string;
  name: string;
  layer: string;
}

interface CreatorProject {
  version: number;
  name: string;
  genre: Genre;
  theme: SkyTheme;
  weather: WeatherType;
  speedTier: SpeedTier;
  selectedTool: ToolId;
  selectedBrush: TerrainBrush;
  selectedAssetId: string;
  placed: Placed[];
  terrain: PaintCell[];
  layers: Record<string, boolean>;
  timelineFrame: number;
}

interface HistoryState { past: CreatorProject[]; present: CreatorProject; future: CreatorProject[] }
type HistoryAction =
  | { type: "patch"; patch: Partial<CreatorProject>; save?: boolean }
  | { type: "replace"; project: CreatorProject; save?: boolean }
  | { type: "undo" }
  | { type: "redo" };

const baseRender = (color: string, emissive = "#000000", emissiveIntensity = 0, metalness = 0.15, roughness = 0.7): RenderComponent => ({ color, emissive, emissiveIntensity, metalness, roughness });

const ASSET_LIBRARY: { id: string; model: ModelType; label: string; emoji: string; category: string; render: RenderComponent; genres: Genre[] }[] = [
  { id: "car-neon", model: "car", label: "Carro", emoji: "🏎️", category: "Veículos", render: baseRender("#0f172a", "#22d3ee", 2.4, 0.55, 0.28), genres: ["race", "futuristic", "open-world", "sandbox"] },
  { id: "ramp", model: "ramp", label: "Rampa", emoji: "⤴️", category: "Pistas", render: baseRender("#475569", "#38bdf8", 0.6, 0.35, 0.5), genres: ["race", "platform", "sandbox"] },
  { id: "bridge", model: "bridge", label: "Ponte", emoji: "🌉", category: "Pistas", render: baseRender("#64748b", "#60a5fa", 0.35, 0.35, 0.45), genres: ["race", "rpg", "open-world", "medieval", "sandbox"] },
  { id: "tunnel", model: "tunnel", label: "Túnel", emoji: "🚇", category: "Pistas", render: baseRender("#334155", "#818cf8", 0.75, 0.35, 0.45), genres: ["race", "horror", "shooter", "sandbox"] },
  { id: "tree", model: "tree", label: "Árvore", emoji: "🌳", category: "Natureza", render: baseRender("#2f8f46", "#064e3b", 0.05, 0, 1), genres: ["race", "rpg", "open-world", "horror", "sandbox", "medieval"] },
  { id: "grass", model: "grass", label: "Grama", emoji: "🌿", category: "Natureza", render: baseRender("#52b788", "#000000", 0, 0, 1), genres: ["rpg", "open-world", "sandbox", "medieval", "platform"] },
  { id: "rock", model: "rock", label: "Pedra", emoji: "🪨", category: "Natureza", render: baseRender("#8b95a1", "#000000", 0, 0.1, 0.9), genres: ["race", "rpg", "open-world", "horror", "sandbox", "medieval", "platform"] },
  { id: "water", model: "water", label: "Água", emoji: "💧", category: "Terreno", render: baseRender("#0ea5e9", "#38bdf8", 0.7, 0.05, 0.18), genres: ["race", "rpg", "open-world", "sandbox", "platform"] },
  { id: "house", model: "house", label: "Casa", emoji: "🏠", category: "Construções", render: baseRender("#c89060", "#000000", 0, 0.1, 0.78), genres: ["rpg", "open-world", "horror", "sandbox", "medieval"] },
  { id: "building", model: "building", label: "Prédio", emoji: "🏢", category: "Construções", render: baseRender("#101827", "#00d5ff", 1.6, 0.45, 0.42), genres: ["race", "futuristic", "shooter", "sandbox", "open-world"] },
  { id: "grandstand", model: "grandstand", label: "Arquibancada", emoji: "🏟️", category: "Corrida", render: baseRender("#e2e8f0", "#38bdf8", 1, 0.25, 0.4), genres: ["race", "fight", "sandbox"] },
  { id: "sign", model: "sign", label: "Placa", emoji: "🪧", category: "Corrida", render: baseRender("#facc15", "#fef08a", 0.7, 0.2, 0.45), genres: ["race", "open-world", "sandbox"] },
  { id: "cone", model: "cone", label: "Cone", emoji: "🔺", category: "Corrida", render: baseRender("#fb923c", "#ffedd5", 0.25, 0.1, 0.55), genres: ["race", "shooter", "sandbox"] },
  { id: "wall", model: "wall", label: "Muro", emoji: "🧱", category: "Construções", render: baseRender("#64748b", "#000000", 0, 0.1, 0.85), genres: ["fight", "shooter", "horror", "sandbox", "medieval"] },
  { id: "lamp", model: "lamp", label: "Luz", emoji: "💡", category: "Iluminação", render: baseRender("#111827", "#fff2a6", 2.8, 0.8, 0.28), genres: ["race", "rpg", "open-world", "horror", "shooter", "sandbox", "futuristic"] },
  { id: "fire", model: "fire", label: "Fogo", emoji: "🔥", category: "Partículas", render: baseRender("#ff7a18", "#ff3300", 3.3, 0, 0.25), genres: ["rpg", "fight", "horror", "platform", "sandbox", "medieval"] },
  { id: "orc", model: "orc", label: "Orc", emoji: "👹", category: "Personagens", render: baseRender("#5f7f32", "#ff2200", 1.6, 0.1, 0.85), genres: ["rpg", "fight", "open-world", "medieval", "sandbox"] },
  { id: "warrior", model: "warrior", label: "Guerreiro", emoji: "🛡️", category: "Personagens", render: baseRender("#9ca3af", "#60a5fa", 0.8, 0.75, 0.3), genres: ["rpg", "fight", "medieval", "sandbox"] },
  { id: "mage", model: "mage", label: "Mago", emoji: "🧙", category: "Personagens", render: baseRender("#5b21b6", "#c084fc", 2.4, 0.15, 0.48), genres: ["rpg", "medieval", "sandbox"] },
  { id: "robot", model: "robot", label: "Robô", emoji: "🤖", category: "Personagens", render: baseRender("#64748b", "#22d3ee", 2.2, 0.9, 0.22), genres: ["fight", "shooter", "futuristic", "sandbox"] },
  { id: "dragon", model: "dragon", label: "Dragão", emoji: "🐉", category: "Criaturas", render: baseRender("#5a1818", "#ff5500", 2.4, 0.3, 0.58), genres: ["rpg", "open-world", "medieval", "sandbox"] },
  { id: "portal", model: "portal", label: "Portal", emoji: "🌀", category: "Gameplay", render: baseRender("#312e81", "#8b5cf6", 3.2, 0.2, 0.25), genres: ["rpg", "platform", "open-world", "futuristic", "sandbox"] },
];

const LAYER_NAMES = ["Terreno", "Pistas", "Gameplay", "Personagens", "Iluminação", "Partículas"];
const TOOLS: { id: ToolId; label: string; emoji: string }[] = [
  { id: "select", label: "Select", emoji: "🖱️" }, { id: "track", label: "Pista", emoji: "🛣️" }, { id: "terrain", label: "Terreno", emoji: "⛰️" }, { id: "asset", label: "Assets", emoji: "📦" },
  { id: "npc", label: "NPC", emoji: "🧍" }, { id: "quest", label: "Quests", emoji: "📜" }, { id: "combat", label: "Combate", emoji: "⚔️" }, { id: "lighting", label: "Luz", emoji: "💡" },
  { id: "weather", label: "Clima", emoji: "🌦️" }, { id: "ai", label: "IA", emoji: "🧠" }, { id: "timeline", label: "Timeline", emoji: "🎞️" }, { id: "console", label: "Console", emoji: "⌨️" },
];

function defaultProject(genre: Genre = "race"): CreatorProject {
  const asset = ASSET_LIBRARY.find((a) => a.genres.includes(genre)) ?? ASSET_LIBRARY[0];
  const theme: SkyTheme = genre === "futuristic" || genre === "shooter" ? "cyber" : genre === "horror" || genre === "medieval" || genre === "rpg" ? "forest" : "day";
  return {
    version: 4,
    name: `${GENRE_TEMPLATES[genre].label} Project`,
    genre,
    theme,
    weather: genre === "horror" ? "fog" : "clear",
    speedTier: "medium",
    selectedTool: genre === "race" ? "track" : "asset",
    selectedBrush: genre === "race" ? "track" : "dirt",
    selectedAssetId: asset.id,
    placed: seedProject(genre),
    terrain: [],
    layers: Object.fromEntries(LAYER_NAMES.map((l) => [l, true])),
    timelineFrame: 24,
  };
}

function seedProject(genre: Genre): Placed[] {
  const ids = genre === "race" ? ["car-neon", "ramp", "bridge", "grandstand", "sign", "cone", "lamp", "tree"] : genre === "rpg" || genre === "medieval" ? ["house", "warrior", "mage", "orc", "dragon", "portal", "tree", "fire"] : genre === "fight" ? ["warrior", "robot", "orc", "wall", "fire", "lamp"] : ["building", "robot", "portal", "lamp", "wall", "fire", "rock", "tree"];
  return ids.map((id, i) => {
    const a = ASSET_LIBRARY.find((x) => x.id === id) ?? ASSET_LIBRARY[0];
    return { id: `seed-${genre}-${id}-${i}`, model: a.model, lane: ([-1, 0, 1] as const)[i % 3], z: PLAYER_Z - 8 - i * 4, render: a.render, category: a.category, name: a.label, layer: a.category === "Iluminação" ? "Iluminação" : a.category === "Partículas" ? "Partículas" : a.category === "Personagens" || a.category === "Criaturas" ? "Personagens" : a.category === "Pistas" || a.category === "Corrida" ? "Pistas" : "Gameplay" };
  });
}

function safeLoadProject(): CreatorProject {
  if (typeof window === "undefined") return defaultProject();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProject();
    const parsed = JSON.parse(raw) as Partial<CreatorProject>;
    if (!parsed.genre || !(parsed.genre in GENRE_TEMPLATES)) return defaultProject();
    return { ...defaultProject(parsed.genre), ...parsed, version: 4 };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultProject();
  }
}

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "undo") return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] } : state;
  if (action.type === "redo") return state.future.length ? { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) } : state;
  const next = action.type === "replace" ? action.project : { ...state.present, ...action.patch };
  return action.save === false ? { ...state, present: next } : { past: [...state.past.slice(-80), state.present], present: next, future: [] };
}

function ProfessionalLoader({ label = "Inicializando módulos da engine" }: { label?: string }) {
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 text-cyan-100"><div className="w-80 rounded-2xl border border-cyan-400/30 bg-slate-900/80 p-5 shadow-[0_0_45px_rgba(34,211,238,0.25)]"><div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">FCN Recovery Loader</div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-blue-400" /></div><div className="mt-3 text-sm text-slate-300">{label}</div></div></div>;
}

class CreatorErrorBoundary extends Component<{ children: ReactNode; onRecover: () => void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: unknown) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950 p-6 text-white"><div className="max-w-md rounded-2xl border border-red-400/40 bg-slate-900 p-6 text-center shadow-2xl"><div className="text-4xl">🛡️</div><h2 className="mt-3 text-2xl font-black">Auto Recovery ativado</h2><p className="mt-2 text-sm text-slate-300">A viewport 3D falhou ao iniciar. A engine preservou o projeto e pode recarregar módulos seguros.</p><button onClick={() => { this.setState({ error: false }); this.props.onRecover(); }} className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950">Restaurar editor</button></div></div>;
  }
}

function CreatorCanvas({ project, mode, playerLane, playerY, scroll, cameraView, yawRef, pitchRef }: { project: CreatorProject; mode: Mode; playerLane: number; playerY: number; scroll: number; cameraView: CameraView; yawRef: React.MutableRefObject<number>; pitchRef: React.MutableRefObject<number> }) {
  return <Canvas shadows dpr={[1, 1.5]} frameloop="always" gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }} camera={{ position: [0, 18, 13], fov: 60 }}><Scene project={project} mode={mode} playerLane={playerLane} playerY={playerY} scroll={scroll} cameraView={cameraView} yawRef={yawRef} pitchRef={pitchRef} /></Canvas>;
}

function Scene({ project, mode, playerLane, playerY, scroll, cameraView, yawRef, pitchRef }: { project: CreatorProject; mode: Mode; playerLane: number; playerY: number; scroll: number; cameraView: CameraView; yawRef: React.MutableRefObject<number>; pitchRef: React.MutableRefObject<number> }) {
  const theme = THEMES[project.theme];
  const { camera, gl } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const targetLaneX = LANE_X[playerLane + 1];
  const trackTiles = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);

  // Pointer drag → orbit yaw/pitch (mouse + touch)
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false; let lx = 0; let ly = 0;
    const down = (e: PointerEvent) => { if (mode !== "play") return; dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!dragging) return; const dx = e.clientX - lx; const dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; yawRef.current -= dx * 0.005; pitchRef.current = Math.max(-0.4, Math.min(1.0, pitchRef.current + dy * 0.004)); };
    const up = (e: PointerEvent) => { dragging = false; try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ } };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [gl, mode, yawRef, pitchRef]);

  const tmpTarget = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (playerRef.current) {
      playerRef.current.position.x += (targetLaneX - playerRef.current.position.x) * Math.min(1, dt * 12);
      playerRef.current.position.y = 0.55 + playerY + Math.sin(performance.now() * 0.006) * 0.04;
      playerRef.current.rotation.y += (((targetLaneX - playerRef.current.position.x) * -0.4) - playerRef.current.rotation.y) * Math.min(1, dt * 8);
    }
    if (mode === "play") {
      const px = playerRef.current?.position.x ?? targetLaneX;
      const py = playerRef.current?.position.y ?? 0.6;
      const pz = PLAYER_Z;
      const yaw = yawRef.current; const pitch = pitchRef.current;
      // distance & height by camera view
      const view = cameraView;
      const dist = view === "fps" ? 0.001 : view === "tps-close" ? 4.5 : view === "tps" ? 7 : view === "side" ? 9 : view === "top" ? 11 : 8;
      const height = view === "fps" ? 1.55 : view === "tps-close" ? 2.4 : view === "tps" ? 3.2 : view === "side" ? 3 : view === "top" ? 10 : 3.4;
      if (view === "side") {
        tmpPos.set(px + 9, 3 + py, pz);
        tmpTarget.set(px, 1 + py, pz - 1);
      } else if (view === "top") {
        tmpPos.set(px, 14, pz + 1);
        tmpTarget.set(px, 0, pz - 4);
      } else {
        // orbit / tps / fps — yaw rotates behind player, pitch tilts
        const ox = Math.sin(yaw) * Math.cos(pitch) * dist;
        const oz = Math.cos(yaw) * Math.cos(pitch) * dist;
        const oy = Math.sin(pitch) * dist + height;
        tmpPos.set(px + ox, py + oy, pz + oz);
        if (view === "fps") tmpTarget.set(px - Math.sin(yaw) * 6, py + 1.4 - Math.sin(pitch) * 4, pz - Math.cos(yaw) * 6);
        else tmpTarget.set(px, py + 0.9, pz - 0.5);
      }
      const k = view === "fps" ? 1 : Math.min(1, dt * 7);
      camera.position.lerp(tmpPos, k);
      camera.lookAt(tmpTarget);
    } else {
      // editor: gentle isometric with optional yaw drag
      const yaw = yawRef.current * 0.4;
      tmpPos.set(Math.sin(yaw) * 14, 18, 13 + Math.cos(yaw) * 4);
      camera.position.lerp(tmpPos, Math.min(1, dt * 3));
      camera.lookAt(0, 0, -12);
    }
  });
  const sky = project.weather === "night" ? "#050816" : project.weather === "fog" ? "#283044" : theme.sky;
  const fog = project.weather === "clear" ? theme.fog : project.weather === "rain" || project.weather === "storm" ? "#172033" : "#94a3b8";
  const visiblePlaced = project.placed.filter((p) => project.layers[p.layer] !== false);
  const isCyber = project.theme === "cyber" || project.weather === "night";
  return <><color attach="background" args={[sky]} /><fog attach="fog" args={[fog, project.weather === "fog" ? 5 : 18, project.weather === "fog" ? 44 : 90]} /><ambientLight intensity={project.weather === "night" ? 0.22 : theme.ambient * 0.85} /><directionalLight position={[8, 14, 6]} intensity={project.weather === "night" ? 0.55 : 1.3} color={theme.sun} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} /><directionalLight position={[-6, 6, -8]} intensity={isCyber ? 0.9 : 0.35} color={isCyber ? "#ff3df0" : "#9bb7ff"} /><hemisphereLight args={[sky, theme.ground, 0.45]} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -8]} receiveShadow><planeGeometry args={[260, 260]} /><meshStandardMaterial color={theme.ground} roughness={1} metalness={isCyber ? 0.25 : 0} /></mesh>{trackTiles.map((i) => <group key={i} position={[0, 0, PLAYER_Z - i * 8 + (mode === "play" ? scroll % 8 : 0)]}>{modelElement(project.genre === "race" || project.selectedBrush === "track" ? "track" : "grass", project.genre === "race" ? theme.track : baseRender("#1f6f42"))}</group>)}{project.terrain.map((c) => <mesh key={`${c.row}-${c.lane}`} position={[LANE_X[c.lane + 1], 0.045 + c.height * 0.08, PLAYER_Z - 6 - c.row * 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.15, 3.65]} /><meshStandardMaterial color={brushColor(c.brush)} roughness={0.86} /></mesh>)}{visiblePlaced.map((p) => <group key={p.id} position={[LANE_X[p.lane + 1], 0, p.z + (mode === "play" ? scroll : 0)]}>{modelElement(p.model, p.render)}</group>)}<group ref={playerRef} position={[targetLaneX, 0.5, PLAYER_Z]} visible={cameraView !== "fps"}>{modelElement(project.genre === "race" ? "car" : project.genre === "futuristic" || project.genre === "shooter" ? "robot" : "warrior", project.genre === "race" ? baseRender("#111827", "#22d3ee", 2.5, 0.65, 0.25) : baseRender("#d6d3d1", "#facc15", 1.3, 0.75, 0.3))}<pointLight color="#67e8f9" intensity={3} distance={6} /></group>{(project.weather === "rain" || project.weather === "storm") && Array.from({ length: 120 }).map((_, i) => <mesh key={i} position={[(i % 19 - 9) * 0.9, 3 + (i % 9) * 0.45, -34 + (i % 23) * 2]}><boxGeometry args={[0.015, 0.7, 0.015]} /><meshBasicMaterial color="#93c5fd" transparent opacity={0.5} /></mesh>)}{project.weather === "storm" && <pointLight position={[0, 8, -12]} color="#bfdbfe" intensity={8} distance={45} />}{mode !== "play" && Array.from({ length: 12 }).map((_, row) => ([-1, 0, 1] as const).map((lane) => <mesh key={`${row}-${lane}`} position={[LANE_X[lane + 1], 0.07, PLAYER_Z - 6 - row * 4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.15, 3.65]} /><meshBasicMaterial color="#e0f2fe" transparent opacity={0.055} /></mesh>))}</>;
}

type CameraView = "tps" | "tps-close" | "fps" | "side" | "top" | "orbit";
const CAMERA_VIEWS: { id: CameraView; label: string; emoji: string }[] = [
  { id: "tps", label: "3ª Pessoa", emoji: "🎮" },
  { id: "tps-close", label: "Over-Shoulder", emoji: "🎯" },
  { id: "fps", label: "FPS", emoji: "🔫" },
  { id: "side", label: "Side", emoji: "🕹️" },
  { id: "top", label: "Top-Down", emoji: "🗺️" },
  { id: "orbit", label: "Cinematográfica", emoji: "🎬" },
];
function defaultCameraFor(g: Genre): CameraView { return g === "shooter" || g === "futuristic" ? "fps" : g === "race" ? "tps-close" : g === "fight" ? "orbit" : g === "platform" ? "side" : g === "sandbox" ? "top" : "tps"; }

function brushColor(brush: TerrainBrush) { return ({ track: "#30343b", height: "#8b7355", smooth: "#55744a", water: "#0ea5e9", sand: "#d6b46a", snow: "#e0f2fe", dirt: "#765238", mountain: "#6b7280" } as Record<TerrainBrush, string>)[brush]; }

export default function Creator({ onExit }: { onExit: () => void }) {
  const [history, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: safeLoadProject(), future: [] }));
  const project = history.present;
  const [mode, setMode] = useState<Mode>("template");
  const [music, setMusic] = useState(false);
  const [status, setStatus] = useState<"booting" | "ready" | "recovering">("booting");
  const [logs, setLogs] = useState<LogEntry[]>([{ level: "ok", text: "Kernel visual carregado" }, { level: "ok", text: "Cache de projeto pronto" }]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const playerYRef = useRef(0);
  const jumpVel = useRef(0);
  const scrollRef = useRef(0);
  const [scroll, setScroll] = useState(0);
  const rafId = useRef<number | null>(null);
  const hitCool = useRef(0);

  useEffect(() => { const id = window.setTimeout(() => setStatus("ready"), 650); return () => window.clearTimeout(id); }, []);
  useEffect(() => { if (music) startMusic(); else stopMusic(); return () => stopMusic(); }, [music]);
  useEffect(() => { const id = window.setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); setLogs((l) => [{ level: "ok" as const, text: `Autosave ${new Date().toLocaleTimeString()}` }, ...l].slice(0, 8)); } catch { setLogs((l) => [{ level: "warn" as const, text: "Cache local cheio: projeto mantido em memória" }, ...l].slice(0, 8)); } }, 450); return () => clearTimeout(id); }, [project]);
  useEffect(() => { ASSET_LIBRARY.slice(0, 10).forEach((a) => modelElement(a.model, a.render)); }, []);

  const patch = useCallback((patchData: Partial<CreatorProject>, save = true) => dispatch({ type: "patch", patch: patchData, save }), []);
  const selectGenre = (genre: Genre) => { dispatch({ type: "replace", project: defaultProject(genre) }); setMode("edit"); setLogs((l) => [{ level: "ok" as const, text: `${GENRE_TEMPLATES[genre].label}: módulos, física e câmera aplicados` }, ...l].slice(0, 8)); SFX.click(); };
  const selectedAsset = ASSET_LIBRARY.find((a) => a.id === project.selectedAssetId) ?? ASSET_LIBRARY[0];
  const filteredAssets = ASSET_LIBRARY.filter((a) => a.genres.includes(project.genre) || project.genre === "sandbox");
  const placeAt = (lane: -1 | 0 | 1, row: number) => {
    if (mode === "play") return;
    const z = PLAYER_Z - 6 - row * 4;
    if (project.selectedTool === "terrain" || project.selectedTool === "track") {
      const terrain = [...project.terrain.filter((c) => !(c.row === row && c.lane === lane)), { row, lane, brush: project.selectedTool === "track" ? "track" : project.selectedBrush, height: project.selectedBrush === "mountain" || project.selectedBrush === "height" ? 2 : 0 }];
      patch({ terrain }); SFX.place(); return;
    }
    const next: Placed = { id: `${Date.now()}-${Math.random()}`, model: selectedAsset.model, lane, z, render: selectedAsset.render, category: selectedAsset.category, name: selectedAsset.label, layer: selectedAsset.category === "Iluminação" ? "Iluminação" : selectedAsset.category === "Partículas" ? "Partículas" : selectedAsset.category === "Personagens" || selectedAsset.category === "Criaturas" ? "Personagens" : selectedAsset.category === "Pistas" || selectedAsset.category === "Corrida" ? "Pistas" : "Gameplay" };
    patch({ placed: [...project.placed.filter((p) => !(p.lane === lane && Math.abs(p.z - z) < 1.8)), next] }); SFX.place();
  };
  const resetProject = () => { dispatch({ type: "replace", project: defaultProject(project.genre) }); SFX.click(); };
  const recover = () => { setStatus("recovering"); window.setTimeout(() => setStatus("ready"), 500); setLogs((l) => [{ level: "warn" as const, text: "Auto recovery: viewport reiniciada com projeto salvo" }, ...l].slice(0, 8)); };

  useEffect(() => {
    if (mode !== "play") { if (rafId.current) cancelAnimationFrame(rafId.current); scrollRef.current = 0; setScroll(0); setScore(0); setLives(3); jumpVel.current = 0; playerYRef.current = 0; setPlayerY(0); return; }
    let last = performance.now(); let scoreAcc = 0; const speed = SPEED_VALUES[project.speedTier] * (project.genre === "race" ? 1.15 : 0.72);
    const tick = (now: number) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; scrollRef.current += speed * dt; setScroll(scrollRef.current); scoreAcc += dt; if (scoreAcc >= 0.4) { scoreAcc = 0; setScore((s) => s + 1); }
      if (project.genre === "platform") { jumpVel.current -= 18 * dt; playerYRef.current = Math.max(0, playerYRef.current + jumpVel.current * dt); if (playerYRef.current === 0) jumpVel.current = 0; setPlayerY(playerYRef.current); } else setPlayerY(0);
      project.placed.forEach((p) => { const worldZ = p.z + scrollRef.current; if (Math.abs(worldZ - PLAYER_Z) < 1 && (project.genre === "platform" ? playerYRef.current < 0.9 : p.lane === playerLane) && now - hitCool.current > 850) { hitCool.current = now; SFX.hit(); setLives((l) => Math.max(0, l - 1)); } }); rafId.current = requestAnimationFrame(tick); };
    rafId.current = requestAnimationFrame(tick); return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [mode, project.genre, project.speedTier, project.placed, playerLane]);
  useEffect(() => { if (mode === "play" && lives <= 0) { setMode("edit"); setLogs((l) => [{ level: "warn" as const, text: "Teste encerrado: voltando ao editor sem perder alterações" }, ...l].slice(0, 8)); } }, [lives, mode]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") dispatch({ type: "undo" }); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") dispatch({ type: "redo" }); if (mode !== "play") return; if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") setPlayerLane((l) => Math.max(-1, l - 1)); if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") setPlayerLane((l) => Math.min(1, l + 1)); if ((e.key === " " || e.key === "ArrowUp") && playerYRef.current === 0) { jumpVel.current = 8; SFX.jump(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [mode]);

  return <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100"><CreatorErrorBoundary onRecover={recover}><Suspense fallback={<ProfessionalLoader />}><LazyCanvas project={project} mode={mode} playerLane={playerLane} playerY={playerY} scroll={scroll} /></Suspense></CreatorErrorBoundary>{status !== "ready" && <ProfessionalLoader label={status === "recovering" ? "Restaurando viewport e cache" : "Pré-carregando assets, áudio e editor"} />}{mode === "template" ? <TemplateSelector onExit={onExit} onSelect={selectGenre} restored={project.placed.length > 0} onResume={() => { setMode("edit"); SFX.click(); }} /> : <EditorUI project={project} filteredAssets={filteredAssets} selectedAsset={selectedAsset} mode={mode} music={music} score={score} lives={lives} logs={logs} canUndo={history.past.length > 0} canRedo={history.future.length > 0} onExit={onExit} onBackTemplates={() => setMode("template")} onPatch={patch} onUndo={() => dispatch({ type: "undo" })} onRedo={() => dispatch({ type: "redo" })} onReset={resetProject} onSetMode={setMode} onSetMusic={setMusic} onPlace={placeAt} onRecover={recover} onMove={(dir) => { setPlayerLane((l) => Math.max(-1, Math.min(1, l + dir))); SFX.click(); }} onJump={() => { if (playerYRef.current === 0) { jumpVel.current = 8; SFX.jump(); } }} />}</div>;
}

function TemplateSelector({ onExit, onSelect, restored, onResume }: { onExit: () => void; onSelect: (g: Genre) => void; restored: boolean; onResume: () => void }) {
  return <div className="absolute inset-0 z-40 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,27,75,0.94)_48%,rgba(2,6,23,0.98))] p-4 sm:p-6"><div className="mx-auto flex max-w-7xl items-center justify-between"><button onClick={onExit} className="rounded-xl border border-cyan-300/30 bg-slate-950/60 px-4 py-2 text-sm font-black text-cyan-100 backdrop-blur">← Home</button>{restored && <button onClick={onResume} className="rounded-xl border border-emerald-300/50 bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-100">↻ Restaurar projeto</button>}</div><div className="mx-auto mt-7 max-w-7xl"><div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">FCN Creator Studio</div><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Criar Projeto</h1><p className="mt-3 text-sm text-slate-300 sm:text-base">Selecione um template visual. A engine muda física, câmera, ferramentas, assets e controles automaticamente.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.values(GENRE_TEMPLATES).map((t) => <button key={t.id} onClick={() => onSelect(t.id)} className="group min-h-44 rounded-2xl border border-cyan-300/20 bg-white/[0.06] p-4 text-left shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-200/60 hover:bg-cyan-300/10"><div className="text-4xl">{t.emoji}</div><div className="mt-3 text-xl font-black text-white">{t.label}</div><div className="mt-2 text-xs text-slate-300">{t.physics} • {t.camera} • {t.controls}</div><div className="mt-4 flex flex-wrap gap-1">{t.assets.slice(0, 3).map((a) => <span key={a} className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-100">{a}</span>)}</div></button>)}</div></div></div>;
}

function EditorUI(props: { project: CreatorProject; filteredAssets: typeof ASSET_LIBRARY; selectedAsset: typeof ASSET_LIBRARY[number]; mode: Mode; music: boolean; score: number; lives: number; logs: { level: LogLevel; text: string }[]; canUndo: boolean; canRedo: boolean; onExit: () => void; onBackTemplates: () => void; onPatch: (p: Partial<CreatorProject>, save?: boolean) => void; onUndo: () => void; onRedo: () => void; onReset: () => void; onSetMode: (m: Mode) => void; onSetMusic: (v: boolean | ((v: boolean) => boolean)) => void; onPlace: (lane: -1 | 0 | 1, row: number) => void; onRecover: () => void; onMove: (d: -1 | 1) => void; onJump: () => void }) {
  const p = props.project; const template = GENRE_TEMPLATES[p.genre]; const rows = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return <><div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3"><div className="pointer-events-auto flex gap-2"><button onClick={props.onBackTemplates} className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-xs font-black backdrop-blur">☰ Projetos</button><button onClick={props.onExit} className="rounded-xl border border-slate-400/30 bg-slate-950/70 px-3 py-2 text-xs font-black backdrop-blur">← Home</button></div><div className="pointer-events-auto rounded-2xl border border-cyan-300/20 bg-slate-950/75 px-4 py-2 text-center shadow-xl backdrop-blur"><div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">{template.emoji} {template.label}</div><div className="text-lg font-black text-white">{p.name}</div></div><div className="pointer-events-auto flex gap-2"><button disabled={!props.canUndo} onClick={props.onUndo} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30">↶</button><button disabled={!props.canRedo} onClick={props.onRedo} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30">↷</button><button onClick={() => props.onSetMode(props.mode === "play" ? "edit" : "play")} className={`rounded-xl px-4 py-2 text-xs font-black ${props.mode === "play" ? "bg-emerald-400 text-slate-950" : "bg-cyan-400 text-slate-950"}`}>{props.mode === "play" ? "■ EDIT" : "▶ PLAY"}</button></div></div>{props.mode !== "play" && <><aside className="absolute left-3 top-20 z-20 hidden max-h-[calc(100vh-9rem)] w-64 overflow-y-auto rounded-2xl border border-cyan-300/20 bg-slate-950/78 p-3 shadow-2xl backdrop-blur-xl md:block"><div className="mb-2 text-xs font-black uppercase tracking-widest text-cyan-300">Ferramentas</div><div className="grid grid-cols-2 gap-2">{TOOLS.map((t) => <button key={t.id} onClick={() => { props.onPatch({ selectedTool: t.id }); SFX.click(); }} className={`rounded-xl p-2 text-left text-xs font-bold ${p.selectedTool === t.id ? "bg-cyan-300 text-slate-950" : "bg-white/8 text-slate-200"}`}><span className="mr-1 text-base">{t.emoji}</span>{t.label}</button>)}</div><div className="mt-4 text-xs font-black uppercase tracking-widest text-cyan-300">Terreno</div><div className="mt-2 grid grid-cols-2 gap-2">{GENRE_TEMPLATES[p.genre].tools.map((b) => <button key={b} onClick={() => props.onPatch({ selectedBrush: b, selectedTool: b === "track" ? "track" : "terrain" })} className={`rounded-lg px-2 py-2 text-xs font-black capitalize ${p.selectedBrush === b ? "bg-fuchsia-400 text-slate-950" : "bg-white/8"}`}>{b}</button>)}</div><div className="mt-4 grid grid-cols-3 gap-2">{(["clear", "rain", "fog", "night", "storm"] as WeatherType[]).map((w) => <button key={w} onClick={() => props.onPatch({ weather: w })} className={`rounded-lg p-2 text-xs font-black ${p.weather === w ? "bg-blue-400 text-slate-950" : "bg-white/8"}`}>{w}</button>)}</div><div className="mt-4 flex gap-2">{(["slow", "medium", "fast"] as SpeedTier[]).map((s) => <button key={s} onClick={() => props.onPatch({ speedTier: s })} className={`flex-1 rounded-lg p-2 text-xs font-black ${p.speedTier === s ? "bg-amber-300 text-slate-950" : "bg-white/8"}`}>{s}</button>)}</div></aside><aside className="absolute right-3 top-20 z-20 hidden max-h-[calc(100vh-9rem)] w-72 overflow-y-auto rounded-2xl border border-fuchsia-300/20 bg-slate-950/78 p-3 shadow-2xl backdrop-blur-xl lg:block"><div className="text-xs font-black uppercase tracking-widest text-fuchsia-300">Inspector</div><div className="mt-3 rounded-xl bg-white/8 p-3"><div className="text-sm font-black">{props.selectedAsset.emoji} {props.selectedAsset.label}</div><div className="mt-1 text-xs text-slate-300">{props.selectedAsset.category} • {props.selectedAsset.model}</div></div><div className="mt-4 text-xs font-black uppercase tracking-widest text-fuchsia-300">Layers</div><div className="mt-2 space-y-2">{LAYER_NAMES.map((l) => <label key={l} className="flex items-center justify-between rounded-lg bg-white/8 px-3 py-2 text-xs font-bold"><span>{l}</span><input type="checkbox" checked={p.layers[l] !== false} onChange={(e) => props.onPatch({ layers: { ...p.layers, [l]: e.currentTarget.checked } })} /></label>)}</div><div className="mt-4 text-xs font-black uppercase tracking-widest text-fuchsia-300">Profiler</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/8 p-2"><b>Assets</b><br />{p.placed.length}/{props.filteredAssets.length}</div><div className="rounded-lg bg-white/8 p-2"><b>FPS alvo</b><br />60 mobile</div><div className="rounded-lg bg-white/8 p-2"><b>Cache</b><br />autosave</div><div className="rounded-lg bg-white/8 p-2"><b>GPU</b><br />WebGL safe</div></div><div className="mt-4 text-xs font-black uppercase tracking-widest text-fuchsia-300">Console</div><div className="mt-2 space-y-1">{props.logs.map((l, i) => <div key={i} className={`rounded px-2 py-1 text-[11px] ${l.level === "ok" ? "bg-emerald-400/10 text-emerald-200" : l.level === "warn" ? "bg-amber-400/10 text-amber-200" : "bg-red-400/10 text-red-200"}`}>{l.text}</div>)}</div><button onClick={props.onRecover} className="mt-3 w-full rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950">Auto Recovery</button></aside><div className="absolute inset-0 z-10 flex items-center justify-center pt-14 pb-36"><div className="pointer-events-auto grid grid-cols-3 gap-1 rounded-2xl border border-cyan-300/10 bg-slate-950/12 p-2 backdrop-blur-[1px]">{rows.map((r) => ([-1, 0, 1] as const).map((lane) => <button key={`${r}-${lane}`} onClick={() => props.onPlace(lane, r)} className="h-8 w-20 rounded border border-cyan-100/10 bg-cyan-100/5 hover:border-cyan-200/70 hover:bg-cyan-200/15 sm:h-9 sm:w-24" aria-label={`editar célula ${lane}-${r}`} />))}</div></div><div className="absolute inset-x-0 bottom-0 z-30 border-t border-cyan-300/20 bg-slate-950/86 p-3 shadow-[0_-20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"><div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">{props.filteredAssets.map((a) => <button key={a.id} onClick={() => props.onPatch({ selectedAssetId: a.id, selectedTool: "asset" })} className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition ${p.selectedAssetId === a.id ? "scale-105 border-cyan-200 bg-cyan-300/25 shadow-lg shadow-cyan-400/25" : "border-white/10 bg-white/7"}`}><span className="text-2xl">{a.emoji}</span><span className="mt-1 text-[10px] font-black leading-tight">{a.label}</span></button>)}</div><div className="mx-auto mt-2 flex max-w-6xl items-center justify-between text-[11px] text-slate-400"><span>Viewport superior: mapa top-down • viewport realtime: luz, sombra, clima e teste instantâneo</span><button onClick={props.onReset} className="rounded-lg bg-red-500/20 px-3 py-1 font-black text-red-100">Reset</button></div></div></>}{props.mode === "play" && <><div className="absolute left-3 top-20 z-20 rounded-2xl border border-cyan-300/20 bg-slate-950/75 px-4 py-3 text-sm font-black backdrop-blur">⭐ {props.score} · {"❤".repeat(props.lives)}</div><div className="absolute inset-x-0 bottom-0 z-30 flex select-none justify-between gap-4 p-4 touch-none sm:p-8">{p.genre === "platform" ? <button onClick={props.onJump} onTouchStart={(e) => { e.preventDefault(); props.onJump(); }} className="mx-auto flex h-24 w-56 touch-none items-center justify-center rounded-full border-4 border-amber-200 bg-amber-300/25 text-2xl font-black text-amber-50 backdrop-blur active:scale-95">⬆ JUMP</button> : <><button onClick={() => props.onMove(-1)} onTouchStart={(e) => { e.preventDefault(); props.onMove(-1); }} className="flex h-20 w-36 touch-none items-center justify-center rounded-2xl border-2 border-cyan-300/70 bg-cyan-950/55 text-xl font-black text-cyan-100 backdrop-blur active:scale-95">◀ LEFT</button><button onClick={() => props.onMove(1)} onTouchStart={(e) => { e.preventDefault(); props.onMove(1); }} className="flex h-20 w-36 touch-none items-center justify-center rounded-2xl border-2 border-fuchsia-300/70 bg-fuchsia-950/55 text-xl font-black text-fuchsia-100 backdrop-blur active:scale-95">RIGHT ▶</button></>}</div></>}<button onClick={() => props.onSetMusic((m) => !m)} className="absolute bottom-24 right-4 z-40 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-xs font-black backdrop-blur">{props.music ? "🔊" : "🔇"}</button></>;
}