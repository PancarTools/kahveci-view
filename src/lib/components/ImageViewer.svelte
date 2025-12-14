<script lang="ts">
	import { onMount } from 'svelte';
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getViewerControls } from '$lib/stores/viewerControls.svelte';
	import { getImageMetadata } from '$lib/stores/imageMetadata.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { WebGLRenderer } from '$lib/utils/WebGLRenderer';
	import { XCircle } from '$lib/icons';
	import { logger } from '$lib/utils/logger';

	const fileService = getFileService();
	const viewerControls = getViewerControls();
	const imageMetadata = getImageMetadata();
	const mouseCoords = getMouseCoordinates();
	const navStore = getNavigationStore();

	// DOM elements
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);

	// State
	let imageLoaded = $state(false);
	let imageError = $state(false);

	// WebGL renderer instance (NOT reactive)
	let renderer: WebGLRenderer | null = null;

	// Track last loaded source to avoid duplicate loads
	let lastLoadedSource: string | null = null;

	// Zoom/Pan state (NOT reactive - we control re-renders manually)
	let currentScale = 1;
	let currentOffsetX = 0;
	let currentOffsetY = 0;

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
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		const { scale, offsetX, offsetY } = calculateFitToWindow(imgW, imgH, containerW, containerH);
		
		animateTo(scale, offsetX, offsetY);
	}

	export function actualSize() {
		if (!renderer || !renderer.hasImage()) return;
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		
		// 100% scale, centered
		const targetScale = 1;
		const targetOffsetX = (containerW - imgW) / 2;
		const targetOffsetY = (containerH - imgH) / 2;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function zoomIn() {
		if (!renderer || !renderer.hasImage()) return;
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		
		const targetScale = Math.min(MAX_SCALE, currentScale * 1.5);
		const scaledW = imgW * targetScale;
		const scaledH = imgH * targetScale;
		
		// Keep centered
		const targetOffsetX = (containerW - scaledW) / 2;
		const targetOffsetY = (containerH - scaledH) / 2;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function zoomOut() {
		if (!renderer || !renderer.hasImage()) return;
		
		const { width: imgW, height: imgH } = renderer.getImageSize();
		const { width: containerW, height: containerH } = renderer.getCanvasSize();
		
		const targetScale = Math.max(MIN_SCALE, currentScale / 1.5);
		const scaledW = imgW * targetScale;
		const scaledH = imgH * targetScale;
		
		// Keep centered
		const targetOffsetX = (containerW - scaledW) / 2;
		const targetOffsetY = (containerH - scaledH) / 2;
		
		animateTo(targetScale, targetOffsetX, targetOffsetY);
	}

	// Get current zoom percentage (for status bar)
	export function getZoomPercentage(): number {
		return Math.round(currentScale * 100);
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

		const rect = canvasElement.getBoundingClientRect();
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;

		// Convert canvas coords to image coords
		const imgX = (canvasX - currentOffsetX) / currentScale;
		const imgY = (canvasY - currentOffsetY) / currentScale;

		const { width: imgW, height: imgH } = renderer.getImageSize();

		// Check if within image bounds
		if (imgX >= 0 && imgX < imgW && imgY >= 0 && imgY < imgH) {
			mouseCoords.updatePosition(Math.round(imgX), Math.round(imgY));
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

	function prewarmNeighborTextures() {
		if (!renderer || !renderer.isReady()) return;

		const adjacentPaths = navStore.getAdjacentPaths();
		for (const path of adjacentPaths) {
			const img = navStore.getCachedImage(path);
			if (!img) continue;
			renderer.prewarmTexture(img, path);
		}
	}

	// Load and render the current image
	async function loadAndRender() {
		if (!fileService.currentFile || !renderer || !renderer.isReady()) {
			return;
		}

		const filePath = fileService.currentFile.path;
		const source = convertFileSrc(filePath);
		const tStart = performance.now();
		
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
			let img = navStore.getCachedImage(filePath);
			
			if (img) {
				console.log('[ImageViewer] Using cached image!');
				logger.debug('Using cached image', 'PERF/ImageViewer', {
					path: filePath,
					name: fileService.currentFile?.name ?? null,
					size: fileService.currentFile?.size ?? null,
					formattedSize: fileService.currentFile?.formattedSize ?? null
				});
			} else {
				const tDecodeStart = performance.now();
				img = await loadImage(source);
				console.log('[ImageViewer] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
				const tDecodeEnd = performance.now();
				logger.info(
					`Decoded image in ${(tDecodeEnd - tDecodeStart).toFixed(1)}ms`,
					'PERF/ImageViewer',
					{
						path: filePath,
						width: img.naturalWidth,
						height: img.naturalHeight,
						name: fileService.currentFile?.name ?? null,
						size: fileService.currentFile?.size ?? null,
						formattedSize: fileService.currentFile?.formattedSize ?? null
					}
				);
			}
			
			if (!renderer || !renderer.isReady()) return;
			
			// Upload to GPU
			const tGpuStart = performance.now();
			const success = renderer.loadImage(img, filePath);
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

			// Update image metadata for status bar
			imageMetadata.setDimensions(img.naturalWidth, img.naturalHeight);

			// Calculate fit-to-window and set initial zoom state
			const { width: containerW, height: containerH } = renderer.getCanvasSize();
			const { scale, offsetX, offsetY } = calculateFitToWindow(
				img.naturalWidth,
				img.naturalHeight,
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
			setTimeout(() => {
				try {
					prewarmNeighborTextures();
				} catch (err) {
					console.warn('[ImageViewer] Failed to prewarm neighbor textures', err);
				}
			}, 50);
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
			getZoomPercentage
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
		
		if (file) {
			// Small delay to ensure renderer is ready after mount
			setTimeout(() => {
				loadAndRender();
			}, 10);
		} else {
			// File cleared
			imageLoaded = false;
			imageError = false;
			lastLoadedSource = null;
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
