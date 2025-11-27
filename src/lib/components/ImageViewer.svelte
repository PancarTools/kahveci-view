<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { invoke } from '@tauri-apps/api/core';

	const fileService = getFileService();

	async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "info") {
		try {
			await invoke("logger", { level, message });
		} catch (error) {
			console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](message);
		}
	}

	// Reactive variables for image display
	let imageElement: HTMLImageElement | null = $state(null);
	let imageLoaded = $state(false);
	let imageError = $state(false);
	let imageNaturalWidth = $state(0);
	let imageNaturalHeight = $state(0);

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
	function handleImageLoad(event: Event) {
		const target = event.target as HTMLImageElement;
		imageLoaded = true;
		imageError = false;
		imageNaturalWidth = target.naturalWidth;
		imageNaturalHeight = target.naturalHeight;
		console.log(`[ImageViewer] Image loaded successfully: ${imageNaturalWidth}x${imageNaturalHeight}`);
		console.log(`[ImageViewer] Image src: ${target.src}`);
		logTauri(`[ImageViewer] Image loaded: ${imageNaturalWidth}x${imageNaturalHeight} from ${target.src}`, "info");
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
		} else {
			console.log('[ImageViewer] File cleared');
			logTauri("[ImageViewer] Current file cleared", "info");
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

<div class="image-viewer">
	{#if imageSource}
		<div class="image-container">
			{#if fileService.isLoading}
				<div class="loading">
					<div class="loading-spinner"></div>
					<p>Loading image...</p>
				</div>
			{:else if imageError}
				<div class="error">
					<div class="error-icon">❌</div>
					<h3>Failed to Load Image</h3>
					<p>Could not display: {fileService.currentFile?.name || 'Unknown file'}</p>
					<p class="error-detail">The image file may be corrupted or in an unsupported format.</p>
				</div>
			{:else}
				<div class="image-wrapper">
					<img
						bind:this={imageElement}
						src={imageSource}
						alt={fileService.currentFile?.name || 'Image'}
						onload={handleImageLoad}
						onerror={handleImageError}
						class="main-image"
						class:loaded={imageLoaded}
						onloadstart={(e) => {
							console.log('[ImageViewer] Image load started for:', e.currentTarget.src);
							logTauri(`[ImageViewer] Image load started: ${e.currentTarget.src}`, "debug");
						}}
						onabort={(e) => {
							console.log('[ImageViewer] Image load aborted for:', e.currentTarget.src);
							logTauri(`[ImageViewer] Image load aborted: ${e.currentTarget.src}`, "warn");
						}}
						onstalled={(e) => {
							console.log('[ImageViewer] Image load stalled for:', e.currentTarget.src);
							logTauri(`[ImageViewer] Image load stalled: ${e.currentTarget.src}`, "warn");
						}}
						onprogress={(e) => {
							console.log('[ImageViewer] Image loading progress:', e);
						}}
					/>
					
					{#if !imageLoaded}
						<div class="image-loading">
							<div class="loading-spinner"></div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.image-viewer {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: transparent;
		position: relative;
		overflow: hidden;
	}

	.image-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		width: 100%;
		height: 100%;
	}

	.image-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		position: relative;
		width: 100%;
		height: 100%;
	}

	.main-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.main-image.loaded {
		opacity: 1;
	}

	.image-loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.loading, .error {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading p {
		margin: 0.5rem 0 0 0;
		color: #cccccc;
	}

	.error {
		color: #ff6b6b;
	}

	.error-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.error h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.error p {
		margin: 0.25rem 0;
	}

	.error-detail {
		font-size: 0.85rem;
		opacity: 0.8;
	}
</style>
