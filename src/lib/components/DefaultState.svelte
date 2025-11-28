<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';

	const fileService = getFileService();

	async function handleOpenImage() {
		await fileService.openFile();
	}

	async function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.dataTransfer!.dropEffect = "copy";
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			// TODO: Handle dropped files when drag & drop is implemented
			console.log("File dropped:", file.name);
		}
	}
</script>

<div 
	class="flex items-center justify-center 
	       p-6 md:p-5 m-auto 
	       bg-surface border-2 border-dashed border-surface/50 rounded-xl 
	       cursor-pointer transition-all duration-300 ease-in-out 
	       relative overflow-hidden 
	       hover:border-surface/70 hover:bg-surface/80 hover:-translate-y-0.5 hover:shadow-lg 
	       active:translate-y-0 active:shadow-md"
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={handleOpenImage}
	onkeydown={(e) => e.key === 'Enter' && handleOpenImage()}
>
	<div class="text-center p-8 max-w-80 w-full">
		<div class="mb-6">
			<div class="mb-4">
				<div class="text-6xl md:text-5xl inline-block m-0 drop-shadow-sm">🖼️</div>
			</div>
			<div class="m-0">
				<h2 class="m-0 mb-2 text-2xl md:text-xl font-bold text-text leading-tight">Welcome to Kahveci View</h2>
				<p class="m-0 mb-6 text-sm text-text/70 leading-relaxed font-normal">Click here or drag & drop an image to get started</p>
			</div>
		</div>
		
		<button 
			class="inline-flex items-center gap-2 
			       px-5 py-3 
			       bg-surface text-text border border-surface/50 rounded-lg 
			       text-sm font-semibold cursor-pointer 
			       transition-all duration-200 ease-in-out mb-6 shadow-sm 
			       hover:bg-surface/80 hover:border-surface/70 hover:-translate-y-0.5 hover:shadow-md 
			       active:translate-y-0 active:shadow-sm" 
			onclick={handleOpenImage}
		>
			<span class="text-lg">📁</span>
			Open Image
		</button>

		<div class="mb-5 p-3 bg-bg border border-surface/30 rounded-md">
			<p class="m-0 mb-1 text-xs font-semibold text-text">Supported formats:</p>
			<p class="m-0 text-xs text-text/70 font-mono tracking-wide">JPG, PNG, GIF, WebP, BMP, TIFF, SVG</p>
		</div>

		<div class="flex flex-col gap-1.5 max-sm:hidden">
			<div class="flex items-center gap-1.5 text-xs text-text/50 justify-center">
				<span class="text-sm opacity-80">⌨️</span>
				<span class="font-medium">Press Ctrl+O to open</span>
			</div>
			<div class="flex items-center gap-1.5 text-xs text-text/50 justify-center">
				<span class="text-sm opacity-80">🖱️</span>
				<span class="font-medium">Drag & drop supported</span>
			</div>
		</div>
	</div>
</div>


