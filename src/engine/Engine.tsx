import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import * as THREE from "three";
import { GAME_REGISTRY, getConfig } from "../core/registry";
import type { Entity, GameState } from "../core/types";
import { Scene } from "./Scene";
import Creator from "./Creator";
import { SFX } from "./audio";
import knightBg from "../assets/knight-hero.jpg";

type Action =
  | { type: "select"; id: string }
  | { type: "lane"; dir: -1 | 1 }
  | { type: "hit" }
  | { type: "score" }
  | { type: "restart" }
  | { type: "menu" };

const initial: GameState = { status: "menu", score: 0, lives: 3, lane: 0, configId: null };

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "select":
      return { ...initial, status: "playing", configId: a.id };
    case "lane":
      if (s.status !== "playing") return s;
      return { ...s, lane: Math.max(-1, Math.min(1, s.lane + a.dir)) as -1 | 0 | 1 };
    case "hit": {
      const lives = s.lives - 1;
      if (lives <= 0) return { ...s, lives: 0, status: "gameover" };
      return { ...s, lives };
    }
    case "score":
      return { ...s, score: s.score + 1 };
    case "restart":
      return s.configId ? { ...initial, status: "playing", configId: s.configId } : initial;
    case "menu":
      return initial;
  }
}

export default function Engine() {
  const [state, dispatch] = useReducer(reducer, initial);
  const entitiesRef = useRef<Entity[]>([]);
  const hitCooldown = useRef(0);
  const config = getConfig(state.configId);

  // Clear entities on (re)start
  useEffect(() => {
    if (state.status === "playing") entitiesRef.current = [];
  }, [state.status, state.configId]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dispatch({ type: "lane", dir: -1 });
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dispatch({ type: "lane", dir: 1 });
      else if (e.key === "Enter" && state.status === "gameover") dispatch({ type: "restart" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.status]);

  const handleHit = useCallback(() => {
    const now = performance.now();
    if (now - hitCooldown.current < 700) return;
    hitCooldown.current = now;
    dispatch({ type: "hit" });
  }, []);
  const handleScore = useCallback(() => dispatch({ type: "score" }), []);

  const lane = (dir: -1 | 1) => () => dispatch({ type: "lane", dir });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-mono text-cyan-300">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 1.2]}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [0, 4.5, 10], fov: 60 }}
      >
        {config && state.status !== "menu" && (
          <Scene
            config={config}
            state={state}
            entitiesRef={entitiesRef}
            onHit={handleHit}
            onScore={handleScore}
          />
        )}
        {!config && <color attach="background" args={["#050510"]} />}
      </Canvas>

      {/* HUD */}
      {state.status === "playing" && config && (
        <>
          <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-4 text-xs uppercase tracking-widest">
            <div className="rounded border border-cyan-500/40 bg-black/50 px-3 py-2 backdrop-blur-sm">
              <div className="text-cyan-400/60">Engine</div>
              <div className="text-base text-cyan-200">{config.name}</div>
            </div>
            <div className="rounded border border-cyan-500/40 bg-black/50 px-3 py-2 backdrop-blur-sm text-center">
              <div className="text-cyan-400/60">Score</div>
              <div className="text-2xl font-bold text-cyan-100">{state.score}</div>
            </div>
            <div className="rounded border border-fuchsia-500/40 bg-black/50 px-3 py-2 backdrop-blur-sm">
              <div className="text-fuchsia-400/60">Lives</div>
              <div className="text-base text-fuchsia-200">{"❤".repeat(state.lives)}</div>
            </div>
          </div>

          {/* Touch controls */}
          <div className="absolute bottom-0 left-0 right-0 flex select-none justify-between gap-4 p-4 sm:p-8 touch-none">
            <button
              onClick={lane(-1)}
              onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "lane", dir: -1 }); }}
              className="touch-none flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-cyan-400/70 bg-cyan-950/50 text-xl font-bold text-cyan-200 backdrop-blur-md active:scale-95 active:bg-cyan-400/30 sm:h-24 sm:w-40"
            >
              ◀ LEFT
            </button>
            <button
              onClick={lane(1)}
              onTouchStart={(e) => { e.preventDefault(); dispatch({ type: "lane", dir: 1 }); }}
              className="touch-none flex h-20 w-32 items-center justify-center rounded-2xl border-2 border-fuchsia-400/70 bg-fuchsia-950/50 text-xl font-bold text-fuchsia-200 backdrop-blur-md active:scale-95 active:bg-fuchsia-400/30 sm:h-24 sm:w-40"
            >
              RIGHT ▶
            </button>
          </div>
        </>
      )}

      {/* Start menu */}
      {state.status === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-black via-fuchsia-950/30 to-black p-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.4em] text-cyan-400/70">FCN Next Engine</div>
            <h1 className="mt-2 bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl">
              ULTRA ENGINE X ONE
            </h1>
            <p className="mt-3 text-sm text-cyan-200/60">Choose a procedural game world</p>
          </div>
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            {GAME_REGISTRY.map((g) => (
              <button
                key={g.id}
                onClick={() => dispatch({ type: "select", id: g.id })}
                className="group rounded-xl border border-cyan-500/30 bg-black/60 p-5 text-left backdrop-blur-sm transition hover:border-fuchsia-400/60 hover:bg-fuchsia-950/30"
              >
                <div className="text-lg font-bold text-cyan-100">{g.name}</div>
                <div className="mt-1 text-xs text-cyan-300/60">{g.tagline}</div>
                <div className="mt-4 text-xs font-bold uppercase tracking-widest text-fuchsia-300 group-hover:text-fuchsia-200">
                  ▶ Boot Engine
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game over */}
      {state.status === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-md">
          <h2 className="text-5xl font-black tracking-tight text-fuchsia-400">GAME OVER</h2>
          <div className="text-cyan-200">Final Score: <span className="text-2xl font-bold">{state.score}</span></div>
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: "restart" })}
              className="rounded-lg border-2 border-cyan-400 bg-cyan-950/50 px-6 py-3 font-bold text-cyan-100 hover:bg-cyan-400/20"
            >
              ↻ RESTART
            </button>
            <button
              onClick={() => dispatch({ type: "menu" })}
              className="rounded-lg border-2 border-fuchsia-400 bg-fuchsia-950/50 px-6 py-3 font-bold text-fuchsia-100 hover:bg-fuchsia-400/20"
            >
              ⌂ MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
