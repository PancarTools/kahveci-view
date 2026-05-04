# Kahveci View — AI Agent Handover

> IrfanView-inspired cross-platform image viewer built with Tauri 2, Svelte 5, and Rust.
> This document is the single source of truth for any AI agent picking up work on this project.

---

## Coding Conventions (Non-Negotiable)

- **Svelte 5 runes syntax only.** No legacy `$:`, `export let`, or writable stores. Use `$state`, `$derived`, `$effect`.
- **State lives in `.svelte.ts` class files** using the map-keyed singleton pattern (see example below). Never use plain objects or primitive exports for shared state.
- **Tauri v2 APIs only.** No v1 patterns. Commands are invoked with `@tauri-apps/api/core` `invoke`.
- **Always use `logTauri()`** (see `src/lib/utils/logger.ts`) for logging from the frontend. Never use raw `console.log` in production paths.
- **No CSS files except `src/app.css`.** All styling via Tailwind v4 utility classes. Custom design tokens live inside the `@theme {}` block in `app.css`.
- **Read current implementation before suggesting changes.**
- **Update `ROADMAP.md` after every meaningful change.**

### Svelte 5 Store Pattern

```typescript
// myStore.svelte.ts
class MyStore {
  value = $state(0);
  update() { this.value++; }
}

const DEFAULT_KEY = Symbol("default");
const registry = new Map<symbol, MyStore>();
export function getMyStore(key = DEFAULT_KEY): MyStore {
  if (!registry.has(key)) registry.set(key, new MyStore());
  return registry.get(key)!;
}
```

### Tauri Logger (use everywhere instead of console)

```typescript
// src/lib/utils/logger.ts exports logTauri()
await logTauri("message", "info" | "warn" | "error" | "debug");
```

Rust side (`src-tauri/src/lib.rs`): `logger` command prints with ISO timestamp.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Svelte 5 (runes) + SvelteKit |
| Desktop shell | Tauri 2 |
| Rust backend | Tauri commands (lib.rs) |
| Styling | Tailwind CSS v4.1 (`@theme` directive in app.css) |
| Icons | Lucide Svelte (`@lucide/svelte`) |
| Image rendering | WebGL (custom `WebGLRenderer` class) |
| Font | Mulish (Google Fonts, loaded in app.css) |
| Build | Vite + `@tailwindcss/vite` |

---

## Architecture Overview

```
User action
    │
    ▼
Toolbar.svelte / StatusBar.svelte
    │ calls registered fns via viewerControls store
    ▼
ImageViewer.svelte  ◄──── zoomStore (zoom/pan state + command queue)
    │                ◄──── colorPicker store (mode, selection, color)
    │                ◄──── navigationStore (image list, preloading)
    ▼
WebGLRenderer.ts   (imperative class — no Svelte reactivity inside)
    │  gl.readPixels → color sampling
    │  texImage2D → ImageBitmap upload
    │  uniform transforms → zoom/pan/rotate/flip
    ▼
statusBar ← viewerControls.zoomPercentage, colorPicker.currentColor
```

**Key design rule:** WebGL operations are fully imperative. Use `onMount` for WebGL init, never `$effect`. Non-reactive variables hold WebGL state; reactive Svelte state is used only for UI display values.

---

## File Tree

```
kahveci-view/
├── src/
│   ├── app.css                         # @theme color tokens + global dark theme styles
│   ├── app.html                        # HTML shell
│   ├── assets/
│   │   └── aaa.JPG                     # Dev test image (used by PUBLIC_DEV_AUTOLOAD_IMAGE_PATH)
│   ├── lib/
│   │   ├── components/
│   │   │   ├── DefaultState.svelte     # Empty-state placeholder shown when no image is open
│   │   │   ├── FileExplorer.svelte     # File browser UI (legacy, mostly superseded by toolbar)
│   │   │   ├── ImageViewer.svelte      # ★ Main viewer: WebGL rendering, zoom, pan, selection, color picker
│   │   │   ├── ImageViewer.old.svelte  # Canvas 2D implementation (preserved for reference, not used)
│   │   │   ├── StatusBar.svelte        # Bottom bar: coords, zoom %, color swatch, copy button
│   │   │   └── Toolbar.svelte          # Top bar: file ops, zoom controls, nav, mode buttons, window controls
│   │   ├── icons/
│   │   │   └── index.ts               # Re-exports used Lucide icons by name
│   │   ├── stores/
│   │   │   ├── colorPicker.svelte.ts   # Current color (RGB), display format, selection mode, copy state
│   │   │   ├── fileService.svelte.ts   # File open dialog, openFileByPath, metadata, path validation
│   │   │   ├── imageMetadata.svelte.ts # Shared naturalWidth/height, resolution string, ratio, megapixels
│   │   │   ├── mouseCoordinates.svelte.ts  # Mouse position mapped to original image pixel space
│   │   │   ├── navigationStore.svelte.ts   # Folder scan, image list, prev/next/first/last, ImageBitmap cache
│   │   │   ├── viewerControls.svelte.ts    # Bridge: Toolbar registers zoom fns, exposes zoomPercentage
│   │   │   └── zoomStore.svelte.ts     # Zoom scale + pan offset state, command queue for toolbar→viewer
│   │   └── utils/
│   │       ├── colorConverter.ts       # RGB → HSL / HSV / OKLab / OKLch; CSS string formatting
│   │       ├── logger.ts               # logTauri() with console fallback
│   │       └── WebGLRenderer.ts        # Standalone WebGL class: texture cache, GPU prewarm, readPixels
│   └── routes/
│       ├── +layout.svelte             # Root layout: dark theme wrapper, font
│       ├── +layout.ts                 # prerender=false, SSR=false (required for Tauri)
│       └── +page.svelte               # App root: keyboard shortcuts, store wiring, dev auto-load
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                     # Tauri commands: logger, start_drag, take_pending_open_files
│   │   └── main.rs                    # Calls lib::run()
│   ├── capabilities/
│   │   └── default.json               # fs, dialog, window, opener permissions
│   ├── tauri.conf.json                # Bundle config, file associations (25+ formats), asset protocol, window decorations off
│   └── Cargo.toml                     # tauri, chrono, serde_json
├── .env                               # Local dev overrides (gitignored)
├── .env.example                       # All supported env vars with docs
├── HANDOVER.md                        # This file
├── ROADMAP.md                         # Phase tracker with checkboxes
├── README.md                          # User-facing overview
├── package.json
├── svelte.config.js
├── tailwind.config.js                 # Minimal — @theme lives in app.css
├── tsconfig.json
└── vite.config.js
```

---

## Key Implementation Details

### WebGL Rendering (`WebGLRenderer.ts`)

- **Texture cache**: path-keyed, FIFO eviction, never evicts the currently displayed texture.
- **GPU prewarm**: adjacent images are uploaded to GPU in the background (throttled, one per frame).
- **Full-res upgrade**: large images are decoded at a downscaled size first, then upgraded to full resolution after first render (debounced/idle).
- **Preview modes** (env-controlled): `off` | `aggressive` (cap decode width) | `progressive` (two-stage decode).
- **Transforms**: rotate (0/90/180/270°) and flip (H/V) are applied via shader uniforms, not CPU-side. Zoom/pan/rotate/flip are all uniform-based — no CPU transform math per frame.
- **Pixel sampling**: `gl.readPixels(x, y, 1, 1, RGBA, UNSIGNED_BYTE)` — source data is Uint8 (0–255 per channel). This is the precision ceiling for all color output.
- **SVG support**: SVGs are rendered to a Canvas first, then converted to `ImageBitmap` before WebGL upload (browsers cannot directly pass SVG to `texImage2D`).

### Color Conversion (`colorConverter.ts`)

- Conversion pipeline: Uint8 RGB → linearize (sRGB gamma) → LMS matrix → cbrt → OKLab matrix.
- Coefficients match Björn Ottosson's reference implementation exactly.
- All intermediate values stored as raw `float64` (no integer scaling). Output formatted to 4 decimal places via `.toFixed(4)`.
- OKLch hue uses `atan2(b, a)` (scale-invariant); chroma = `sqrt(a² + b²)`.
- Source is 8-bit, so precision beyond 4 decimal places is meaningless — `.toFixed(4)` is appropriate.

### Color Picker

- **Pointer mode**: samples single pixel at cursor via `gl.readPixels`.
- **Select mode**: drag to define rectangle → on mouse-up, samples a grid of points within the rect → averages RGBA → updates color display.
- Default format: OKLab. Cycles: RGB → HSL → HSV → OKLab → OKLch → RGB.
- Copy shortcut: `Cmd+Shift+C` / `Ctrl+Shift+C`. Also clickable in StatusBar.

### File Association (cold-start race fix)

- When the OS opens a file via association before the frontend is ready, Rust queues the path in `PendingOpenFiles` state.
- Frontend calls `take_pending_open_files` on startup to drain the queue before registering the live `file-opened` event listener.

### Rust Commands

| Command | Purpose |
|---|---|
| `logger` | Timestamped log output to terminal |
| `start_drag` | Initiates native window drag (called from toolbar mousedown) |
| `take_pending_open_files` | Drains OS file-open queue (cold-start race fix) |

### Environment Variables (`.env` / `.env.example`)

| Variable | Purpose |
|---|---|
| `PUBLIC_DEV_AUTOLOAD_IMAGE_PATH` | Auto-opens this image on dev startup (unset = off) |
| `PUBLIC_PREVIEW_MODE` | `off` / `aggressive` / `progressive` for large images |
| `PUBLIC_PREVIEW_LARGE_IMAGE_BYTES` | Byte threshold for preview mode |
| `PUBLIC_PREVIEW_LARGE_IMAGE_MEGAPIXELS` | MP threshold for preview mode |
| `PUBLIC_PREVIEW_AGGRESSIVE_MAX_WIDTH` | Max decode width in aggressive mode |
| `PUBLIC_PREVIEW_PROGRESSIVE_STAGE1_WIDTH` | Stage 1 decode width in progressive mode |
| `PUBLIC_PREVIEW_PROGRESSIVE_STAGE2_WIDTH` | Stage 2 decode width in progressive mode |
| `PUBLIC_MINIMAP_ENABLED` | `true` / `false` — zoom minimap overlay |

### Design System

All color tokens live in the `@theme {}` block in `src/app.css`. Tailwind v4 generates utility classes from them automatically (`bg-brand-dark`, `text-brand-muted`, `bg-traffic-red`, etc.). Do not add colors to `tailwind.config.js`.

Color space: OKLCH for all brand colors. HSL for traffic light button colors.

### Keyboard Shortcuts (implemented in `+page.svelte`)

| Key | Action |
|---|---|
| `←` / `→` | Previous / Next image |
| `Home` / `End` | First / Last image |
| `Escape` | Clear selection |
| `Cmd+Shift+C` | Copy color to clipboard |

---

## Current Status

**Phase 3.4 complete.** See `ROADMAP.md` for full phase breakdown.

What works today:
- Open image via dialog or double-click (file association, 25+ formats)
- WebGL rendering with zoom-to-cursor, pan, boundary clamping, smooth animations
- Image navigation (prev/next/first/last, keyboard, preloading, GPU texture cache)
- Non-destructive rotate (90° steps) and flip (H/V)
- Zoom minimap overlay (drag-to-pan, rotated thumbnail)
- Color picker: pointer-mode pixel sampling + select-mode area averaging
- Color format display: RGB, HSL, HSV, OKLab, OKLch — copy to clipboard
- Status bar: filename, dimensions, aspect ratio, megapixels, zoom %, coords, color
- Custom window chrome (macOS traffic-light aesthetic, Windows-style right placement)

What is NOT yet implemented (see ROADMAP.md Phase 3.3+):
- Full-screen / slideshow mode
- Non-destructive editing (crop, resize, brightness, etc.)
- Thumbnail browser
- Batch operations
- Export / format conversion
