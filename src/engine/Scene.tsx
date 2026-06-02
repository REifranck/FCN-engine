import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Entity, GameConfig, GameState } from "../core/types";
import { modelElement } from "./models";

const LANE_X = [-2.2, 0, 2.2];
const PLAYER_Z = 4;

interface SceneProps {
  config: GameConfig;
  state: GameState;
  entitiesRef: React.MutableRefObject<Entity[]>;
  onHit: () => void;
  onScore: () => void;
}

export function Scene({ config, state, entitiesRef, onHit, onScore }: SceneProps) {
  const playerRef = useRef<THREE.Group>(null);
  const tracksRef = useRef<THREE.Group>(null);
  const obstaclesRef = useRef<THREE.Group>(null);
  const spawnTimer = useRef(0);
  const scoreTimer = useRef(0);
  const trackOffset = useRef(0);
  const camTargetX = useRef(0);
  const { camera } = useThree();

  const trackTiles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  useFrame((_, delta) => {
    if (state.status !== "playing") return;
    const dt = Math.min(delta, 0.05);
    const speed = config.speed;

    // Track scroll
    trackOffset.current = (trackOffset.current + speed * dt) % 8;
    if (tracksRef.current) {
      tracksRef.current.children.forEach((child, i) => {
        child.position.z = -i * 8 + trackOffset.current + PLAYER_Z;
      });
    }

    // Camera lerp
    camTargetX.current = LANE_X[state.lane + 1] * 0.4;
    camera.position.x += (camTargetX.current - camera.position.x) * Math.min(1, dt * 6);
    camera.position.y += (4.5 - camera.position.y) * Math.min(1, dt * 4);
    camera.position.z += (PLAYER_Z + 6 - camera.position.z) * Math.min(1, dt * 4);
    camera.lookAt(LANE_X[state.lane + 1] * 0.3, 1, 0);

    // Player lane lerp
    if (playerRef.current) {
      const targetX = LANE_X[state.lane + 1];
      playerRef.current.position.x += (targetX - playerRef.current.position.x) * Math.min(1, dt * 12);
      playerRef.current.position.y = 0.5 + Math.sin(performance.now() * 0.006) * 0.05;
    }

    // Spawn
    spawnTimer.current += dt;
    if (spawnTimer.current >= config.spawnInterval) {
      spawnTimer.current = 0;
      const totalWeight = config.obstacles.reduce((s, o) => s + o.weight, 0);
      let pick = Math.random() * totalWeight;
      let chosen = config.obstacles[0];
      for (const o of config.obstacles) {
        pick -= o.weight;
        if (pick <= 0) { chosen = o; break; }
      }
      const lane = Math.floor(Math.random() * 3) - 1;
      entitiesRef.current.push({
        id: `e${Date.now()}-${Math.random()}`,
        model: chosen.model,
        kind: chosen.kind,
        render: chosen.render,
        position: [LANE_X[lane + 1], 0, -40],
      });
    }

    // Move + collide
    const playerLaneX = LANE_X[state.lane + 1];
    const survivors: Entity[] = [];
    for (const e of entitiesRef.current) {
      e.position[2] += speed * dt;
      if (e.position[2] > PLAYER_Z + 4) continue;
      // Collision: same lane, near player Z
      const dz = Math.abs(e.position[2] - PLAYER_Z);
      const dx = Math.abs(e.position[0] - playerLaneX);
      if (dz < 1 && dx < 1.2) {
        onHit();
        continue;
      }
      survivors.push(e);
    }
    entitiesRef.current = survivors;

    // Apply transforms to obstacle group
    if (obstaclesRef.current) {
      obstaclesRef.current.children.forEach((child, i) => {
        const e = entitiesRef.current[i];
        if (e) child.position.set(e.position[0], e.position[1], e.position[2]);
      });
    }

    // Score over time
    scoreTimer.current += dt;
    if (scoreTimer.current >= 0.25) {
      scoreTimer.current = 0;
      onScore();
    }
  });

  return (
    <>
      <color attach="background" args={[config.skyColor]} />
      <fog attach="fog" args={[config.fogColor, 12, 50]} />
      <ambientLight intensity={config.ambient} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.3}
        color={config.sunColor}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight args={[config.skyColor, config.groundColor, 0.4]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={config.groundColor} roughness={1} />
      </mesh>

      {/* Track tiles */}
      <group ref={tracksRef}>
        {trackTiles.map((i) => (
          <group key={i} position={[0, 0, -i * 8 + PLAYER_Z]}>
            {modelElement("track", config.trackRender)}
          </group>
        ))}
      </group>

      {/* Side decor */}
      {config.decor.length > 0 &&
        Array.from({ length: 16 }).map((_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const d = config.decor[i % config.decor.length];
          return (
            <group key={i} position={[side * (4 + Math.random() * 3), 0, -i * 6]}>
              {modelElement(d.model, d.render)}
            </group>
          );
        })}

      {/* Player */}
      <group ref={playerRef} position={[0, 0.5, PLAYER_Z]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 1.4]} />
          <meshStandardMaterial
            color={config.playerColor}
            emissive={config.playerEmissive}
            emissiveIntensity={1.2}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        <pointLight color={config.playerEmissive} intensity={3} distance={6} />
      </group>

      {/* Obstacles pool — rendered as fixed list, transforms updated each frame */}
      <group ref={obstaclesRef}>
        {entitiesRef.current.map((e) => (
          <group key={e.id} position={e.position}>
            {modelElement(e.model, e.render)}
          </group>
        ))}
      </group>
    </>
  );
}
