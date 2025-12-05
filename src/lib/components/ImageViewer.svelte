
<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { getImageMetadata } from '$lib/stores/imageMetadata.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { invoke } from '@tauri-apps/api/core';
	import { XCircle } from '$lib/icons';

	const fileService = getFileService();
	const mouseCoords = getMouseCoordinates();
	const imageMetadata = getImageMetadata();

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

	// Mouse tracking functions
	function handleMouseMove(event: MouseEvent) {
		if (!canvasElement || !imageContainer || !imageLoaded) return;
		
		const rect = canvasElement.getBoundingClientRect();
		const containerRect = imageContainer.getBoundingClientRect();
		
		// Calculate relative position within the canvas bounds
		const x = Math.round(event.clientX - rect.left);
		const y = Math.round(event.clientY - rect.top);
		
		// Check if mouse is within canvas bounds
		const isWithinImage = x >= 0 && x < rect.width && y >= 0 && y < rect.height;
		
		if (isWithinImage) {
			// Scale coordinates to original image dimensions
			const scaleX = imageNaturalWidth / rect.width;
			const scaleY = imageNaturalHeight / rect.height;
			
			const originalX = Math.round(x * scaleX);
			const originalY = Math.round(y * scaleY);
			
			mouseCoords.updatePosition(originalX, originalY);
			mouseCoords.setOverImage(true);
		} else {
			mouseCoords.setOverImage(false);
		}
	}
	
	function handleMouseEnter() {
		mouseCoords.setOverImage(true);
	}
	
	function handleMouseLeave() {
		mouseCoords.setOverImage(false);
		mouseCoords.reset();
	}

	// Computed image source URL
	let imageSrc = $derived(() => {
		if (fileService.currentFile) {
			// Convert file path to asset URL for Tauri
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
		
		// Additional debugging for the error event
		if (event instanceof ErrorEvent) {
			console.error('[ImageViewer] Error details:', event.message);
			logTauri(`[ImageViewer] Error details: ${event.message}`, "error");
		}
	}

	// Canvas rendering functions
	function initializeCanvas() {
		if (!canvasElement || !imageContainer) return;
		
		// Get 2D context with alpha enabled for better quality
		ctx = canvasElement.getContext('2d', { 
			alpha: false, // Disable alpha for better performance
			desynchronized: true, // Allow desynchronized rendering for better performance
			willReadFrequently: false // Optimize for writing, not reading
		});
		
		if (!ctx) {
			console.error('[ImageViewer] Failed to get 2D context');
			return;
		}
		
		// Enable image smoothing for better quality
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		
		// Set canvas size to match container
		resizeCanvas();
	}

	function resizeCanvas() {
		if (!canvasElement || !imageContainer) return;
		
		const containerRect = imageContainer.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		
		// Set actual canvas size (accounting for device pixel ratio)
		canvasWidth = Math.floor(containerRect.width);
		canvasHeight = Math.floor(containerRect.height);
		
		canvasElement.width = canvasWidth * dpr;
		canvasElement.height = canvasHeight * dpr;
		
		// Scale CSS size back down
		canvasElement.style.width = canvasWidth + 'px';
		canvasElement.style.height = canvasHeight + 'px';
		
		// Scale the drawing context to account for device pixel ratio
		if (ctx) {
			ctx.scale(dpr, dpr);
		}
		
		// Re-render current image if loaded
		if (currentImage && imageLoaded) {
			renderImageToCanvas(currentImage);
		}
	}

	function renderImageToCanvas(img: HTMLImageElement) {
		if (!ctx || !canvasElement) return;
		
		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		
		// Calculate display dimensions (fit to canvas while maintaining aspect ratio)
		const imgAspect = img.naturalWidth / img.naturalHeight;
		const canvasAspect = canvasWidth / canvasHeight;
		
		let drawWidth, drawHeight, offsetX, offsetY;
		
		if (imgAspect > canvasAspect) {
			// Image is wider than canvas aspect ratio
			drawWidth = canvasWidth;
			drawHeight = canvasWidth / imgAspect;
			offsetX = 0;
			offsetY = (canvasHeight - drawHeight) / 2;
		} else {
			// Image is taller than canvas aspect ratio
			drawHeight = canvasHeight;
			drawWidth = canvasHeight * imgAspect;
			offsetX = (canvasWidth - drawWidth) / 2;
			offsetY = 0;
		}
		
		// Draw image to canvas with high quality
		ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
		
		console.log(`[ImageViewer] Rendered image to canvas: ${drawWidth}x${drawHeight} at ${offsetX},${offsetY}`);
		logTauri(`[ImageViewer] Canvas render complete: ${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)}`, "debug");
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
			console.log('[ImageViewer] New file details:', {
				path: fileService.currentFile.path,
				name: fileService.currentFile.name,
				extension: fileService.currentFile.extension,
				size: fileService.currentFile.size,
				formattedSize: fileService.currentFile.formattedSize
			});
			logTauri(`[ImageViewer] File changed to: ${fileService.currentFile.name} (${fileService.currentFile.formattedSize})`, "info");
			
			imageLoaded = false;
			imageError = false;
			imageNaturalWidth = 0;
			imageNaturalHeight = 0;
			currentImage = null;
			
			// Reset shared image metadata
			imageMetadata.reset();
		} else {
			console.log('[ImageViewer] File cleared');
			logTauri("[ImageViewer] Current file cleared", "info");
			
			// Reset shared image metadata
			imageMetadata.reset();
		}
	});

	// Initialize canvas when mounted
	$effect(() => {
		if (canvasElement && imageContainer) {
			initializeCanvas();
			
			// Listen for window resize to update canvas
			const handleResize = () => resizeCanvas();
			window.addEventListener('resize', handleResize);
			
			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}
	});

	// Load and render image when source changes
	$effect(() => {
		if (imageSource && canvasElement) {
			(async () => {
				try {
					imageLoaded = false;
					imageError = false;
					
					const img = await loadImage(imageSource);
					handleImageLoad(img);
				} catch (error) {
					console.error('[ImageViewer] Failed to load image:', error);
					imageError = true;
					imageLoaded = false;
				}
			})();
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
			{#if fileService.isLoading}
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
				<div 
					class="flex-1 
					       flex items-center justify-center 
					       p-5 
					       relative w-full h-full"
					bind:this={imageContainer}
					onmousemove={handleMouseMove}
					onmouseenter={handleMouseEnter}
					onmouseleave={handleMouseLeave}
					role="img"
					aria-label="Image viewer area"
				>
					<canvas
						bind:this={canvasElement}
						class="max-w-full max-h-full 
						       rounded shadow-lg 
						       opacity-0 transition-opacity duration-300 ease-in-out
						       cursor-crosshair"
						class:opacity-100={imageLoaded}
						style="image-rendering: high-quality;"
						aria-label={fileService.currentFile?.name || 'Image'}
					></canvas>
					
					{#if !imageLoaded}
						<div 
							class="absolute top-1/2 left-1/2 
							       transform -translate-x-1/2 -translate-y-1/2 
							       flex flex-col items-center 
							       gap-2"
						>
							<div 
								class="w-8 h-8 
								       border-2 border-text/20 border-t-text 
								       rounded-full 
								       animate-spin"
							></div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>


