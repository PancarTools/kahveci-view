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
	       h-10 
	       bg-brand-darker border-t border-brand-subtle 
	       px-6 text-sm text-brand-muted 
	       select-none relative z-10"
>
	<div class="flex items-center gap-3 flex-none">
		{#if fileService.currentFile}
			<span 
				class="font-mono text-xs 
				       flex items-center gap-2 
				       max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" 
				title={fileService.currentFile.path}
			>
				<Folder class="w-3.5 h-3.5 shrink-0 text-brand-muted" />
				{getDisplayPath(fileService.currentFile.path)}
			</span>
		{:else}
			<span class="text-brand-muted/60">No image loaded</span>
		{/if}
	</div>

	<div class="flex items-center justify-center flex-1 overflow-hidden">
		{#if fileService.currentFile}
			<div 
				class="flex items-center gap-3 
				       whitespace-nowrap overflow-hidden text-ellipsis"
			>
				<span class="font-medium text-brand-white flex items-center gap-1.5">
					<Image class="w-3.5 h-3.5 shrink-0" />
					{fileService.currentFile.name}
				</span>
				<span class="text-brand-muted/40">•</span>
				<span class="font-semibold text-brand-primary font-mono text-xs">
					{fileService.currentFile.extension.toUpperCase()}
				</span>
				<span class="text-brand-muted/40">•</span>
				<span class="text-brand-muted font-medium">
					{fileService.currentFile.formattedSize}
				</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-3 flex-none">
		<span class="font-medium flex items-center gap-1.5">
			{#if fileService.isLoading}
				<Loader2 class="w-3.5 h-3.5 animate-spin text-brand-primary" />
				<span class="text-brand-primary">Loading...</span>
			{:else if fileService.error}
				<XCircle class="w-3.5 h-3.5 text-brand-secondary" />
				<span class="text-brand-secondary">Error</span>
			{:else if fileService.currentFile}
				<CheckCircle class="w-3.5 h-3.5 text-brand-primary" />
				<span class="text-brand-primary">Ready</span>
			{:else}
				<div class="w-3.5 h-3.5 bg-brand-highlight rounded-full"></div>
				<span class="text-brand-muted">Idle</span>
			{/if}
		</span>
	</div>
</div>
