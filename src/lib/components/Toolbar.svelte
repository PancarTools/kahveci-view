<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { logger } from '$lib/utils/logger';
	import { FolderOpen } from '$lib/icons';

	const fileService = getFileService();

	async function handleOpenImage() {
		logger.debug("Toolbar open image button clicked", "TOOLBAR");
		await fileService.openFile();
	}
</script>

<div 
	class="flex items-center justify-between 
	       h-16 
	       bg-brand-darker border-b border-brand-subtle 
	       px-6 relative z-10"
>
	<div class="flex items-center gap-3 flex-none">
		<button 
			class="flex items-center gap-2 
			       px-4 py-2.5 
			       border border-brand-subtle rounded-lg 
			       bg-brand-light text-brand-white text-sm font-medium 
			       cursor-pointer transition-all duration-200 ease-out 
			       hover:bg-brand-lighter hover:border-brand-border hover:shadow-soft 
			       active:scale-95 
			       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
			onclick={handleOpenImage}
			disabled={fileService.isLoading}
			title="Open Image (Ctrl+O)"
		>
			<FolderOpen class="w-4 h-4" />
			<span class="whitespace-nowrap">Open Image</span>
		</button>
	</div>

	<div class="flex items-center justify-center flex-1">
		<h1 class="text-lg font-semibold text-brand-white select-none">Kahveci View</h1>
	</div>

	<div class="flex items-center gap-3 flex-none">
		<!-- Future: zoom controls, theme toggle, etc. -->
	</div>
</div>


