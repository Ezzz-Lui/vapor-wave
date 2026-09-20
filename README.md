# VAPOR WAVE

Endless runner 3D con estética synthwave. Three.js + React + Vite + TypeScript.

Repo: [https://github.com/Ezzz-Lui/vapor-wave](https://github.com/Ezzz-Lui/vapor-wave)

## Requisitos

- [Bun](https://bun.sh/) **o** [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- Navegador con WebGL (Chrome, Edge, Firefox)

No hay variables de entorno. Clonás, instalás y corrés.

## Ejecutar en local

### Con Bun

```bash
git clone https://github.com/Ezzz-Lui/vapor-wave.git
cd vapor-wave
bun install
bun run dev
```

Abrí la URL que imprime Vite, normalmente `http://localhost:5173`.

### Con pnpm

```bash
git clone https://github.com/Ezzz-Lui/vapor-wave.git
cd vapor-wave
pnpm install
pnpm dev
```

Misma URL: `http://localhost:5173`.

## Cómo jugar

1. En el Home: **Empezar partida**.
2. `A` / `D` o flechas: cambiar de carril.
3. `Espacio`: saltar (a partir del stage Difícil, cuando aparecen filas de 3 obstáculos).
4. `Esc`: pausar / reanudar.
5. En el Home podés activar o desactivar la música. Esa preferencia se guarda en `localStorage`.

## Scripts

| Comando | Bun | pnpm |
| --- | --- | --- |
| Dev | `bun run dev` | `pnpm dev` |
| Build | `bun run build` | `pnpm build` |
| Preview del build | `bun run preview` | `pnpm preview` |
| Lint | `bun run lint` | `pnpm lint` |

## Stack

- React 19 + TypeScript
- Vite 8
- Three.js (`WebGLRenderer` + postprocesado bloom)
- Audio de fondo en loop (`src/assets/game-soundtrack.mp3`)
