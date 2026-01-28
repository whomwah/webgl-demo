# AGENTS.md - AI Coding Agent Guidelines

## Project Overview

React Three Fiber WebGL demo with animated butterfly using shader-based wing flapping.

**Tech Stack:** React 19, TypeScript (strict), R3F + Drei + Postprocessing, Three.js, GLSL shaders, Vite 6.2

## Build/Lint/Test Commands

```bash
npm run dev          # Start dev server (or: just dev)
npm run build        # TypeScript + Vite build (or: just build)
npm run lint         # ESLint (or: just lint)
npm run preview      # Preview build (or: just preview)
npm run deploy       # Deploy to Deno staging
npm run deploy-prod  # Deploy to Deno production
```

**No test framework configured.**

## Code Style

### TypeScript
- Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2020, Module: ESNext

### ESLint
ESLint v9 flat config with `typescript-eslint`, `react-hooks`, `react-refresh` plugins.

### Imports (in order, grouped)
```typescript
import React, { useRef, useState } from "react";           // 1. React
import { useFrame } from "@react-three/fiber";             // 2. Third-party
import { Butterfly } from "./threejs/butterfly";           // 3. Local
import fragmentShader from "./glsl/butterfly.frag";        // 4. Assets
import "./App.css";                                        // 5. Styles
```
Use **double quotes** for imports.

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Butterfly`, `Scene` |
| Functions/Variables | camelCase | `handleDecay`, `meshRef` |
| Constants | SCREAMING_SNAKE | `WING_SPEED` |
| Refs | `*Ref` suffix | `uniformsRef` |
| Props | `*Props` suffix | `ButterflyProps` |

### Type Patterns
```typescript
interface ButterflyProps { size: number; autoPokeDelay?: number; }
const meshRef = useRef<Mesh>(null!);  // Non-null assertion for R3F
export const Butterfly = forwardRef<Mesh, ButterflyProps>((props, ref) => {});
Butterfly.displayName = "Butterfly";  // Required for forwardRef
```

### React Three Fiber Patterns
```typescript
useFrame((_state, delta) => { uniformsRef.current.time.value += delta; });
const texture = useLoader(TextureLoader, path) as Texture;
```

### Error Handling
- Use `Suspense` with `fallback={null}` for async loading
- Clean up timeouts in useEffect return
- Use `discard` in shaders for transparency: `if(texColor.a < 0.5) discard;`

### GLSL
- Use `precision highp float;` in fragment shaders
- Document uniforms with inline comments

## Project Structure
```
src/
  main.tsx, App.tsx, App.css, index.css, vite-env.d.ts
  assets/         # Images, SVGs
  glsl/           # .vert, .frag shaders
  threejs/butterfly/index.tsx
public/textures/  # Runtime textures
```

## Key Dependencies
`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `three`, `vite-plugin-glsl`
