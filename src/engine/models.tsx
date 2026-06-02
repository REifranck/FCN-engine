// FCN NEXT ENGINE — Procedural multi-part models (props + creatures)
import type { ReactElement } from "react";
import type { ModelType, RenderComponent } from "../core/types";

type M = RenderComponent;

function mat(color: string, opts: Partial<M> = {}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={opts.emissive ?? "#000000"}
      emissiveIntensity={opts.emissiveIntensity ?? 0}
      metalness={opts.metalness ?? 0.1}
      roughness={opts.roughness ?? 0.85}
    />
  );
}

function House(r: M) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.6, 1.4, 1.4]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.45, 0.9, 4]} />
        {mat("#7a2f24", { roughness: 0.8 })}
      </mesh>
      <mesh position={[0, 0.4, 0.71]}>
        <boxGeometry args={[0.4, 0.8, 0.05]} />
        {mat("#3a2412", { roughness: 0.7 })}
      </mesh>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.72]}>
          <boxGeometry args={[0.32, 0.32, 0.04]} />
          {mat("#ffd27a", { emissive: "#ffce7a", emissiveIntensity: 1.6 })}
        </mesh>
      ))}
      <mesh castShadow position={[0.5, 2.1, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        {mat("#5a4030")}
      </mesh>
    </group>
  );
}

function Barrel(r: M) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.42, 0.36, 1.1, 18]} />
        {mat(r.color, r)}
      </mesh>
      {[0.25, 0.55, 0.85].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.43, 0.04, 8, 20]} />
          {mat("#2a1a0e", { metalness: 0.6, roughness: 0.4 })}
        </mesh>
      ))}
    </group>
  );
}

function Tree(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 1.4, 10]} />
        {mat("#5a3a1e", { roughness: 0.95 })}
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <icosahedronGeometry args={[0.95, 0]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0.4, 2.3, 0.2]}>
        <icosahedronGeometry args={[0.6, 0]} />
        {mat(r.color, r)}
      </mesh>
    </group>
  );
}

function Rock(r: M) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0.7, 0.3, 0.3]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        {mat(r.color, r)}
      </mesh>
    </group>
  );
}

function Building(r: M) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[2, 6, 2]} />
        {mat(r.color, { ...r, emissiveIntensity: 0.15 })}
      </mesh>
      {Array.from({ length: 5 }).map((_, row) =>
        [-0.6, 0, 0.6].map((x) => (
          <mesh key={`${row}-${x}`} position={[x, 1 + row * 1.1, 1.01]}>
            <boxGeometry args={[0.4, 0.5, 0.04]} />
            {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: row % 2 ? 2.2 : 0.6 })}
          </mesh>
        ))
      )}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: 3 })}
      </mesh>
    </group>
  );
}

function Lamp(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 2.8, 8]} />
        {mat(r.color, { metalness: 0.8, roughness: 0.4 })}
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: r.emissiveIntensity })}
      </mesh>
      <pointLight position={[0, 2.85, 0]} intensity={12} distance={10} color={r.emissive} />
    </group>
  );
}

function Fence(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[1.2, 0.6, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        {mat(r.color, r)}
      </mesh>
      {[0.4, 0.85].map((y) => (
        <mesh key={y} castShadow position={[0.6, y, 0]}>
          <boxGeometry args={[1.3, 0.1, 0.08]} />
          {mat(r.color, r)}
        </mesh>
      ))}
    </group>
  );
}

function Track(r: M) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 8]} />
        {mat(r.color, { metalness: 0.2, roughness: 0.6 })}
      </mesh>
      {[-3, -1.5, 0, 1.5, 3].map((z) => (
        <mesh key={z} position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 0.7]} />
          {mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.4 })}
        </mesh>
      ))}
      {[-1.95, 1.95].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 8]} />
          {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: 0.5 })}
        </mesh>
      ))}
    </group>
  );
}

function quad(bodyColor: string, r: M, legColor?: string) {
  const lc = legColor ?? bodyColor;
  return (
    <>
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.8, 0.7, 1.7]} />
        {mat(bodyColor, r)}
      </mesh>
      <mesh castShadow position={[0, 1.3, 1]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.4]} />
        {mat(bodyColor, r)}
      </mesh>
      <mesh castShadow position={[0, 1.55, 1.35]}>
        <boxGeometry args={[0.45, 0.45, 0.6]} />
        {mat(bodyColor, r)}
      </mesh>
      {[
        [-0.3, 0.7],
        [0.3, 0.7],
        [-0.3, -0.7],
        [0.3, -0.7],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.4, z]}>
          <boxGeometry args={[0.22, 0.8, 0.22]} />
          {mat(lc, r)}
        </mesh>
      ))}
    </>
  );
}

function Cow(r: M) {
  return (
    <group>
      {quad(r.color, r, "#2a2a2a")}
      <mesh position={[0.25, 1.2, 0.2]}>
        <boxGeometry args={[0.35, 0.36, 0.5]} />
        {mat("#2a2a2a", { roughness: 1 })}
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 1.8, 1.35]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
          <coneGeometry args={[0.06, 0.3, 6]} />
          {mat("#e8dcc0")}
        </mesh>
      ))}
    </group>
  );
}

function Horse(r: M) {
  return (
    <group>
      {quad(r.color, r, "#2a1808")}
      <mesh position={[0, 1.7, 1]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.4]} />
        {mat("#1a0f06", { roughness: 1 })}
      </mesh>
      <mesh position={[0, 1, -0.95]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
        {mat("#1a0f06", { roughness: 1 })}
      </mesh>
    </group>
  );
}

function Orc(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[1, 1.2, 0.7]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 1.95, 0.05]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        {mat(r.color, r)}
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 2, 0.32]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: 2.5 })}
        </mesh>
      ))}
      {[-0.12, 0.12].map((x) => (
        <mesh key={`t${x}`} position={[x, 1.78, 0.3]}>
          <coneGeometry args={[0.05, 0.18, 6]} />
          {mat("#f0ead0")}
        </mesh>
      ))}
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} castShadow position={[x, 1.1, 0]}>
          <boxGeometry args={[0.32, 1.1, 0.32]} />
          {mat(r.color, r)}
        </mesh>
      ))}
      {[-0.28, 0.28].map((x) => (
        <mesh key={`l${x}`} castShadow position={[x, 0.35, 0]}>
          <boxGeometry args={[0.34, 0.8, 0.34]} />
          {mat(r.color, r)}
        </mesh>
      ))}
    </group>
  );
}

function Werewolf(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 1.2, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.7, 1.3, 0.6]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 2, 0.2]}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 1.9, 0.5]}>
        <boxGeometry args={[0.25, 0.22, 0.35]} />
        {mat(r.color, r)}
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 2.3, 0.15]}>
          <coneGeometry args={[0.1, 0.25, 4]} />
          {mat(r.color, r)}
        </mesh>
      ))}
      {[-0.12, 0.12].map((x) => (
        <mesh key={`e${x}`} position={[x, 2.05, 0.42]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: 3 })}
        </mesh>
      ))}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} castShadow position={[x, 1.1, 0.1]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.24, 1.1, 0.24]} />
          {mat(r.color, r)}
        </mesh>
      ))}
      {[-0.25, 0.25].map((x) => (
        <mesh key={`l${x}`} castShadow position={[x, 0.4, -0.05]}>
          <boxGeometry args={[0.26, 0.9, 0.26]} />
          {mat(r.color, r)}
        </mesh>
      ))}
      <mesh position={[0, 1.1, -0.45]} rotation={[-0.8, 0, 0]}>
        <coneGeometry args={[0.14, 0.9, 6]} />
        {mat(r.color, r)}
      </mesh>
    </group>
  );
}

function Dragon(r: M) {
  return (
    <group>
      <mesh castShadow position={[0, 1.3, 0]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.55, 1.4, 8, 16]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 2.2, 0.7]} rotation={[0.7, 0, 0]}>
        <capsuleGeometry args={[0.28, 1, 6, 12]} />
        {mat(r.color, r)}
      </mesh>
      <mesh castShadow position={[0, 2.9, 1.25]}>
        <boxGeometry args={[0.5, 0.5, 0.8]} />
        {mat(r.color, r)}
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 3, 1.55]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          {mat(r.emissive, { emissive: r.emissive, emissiveIntensity: 3.5 })}
        </mesh>
      ))}
      {[-0.18, 0.18].map((x) => (
        <mesh key={`h${x}`} position={[x, 3.25, 1]} rotation={[-0.6, 0, x > 0 ? -0.3 : 0.3]}>
          <coneGeometry args={[0.08, 0.5, 6]} />
          {mat("#2a1a14")}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.9, 1.8, -0.1]} rotation={[0, 0, s * 0.6]}>
          <boxGeometry args={[1.8, 0.05, 1.2]} />
          {mat(r.color, { ...r, emissive: r.emissive, emissiveIntensity: r.emissiveIntensity * 0.6 })}
        </mesh>
      ))}
      {[
        [-0.4, 0.5],
        [0.4, 0.5],
        [-0.4, -0.5],
        [0.4, -0.5],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.5, z]}>
          <boxGeometry args={[0.3, 1, 0.3]} />
          {mat(r.color, r)}
        </mesh>
      ))}
      <mesh position={[0, 1, -1.3]} rotation={[-0.5, 0, 0]}>
        <coneGeometry args={[0.3, 1.8, 8]} />
        {mat(r.color, r)}
      </mesh>
    </group>
  );
}

const REGISTRY: Record<ModelType, (r: M) => ReactElement> = {
  house: House,
  barrel: Barrel,
  tree: Tree,
  rock: Rock,
  building: Building,
  lamp: Lamp,
  fence: Fence,
  track: Track,
  werewolf: Werewolf,
  orc: Orc,
  cow: Cow,
  horse: Horse,
  dragon: Dragon,
};

export function modelElement(model: ModelType, render: M): ReactElement {
  const Builder = REGISTRY[model] ?? Rock;
  return Builder(render);
}
