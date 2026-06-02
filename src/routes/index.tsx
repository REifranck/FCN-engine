import { createFileRoute } from "@tanstack/react-router";
import Engine from "../engine/Engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FCN Ultra Engine X One" },
      { name: "description", content: "Modular multi-game procedural 3D engine — mobile optimized." },
    ],
  }),
  component: () => <Engine />,
});
