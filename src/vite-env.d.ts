/// <reference types="vite/client" />

declare module "recharts/es6/animation/AnimationManager" {
  export function createAnimateManager(controller: unknown): unknown;
}

declare module "recharts/es6/animation/useAnimationManager" {
  import type { Context } from "react";

  export const AnimationManagerContext: Context<(_animationId: string) => unknown>;
}
