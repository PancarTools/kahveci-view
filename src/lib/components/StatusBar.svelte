<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getMouseCoordinates } from '$lib/stores/mouseCoordinates.svelte';
	import { getImageMetadata } from '$lib/stores/imageMetadata.svelte';
	import { getViewerControls } from '$lib/stores/viewerControls.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { getColorPicker } from '$lib/stores/colorPicker.svelte';
	import { CheckCircle, XCircle, Loader2, Copy } from '$lib/icons';

	const fileService = getFileService();
	const mouseCoords = getMouseCoordinates();
	const imageMetadata = getImageMetadata();
	const viewerControls = getViewerControls();
	const navStore = getNavigationStore();
	const colorPicker = getColorPicker();

	function formatCoordinates(): string {
		if (!mouseCoords.isOverImage) return "—";
		return `${mouseCoords.x}, ${mouseCoords.y}`;
	}

	function getColorDisplay(): string {
		const formattedColor = colorPicker.getFormattedColor();
		return formattedColor || "—";
	}

	function getColorSwatchStyle(): string {
		if (!colorPicker.currentColor) return "background-color: rgb(100, 100, 100);";
		const { r, g, b, a } = colorPicker.currentColor;
		const alpha = a !== undefined ? a / 255 : 1;
		return `background-color: rgba(${r}, ${g}, ${b}, ${alpha});`;
	}

	function handleColorClick() {
		colorPicker.toggleFormat();
	}

	async function handleCopyColor() {
		await colorPicker.copyCurrentColor();
	}

	function getCopyTitle(): string {
		if (!colorPicker.canCopyColor()) return 'No color available to copy';
		if (colorPicker.copySuccess) return 'Copied';
		if (colorPicker.isCopying) return 'Copying...';
		return 'Copy color value (⌘⇧C)';
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
		{#if fileService.currentFile && imageMetadata.isLoaded}
			<span class="font-mono text-brand-white text-xs">{imageMetadata.resolution}</span>
			<span class="text-brand-muted/40">•</span>
			<span class="text-brand-muted text-xs">{imageMetadata.ratio}</span>
			<span class="text-brand-muted/40">•</span>
			<span class="text-brand-muted text-xs">{fileService.currentFile.formattedSize}</span>
			<span class="text-brand-muted/40">•</span>
			<span class="text-brand-primary text-xs font-medium">{imageMetadata.megapixels}</span>
			<span class="text-brand-muted/40">•</span>
			<span class="text-brand-muted/80 text-xs">Fujifilm X100VI</span>
		{:else if fileService.currentFile}
			<span class="text-brand-muted/60 text-xs">Loading...</span>
		{:else}
			<span class="text-brand-muted/60 text-xs">No image</span>
		{/if}
	</div>

	<!-- Center: Status & Navigation Position -->
	<div class="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3 overflow-hidden">
		<!-- Status indicator -->
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

		<!-- Navigation position (when images in folder) -->
		{#if navStore.hasImages && navStore.positionText}
			<span class="text-brand-muted/40">•</span>
			<span class="font-mono text-brand-white text-xs">{navStore.positionText}</span>
		{/if}
	</div>

	<!-- Right: Color, Zoom & Mouse Coordinates -->
	<div class="flex items-center gap-3 flex-none">
		<!-- Color Picker Display -->
		<div class="flex items-center gap-1.5 px-1 py-1 rounded hover:bg-brand-subtle/30 transition-colors">
			<button
				type="button"
				class="flex items-center gap-2 px-2 py-1 rounded hover:bg-brand-subtle/50 transition-colors cursor-pointer"
				onclick={handleColorClick}
				title="Click to toggle color format"
			>
				<div
					class="w-4 h-4 rounded border border-brand-muted/50"
					style={getColorSwatchStyle()}
				></div>
				<span class="font-mono text-brand-white text-xs min-w-[120px]">{getColorDisplay()}</span>
			</button>
			<button
				type="button"
				class="flex items-center justify-center w-7 h-7 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-subtle/50"
				onclick={handleCopyColor}
				disabled={!colorPicker.canCopyColor() || colorPicker.isCopying}
				title={getCopyTitle()}
			>
				{#if colorPicker.copySuccess}
					<span class="text-[10px] font-medium text-brand-primary">OK</span>
				{:else}
					<Copy class="w-3.5 h-3.5 text-brand-muted" />
				{/if}
			</button>
		</div>
		
		{#if fileService.currentFile && imageMetadata.isLoaded}
			<span class="text-brand-muted/40">•</span>
			<span class="font-mono text-brand-primary text-xs font-medium min-w-10 text-right">{viewerControls.zoomPercentage}%</span>
			<span class="text-brand-muted/40">•</span>
			{#if viewerControls.fullResLoading}
				<span class="text-brand-primary text-xs font-medium whitespace-nowrap">
					Loading full resolution<span class="loading-dots" aria-hidden="true"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>
				</span>
				<span class="text-brand-muted/40">•</span>
			{/if}
		{/if}
		<span class="text-brand-muted/60 text-xs">XY:</span>
		<span class="font-mono text-brand-white text-xs min-w-[50px]">{formatCoordinates()}</span>
	</div>
</div>

<style>
	.loading-dots {
		display: inline-block;
		width: 1.25em;
	}

	.loading-dots .dot {
		display: inline-block;
		opacity: 0.2;
		animation: loadingDots 1.2s infinite;
	}

	.loading-dots .dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loading-dots .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes loadingDots {
		0%,
		80%,
		100% {
			opacity: 0.2;
		}
		40% {
			opacity: 1;
		}
	}
</style>
