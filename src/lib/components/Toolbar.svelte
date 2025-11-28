<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { logger } from '$lib/utils/logger';

	const fileService = getFileService();

	async function handleOpenImage() {
		logger.debug("Toolbar open image button clicked", "TOOLBAR");
		await fileService.openFile();
	}
</script>

<div 
	class="flex items-center justify-between 
	       h-14 md:h-12 
	       bg-surface border-b border-surface shadow-sm 
	       px-4 md:px-3 relative z-10"
>
	<div class="flex items-center gap-2 flex-none min-w-[150px] md:min-w-[120px]">
		<button 
			class="flex items-center gap-1.5 
			       px-4 py-2 md:px-3 md:py-1.5 
			       border border-surface/50 rounded-md 
			       bg-surface text-text text-sm font-medium 
			       cursor-pointer transition-all duration-200 ease-in-out 
			       hover:bg-surface/80 hover:border-surface/70 hover:-translate-y-0.5 hover:shadow-md 
			       active:translate-y-0 active:shadow-sm 
			       disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
			onclick={handleOpenImage}
			disabled={fileService.isLoading}
			title="Open Image (Ctrl+O)"
		>
			<span class="text-base leading-none">📁</span>
			<span class="whitespace-nowrap md:hidden">Open Image</span>
		</button>
	</div>

	<div class="flex items-center justify-center flex-1">
		<h1 class="m-0 text-lg md:text-base font-semibold text-text select-none">Kahveci View</h1>
	</div>

	<div class="flex items-center gap-2 flex-none min-w-[150px] md:min-w-[120px]">
		<!-- Future: zoom controls, theme toggle, etc. -->
	</div>
</div>


