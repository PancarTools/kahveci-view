<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { Folder, Image, CheckCircle, XCircle, Loader2 } from '$lib/icons';

	const fileService = getFileService();

	// Format file path to show just filename and parent directory
	function getDisplayPath(filePath: string): string {
		const parts = filePath.split(/[/\\]/);
		if (parts.length >= 2) {
			return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
		}
		return parts[parts.length - 1];
	}

	// Get current timestamp for status
	function getCurrentTime(): string {
		return new Date().toLocaleTimeString();
	}
</script>

<div 
	class="flex items-center justify-between 
	       h-8 md:h-7 
	       bg-surface border-t border-surface 
	       px-4 md:px-3 text-xs md:text-[11px] text-text 
	       select-none relative z-10"
>
	<div class="flex items-center gap-2 flex-none min-w-[150px] md:min-w-[100px]">
		{#if fileService.currentFile}
			<span 
				class="font-mono text-xs md:text-[10px] text-text 
				       max-w-[200px] md:max-w-[120px] 
				       overflow-hidden text-ellipsis whitespace-nowrap
				       flex items-center gap-1" 
				title={fileService.currentFile.path}
			>
				<Folder class="w-3 h-3 shrink-0" />
				{getDisplayPath(fileService.currentFile.path)}
			</span>
		{:else}
			<span class="italic text-text/60">No image loaded</span>
		{/if}
	</div>

	<div class="flex items-center justify-center flex-1 overflow-hidden max-sm:hidden">
		{#if fileService.currentFile}
			<div 
				class="flex items-center gap-1.5 md:gap-1 
				       whitespace-nowrap overflow-hidden text-ellipsis"
			>
				<span class="font-medium text-text flex items-center gap-1">
					<Image class="w-3 h-3 shrink-0" />
					{fileService.currentFile.name}
				</span>
				<span class="text-text/40 font-normal">•</span>
				<span class="font-semibold text-text font-mono">
					{fileService.currentFile.extension.toUpperCase()}
				</span>
				<span class="text-text/40 font-normal">•</span>
				<span class="text-text font-medium">
					{fileService.currentFile.formattedSize}
				</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-2 flex-none min-w-[150px] md:min-w-[100px] max-sm:flex-1">
		<span class="font-medium flex items-center gap-1">
			{#if fileService.isLoading}
				<Loader2 class="w-3 h-3 animate-spin" />
				Loading...
			{:else if fileService.error}
				<XCircle class="w-3 h-3 text-accent" />
				Error
			{:else if fileService.currentFile}
				<CheckCircle class="w-3 h-3 text-green-400" />
				Ready
			{:else}
				<div class="w-3 h-3 bg-text/30 rounded-full"></div>
				Idle
			{/if}
		</span>
		<span class="text-text/40 font-normal">•</span>
		<span class="font-mono text-xs text-text md:hidden">{getCurrentTime()}</span>
	</div>
</div>
