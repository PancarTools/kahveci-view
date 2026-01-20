<script lang="ts">
	import { onMount } from 'svelte';
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getViewerControls } from '$lib/stores/viewerControls.svelte';
	import { getImageMetadata } from '$lib/stores/imageMetadata.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { env } from '$env/dynamic/public';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { WebGLRenderer } from '$lib/utils/WebGLRenderer';
	import { XCircle } from '$lib/icons';
	import { logger } from '$lib/utils/logger';

	const fileService = getFileService();
	const viewerControls = getViewerControls();
	const imageMetadata = getImageMetadata();
	const mouseCoords = getMouseCoordinates();
	const navStore = getNavigationStore();

	// Feature flags
	const minimapEnabled = env.PUBLIC_MINIMAP_ENABLED !== "false";

	// DOM elements
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);
	let minimapCanvas: HTMLCanvasElement | null = $state(null);

	// State
	let imageLoaded = $state(false);
	let imageError = $state(false);
	let minimapVisible = $state(false);
	let minimapWidth = $state(0);
	let minimapHeight = $state(0);
	let minimapRectX = $state(0);
	let minimapRectY = $state(0);
	let minimapRectW = $state(0);
	let minimapRectH = $state(0);
	let minimapDragging = $state(false);
	let minimapImageToken = 0;
	let minimapImagePath: string | null = null;
	let minimapImageEl: HTMLImageElement | null = null;
	let prewarmRunId = 0;
	let isPrewarming = false;
	let prewarmQueue: string[] = [];
	const prewarmQueued = new Set<string>();
	const prewarmAttempts = new Map<string, number>();

	// WebGL renderer instance (NOT reactive)
	let renderer: WebGLRenderer | null = null;

	// Track last loaded source to avoid duplicate loads
	let lastLoadedSource: string | null = null;
	let fullResUpgradeToken = 0;
	let fullResLoadedForPath: string | null = null;
	let fullResInFlightForPath: string | null = null;
	let fullResAbortController: AbortController | null = null;
	let fullResUpgradeTimer: number | null = null;
	let fullResUpgradeIdleHandle: number | null = null;
	let previewUpgradeToken = 0;
	let previewUpgradedForPath: string | null = null;
	let previewUpgradeInFlightForPath: string | null = null;
	let previewUpgradeTimer: number | null = null;
	let previewUpgradeIdleHandle: number | null = null;

	// Zoom/Pan state (NOT reactive - we control re-renders manually)
	let currentScale = 1;
	let currentOffsetX = 0;
	let currentOffsetY = 0;
	let currentRotation = 0;
	let currentFlipX = false;
	let currentFlipY = false;
	let transformAnimationTimer: number | null = null;
	let transformAnimationRaf: number | null = null;

	// Zoom settings
	const MIN_SCALE = 0.1;
	const MAX_SCALE = 10;
	const ZOOM_SENSITIVITY = 0.008; // For pinch/wheel (higher = faster)

	// Pan/drag state
	let isDragging = $state(false);
	let lastMouseX = 0;
	let lastMouseY = 0;

	// Animation state
	let animationId: number | null = null;
	const ANIMATION_DURATION = 250; // ms

	// Easing function (ease-out cubic)
	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	type PreviewMode = "off" | "aggressive" | "progressive";

	function parseEnvInt(value: string | undefined, fallback: number): number {
		if (!value) return fallback;
		const n = Number.parseInt(value, 10);
		return Number.isFinite(n) ? n : fallback;
	}

	function parseEnvFloat(value: string | undefined, fallback: number): number {
		if (!value) return fallback;
		const n = Number.parseFloat(value);
		return Number.isFinite(n) ? n : fallback;
	}

	function normalizePreviewMode(value: string | undefined): PreviewMode {
		const v = (value ?? "off").toLowerCase();
		if (v === "aggressive" || v === "progressive" || v === "off") return v;
		return "off";
	}

	const previewMode: PreviewMode = normalizePreviewMode(env.PUBLIC_PREVIEW_MODE);
	const previewLargeImageBytes = parseEnvInt(env.PUBLIC_PREVIEW_LARGE_IMAGE_BYTES, 12_000_000);
	const previewLargeImageMegapixels = parseEnvFloat(env.PUBLIC_PREVIEW_LARGE_IMAGE_MEGAPIXELS, 10);
	const previewAggressiveMaxWidth = parseEnvInt(env.PUBLIC_PREVIEW_AGGRESSIVE_MAX_WIDTH, 2048);
	const previewProgressiveStage1Width = parseEnvInt(env.PUBLIC_PREVIEW_PROGRESSIVE_STAGE1_WIDTH, 1024);
	const previewProgressiveStage2Width = parseEnvInt(env.PUBLIC_PREVIEW_PROGRESSIVE_STAGE2_WIDTH, 2048);

	function isLargeImageForPreview(fileSize: number | null, originalDims: { width: number; height: number } | null): boolean {
		if (typeof fileSize === "number" && fileSize >= previewLargeImageBytes) return true;
		if (originalDims) {
			const mp = (originalDims.width * originalDims.height) / 1_000_000;
			if (mp >= previewLargeImageMegapixels) return true;
		}
		return false;
	}

	function applyPreviewModeToResizeWidth(baseResizeWidth: number, mode: PreviewMode): number {
		if (mode === "aggressive") return Math.min(baseResizeWidth, previewAggressiveMaxWidth);
		if (mode === "progressive") return Math.min(baseResizeWidth, previewProgressiveStage1Width);
		return baseResizeWidth;
	}

	function applyProgressiveStage2ToResizeWidth(baseResizeWidth: number): number {
		return Math.min(baseResizeWidth, previewProgressiveStage2Width);
	}

	function getDecodeResizeWidth(): number {
		if (!containerElement) {
			const dpr = window.devicePixelRatio || 1;
			return Math.min(Math.ceil(Math.max(window.innerWidth, window.innerHeight) * dpr), 4096);
		}
		const rect = containerElement.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		return Math.min(Math.ceil(Math.max(rect.width, rect.height) * dpr), 4096);
	}

	function cancelPreviewUpgrade(): void {
		if (previewUpgradeTimer !== null) {
			window.clearTimeout(previewUpgradeTimer);
			previewUpgradeTimer = null;
		}
		if (previewUpgradeIdleHandle !== null) {
			const anyWindow = window as any;
			if (typeof anyWindow.cancelIdleCallback === "function") {
				anyWindow.cancelIdleCallback(previewUpgradeIdleHandle);
			}
			previewUpgradeIdleHandle = null;
		}
		previewUpgradeToken++;
		previewUpgradeInFlightForPath = null;
	}

	// Animate to target zoom/position
	function animateTo(targetScale: number, targetOffsetX: number, targetOffsetY: number) {
		// Cancel any existing animation
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
		}

		const startScale = currentScale;
		const startOffsetX = currentOffsetX;
		const startOffsetY = currentOffsetY;
		const startTime = performance.now();

		function tick(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
			const eased = easeOutCubic(progress);

			currentScale = startScale + (targetScale - startScale) * eased;
			currentOffsetX = startOffsetX + (targetOffsetX - startOffsetX) * eased;
			currentOffsetY = startOffsetY + (targetOffsetY - startOffsetY) * eased;

			render();

			if (progress < 1) {
				animationId = requestAnimationFrame(tick);
			} else {
				animationId = null;
				// Ensure exact final values
				currentScale = targetScale;
				currentOffsetX = targetOffsetX;
				currentOffsetY = targetOffsetY;
				clampOffset();
				render();
			}
		}

		animationId = requestAnimationFrame(tick);
	}

	// Exported zoom control functions (for toolbar)
	export function fitToWindow() {
		if (!renderer || !renderer.hasImage()) return;
		void requestFullResUpgrade();
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { scale, offsetX, offsetY } = calculateFitToWindow(imgW, imgH, containerW, containerH);
		
		animateTo(scale, offsetX, offsetY);
	}

	export function actualSize() {
		if (!renderer || !renderer.hasImage()) return;
		void requestFullResUpgrade();
		
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { width: imgW, height: imgH } = renderer.getImageSize();
		
		// 100% scale, preserve current framing by keeping the current viewport center fixed
		const targetScale = 1;
		const viewportCenterX = containerW / 2;
		const viewportCenterY = containerH / 2;
		const imagePointX = (viewportCenterX - currentOffsetX) / currentScale;
		const imagePointY = (viewportCenterY - currentOffsetY) / currentScale;
		const targetOffsetX = viewportCenterX - imagePointX * targetScale;
		const targetOffsetY = viewportCenterY - imagePointY * targetScale;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function zoomIn() {
		if (!renderer || !renderer.hasImage()) return;
		void requestFullResUpgrade();
		
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { width: imgW, height: imgH } = renderer.getImageSize();
		
		const targetScale = Math.min(MAX_SCALE, currentScale * 1.5);
		const viewportCenterX = containerW / 2;
		const viewportCenterY = containerH / 2;
		const imagePointX = (viewportCenterX - currentOffsetX) / currentScale;
		const imagePointY = (viewportCenterY - currentOffsetY) / currentScale;
		const targetOffsetX = viewportCenterX - imagePointX * targetScale;
		const targetOffsetY = viewportCenterY - imagePointY * targetScale;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function zoomOut() {
		if (!renderer || !renderer.hasImage()) return;
		void requestFullResUpgrade();
		
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { width: imgW, height: imgH } = renderer.getImageSize();
		
		const targetScale = Math.max(MIN_SCALE, currentScale / 1.5);
		const viewportCenterX = containerW / 2;
		const viewportCenterY = containerH / 2;
		const imagePointX = (viewportCenterX - currentOffsetX) / currentScale;
		const imagePointY = (viewportCenterY - currentOffsetY) / currentScale;
		const targetOffsetX = viewportCenterX - imagePointX * targetScale;
		const targetOffsetY = viewportCenterY - imagePointY * targetScale;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	// Get current zoom percentage (for status bar)
	export function getZoomPercentage(): number {
		return Math.round(currentScale * 100);
	}

	function cancelTransformAnimation(): void {
		if (transformAnimationTimer !== null) {
			window.clearTimeout(transformAnimationTimer);
			transformAnimationTimer = null;
		}
		if (transformAnimationRaf !== null) {
			window.cancelAnimationFrame(transformAnimationRaf);
			transformAnimationRaf = null;
		}
		if (canvasElement) {
			canvasElement.style.transition = "";
			canvasElement.style.transform = "";
			canvasElement.style.transformOrigin = "";
		}
	}

	function animateCanvasInverseTransform(inverseCssTransform: string, durationMs: number): void {
		if (!canvasElement) return;
		cancelTransformAnimation();
		canvasElement.style.transformOrigin = "center center";
		canvasElement.style.transition = "none";
		canvasElement.style.transform = inverseCssTransform;
		canvasElement.getBoundingClientRect();
		transformAnimationRaf = window.requestAnimationFrame(() => {
			transformAnimationRaf = null;
			if (!canvasElement) return;
			canvasElement.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
			canvasElement.style.transform = "none";
			transformAnimationTimer = window.setTimeout(() => {
				transformAnimationTimer = null;
				if (!canvasElement) return;
				canvasElement.style.transition = "";
				canvasElement.style.transform = "";
				canvasElement.style.transformOrigin = "";
			}, durationMs + 20);
		});
	}

	function applyTransformAndKeepCenter(
		nextRotation: number,
		nextFlipX: boolean,
		nextFlipY: boolean,
		options?: { inverseCssTransform?: string; durationMs?: number; alwaysFitToWindow?: boolean }
	): void {
		if (!renderer || !renderer.hasImage()) return;
		const durationMs = options?.durationMs ?? 160;
		const before = renderer.getImageSize();
		const centerX = currentOffsetX + (before.width * currentScale) / 2;
		const centerY = currentOffsetY + (before.height * currentScale) / 2;
		renderer.setTransform(nextRotation, nextFlipX, nextFlipY);
		const after = renderer.getImageSize();
		currentOffsetX = centerX - (after.width * currentScale) / 2;
		currentOffsetY = centerY - (after.height * currentScale) / 2;
		currentRotation = ((nextRotation % 4) + 4) % 4;
		currentFlipX = nextFlipX;
		currentFlipY = nextFlipY;

		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { scale: fitScale, offsetX: fitOffsetX, offsetY: fitOffsetY } = calculateFitToWindow(
			after.width,
			after.height,
			containerW,
			containerH
		);

		// Rotate should always re-fit to window (reset zoom down/up as needed).
		// Flips keep current zoom unless it would overflow.
		if (options?.alwaysFitToWindow) {
			render();
			animateTo(fitScale, fitOffsetX, fitOffsetY);
		} else if (currentScale > fitScale) {
			render();
			animateTo(fitScale, fitOffsetX, fitOffsetY);
		} else {
			clampOffset();
			render();
		}
		if (options?.inverseCssTransform) {
			animateCanvasInverseTransform(options.inverseCssTransform, durationMs);
		}
	}

	export function rotateLeft(): void {
		applyTransformAndKeepCenter(currentRotation - 1, currentFlipX, currentFlipY, {
			inverseCssTransform: "rotate(90deg)",
			alwaysFitToWindow: true,
		});
	}

	export function rotateRight(): void {
		applyTransformAndKeepCenter(currentRotation + 1, currentFlipX, currentFlipY, {
			inverseCssTransform: "rotate(-90deg)",
			alwaysFitToWindow: true,
		});
	}

	export function flipHorizontal(): void {
		const inverseCssTransform = currentRotation % 2 === 0 ? "scaleX(-1)" : "scaleY(-1)";
		applyTransformAndKeepCenter(currentRotation, !currentFlipX, currentFlipY, {
			inverseCssTransform,
		});
	}

	export function flipVertical(): void {
		const inverseCssTransform = currentRotation % 2 === 0 ? "scaleY(-1)" : "scaleX(-1)";
		applyTransformAndKeepCenter(currentRotation, currentFlipX, !currentFlipY, {
			inverseCssTransform,
		});
	}

	export function resetTransform(): void {
		applyTransformAndKeepCenter(0, false, false);
	}

	// Load image helper
	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = src;
		});
	}

	// Calculate "fit to window" scale and centered position
	function calculateFitToWindow(imgWidth: number, imgHeight: number, containerWidth: number, containerHeight: number) {
		const scaleX = containerWidth / imgWidth;
		const scaleY = containerHeight / imgHeight;
		const scale = Math.min(scaleX, scaleY, 1); // Don't upscale small images

		const scaledWidth = imgWidth * scale;
		const scaledHeight = imgHeight * scale;
		const offsetX = (containerWidth - scaledWidth) / 2;
		const offsetY = (containerHeight - scaledHeight) / 2;

		return { scale, offsetX, offsetY };
	}

	// Re-render with current zoom state
	function render() {
		if (!renderer || !renderer.hasImage()) return;
		renderer.render(currentScale, currentOffsetX, currentOffsetY);
		viewerControls.updateZoom(Math.round(currentScale * 100));
		updateMinimap();
	}

	function updateMinimap(): void {
		if (!minimapEnabled) {
			minimapVisible = false;
			return;
		}
		if (!renderer || !renderer.hasImage() || !containerElement || !fileService.currentFile) {
			minimapVisible = false;
			return;
		}
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		if (imgW <= 0 || imgH <= 0 || containerW <= 0 || containerH <= 0) {
			minimapVisible = false;
			return;
		}

		const { scale: fitScale } = calculateFitToWindow(imgW, imgH, containerW, containerH);
		const shouldShow =
			currentScale > fitScale * 1.02 &&
			(imgW * currentScale > containerW + 1 || imgH * currentScale > containerH + 1);
		minimapVisible = shouldShow;
		if (!shouldShow || !minimapCanvas) return;

		const maxSize = 160;
		const k = Math.min(maxSize / imgW, maxSize / imgH);
		const w = Math.max(1, Math.round(imgW * k));
		const h = Math.max(1, Math.round(imgH * k));
		minimapWidth = w;
		minimapHeight = h;

		const dpr = window.devicePixelRatio || 1;
		const targetCanvasW = Math.max(1, Math.round(w * dpr));
		const targetCanvasH = Math.max(1, Math.round(h * dpr));
		if (minimapCanvas.width !== targetCanvasW) minimapCanvas.width = targetCanvasW;
		if (minimapCanvas.height !== targetCanvasH) minimapCanvas.height = targetCanvasH;
		minimapCanvas.style.width = `${w}px`;
		minimapCanvas.style.height = `${h}px`;

		const left = (0 - currentOffsetX) / currentScale;
		const top = (0 - currentOffsetY) / currentScale;
		const right = (containerW - currentOffsetX) / currentScale;
		const bottom = (containerH - currentOffsetY) / currentScale;

		const clLeft = Math.max(0, Math.min(imgW, left));
		const clTop = Math.max(0, Math.min(imgH, top));
		const clRight = Math.max(0, Math.min(imgW, right));
		const clBottom = Math.max(0, Math.min(imgH, bottom));

		const rectX = (clLeft / imgW) * w;
		const rectY = (clTop / imgH) * h;
		const rectW = ((clRight - clLeft) / imgW) * w;
		const rectH = ((clBottom - clTop) / imgH) * h;

		minimapRectX = rectX;
		minimapRectY = rectY;
		minimapRectW = Math.max(2, rectW);
		minimapRectH = Math.max(2, rectH);

		const ctx = minimapCanvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		if (!minimapImageEl) return;

		ctx.save();
		ctx.translate(w / 2, h / 2);
		const rot = ((currentRotation % 4) + 4) % 4;
		ctx.rotate((rot * Math.PI) / 2);
		ctx.scale(currentFlipX ? -1 : 1, currentFlipY ? -1 : 1);
		const drawW = rot % 2 === 0 ? w : h;
		const drawH = rot % 2 === 0 ? h : w;
		ctx.drawImage(minimapImageEl, -drawW / 2, -drawH / 2, drawW, drawH);
		ctx.restore();
	}

	function panFromMinimapEvent(event: PointerEvent): void {
		if (!renderer || !renderer.hasImage() || !minimapCanvas) return;
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		if (imgW <= 0 || imgH <= 0 || minimapWidth <= 0 || minimapHeight <= 0) return;

		const rect = minimapCanvas.getBoundingClientRect();
		const x = Math.max(0, Math.min(minimapWidth, event.clientX - rect.left));
		const y = Math.max(0, Math.min(minimapHeight, event.clientY - rect.top));
		const imgX = (x / minimapWidth) * imgW;
		const imgY = (y / minimapHeight) * imgH;

		currentOffsetX = containerW / 2 - imgX * currentScale;
		currentOffsetY = containerH / 2 - imgY * currentScale;
		clampOffset();
		render();
	}

	function handleMinimapPointerDown(event: PointerEvent): void {
		if (!minimapCanvas) return;
		minimapDragging = true;
		minimapCanvas.setPointerCapture(event.pointerId);
		event.preventDefault();
		panFromMinimapEvent(event);
	}

	function handleMinimapPointerMove(event: PointerEvent): void {
		if (!minimapDragging) return;
		event.preventDefault();
		panFromMinimapEvent(event);
	}

	function handleMinimapPointerUp(event: PointerEvent): void {
		if (!minimapDragging || !minimapCanvas) return;
		minimapDragging = false;
		try {
			minimapCanvas.releasePointerCapture(event.pointerId);
		} catch {}
	}

	function cancelFullResUpgrade(): void {
		if (fullResUpgradeTimer !== null) {
			window.clearTimeout(fullResUpgradeTimer);
			fullResUpgradeTimer = null;
		}
		if (fullResUpgradeIdleHandle !== null) {
			const anyWindow = window as any;
			if (typeof anyWindow.cancelIdleCallback === "function") {
				anyWindow.cancelIdleCallback(fullResUpgradeIdleHandle);
			}
			fullResUpgradeIdleHandle = null;
		}
		fullResUpgradeToken++;
		fullResInFlightForPath = null;
		if (fullResAbortController) {
			fullResAbortController.abort();
			fullResAbortController = null;
		}
		viewerControls.endFullResLoad();
	}

	async function requestProgressivePreviewUpgrade(resizeWidth: number): Promise<void> {
		if (!fileService.currentFile || !renderer || !renderer.isReady()) return;
		const filePath = fileService.currentFile.path;

		if (previewMode !== "progressive") return;
		if (previewUpgradedForPath === filePath) return;
		if (previewUpgradeInFlightForPath === filePath) return;

		const token = ++previewUpgradeToken;
		previewUpgradeInFlightForPath = filePath;
		logger.debug("Starting progressive stage2 preview upgrade", "PERF/ImageViewer", {
			path: filePath,
			resizeWidth
		});

		try {
			const tStart = performance.now();
			const bitmap = await navStore.getOrDecodeBitmap(filePath, resizeWidth);
			if (!bitmap) return;
			if (token !== previewUpgradeToken) return;
			if (!renderer || !renderer.isReady()) return;
			if (fileService.currentFile?.path !== filePath) return;

			const success = renderer.loadImage(bitmap, filePath, { forceUpload: true, preserveImageSize: true });
			render();
			const tEnd = performance.now();
			if (success) {
				previewUpgradedForPath = filePath;
				logger.info(
					`Preview texture upgrade completed in ${(tEnd - tStart).toFixed(1)}ms`,
					"PERF/ImageViewer",
					{ path: filePath, width: bitmap.width, height: bitmap.height, resizeWidth }
				);
			}
		} finally {
			if (token === previewUpgradeToken) {
				previewUpgradeInFlightForPath = null;
			}
		}
	}

	function scheduleProgressivePreviewUpgrade(path: string, resizeWidth: number): void {
		if (previewMode !== "progressive") return;
		if (!fileService.currentFile || fileService.currentFile.path !== path) return;
		if (previewUpgradedForPath === path) return;
		if (previewUpgradeInFlightForPath === path) return;
		logger.debug("Queued progressive stage2 preview upgrade", "PERF/ImageViewer", {
			path,
			resizeWidth
		});

		if (previewUpgradeTimer !== null) {
			window.clearTimeout(previewUpgradeTimer);
		}
		if (previewUpgradeIdleHandle !== null) {
			const anyWindow = window as any;
			if (typeof anyWindow.cancelIdleCallback === "function") {
				anyWindow.cancelIdleCallback(previewUpgradeIdleHandle);
			}
			previewUpgradeIdleHandle = null;
		}

		previewUpgradeTimer = window.setTimeout(() => {
			previewUpgradeTimer = null;
			if (!fileService.currentFile || fileService.currentFile.path !== path) return;

			const anyWindow = window as any;
			if (typeof anyWindow.requestIdleCallback === "function") {
				previewUpgradeIdleHandle = anyWindow.requestIdleCallback(
					() => {
						previewUpgradeIdleHandle = null;
						if (!fileService.currentFile || fileService.currentFile.path !== path) return;
						void requestProgressivePreviewUpgrade(resizeWidth);
					},
					{ timeout: 1200 }
				);
			} else {
				void requestProgressivePreviewUpgrade(resizeWidth);
			}
		}, 450);
	}

	function scheduleAutoFullResUpgrade(path: string): void {
		if (!fileService.currentFile || fileService.currentFile.path !== path) return;
		if (fullResLoadedForPath === path) return;
		if (fullResInFlightForPath === path) return;

		if (fullResUpgradeTimer !== null) {
			window.clearTimeout(fullResUpgradeTimer);
		}
		if (fullResUpgradeIdleHandle !== null) {
			const anyWindow = window as any;
			if (typeof anyWindow.cancelIdleCallback === "function") {
				anyWindow.cancelIdleCallback(fullResUpgradeIdleHandle);
			}
			fullResUpgradeIdleHandle = null;
		}

		fullResUpgradeTimer = window.setTimeout(() => {
			fullResUpgradeTimer = null;
			if (!fileService.currentFile || fileService.currentFile.path !== path) return;
			if (fullResLoadedForPath === path) return;
			if (fullResInFlightForPath === path) return;

			const anyWindow = window as any;
			if (typeof anyWindow.requestIdleCallback === "function") {
				fullResUpgradeIdleHandle = anyWindow.requestIdleCallback(
					() => {
						fullResUpgradeIdleHandle = null;
						if (!fileService.currentFile || fileService.currentFile.path !== path) return;
						void requestFullResUpgrade();
					},
					{ timeout: 2000 }
				);
			} else {
				void requestFullResUpgrade();
			}
		}, 1200);
	}

	async function fetchBlobWithProgress(
		url: string,
		onProgress: (loaded: number, total: number | null) => void,
		signal?: AbortSignal
	): Promise<{ blob: Blob; total: number | null }> {
		const res = await fetch(url, signal ? { signal } : undefined);
		if (!res.ok) {
			throw new Error(`Failed to fetch image for full-res decode (status ${res.status})`);
		}
		const header = res.headers.get("content-length") ?? res.headers.get("Content-Length");
		const total = header ? Number(header) : null;
		const blob = await res.blob();
		onProgress(blob.size, total ?? blob.size);
		return { blob, total: total ?? blob.size };
	}

	async function requestFullResUpgrade(): Promise<void> {
		if (!fileService.currentFile || !renderer || !renderer.isReady()) return;
		const filePath = fileService.currentFile.path;

		if (fullResLoadedForPath === filePath) return;
		if (fullResInFlightForPath === filePath) return;

		const token = ++fullResUpgradeToken;
		if (fullResAbortController) {
			fullResAbortController.abort();
		}
		const abortController = new AbortController();
		fullResAbortController = abortController;
		fullResInFlightForPath = filePath;
		viewerControls.beginFullResLoad();
		viewerControls.updateFullResProgress(0);

		try {
			const source = convertFileSrc(filePath);
			viewerControls.updateFullResProgress(5);

			const { blob, total } = await fetchBlobWithProgress(
				source,
				(loaded, totalBytes) => {
					if (token !== fullResUpgradeToken) return;
					if (fileService.currentFile?.path !== filePath) return;
					if (typeof totalBytes === "number" && totalBytes > 0) {
						viewerControls.updateFullResProgress((loaded / totalBytes) * 60);
					}
				},
				abortController.signal
			);

			if (token !== fullResUpgradeToken) return;
			if (fileService.currentFile?.path !== filePath) return;
			if (!(typeof total === "number" && total > 0)) {
				viewerControls.updateFullResProgress(40);
			}

			viewerControls.updateFullResProgress(65);
			const bitmap = await createImageBitmap(blob);
			viewerControls.updateFullResProgress(85);

			if (token !== fullResUpgradeToken) {
				bitmap.close();
				return;
			}
			if (!renderer || !renderer.isReady()) {
				bitmap.close();
				return;
			}
			if (fileService.currentFile?.path !== filePath) {
				bitmap.close();
				return;
			}

			viewerControls.updateFullResProgress(92);
			const success = renderer.loadImage(bitmap, filePath, { forceUpload: true, preserveImageSize: true });
			imageMetadata.setDimensions(bitmap.width, bitmap.height);
			bitmap.close();
			render();
			viewerControls.updateFullResProgress(100);

			if (!success) {
				throw new Error("Failed to upload full-res texture");
			}

			fullResLoadedForPath = filePath;
			logger.info("Full-res texture upgrade completed", "PERF/ImageViewer", {
				path: filePath,
				width: imageMetadata.naturalWidth,
				height: imageMetadata.naturalHeight,
			});
		} catch (err) {
			if (abortController.signal.aborted) {
				return;
			}
			logger.warn("Full-res texture upgrade failed", "PERF/ImageViewer", {
				path: fileService.currentFile?.path ?? null,
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			if (token === fullResUpgradeToken) {
				fullResInFlightForPath = null;
				fullResAbortController = null;
				viewerControls.endFullResLoad();
			}
		}
	}

	// Clamp offset to keep image edges visible (or centered if smaller than container)
	function clampOffset() {
		if (!renderer) return;
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const scaledW = imgW * currentScale;
		const scaledH = imgH * currentScale;

		// X axis
		if (scaledW <= containerW) {
			// Image smaller than container - center it
			currentOffsetX = (containerW - scaledW) / 2;
		} else {
			// Image larger - clamp so edges don't go past viewport
			currentOffsetX = Math.max(containerW - scaledW, Math.min(0, currentOffsetX));
		}

		// Y axis
		if (scaledH <= containerH) {
			currentOffsetY = (containerH - scaledH) / 2;
		} else {
			currentOffsetY = Math.max(containerH - scaledH, Math.min(0, currentOffsetY));
		}
	}

	// Handle mouse wheel for zooming and panning
	function handleWheel(event: WheelEvent) {
		if (!renderer || !renderer.hasImage() || !canvasElement) return;

		// Zoom with Cmd/Ctrl+scroll OR pinch (ctrlKey is true for pinch gestures)
		const isZoomGesture = event.ctrlKey || event.metaKey;
		
		if (isZoomGesture) {
			// ZOOM TO CURSOR - keep point under cursor fixed
			event.preventDefault();

			// Get cursor position relative to canvas
			const rect = canvasElement.getBoundingClientRect();
			const cursorX = event.clientX - rect.left;
			const cursorY = event.clientY - rect.top;
			
			// Get the point under cursor in image coordinates BEFORE zoom
			const imgX = (cursorX - currentOffsetX) / currentScale;
			const imgY = (cursorY - currentOffsetY) / currentScale;

			// Calculate new scale
			const delta = -event.deltaY * ZOOM_SENSITIVITY;
			const zoomFactor = Math.exp(delta);
			const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * zoomFactor));

			// Calculate new offset so the same image point stays under cursor
			currentOffsetX = cursorX - imgX * newScale;
			currentOffsetY = cursorY - imgY * newScale;
			currentScale = newScale;
			
			clampOffset();
			render();
		} else {
			// PAN (regular scroll)
			event.preventDefault();

			// Natural scrolling - content follows fingers
			currentOffsetX -= event.deltaX;
			currentOffsetY -= event.deltaY;
			clampOffset();
			render();
		}
	}

	// Mouse drag handlers for panning
	function handleMouseDown(event: MouseEvent) {
		if (!renderer || !renderer.hasImage()) return;
		if (event.button !== 0) return; // Left click only
		
		isDragging = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		// Always update coordinates
		updateMouseCoords(event);

		// Handle panning if dragging
		if (isDragging && renderer) {
			const deltaX = event.clientX - lastMouseX;
			const deltaY = event.clientY - lastMouseY;
			
			currentOffsetX += deltaX;
			currentOffsetY += deltaY;
			clampOffset();
			render();
			
			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
		}
	}

	function handleMouseEnter() {
		mouseCoords.setOverImage(true);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleMouseLeave() {
		isDragging = false;
		mouseCoords.setOverImage(false);
		mouseCoords.reset();
	}

	// Track mouse position for coordinate display
	function updateMouseCoords(event: MouseEvent) {
		if (!renderer || !renderer.hasImage() || !canvasElement) return;
		if (!imageMetadata.isLoaded || imageMetadata.naturalWidth === 0 || imageMetadata.naturalHeight === 0) {
			mouseCoords.setOverImage(false);
			return;
		}

		const rect = canvasElement.getBoundingClientRect();
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;

		// Convert canvas coords to image coords (in displayed/transformed space)
		const imgX = (canvasX - currentOffsetX) / currentScale;
		const imgY = (canvasY - currentOffsetY) / currentScale;

		const { width: imgW, height: imgH } = renderer.getImageSize();
		if (imgW <= 0 || imgH <= 0) {
			mouseCoords.setOverImage(false);
			return;
		}
		const nx = imgX / imgW;
		const ny = imgY / imgH;
		const transform = renderer.getTransform();
		let u = nx;
		let v = ny;
		if (transform.flipX) {
			u = 1 - u;
		}
		if (transform.flipY) {
			v = 1 - v;
		}
		if (transform.rotation === 1) {
			const prevU = u;
			u = v;
			v = 1 - prevU;
		} else if (transform.rotation === 2) {
			u = 1 - u;
			v = 1 - v;
		} else if (transform.rotation === 3) {
			const prevU = u;
			u = 1 - v;
			v = prevU;
		}

		// Check if within image bounds
		if (imgX >= 0 && imgX < imgW && imgY >= 0 && imgY < imgH) {
			const originalX = Math.min(
				imageMetadata.naturalWidth - 1,
				Math.max(0, Math.round(u * imageMetadata.naturalWidth))
			);
			const originalY = Math.min(
				imageMetadata.naturalHeight - 1,
				Math.max(0, Math.round(v * imageMetadata.naturalHeight))
			);
			mouseCoords.updatePosition(originalX, originalY);
			mouseCoords.setOverImage(true);
		} else {
			mouseCoords.setOverImage(false);
		}
	}

	// Resize canvas and re-render
	function handleResize() {
		if (!canvasElement || !containerElement || !renderer) return;
		
		const rect = containerElement.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		
		canvasElement.width = rect.width * dpr;
		canvasElement.height = rect.height * dpr;
		canvasElement.style.width = rect.width + 'px';
		canvasElement.style.height = rect.height + 'px';
		
		renderer.resize(rect.width, rect.height, dpr);
		const baseResizeWidth = Math.min(Math.ceil(Math.max(rect.width, rect.height) * dpr), 4096);
		navStore.setDecodeResizeWidth(baseResizeWidth);
		
		// Re-center image at current scale
		if (renderer.hasImage()) {
			const { width: imgW, height: imgH } = renderer.getImageSize();
			const scaledW = imgW * currentScale;
			const scaledH = imgH * currentScale;
			currentOffsetX = (rect.width - scaledW) / 2;
			currentOffsetY = (rect.height - scaledH) / 2;
			render();
		}
	}

	function cancelPrewarm() {
		const previousRunId = prewarmRunId;
		const previousQueueSize = prewarmQueue.length;
		prewarmRunId++;
		prewarmQueue = [];
		prewarmQueued.clear();
		prewarmAttempts.clear();
		isPrewarming = false;
		logger.debug('Canceled GPU prewarm queue', 'PERF/PrewarmQueue', {
			fromRunId: previousRunId,
			toRunId: prewarmRunId,
			clearedQueueSize: previousQueueSize
		});
	}

	function enqueuePrewarm(paths: string[]) {
		const before = prewarmQueue.length;
		let added = 0;
		for (const path of paths) {
			if (prewarmQueued.has(path)) continue;
			prewarmQueued.add(path);
			prewarmQueue.push(path);
			added++;
		}
		const after = prewarmQueue.length;
		if (added > 0) {
			logger.debug('Enqueued GPU prewarm items', 'PERF/PrewarmQueue', {
				runId: prewarmRunId,
				added,
				before,
				after
			});
		}
	}

	function schedulePrewarm() {
		if (isPrewarming) return;
		isPrewarming = true;
		const runId = prewarmRunId;
		logger.debug('Starting GPU prewarm worker', 'PERF/PrewarmQueue', {
			runId,
			queueSize: prewarmQueue.length
		});

		const step = () => {
			if (runId !== prewarmRunId) {
				isPrewarming = false;
				logger.debug('Stopping GPU prewarm worker (canceled)', 'PERF/PrewarmQueue', {
					runId,
					currentRunId: prewarmRunId
				});
				return;
			}
			if (!renderer || !renderer.isReady()) {
				isPrewarming = false;
				logger.debug('Stopping GPU prewarm worker (renderer not ready)', 'PERF/PrewarmQueue', {
					runId
				});
				return;
			}

			const nextPath = prewarmQueue.shift();
			if (!nextPath) {
				isPrewarming = false;
				logger.debug('GPU prewarm worker drained', 'PERF/PrewarmQueue', {
					runId
				});
				return;
			}
			prewarmQueued.delete(nextPath);

			const bitmap = navStore.getCachedBitmap(nextPath);
			if (bitmap) {
				prewarmAttempts.delete(nextPath);
				logger.debug('GPU prewarm step', 'PERF/PrewarmQueue', {
					runId,
					path: nextPath,
					queueRemaining: prewarmQueue.length
				});
				renderer.prewarmTexture(bitmap, nextPath);
			} else {
				const attempts = (prewarmAttempts.get(nextPath) ?? 0) + 1;
				prewarmAttempts.set(nextPath, attempts);
				// Retry for a short while in case decode is still in progress
				if (attempts < 60) {
					if (attempts === 1 || attempts === 10 || attempts === 30) {
						logger.debug('GPU prewarm retry (image not decoded yet)', 'PERF/PrewarmQueue', {
							runId,
							path: nextPath,
							attempts
						});
					}
					enqueuePrewarm([nextPath]);
				} else {
					logger.warn('GPU prewarm giving up (image not decoded)', 'PERF/PrewarmQueue', {
						runId,
						path: nextPath,
						attempts
					});
					prewarmAttempts.delete(nextPath);
				}
			}

			requestAnimationFrame(step);
		};

		requestAnimationFrame(step);
	}

	// Load and render the current image
	async function loadAndRender() {
		if (!fileService.currentFile || !renderer || !renderer.isReady()) {
			return;
		}

		cancelPrewarm();

		const filePath = fileService.currentFile.path;
		const source = convertFileSrc(filePath);
		const tStart = performance.now();
		const cachedOriginalDims = navStore.getOriginalDimensions(filePath);
		if (cachedOriginalDims) {
			imageMetadata.setDimensions(cachedOriginalDims.width, cachedOriginalDims.height);
		}
		const baseResizeWidth = getDecodeResizeWidth();
		const isLargeForPreview = isLargeImageForPreview(fileService.currentFile.size ?? null, cachedOriginalDims);
		const initialResizeWidth =
			previewMode === "off"
				? baseResizeWidth
				: isLargeForPreview
					? applyPreviewModeToResizeWidth(baseResizeWidth, previewMode)
					: baseResizeWidth;
		const resizeWidth = initialResizeWidth;
		const progressiveStage2Width =
			previewMode === "progressive" && isLargeForPreview
				? applyProgressiveStage2ToResizeWidth(baseResizeWidth)
				: null;
		if (previewMode === "progressive" && isLargeForPreview) {
			logger.info("Progressive preview mode active", "PERF/ImageViewer", {
				path: filePath,
				baseResizeWidth,
				stage1ResizeWidth: resizeWidth,
				stage2ResizeWidth: progressiveStage2Width,
				fileSize: fileService.currentFile.size ?? null,
				originalDims: cachedOriginalDims
			});
		}
		
		// Skip if same source
		if (source === lastLoadedSource) {
			return;
		}

		console.log('[ImageViewer] Loading:', fileService.currentFile.name);
		
		imageLoaded = false;
		imageError = false;
		lastLoadedSource = source;

		try {
			// Check cache first
			let bitmap = navStore.getCachedBitmap(filePath);
			let originalDims = navStore.getOriginalDimensions(filePath);
			
			if (bitmap) {
				console.log('[ImageViewer] Using cached image!');
				logger.debug('Using cached image', 'PERF/ImageViewer', {
					path: filePath,
					name: fileService.currentFile?.name ?? null,
					size: fileService.currentFile?.size ?? null,
					formattedSize: fileService.currentFile?.formattedSize ?? null
				});
				if (!originalDims) {
					originalDims = navStore.getOriginalDimensions(filePath);
					if (originalDims) {
						imageMetadata.setDimensions(originalDims.width, originalDims.height);
					}
				}
				const effectiveDesiredWidth = originalDims ? Math.min(resizeWidth, originalDims.width) : resizeWidth;
				if (bitmap.width < effectiveDesiredWidth && !isLargeForPreview) {
					const upgraded = await navStore.getOrDecodeBitmap(filePath, effectiveDesiredWidth);
					if (upgraded) {
						bitmap = upgraded;
						originalDims = navStore.getOriginalDimensions(filePath) ?? originalDims;
					}
				}
			} else {
				// Load image
				const tDecodeStart = performance.now();
				bitmap = await navStore.getOrDecodeBitmap(filePath, resizeWidth);
				if (!bitmap) {
					throw new Error('Failed to decode image bitmap');
				}
				originalDims = navStore.getOriginalDimensions(filePath);
				if (originalDims) {
					imageMetadata.setDimensions(originalDims.width, originalDims.height);
				}
				console.log('[ImageViewer] Image loaded:', bitmap.width, 'x', bitmap.height);
				const tDecodeEnd = performance.now();
				logger.info(
					`Decoded image in ${(tDecodeEnd - tDecodeStart).toFixed(1)}ms`,
					'PERF/ImageViewer',
					{
						path: filePath,
						width: bitmap.width,
						height: bitmap.height,
						resizeWidth,
						name: fileService.currentFile?.name ?? null,
						size: fileService.currentFile?.size ?? null,
						formattedSize: fileService.currentFile?.formattedSize ?? null
					}
				);
			}
			
			if (!renderer || !renderer.isReady()) return;
			if (!bitmap) return;
			
			// Upload to GPU
			const tGpuStart = performance.now();
			const success = renderer.loadImage(bitmap, filePath);
			const tGpuEnd = performance.now();
			logger.info(
				`GPU upload via WebGLRenderer.loadImage took ${(tGpuEnd - tGpuStart).toFixed(1)}ms`,
				'PERF/ImageViewer',
				{
					path: filePath,
					name: fileService.currentFile?.name ?? null,
					size: fileService.currentFile?.size ?? null,
					formattedSize: fileService.currentFile?.formattedSize ?? null
				}
			);
			if (!success) {
				imageError = true;
				return;
			}

			// Calculate fit-to-window and set initial zoom state
			const { width: containerW, height: containerH } = renderer.getCanvasSize();
			const { scale, offsetX, offsetY } = calculateFitToWindow(
				bitmap.width,
				bitmap.height,
				containerW,
				containerH
			);

			// Reset zoom state
			currentScale = scale;
			currentOffsetX = offsetX;
			currentOffsetY = offsetY;

			const tRenderStart = performance.now();
			render();
			const tRenderEnd = performance.now();
			logger.debug(
				`First render() took ${(tRenderEnd - tRenderStart).toFixed(1)}ms`,
				'PERF/ImageViewer',
				{
					path: filePath,
					scale: currentScale,
					name: fileService.currentFile?.name ?? null,
					size: fileService.currentFile?.size ?? null,
					formattedSize: fileService.currentFile?.formattedSize ?? null
				}
			);
			imageLoaded = true;
			previewUpgradedForPath = null;
			if (previewMode === "progressive" && isLargeForPreview) {
				const stage2Width = progressiveStage2Width ?? applyProgressiveStage2ToResizeWidth(baseResizeWidth);
				if (stage2Width > resizeWidth) {
					logger.debug("Scheduling progressive stage2 preview upgrade", "PERF/ImageViewer", {
						path: filePath,
						stage1ResizeWidth: resizeWidth,
						stage2ResizeWidth: stage2Width
					});
					scheduleProgressivePreviewUpgrade(filePath, stage2Width);
				} else {
					logger.debug("Skipping progressive stage2 preview upgrade (already satisfied)", "PERF/ImageViewer", {
						path: filePath,
						stage1ResizeWidth: resizeWidth,
						stage2ResizeWidth: stage2Width
					});
					previewUpgradedForPath = filePath;
				}
			}
			if (originalDims && bitmap) {
				const alreadyFullRes = bitmap.width >= originalDims.width && bitmap.height >= originalDims.height;
				if (alreadyFullRes) {
					fullResLoadedForPath = filePath;
				} else {
					scheduleAutoFullResUpgrade(filePath);
				}
			} else {
				scheduleAutoFullResUpgrade(filePath);
			}
			
			console.log('[ImageViewer] Rendered at scale:', currentScale.toFixed(3));
			const tEnd = performance.now();
			logger.info(
				`loadAndRender completed in ${(tEnd - tStart).toFixed(1)}ms`,
				'PERF/ImageViewer',
				{
					path: filePath,
					name: fileService.currentFile?.name ?? null,
					size: fileService.currentFile?.size ?? null,
					formattedSize: fileService.currentFile?.formattedSize ?? null
				}
			);
			const runIdAtSchedule = prewarmRunId;
			setTimeout(() => {
				if (runIdAtSchedule !== prewarmRunId) return;
				try {
					const anyWindow = window as any;
					if (typeof anyWindow.requestIdleCallback === "function") {
						anyWindow.requestIdleCallback(
							() => {
								if (runIdAtSchedule !== prewarmRunId) return;
								enqueuePrewarm(navStore.getAdjacentPaths());
								schedulePrewarm();
							},
							{ timeout: 1200 }
						);
					} else {
						enqueuePrewarm(navStore.getAdjacentPaths());
						schedulePrewarm();
					}
				} catch (err) {
					console.warn('[ImageViewer] Failed to prewarm neighbor textures', err);
				}
			}, 250);
		} catch (err) {
			console.error('[ImageViewer] Failed to load image:', err);
			imageError = true;
			lastLoadedSource = null;
		}
	}

	// Initialize on mount
	onMount(() => {
		// Register viewer controls for toolbar
		viewerControls.register({
			fitToWindow,
			actualSize,
			zoomIn,
			zoomOut,
			getZoomPercentage,
			rotateLeft,
			rotateRight,
			flipHorizontal,
			flipVertical,
			resetTransform
		});

		// Wait a tick for canvas to be bound
		const initTimer = setTimeout(() => {
			if (!canvasElement || !containerElement) {
				console.error('[ImageViewer] Canvas or container not ready');
				return;
			}

			console.log('[ImageViewer] Initializing WebGL...');
			
			renderer = new WebGLRenderer();
			const success = renderer.init(canvasElement);
			
			if (!success) {
				console.error('[ImageViewer] WebGL init failed');
				return;
			}

			// Set initial size
			const rect = containerElement.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			
			canvasElement.width = rect.width * dpr;
			canvasElement.height = rect.height * dpr;
			canvasElement.style.width = rect.width + 'px';
			canvasElement.style.height = rect.height + 'px';
			
			renderer.resize(rect.width, rect.height, dpr);
			const baseResizeWidth = Math.min(Math.ceil(Math.max(rect.width, rect.height) * dpr), 4096);
			navStore.setDecodeResizeWidth(baseResizeWidth);
			
			console.log('[ImageViewer] WebGL ready');

			// Load image if one is already selected
			if (fileService.currentFile) {
				loadAndRender();
			}
		}, 0);

		window.addEventListener('resize', handleResize);

		return () => {
			clearTimeout(initTimer);
			window.removeEventListener('resize', handleResize);
			if (animationId !== null) {
				cancelAnimationFrame(animationId);
			}
			if (renderer) {
				renderer.destroy();
				renderer = null;
			}
			viewerControls.unregister();
		};
	});

	// Watch for file changes (using $effect but NOT setting reactive state in it)
	$effect(() => {
		const file = fileService.currentFile;
		// Update navigation when file changes
		if (file) {
			const filePath = file.path;
			if (minimapImagePath !== filePath) {
				minimapImagePath = filePath;
				minimapImageEl = null;
				const token = ++minimapImageToken;
				const src = convertFileSrc(filePath);
				void (async () => {
					try {
						const img = await loadImage(src);
						if (token !== minimapImageToken) return;
						minimapImageEl = img;
						updateMinimap();
					} catch (error) {
						logger.warn('Failed to load minimap image', 'ImageViewer', { error });
					}
				})();
			}

			imageMetadata.reset();
			mouseCoords.reset();
			mouseCoords.setOverImage(false);
			cancelTransformAnimation();
			currentRotation = 0;
			currentFlipX = false;
			currentFlipY = false;
			renderer?.resetTransform();
			fullResLoadedForPath = null;
			cancelPreviewUpgrade();
			cancelFullResUpgrade();
			// Small delay to ensure renderer is ready after mount
			setTimeout(() => {
				loadAndRender();
			}, 10);
		} else {
			imageMetadata.reset();
			mouseCoords.reset();
			minimapVisible = false;
			minimapImageEl = null;
			minimapImagePath = null;
			fullResLoadedForPath = null;
			cancelPreviewUpgrade();
			cancelFullResUpgrade();
			// File cleared
			imageLoaded = false;
			imageError = false;
			lastLoadedSource = null;
		}
	});

	$effect(() => {
		if (minimapCanvas) {
			updateMinimap();
		}
	});
</script>

<div class="w-full h-full flex flex-col bg-brand-dark relative overflow-hidden">
	{#if fileService.currentFile}
		<div class="flex-1 relative w-full h-full" bind:this={containerElement}>
			{#if imageError}
				<div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
					<XCircle class="w-12 h-12 text-brand-secondary mb-4" />
					<h3 class="text-lg font-semibold text-brand-white mb-2">Failed to Load Image</h3>
					<p class="text-brand-muted text-sm">{fileService.currentFile?.name || 'Unknown file'}</p>
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
			<canvas
					bind:this={canvasElement}
					class="w-full h-full cursor-grab"
					class:cursor-grabbing={isDragging}
					onwheel={handleWheel}
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					onmouseenter={handleMouseEnter}
					onmouseleave={handleMouseLeave}
				></canvas>

				{#if minimapVisible}
					<div class="absolute bottom-4 right-4 rounded-md border border-brand-muted/30 bg-brand-dark/80 shadow-lg p-2">
						<div class="relative" style={`width:${minimapWidth}px;height:${minimapHeight}px;`}>
							<canvas
								bind:this={minimapCanvas}
								class="absolute inset-0 touch-none"
								onpointerdown={handleMinimapPointerDown}
								onpointermove={handleMinimapPointerMove}
								onpointerup={handleMinimapPointerUp}
								onpointercancel={handleMinimapPointerUp}
							></canvas>
							<div
								class="absolute border-2 border-brand-white/80 bg-brand-white/10 pointer-events-none"
								style={`left:${minimapRectX}px;top:${minimapRectY}px;width:${minimapRectW}px;height:${minimapRectH}px;`}
							></div>
						</div>
					</div>
				{/if}
				
				{#if !imageLoaded}
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="w-8 h-8 border-2 border-brand-muted/20 border-t-brand-white rounded-full animate-spin"></div>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-brand-muted">No image selected</p>
		</div>
	{/if}
</div>
