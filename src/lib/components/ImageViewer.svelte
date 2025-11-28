<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { invoke } from '@tauri-apps/api/core';
	import { XCircle } from '$lib/icons';

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
					       text-accent"
				>
					<div class="mb-2">
						<XCircle class="w-8 h-8 text-accent mx-auto" />
					</div>
					<h3 class="m-0 mb-2 text-lg">Failed to Load Image</h3>
					<p class="m-1 text-text">Could not display: {fileService.currentFile?.name || 'Unknown file'}</p>
					<p class="m-1 text-sm opacity-80">The image file may be corrupted or in an unsupported format.</p>
				</div>
			{:else}
				<div 
					class="flex-1 
					       flex items-center justify-center 
					       p-5 
					       relative w-full h-full"
				>
					<img
						bind:this={imageElement}
						src={imageSource}
						alt={fileService.currentFile?.name || 'Image'}
						onload={handleImageLoad}
						onerror={handleImageError}
						class="max-w-full max-h-full 
						       object-contain 
						       rounded shadow-lg 
						       opacity-0 transition-opacity duration-300 ease-in-out"
						class:opacity-100={imageLoaded}
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


