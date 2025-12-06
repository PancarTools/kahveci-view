<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { getImageMetadata } from '$lib/stores/imageMetadata.svelte';
	import { getZoomState } from '$lib/stores/zoomStore.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { invoke } from '@tauri-apps/api/core';
	import { XCircle } from '$lib/icons';

	const fileService = getFileService();
	const mouseCoords = getMouseCoordinates();
	const imageMetadata = getImageMetadata();
	const zoomState = getZoomState();
	const navStore = getNavigationStore();

	async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "info") {
		try {
			await invoke("logger", { level, message });
		} catch (error) {
			console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](message);
		}
	}

	// Reactive variables for image display
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let imageContainer: HTMLDivElement | null = $state(null);
	let imageLoaded = $state(false);
	let imageError = $state(false);
	let imageNaturalWidth = $state(0);
	let imageNaturalHeight = $state(0);
	let currentImage: HTMLImageElement | null = $state(null);

	// Canvas rendering context
	let ctx: CanvasRenderingContext2D | null = null;
	let canvasWidth = $state(0);
	let canvasHeight = $state(0);

	// Pan/drag state
	let isPanning = $state(false);
	let lastPanX = 0;
	let lastPanY = 0;

	// Animation state
	let animationFrameId: number | null = null;
	let isAnimating = $state(false);
	const ANIMATION_DURATION = 250; // ms

	// === CONFIGURABLE TRANSITION SETTINGS ===
	// Fade duration between images (in ms)
	const IMAGE_FADE_DURATION = 200; // Adjust this to control fade speed (150-400ms recommended)
	
	// Loading indicator delay (only show spinner if loading takes longer than this)
	const LOADING_INDICATOR_DELAY = 500; // ms
	
	// Loading indicator state
	let showLoadingIndicator = $state(false);
	let loadingTimerId: ReturnType<typeof setTimeout> | null = null;
	
	// Track last loaded image source to prevent duplicate loads
	let lastLoadedSource: string | null = null;

	// Easing function (ease-out cubic for smooth deceleration)
	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	// Animate zoom transition
	function animateZoomTo(targetScale: number, targetOffsetX: number, targetOffsetY: number) {
		// Cancel any ongoing animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		const startScale = zoomState.scale;
		const startOffsetX = zoomState.offsetX;
		const startOffsetY = zoomState.offsetY;
		const startTime = performance.now();

		isAnimating = true;
		console.log(`[Animate] Starting: scale ${startScale.toFixed(3)} -> ${targetScale.toFixed(3)}`);

		function animate(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
			const easedProgress = easeOutCubic(progress);

			// Interpolate values
			zoomState.scale = startScale + (targetScale - startScale) * easedProgress;
			zoomState.offsetX = startOffsetX + (targetOffsetX - startOffsetX) * easedProgress;
			zoomState.offsetY = startOffsetY + (targetOffsetY - startOffsetY) * easedProgress;

			// Render frame
			if (currentImage) {
				renderImageToCanvas(currentImage);
			}

			// Continue animation if not complete
			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				animationFrameId = null;
				isAnimating = false;
				// Ensure final values are exact
				zoomState.scale = targetScale;
				zoomState.offsetX = targetOffsetX;
				zoomState.offsetY = targetOffsetY;
				zoomState.clampOffset();
				if (currentImage) {
					renderImageToCanvas(currentImage);
				}
				console.log(`[Animate] Complete: scale ${targetScale.toFixed(3)}`);
			}
		}

		animationFrameId = requestAnimationFrame(animate);
	}

	// Computed cursor style based on pan state
	let cursorStyle = $derived(() => {
		if (!imageLoaded) return 'default';
		if (isPanning) return 'grabbing';
		if (zoomState.isPannable) return 'grab';
		return 'crosshair';
	});

	// Mouse tracking functions - now accounts for zoom and pan
	function handleMouseMove(event: MouseEvent) {
		if (!canvasElement || !imageContainer || !imageLoaded) return;

		// Handle panning if active
		if (isPanning) {
			const deltaX = event.clientX - lastPanX;
			const deltaY = event.clientY - lastPanY;
			zoomState.pan(deltaX, deltaY);
			lastPanX = event.clientX;
			lastPanY = event.clientY;
			
			// Re-render after pan
			if (currentImage) {
				renderImageToCanvas(currentImage);
			}
			return;
		}

		// Calculate mouse position relative to canvas
		const rect = canvasElement.getBoundingClientRect();
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;

		// Check if mouse is within canvas bounds
		const isWithinCanvas = canvasX >= 0 && canvasX < rect.width && canvasY >= 0 && canvasY < rect.height;

		if (isWithinCanvas) {
			// Convert canvas coordinates to image coordinates (accounting for zoom and pan)
			const imageX = (canvasX - zoomState.offsetX) / zoomState.scale;
			const imageY = (canvasY - zoomState.offsetY) / zoomState.scale;

			// Check if within actual image bounds
			const isWithinImage = imageX >= 0 && imageX < imageNaturalWidth && 
			                      imageY >= 0 && imageY < imageNaturalHeight;

			if (isWithinImage) {
				mouseCoords.updatePosition(Math.round(imageX), Math.round(imageY));
				mouseCoords.setOverImage(true);
			} else {
				mouseCoords.setOverImage(false);
			}
		} else {
			mouseCoords.setOverImage(false);
		}
	}

	function handleMouseEnter() {
		if (imageLoaded) {
			mouseCoords.setOverImage(true);
		}
	}

	function handleMouseLeave() {
		mouseCoords.setOverImage(false);
		mouseCoords.reset();
		
		// Cancel any active pan
		if (isPanning) {
			isPanning = false;
		}
	}

	// Mouse down handler for panning
	function handleMouseDown(event: MouseEvent) {
		if (!imageLoaded || !zoomState.isPannable) return;
		
		// Only start pan on left mouse button
		if (event.button !== 0) return;

		isPanning = true;
		lastPanX = event.clientX;
		lastPanY = event.clientY;
		
		// Prevent text selection while dragging
		event.preventDefault();
	}

	// Mouse up handler to stop panning
	function handleMouseUp() {
		isPanning = false;
	}

	// Wheel handler - scroll to pan, pinch/Cmd+scroll to zoom
	function handleWheel(event: WheelEvent) {
		if (!imageLoaded || !canvasElement) return;

		event.preventDefault();

		const rect = canvasElement.getBoundingClientRect();
		const cursorX = event.clientX - rect.left;
		const cursorY = event.clientY - rect.top;

		// Pinch gesture on trackpad reports as ctrlKey=true
		// Cmd+scroll also triggers zoom (metaKey on macOS)
		const isZoomGesture = event.ctrlKey || event.metaKey;

		if (isZoomGesture) {
			// Zoom mode: pinch or Cmd+scroll
			const zoomIn = event.deltaY < 0;
			zoomState.zoomToPoint(zoomIn, cursorX, cursorY);

			if (currentImage) {
				renderImageToCanvas(currentImage);
			}

			logTauri(`[ImageViewer] Zoom ${zoomIn ? 'in' : 'out'} to ${zoomState.percentage} at (${cursorX.toFixed(0)}, ${cursorY.toFixed(0)})`, "debug");
		} else {
			// Pan mode: regular scroll (vertical and horizontal)
			// Invert delta for natural scrolling feel (content follows fingers)
			const panDeltaX = -event.deltaX;
			const panDeltaY = -event.deltaY;

			if (panDeltaX !== 0 || panDeltaY !== 0) {
				zoomState.pan(panDeltaX, panDeltaY);

				if (currentImage) {
					renderImageToCanvas(currentImage);
				}
			}
		}
	}

	// Computed image source URL
	let imageSrc = $derived(() => {
		if (fileService.currentFile) {
			const originalPath = fileService.currentFile.path;
			const assetUrl = convertFileSrc(originalPath);
			console.log('[ImageViewer] File path:', originalPath);
			console.log('[ImageViewer] Converted URL:', assetUrl);
			logTauri(`[ImageViewer] Converting path: ${originalPath} -> ${assetUrl}`, "debug");
			return assetUrl;
		} else {
			console.log('[ImageViewer] No current file');
			logTauri("[ImageViewer] No current file to display", "debug");
		}
		return null;
	});

	// Get the actual image source value
	let imageSource = $derived(imageSrc());

	// Handle image load
	function handleImageLoad(img: HTMLImageElement) {
		imageLoaded = true;
		imageError = false;
		imageNaturalWidth = img.naturalWidth;
		imageNaturalHeight = img.naturalHeight;
		currentImage = img;

		// Update shared image metadata store
		imageMetadata.setDimensions(img.naturalWidth, img.naturalHeight);

		// Get fresh container dimensions (important for cached images during navigation)
		let containerW = canvasWidth;
		let containerH = canvasHeight;
		if (imageContainer) {
			const rect = imageContainer.getBoundingClientRect();
			containerW = Math.floor(rect.width) || canvasWidth;
			containerH = Math.floor(rect.height) || canvasHeight;
		}

		// Update zoom state with image and container dimensions
		zoomState.setDimensions(
			{ width: img.naturalWidth, height: img.naturalHeight },
			{ width: containerW, height: containerH }
		);

		// Set initial zoom to fit window
		zoomState.setFitToWindow();

		// Render image to canvas
		renderImageToCanvas(img);

		console.log(`[ImageViewer] Image loaded successfully: ${imageNaturalWidth}x${imageNaturalHeight}`);
		console.log(`[ImageViewer] Image src: ${img.src}`);
		logTauri(`[ImageViewer] Image loaded: ${imageNaturalWidth}x${imageNaturalHeight} from ${img.src}`, "info");
	}

	// Handle image error
	function handleImageError(event: Event) {
		const target = event.target as HTMLImageElement;
		imageLoaded = false;
		imageError = true;
		console.error('[ImageViewer] Failed to load image:', target.src);
		console.error('[ImageViewer] Original path:', fileService.currentFile?.path);
		console.error('[ImageViewer] Error event:', event);
		console.error('[ImageViewer] Image element:', target);
		logTauri(`[ImageViewer] Image load failed - URL: ${target.src}, Original: ${fileService.currentFile?.path}`, "error");

		if (event instanceof ErrorEvent) {
			console.error('[ImageViewer] Error details:', event.message);
			logTauri(`[ImageViewer] Error details: ${event.message}`, "error");
		}
	}

	// Canvas rendering functions
	function initializeCanvas() {
		if (!canvasElement || !imageContainer) return;

		ctx = canvasElement.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false
		});

		if (!ctx) {
			console.error('[ImageViewer] Failed to get 2D context');
			return;
		}

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		resizeCanvas();
	}

	function resizeCanvas() {
		if (!canvasElement || !imageContainer) return;

		const containerRect = imageContainer.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		canvasWidth = Math.floor(containerRect.width);
		canvasHeight = Math.floor(containerRect.height);

		canvasElement.width = canvasWidth * dpr;
		canvasElement.height = canvasHeight * dpr;

		canvasElement.style.width = canvasWidth + 'px';
		canvasElement.style.height = canvasHeight + 'px';

		if (ctx) {
			ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
			ctx.scale(dpr, dpr);
		}

		// Update zoom state with new container dimensions
		if (imageNaturalWidth > 0 && imageNaturalHeight > 0) {
			zoomState.setDimensions(
				{ width: imageNaturalWidth, height: imageNaturalHeight },
				{ width: canvasWidth, height: canvasHeight }
			);

			// If in fit mode, recalculate fit (but not during animation)
			if (zoomState.mode === 'fit' && !isAnimating) {
				zoomState.setFitToWindow();
			} else if (!isAnimating) {
				// Just clamp the offset for current zoom level
				zoomState.clampOffset();
			}
		}

		// Re-render current image if loaded
		if (currentImage && imageLoaded) {
			renderImageToCanvas(currentImage);
		}
	}

	function renderImageToCanvas(img: HTMLImageElement) {
		if (!ctx || !canvasElement) return;

		const dpr = window.devicePixelRatio || 1;

		// Reset transform and clear canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);
		
		// Fill with dark background
		ctx.fillStyle = 'hsl(220, 8%, 8%)';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Enable high quality rendering
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';

		// Calculate scaled image dimensions
		const scaledWidth = img.naturalWidth * zoomState.scale;
		const scaledHeight = img.naturalHeight * zoomState.scale;

		// Draw image at current zoom and pan position
		ctx.drawImage(
			img,
			zoomState.offsetX,
			zoomState.offsetY,
			scaledWidth,
			scaledHeight
		);

		console.log(`[ImageViewer] Rendered: scale=${zoomState.percentage}, offset=(${zoomState.offsetX.toFixed(1)}, ${zoomState.offsetY.toFixed(1)}), size=${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);
	}

	// Load image when source changes
	async function loadImage(src: string) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				console.log('[ImageViewer] Image loaded from:', src);
				resolve(img);
			};
			img.onerror = (error) => {
				console.error('[ImageViewer] Image load error:', error);
				reject(error);
			};
			img.src = src;
		});
	}

	// Reset states when file changes
	$effect(() => {
		if (fileService.currentFile) {
			console.log('[ImageViewer] File changed, resetting states for:', fileService.currentFile.name);
			logTauri(`[ImageViewer] File changed to: ${fileService.currentFile.name} (${fileService.currentFile.formattedSize})`, "info");

			imageLoaded = false;
			imageError = false;
			imageNaturalWidth = 0;
			imageNaturalHeight = 0;
			currentImage = null;
			isPanning = false;
			lastLoadedSource = null; // Clear to allow new image to load
			stopLoadingTimer(); // Clear any pending loading indicator

			// Reset image metadata only (zoom state will be set up by handleImageLoad)
			imageMetadata.reset();
			// Note: Don't call zoomState.reset() here - it clears container dimensions
			// and causes issues with cached image navigation. handleImageLoad will set up zoom properly.
		} else {
			console.log('[ImageViewer] File cleared');
			logTauri("[ImageViewer] Current file cleared", "info");

			lastLoadedSource = null;
			stopLoadingTimer();
			imageMetadata.reset();
			zoomState.reset(); // Only reset zoom fully when file is cleared
		}
	});

	// Initialize canvas when mounted
	$effect(() => {
		if (canvasElement && imageContainer) {
			initializeCanvas();

			const handleResize = () => resizeCanvas();
			window.addEventListener('resize', handleResize);

			// Also listen for mouseup on window to catch releases outside canvas
			window.addEventListener('mouseup', handleMouseUp);

			return () => {
				window.removeEventListener('resize', handleResize);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});

	// Start loading indicator timer
	function startLoadingTimer() {
		// Clear any existing timer
		if (loadingTimerId !== null) {
			clearTimeout(loadingTimerId);
		}
		showLoadingIndicator = false;
		
		// Only show loading indicator if loading takes longer than threshold
		loadingTimerId = setTimeout(() => {
			if (!imageLoaded && !imageError) {
				showLoadingIndicator = true;
			}
		}, LOADING_INDICATOR_DELAY);
	}

	// Stop loading indicator timer
	function stopLoadingTimer() {
		if (loadingTimerId !== null) {
			clearTimeout(loadingTimerId);
			loadingTimerId = null;
		}
		showLoadingIndicator = false;
	}

	// Load and render image when source changes
	$effect(() => {
		const source = imageSource;
		const file = fileService.currentFile;
		const canvas = canvasElement;
		
		if (source && canvas && file) {
			// Skip if already loaded this exact source
			if (lastLoadedSource === source && imageLoaded) {
				console.log('[ImageViewer] Skipping duplicate load for:', source);
				return;
			}
			
			(async () => {
				try {
					imageLoaded = false;
					imageError = false;

					// Check if image is already cached (instant load)
					const cachedImg = navStore.getCachedImage(file.path);
					
					if (cachedImg) {
						console.log('[ImageViewer] Using cached image - instant load!');
						lastLoadedSource = source;
						handleImageLoad(cachedImg);
					} else {
						// Not cached, need to load
						// Only show loading indicator for manual loads (not navigation)
						if (!fileService.isNavigating) {
							startLoadingTimer();
						}
						
						const img = await loadImage(source);
						stopLoadingTimer();
						lastLoadedSource = source;
						handleImageLoad(img);
					}
				} catch (error) {
					console.error('[ImageViewer] Failed to load image:', error);
					stopLoadingTimer();
					imageError = true;
					imageLoaded = false;
					lastLoadedSource = null;
				}
			})();
		}
	});

	// Re-render when zoom state changes (for scroll/pinch - not animated)
	$effect(() => {
		// Track zoom state changes
		const _ = zoomState.scale;
		const __ = zoomState.offsetX;
		const ___ = zoomState.offsetY;
		
		// Skip if animation is handling rendering
		if (isAnimating) return;
		
		if (currentImage && imageLoaded && ctx) {
			renderImageToCanvas(currentImage);
		}
	});

	// Monitor imageSource changes
	$effect(() => {
		console.log('[ImageViewer] imageSource changed to:', imageSource);
		if (imageSource) {
			logTauri(`[ImageViewer] Image source set to: ${imageSource}`, "debug");
		} else {
			logTauri("[ImageViewer] Image source cleared", "debug");
		}
	});

	// Monitor loading and error states
	$effect(() => {
		console.log('[ImageViewer] State change - isLoading:', fileService.isLoading, 'imageError:', imageError, 'imageLoaded:', imageLoaded);
		logTauri(`[ImageViewer] State: isLoading=${fileService.isLoading}, imageError=${imageError}, imageLoaded=${imageLoaded}`, "debug");
	});

	// Listen for zoom commands from toolbar and execute with animation
	$effect(() => {
		const command = zoomState.pendingCommand;
		if (!command) return;
		
		console.log(`[ZoomCommand] Received: ${command}, imageLoaded: ${imageLoaded}`);
		
		if (!imageLoaded) {
			zoomState.clearCommand();
			return;
		}

		// Clear command immediately to prevent re-execution
		zoomState.clearCommand();

		// Execute the command with animation
		switch (command) {
			case "zoomIn":
				zoomIn();
				break;
			case "zoomOut":
				zoomOut();
				break;
			case "fitToWindow":
				fitToWindow();
				break;
			case "actualSize":
				actualSize();
				break;
		}
	});

	// Export function for external zoom control (toolbar) with smooth animations
	export function zoomIn() {
		if (!imageLoaded) return;
		
		const zoomStep = 1.25; // Larger step for button clicks (25%)
		const targetScale = Math.min(10, zoomState.scale * zoomStep);
		
		// Calculate target offsets to keep image centered after zoom
		const scaledWidth = imageNaturalWidth * targetScale;
		const scaledHeight = imageNaturalHeight * targetScale;
		
		// If image will be smaller than container, center it
		// Otherwise, zoom towards center while keeping relative position
		let targetOffsetX: number;
		let targetOffsetY: number;
		
		if (scaledWidth <= canvasWidth) {
			targetOffsetX = (canvasWidth - scaledWidth) / 2;
		} else {
			// Keep the center point fixed during zoom
			const centerX = canvasWidth / 2;
			const scaleRatio = targetScale / zoomState.scale;
			targetOffsetX = centerX - (centerX - zoomState.offsetX) * scaleRatio;
			// Clamp to valid range
			targetOffsetX = Math.max(canvasWidth - scaledWidth, Math.min(0, targetOffsetX));
		}
		
		if (scaledHeight <= canvasHeight) {
			targetOffsetY = (canvasHeight - scaledHeight) / 2;
		} else {
			const centerY = canvasHeight / 2;
			const scaleRatio = targetScale / zoomState.scale;
			targetOffsetY = centerY - (centerY - zoomState.offsetY) * scaleRatio;
			targetOffsetY = Math.max(canvasHeight - scaledHeight, Math.min(0, targetOffsetY));
		}
		
		zoomState.mode = 'free';
		console.log(`[ZoomIn] ${zoomState.scale.toFixed(3)} -> ${targetScale.toFixed(3)}`);
		animateZoomTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function zoomOut() {
		if (!imageLoaded) return;
		
		const zoomStep = 1.25;
		const targetScale = Math.max(0.1, zoomState.scale / zoomStep);
		
		// Calculate target offsets
		const scaledWidth = imageNaturalWidth * targetScale;
		const scaledHeight = imageNaturalHeight * targetScale;
		
		let targetOffsetX: number;
		let targetOffsetY: number;
		
		if (scaledWidth <= canvasWidth) {
			targetOffsetX = (canvasWidth - scaledWidth) / 2;
		} else {
			const centerX = canvasWidth / 2;
			const scaleRatio = targetScale / zoomState.scale;
			targetOffsetX = centerX - (centerX - zoomState.offsetX) * scaleRatio;
			targetOffsetX = Math.max(canvasWidth - scaledWidth, Math.min(0, targetOffsetX));
		}
		
		if (scaledHeight <= canvasHeight) {
			targetOffsetY = (canvasHeight - scaledHeight) / 2;
		} else {
			const centerY = canvasHeight / 2;
			const scaleRatio = targetScale / zoomState.scale;
			targetOffsetY = centerY - (centerY - zoomState.offsetY) * scaleRatio;
			targetOffsetY = Math.max(canvasHeight - scaledHeight, Math.min(0, targetOffsetY));
		}
		
		zoomState.mode = 'free';
		console.log(`[ZoomOut] ${zoomState.scale.toFixed(3)} -> ${targetScale.toFixed(3)}`);
		animateZoomTo(targetScale, targetOffsetX, targetOffsetY);
	}

	export function fitToWindow() {
		if (!imageLoaded) return;
		
		// Calculate fit-to-window values
		const scaleX = canvasWidth / imageNaturalWidth;
		const scaleY = canvasHeight / imageNaturalHeight;
		const targetScale = Math.min(scaleX, scaleY, 1);
		
		const scaledWidth = imageNaturalWidth * targetScale;
		const scaledHeight = imageNaturalHeight * targetScale;
		const targetOffsetX = (canvasWidth - scaledWidth) / 2;
		const targetOffsetY = (canvasHeight - scaledHeight) / 2;
		
		console.log(`[FitToWindow] ${zoomState.scale.toFixed(3)} -> ${targetScale.toFixed(3)}`);
		animateZoomTo(targetScale, targetOffsetX, targetOffsetY);
		zoomState.mode = 'fit';
	}

	export function actualSize() {
		if (!imageLoaded) return;
		
		// Calculate 100% values (centered)
		const targetScale = 1;
		const scaledWidth = imageNaturalWidth * targetScale;
		const scaledHeight = imageNaturalHeight * targetScale;
		const targetOffsetX = (canvasWidth - scaledWidth) / 2;
		const targetOffsetY = (canvasHeight - scaledHeight) / 2;
		
		console.log(`[ActualSize] ${zoomState.scale.toFixed(3)} -> ${targetScale.toFixed(3)}`);
		animateZoomTo(targetScale, targetOffsetX, targetOffsetY);
		zoomState.mode = 'actual';
	}
</script>

<div
	class="w-full h-full 
	       flex flex-col 
	       bg-transparent 
	       relative overflow-hidden"
>
	{#if imageSource}
		<div
			class="flex-1 
			       flex flex-col 
			       relative w-full h-full"
		>
			{#if fileService.isLoading && !fileService.isNavigating}
				<!-- Only show full-screen loader for manual loads, not navigation -->
				<div
					class="flex-1 
					       flex flex-col items-center justify-center 
					       p-8 text-center"
				>
					<div
						class="w-8 h-8 
						       border-2 border-text/20 border-t-text 
						       rounded-full 
						       animate-spin"
					></div>
					<p class="mt-2 m-0 text-text/80">Loading image...</p>
				</div>
			{:else if imageError}
				<div
					class="flex-1 
					       flex flex-col items-center justify-center 
					       p-8 text-center 
					       text-secondary"
				>
					<div class="mb-4">
						<XCircle class="w-12 h-12 text-secondary mx-auto" />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-text">Failed to Load Image</h3>
					<p class="mb-1 text-text-muted">Could not display: {fileService.currentFile?.name || 'Unknown file'}</p>
					<p class="text-sm text-text-muted/70">The image file may be corrupted or in an unsupported format.</p>
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="flex-1 
					       flex items-center justify-center 
					       relative w-full h-full
					       select-none"
					bind:this={imageContainer}
					onmousemove={handleMouseMove}
					onmouseenter={handleMouseEnter}
					onmouseleave={handleMouseLeave}
					onmousedown={handleMouseDown}
					onmouseup={handleMouseUp}
					onwheel={handleWheel}
					role="application"
					aria-label="Image viewer - scroll to zoom, drag to pan"
				>
					<canvas
						bind:this={canvasElement}
						class="w-full h-full
						       opacity-0 ease-in-out"
						class:opacity-100={imageLoaded}
						style="cursor: {cursorStyle()}; transition: opacity {IMAGE_FADE_DURATION}ms ease-in-out;"
						aria-label={fileService.currentFile?.name || 'Image'}
					></canvas>

					<!-- Loading indicator (only shows after LOADING_INDICATOR_DELAY) -->
					{#if showLoadingIndicator}
						<div
							class="absolute top-1/2 left-1/2 
							       transform -translate-x-1/2 -translate-y-1/2 
							       flex flex-col items-center 
							       gap-2
							       opacity-0 animate-fade-in"
						>
							<div
								class="w-8 h-8 
								       border-2 border-text/20 border-t-text 
								       rounded-full 
								       animate-spin"
							></div>
							<p class="text-sm text-text/60">Loading...</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
