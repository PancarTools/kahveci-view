<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { Image, FolderOpen, Keyboard } from '$lib/icons';

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
	       p-8 m-auto 
	       bg-brand-gray border border-brand-subtle rounded-2xl 
	       cursor-pointer transition-all duration-300 ease-out 
	       relative overflow-hidden max-w-lg
	       hover:border-brand-border hover:bg-brand-light hover:shadow-medium 
	       active:scale-95"
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={handleOpenImage}
	onkeydown={(e) => e.key === 'Enter' && handleOpenImage()}
>
	<div class="text-center p-8 max-w-80 w-full">
		<div class="mb-8">
			<div class="mb-6">
				<div class="inline-flex items-center justify-center w-20 h-20 mb-4 bg-brand-light rounded-2xl border border-brand-subtle">
					<Image class="w-10 h-10 text-brand-primary" />
				</div>
			</div>
			<div>
				<h2 class="mb-3 text-2xl font-bold text-brand-white leading-tight">Welcome to Kahveci View</h2>
				<p class="mb-8 text-sm text-brand-muted leading-relaxed">Click here or drag & drop an image to get started</p>
			</div>
		</div>
		
		<button 
			class="inline-flex items-center gap-2.5 
			       px-6 py-3 
			       bg-brand-light text-brand-white border border-brand-subtle rounded-xl 
			       text-sm font-semibold cursor-pointer 
			       transition-all duration-200 ease-out mb-8 shadow-soft 
			       hover:bg-brand-lighter hover:border-brand-border hover:shadow-medium 
			       active:scale-95" 
			onclick={handleOpenImage}
		>
			<FolderOpen class="w-4 h-4" />
			Open Image
		</button>

		<div class="mb-6 p-4 bg-brand-light border border-brand-subtle rounded-xl">
			<p class="mb-1 text-xs font-semibold text-brand-white">Supported formats:</p>
			<p class="text-xs text-brand-muted font-mono tracking-wide">JPG, PNG, GIF, WebP, BMP, TIFF, SVG</p>
		</div>

		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2 text-xs text-brand-muted justify-center">
				<Keyboard class="w-3.5 h-3.5" />
				<span class="font-medium">Press Ctrl+O to open</span>
			</div>
			<div class="flex items-center gap-2 text-xs text-brand-muted justify-center">
				<div class="w-3.5 h-3.5 bg-brand-highlight rounded opacity-60"></div>
				<span class="font-medium">Drag & drop supported</span>
			</div>
		</div>
	</div>
</div>


