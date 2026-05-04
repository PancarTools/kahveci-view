# Kahveci View (WIP)

![Kahveci View Demo Screenshot](/static/kahveci-view-demo.jpg)

**IrfanView** is a fast, lightweight, cross-platform **LEGENDARY image viewer.** among MS Windows users. And this project, wants to be the cross-platform alternative of it 😎

_I used IrfanView a lot in the beginning of my career and I miss it a lot. I decided to build a cross-platform alternative of it because I do actually need some quick image capabilities for my side projects that requires image analysis._

## Features

- 🖼️ Fast image viewing (25+ formats including HEIC, AVIF, SVG, WebP, TIFF, PSD, EXR, QOI and more)
- 🔍 WebGL-accelerated zoom-to-cursor, pan, rotate, and flip
- 🗂️ Folder navigation with keyboard shortcuts and adjacent-image preloading
- 🎨 Color picker with pixel sampling and area-average selection (RGB, HSL, HSV, OKLab, OKLch)
- ⚡ GPU texture caching and progressive large-image loading
- 🪟 Custom window chrome with macOS-style traffic light controls

## Tech Stack

- **Frontend**: Svelte 5 with runes + SvelteKit
- **Backend**: Tauri 2 with Rust
- **Build**: Vite + TypeScript

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npm run app

# Build for production
npm run build
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).
