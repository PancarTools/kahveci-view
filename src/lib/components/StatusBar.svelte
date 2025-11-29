<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { CheckCircle, XCircle, Loader2 } from '$lib/icons';

	const fileService = getFileService();
	const mouseCoords = getMouseCoordinates();

	// Mock image data for demonstration
	interface ImageMetadata {
		resolution: string;
		ratio: string;
		megapixels: string;
		date: string;
		device: string;
	}

	function getImageMetadata(): ImageMetadata | null {
		if (!fileService.currentFile) return null;
		
		// Mock data - in reality this would come from EXIF/image processing
		return {
			resolution: "4032x3024",
			ratio: "4:3",
			megapixels: "12.2MP",
			date: "2025-11-29 14:32:15",
			device: "Fujifilm X100VI"
		};
	}

	function formatCoordinates(): string {
		if (!mouseCoords.isOverImage) return "—";
		return `${mouseCoords.x}, ${mouseCoords.y}`;
	}
</script>

<div 
	class="flex items-center justify-between 
	       h-10 
	       bg-brand-darker border-t border-brand-subtle 
	       px-6 text-xs text-brand-muted 
	       select-none relative z-10"
>
	<!-- Left: Image Information -->
	<div class="flex items-center gap-2 flex-none">
		{#if fileService.currentFile}
			{@const metadata = getImageMetadata()}
			{#if metadata}
				<span class="font-mono text-brand-white text-xs">{metadata.resolution}</span>
				<span class="text-brand-muted/40">•</span>
				<span class="text-brand-muted text-xs">{metadata.ratio}</span>
				<span class="text-brand-muted/40">•</span>
				<span class="text-brand-muted text-xs">{fileService.currentFile.formattedSize}</span>
				<span class="text-brand-muted/40">•</span>
				<span class="text-brand-primary text-xs font-medium">{metadata.megapixels}</span>
				<span class="text-brand-muted/40">•</span>
				<span class="text-brand-muted/80 text-xs">{metadata.device}</span>
			{:else}
				<span class="text-brand-muted/60 text-xs">No metadata</span>
			{/if}
		{:else}
			<span class="text-brand-muted/60 text-xs">No image</span>
		{/if}
	</div>

	<!-- Center: Status -->
	<div class="flex items-center justify-center flex-1 overflow-hidden">
		<span class="flex items-center gap-1">
			{#if fileService.isLoading}
				<Loader2 class="w-3 h-3 animate-spin text-brand-primary" />
				<span class="text-brand-primary text-xs">Loading</span>
			{:else if fileService.error}
				<XCircle class="w-3 h-3 text-brand-secondary" />
				<span class="text-brand-secondary text-xs">Error</span>
			{:else if fileService.currentFile}
				<CheckCircle class="w-3 h-3 text-brand-primary" />
				<span class="text-brand-primary text-xs">Ready</span>
			{:else}
				<div class="w-3 h-3 bg-brand-highlight rounded-full"></div>
				<span class="text-brand-muted text-xs">Idle</span>
			{/if}
		</span>
	</div>

	<!-- Right: Mouse Coordinates -->
	<div class="flex items-center gap-1 flex-none">
		<span class="text-brand-muted/60 text-xs">XY:</span>
		<span class="font-mono text-brand-white text-xs min-w-[50px]">{formatCoordinates()}</span>
	</div>
</div>
