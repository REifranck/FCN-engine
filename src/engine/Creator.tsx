import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ModelType, RenderComponent } from "../core/types";
import { modelElement } from "./models";
import { SFX, startMusic, stopMusic } from "./audio";
import { SPEED_VALUES, THEMES, type Genre, type SkyTheme, type SpeedTier } from "./themes";

// ---------- types ----------
interface Placed {
  id: string;
  model: ModelType;
  lane: -1 | 0 | 1;
  z: number; // world z (negative = far ahead)
  render: RenderComponent;
}

const LANE_X = [-2.2, 0, 2.2];
const PLAYER_Z = 4;
const TRACK_LEN = 60; // total editable distance

// ---------- model palette ----------
const PALETTE: { model: ModelType; emoji: string; label: string; render: RenderComponent }[] = [
  { model: "tree", emoji: "🌳", label: "Tree", render: { color: "#2f6a2a", emissive: "#000", emissiveIntensity: 0, metalness: 0, roughness: 1 } },
  { model: "rock", emoji: "🪨", label: "Rock", render: { color: "#7a7a7a", emissive: "#000", emissiveIntensity: 0, metalness: 0.1, roughness: 1 } },
  { model: "house", emoji: "🏠", label: "House", render: { color: "#c89060", emissive: "#000", emissiveIntensity: 0, metalness: 0.1, roughness: 0.8 } },
  { model: "fence", emoji: "🚧", label: "Fence", render: { color: "#a07040", emissive: "#000", emissiveIntensity: 0, metalness: 0, roughness: 1 } },
  { model: "lamp", emoji: "💡", label: "Lamp", render: { color: "#333", emissive: "#fff5a8", emissiveIntensity: 2, metalness: 0.8, roughness: 0.3 } },
  { model: "building", emoji: "🏢", label: "Tower", render: { color: "#1a1030", emissive: "#00bfff", emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.5 } },
  { model: "barrel", emoji: "🛢️", label: "Barrel", render: { color: "#6a3a1a", emissive: "#000", emissiveIntensity: 0, metalness: 0.3, roughness: 0.7 } },
  { model: "cow", emoji: "🐄", label: "Cow", render: { color: "#f0f0f0", emissive: "#000", emissiveIntensity: 0, metalness: 0, roughness: 1 } },
  { model: "horse", emoji: "🐎", label: "Horse", render: { color: "#6a3a1a", emissive: "#000", emissiveIntensity: 0, metalness: 0.1, roughness: 0.9 } },
  { model: "orc", emoji: "👹", label: "Orc", render: { color: "#4a6a30", emissive: "#ff2200", emissiveIntensity: 1.8, metalness: 0.1, roughness: 0.85 } },
  { model: "werewolf", emoji: "🐺", label: "Wolf", render: { color: "#3a2a20", emissive: "#ffaa00", emissiveIntensity: 2, metalness: 0.1, roughness: 0.9 } },
  { model: "dragon", emoji: "🐉", label: "Dragon", render: { color: "#5a1818", emissive: "#ff5500", emissiveIntensity: 2.2, metalness: 0.3, roughness: 0.6 } },
];

// ---------- 3D Scene ----------
function CreatorScene({
  placed, theme, genre, mode, speed, playerLane, playerY, scroll,
}: {
  placed: Placed[];
  theme: SkyTheme;
  genre: Genre;
  mode: "edit" | "play";
  speed: number;
  playerLane: number;
  playerY: number;
  scroll: number;
}) {
  const t = THEMES[theme];
  const playerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const targetLaneX = LANE_X[playerLane + 1];

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (mode === "edit") {
      // Top-down isometric
      camera.position.x += (0 - camera.position.x) * Math.min(1, dt * 4);
      camera.position.y += (22 - camera.position.y) * Math.min(1, dt * 3);
      camera.position.z += (PLAYER_Z + 4 - camera.position.z) * Math.min(1, dt * 3);
      camera.lookAt(0, 0, PLAYER_Z - 8);
    } else {
      camera.position.x += (targetLaneX * 0.4 - camera.position.x) * Math.min(1, dt * 6);
      camera.position.y += (4.5 - camera.position.y) * Math.min(1, dt * 4);
      camera.position.z += (PLAYER_Z + 6 - camera.position.z) * Math.min(1, dt * 4);
      camera.lookAt(targetLaneX * 0.3, 1, 0);
    }
    if (playerRef.current) {
      playerRef.current.position.x += (targetLaneX - playerRef.current.position.x) * Math.min(1, dt * 12);
      playerRef.current.position.y = playerY + 0.5 + Math.sin(performance.now() * 0.006) * 0.05;
    }
  });

  // ground tiles
  const tiles = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  return (
    <>
      <color attach="background" args={[t.sky]} />
      <fog attach="fog" args={[t.fog, 14, 70]} />
      <ambientLight intensity={t.ambient} />
      <directionalLight position={[8, 14, 6]} intensity={1.2} color={t.sun} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
      <hemisphereLight args={[t.sky, t.ground, 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={t.ground} roughness={1} />
      </mesh>

      {/* Track ribbon */}
      <group>
        {tiles.map((i) => (
          <group key={i} position={[0, 0, PLAYER_Z - i * 8 + (scroll % 8)]}>
            {modelElement("track", t.track)}
          </group>
        ))}
      </group>

      {/* Placed objects */}
      {placed.map((p) => (
        <group key={p.id} position={[LANE_X[p.lane + 1], 0, p.z + scroll]}>
          {modelElement(p.model, p.render)}
        </group>
      ))}

      {/* Player */}
      <group ref={playerRef} position={[targetLaneX, 0.5, PLAYER_Z]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 1.4]} />
          <meshStandardMaterial color="#ffaa33" emissive="#ff6600" emissiveIntensity={1.4} metalness={0.5} roughness={0.3} />
        </mesh>
        <pointLight color="#ffaa33" intensity={3} distance={6} />
      </group>

      {/* Edit-mode grid overlay */}
      {mode === "edit" && (
        <group>
          {Array.from({ length: 12 }).map((_, i) =>
            [-1, 0, 1].map((lane) => (
              <mesh key={`${i}-${lane}`} position={[LANE_X[lane + 1], 0.06, PLAYER_Z - 4 - i * 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2, 3.6]} />
                <meshBasicMaterial color={i % 2 ? "#ffffff" : "#ffe0a0"} transparent opacity={0.08} />
              </mesh>
            ))
          )}
        </group>
      )}
    </>
  );
}

// ---------- Main creator component ----------
export default function Creator({ onExit }: { onExit: () => void }) {
  const [genre, setGenre] = useState<Genre>("runner");
  const [theme, setTheme] = useState<SkyTheme>("day");
  const [speedTier, setSpeedTier] = useState<SpeedTier>("medium");
  const [mode, setMode] = useState<"edit" | "play">("edit");
  const [selected, setSelected] = useState<number | "erase">(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [music, setMusic] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState(0);
  const playerYRef = useRef(0);
  const [playerY, setPlayerY] = useState(0);
  const jumpVel = useRef(0);
  const scrollRef = useRef(0);
  const [scroll, setScroll] = useState(0);
  const hitCool = useRef(0);
  const rafId = useRef<number | null>(null);

  // Music toggle
  useEffect(() => { if (music) startMusic(); else stopMusic(); return () => stopMusic(); }, [music]);

  // Place / erase by clicking a lane row in edit mode
  const placeAt = (lane: -1 | 0 | 1, rowIndex: number) => {
    if (mode !== "edit") return;
    const z = PLAYER_Z - 6 - rowIndex * 4;
    if (selected === "erase") {
      setPlaced((arr) => arr.filter((p) => !(p.lane === lane && Math.abs(p.z - z) < 2)));
      SFX.click();
      return;
    }
    const item = PALETTE[selected];
    SFX.place();
    setPlaced((arr) => [
      ...arr.filter((p) => !(p.lane === lane && Math.abs(p.z - z) < 2)),
      { id: `${Date.now()}-${Math.random()}`, model: item.model, lane, z, render: item.render },
    ]);
  };

  const clearAll = () => { setPlaced([]); SFX.click(); };

  // ----- Play loop -----
  useEffect(() => {
    if (mode !== "play") {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      scrollRef.current = 0;
      setScroll(0);
      setScore(0);
      setLives(3);
      jumpVel.current = 0;
      playerYRef.current = 0;
      setPlayerY(0);
      return;
    }
    let last = performance.now();
    const speed = SPEED_VALUES[speedTier];
    let scoreAcc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      scrollRef.current += speed * dt;
      setScroll(scrollRef.current);
      scoreAcc += dt;
      if (scoreAcc >= 0.25) { scoreAcc = 0; setScore((s) => s + 1); SFX.coin(); }

      // jumper gravity
      if (genre === "jumper") {
        jumpVel.current -= 18 * dt;
        playerYRef.current = Math.max(0, playerYRef.current + jumpVel.current * dt);
        if (playerYRef.current === 0) jumpVel.current = 0;
        setPlayerY(playerYRef.current);
      } else {
        setPlayerY(0);
      }

      // collisions
      const px = playerLane;
      for (const p of placed) {
        const worldZ = p.z + scrollRef.current;
        if (Math.abs(worldZ - PLAYER_Z) < 1 && (genre === "jumper" ? true : p.lane === px) && playerYRef.current < 0.9) {
          if (genre === "jumper" || p.lane === px) {
            if (now - hitCool.current > 800) {
              hitCool.current = now;
              SFX.hit();
              setLives((l) => Math.max(0, l - 1));
            }
          }
        }
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [mode, speedTier, genre, placed, playerLane]);

  // Auto game-over
  useEffect(() => { if (mode === "play" && lives <= 0) { setMode("edit"); SFX.hit(); } }, [lives, mode]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "play") return;
      if (genre === "runner") {
        if (e.key === "ArrowLeft") { setPlayerLane((l) => Math.max(-1, l - 1)); SFX.click(); }
        if (e.key === "ArrowRight") { setPlayerLane((l) => Math.min(1, l + 1)); SFX.click(); }
      } else if (e.key === " " || e.key === "ArrowUp") {
        if (playerYRef.current === 0) { jumpVel.current = 8; SFX.jump(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, genre]);

  const jump = useCallback(() => { if (playerYRef.current === 0) { jumpVel.current = 8; SFX.jump(); } }, []);
  const moveLane = (dir: -1 | 1) => { setPlayerLane((l) => Math.max(-1, Math.min(1, l + dir))); SFX.click(); };

  // Grid click rows for edit mode
  const rows = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans text-white">
      <Canvas shadows dpr={[1, 1.2]} gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }} camera={{ position: [0, 22, 10], fov: 55 }}>
        <CreatorScene placed={placed} theme={theme} genre={genre} mode={mode} speed={SPEED_VALUES[speedTier]} playerLane={playerLane} playerY={playerY} scroll={scroll} />
      </Canvas>

      {/* Edit grid click overlay (transparent buttons over the screen) */}
      {mode === "edit" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto grid gap-1 p-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {rows.map((r) =>
              ([-1, 0, 1] as const).map((lane) => (
                <button
                  key={`${r}-${lane}`}
                  onClick={() => placeAt(lane, r)}
                  className="h-7 w-16 rounded border border-white/20 bg-white/5 transition hover:border-yellow-300 hover:bg-yellow-300/20 sm:h-8 sm:w-20"
                  aria-label={`Place lane ${lane} row ${r}`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between gap-2 p-3">
        <button onClick={() => { SFX.click(); onExit(); }} className="pointer-events-auto rounded-full border-2 border-white/40 bg-black/50 px-4 py-2 text-sm font-bold backdrop-blur-md hover:bg-white/10">← Home</button>
        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => { setMode("edit"); SFX.click(); }}
            className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wider transition ${mode === "edit" ? "bg-yellow-300 text-black shadow-lg shadow-yellow-300/50" : "bg-white/10 text-white"}`}
          >🎨 Edit</button>
          <button
            onClick={() => { setMode("play"); SFX.click(); }}
            className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wider transition ${mode === "play" ? "bg-green-400 text-black shadow-lg shadow-green-400/50" : "bg-white/10 text-white"}`}
          >▶ Play</button>
        </div>
        {mode === "play" ? (
          <div className="pointer-events-auto flex gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold backdrop-blur-md">
            <span>⭐ {score}</span><span>{"❤".repeat(lives)}</span>
          </div>
        ) : (
          <button onClick={() => setMusic((m) => !m)} className="pointer-events-auto rounded-full border-2 border-white/40 bg-black/50 px-4 py-2 text-sm font-bold backdrop-blur-md hover:bg-white/10">
            {music ? "🔊 Music" : "🔇 Music"}
          </button>
        )}
      </div>

      {/* Edit mode controls */}
      {mode === "edit" && (
        <>
          {/* Left side genre + sliders */}
          <div className="absolute left-3 top-20 flex w-44 flex-col gap-3 rounded-2xl bg-black/70 p-3 text-xs backdrop-blur-md">
            <div>
              <div className="mb-1 font-bold uppercase opacity-70">Game Type</div>
              <div className="flex gap-1">
                <button onClick={() => { setGenre("runner"); SFX.click(); }} className={`flex-1 rounded-lg p-2 text-xs font-bold ${genre === "runner" ? "bg-cyan-400 text-black" : "bg-white/10"}`}>🏎️ Runner</button>
                <button onClick={() => { setGenre("jumper"); SFX.click(); }} className={`flex-1 rounded-lg p-2 text-xs font-bold ${genre === "jumper" ? "bg-pink-400 text-black" : "bg-white/10"}`}>🦘 Jumper</button>
              </div>
            </div>
            <div>
              <div className="mb-1 font-bold uppercase opacity-70">Speed</div>
              <div className="flex gap-1">
                {(["slow", "medium", "fast"] as SpeedTier[]).map((s) => (
                  <button key={s} onClick={() => { setSpeedTier(s); SFX.click(); }} className={`flex-1 rounded-lg p-2 text-xs font-bold capitalize ${speedTier === s ? "bg-yellow-300 text-black" : "bg-white/10"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 font-bold uppercase opacity-70">Sky Theme</div>
              <div className="flex gap-1">
                {(["day", "cyber", "forest"] as SkyTheme[]).map((s) => (
                  <button key={s} onClick={() => { setTheme(s); SFX.click(); }} className={`flex-1 rounded-lg p-2 text-lg ${theme === s ? "bg-white/30 ring-2 ring-yellow-300" : "bg-white/10"}`} title={THEMES[s].name}>{THEMES[s].emoji}</button>
                ))}
              </div>
            </div>
            <button onClick={clearAll} className="rounded-lg bg-red-500/80 p-2 text-xs font-black uppercase tracking-wider hover:bg-red-500">🗑️ Clear All</button>
          </div>

          {/* Bottom palette drawer */}
          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-white/20 bg-black/80 p-3 backdrop-blur-md">
            <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto">
              <button
                onClick={() => { setSelected("erase"); SFX.click(); }}
                className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${selected === "erase" ? "border-red-400 bg-red-500/40 scale-105" : "border-white/20 bg-white/5"} transition`}
              >
                <span className="text-2xl">🗑️</span>
                <span className="text-[10px] font-bold">Erase</span>
              </button>
              {PALETTE.map((p, i) => (
                <button
                  key={p.model + i}
                  onClick={() => { setSelected(i); SFX.click(); }}
                  className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition ${selected === i ? "border-yellow-300 bg-yellow-300/30 scale-110 shadow-lg shadow-yellow-300/40" : "border-white/20 bg-white/5 hover:border-white/50"}`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[10px] font-bold">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-center text-[11px] opacity-60">Tap a slot on the track to place • {placed.length} objects placed</div>
          </div>
        </>
      )}

      {/* Play mode controls */}
      {mode === "play" && (
        <div className="absolute bottom-0 left-0 right-0 flex select-none justify-between gap-4 p-4 touch-none sm:p-8">
          {genre === "runner" ? (
            <>
              <button
                onClick={() => moveLane(-1)}
                onTouchStart={(e) => { e.preventDefault(); moveLane(-1); }}
                className="touch-none flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-cyan-400/70 bg-cyan-950/50 text-xl font-bold text-cyan-100 backdrop-blur-md active:scale-95 sm:h-24 sm:w-40"
              >◀ LEFT</button>
              <button
                onClick={() => moveLane(1)}
                onTouchStart={(e) => { e.preventDefault(); moveLane(1); }}
                className="touch-none flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-pink-400/70 bg-pink-950/50 text-xl font-bold text-pink-100 backdrop-blur-md active:scale-95 sm:h-24 sm:w-40"
              >RIGHT ▶</button>
            </>
          ) : (
            <button
              onClick={jump}
              onTouchStart={(e) => { e.preventDefault(); jump(); }}
              className="mx-auto touch-none flex h-24 w-48 items-center justify-center rounded-full border-4 border-yellow-300 bg-yellow-400/30 text-2xl font-black text-yellow-100 backdrop-blur-md active:scale-95 sm:h-28 sm:w-64"
            >⬆ JUMP</button>
          )}
        </div>
      )}
    </div>
  );
}
