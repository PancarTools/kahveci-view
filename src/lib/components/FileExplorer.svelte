<script>
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { Folder, FileText, XCircle } from '$lib/icons';

	const fileService = getFileService();

	async function handleOpenFile() {
		const file = await fileService.openFile();
		if (file) {
			console.log(`Opened file: ${file.name}`);
		}
	}
</script>

<div 
	class="p-4 
	       border border-surface rounded-lg 
	       my-4"
>
	<div class="mb-4">
		<button 
			onclick={handleOpenFile} 
			disabled={fileService.isLoading}
			class="bg-bg-light text-text 
			       border border-border-muted 
			       px-4 py-2 rounded-lg 
			       cursor-pointer text-sm font-medium 
			       transition-all duration-200 ease-out 
			       hover:bg-bg-light hover:border-border 
			       disabled:bg-highlight disabled:cursor-not-allowed"
		>
			{fileService.isLoading ? 'Opening...' : 'Open Image'}
		</button>
	</div>

	{#if fileService.error}
		<div 
			class="bg-secondary/10 
			       border-l-4 border-secondary 
			       text-secondary 
			       px-3 py-3 rounded 
			       my-2 
			       flex justify-between items-start 
			       shadow-sm"
			class:bg-yellow-100={fileService.error.includes('Unsupported') || fileService.error.includes('invalid') || fileService.error.includes('reserved')}
			class:border-yellow-600={fileService.error.includes('Unsupported') || fileService.error.includes('invalid') || fileService.error.includes('reserved')}
			class:text-yellow-800={fileService.error.includes('Unsupported') || fileService.error.includes('invalid') || fileService.error.includes('reserved')}
		>
			<div class="flex items-start gap-2 flex-1">
				<span class="leading-none">
					<XCircle class="w-5 h-5 text-secondary" />
				</span>
				<span class="flex-1 leading-relaxed">{fileService.error}</span>
			</div>
			<button 
				onclick={() => fileService.clearError()} 
				class="bg-none border-none 
				       text-current cursor-pointer 
				       text-lg p-0 
				       opacity-70 transition-opacity duration-200 
				       hover:opacity-100" 
				title="Clear error"
			>
				✕
			</button>
		</div>
	{/if}

	{#if fileService.currentFile}
		<div 
			class="bg-bg 
			       p-4 rounded-xl 
			       my-2 
			       border border-border-muted 
			       shadow-soft"
		>
			<h3 class="mb-4 text-text text-lg flex items-center gap-2">
				<Folder class="w-5 h-5 text-primary" />
				Current File
			</h3>
			<div 
				class="flex flex-col 
				       gap-3 
				       mb-4"
			>
				<div class="flex items-start gap-2">
					<span class="min-w-20 font-medium text-text-muted text-sm flex items-center gap-1">
						<FileText class="w-3 h-3" />
						Name:
					</span>
					<span class="flex-1 text-text text-sm wrap-break-word">{fileService.currentFile.name}</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="min-w-20 font-medium text-text-muted text-sm flex items-center gap-1">
						<Folder class="w-3 h-3" />
						Path:
					</span>
					<span 
						class="flex-1 text-text text-xs font-mono 
						       bg-bg px-2 py-1 rounded 
						       border border-surface/20 
						       overflow-hidden text-ellipsis whitespace-nowrap" 
						title={fileService.currentFile.path}
					>
						{fileService.currentFile.path}
					</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="min-w-20 font-medium text-text/70 text-sm">🏷️ Type:</span>
					<span class="flex-1 text-text text-sm wrap-break-word">{fileService.currentFile.extension.toUpperCase()}</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="min-w-20 font-medium text-text/70 text-sm">📏 Size:</span>
					<span class="flex-1 text-text text-sm wrap-break-word">{fileService.currentFile.formattedSize}</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="min-w-20 font-medium text-text/70 text-sm">🕒 Modified:</span>
					<span class="flex-1 text-text text-sm wrap-break-word">{fileService.currentFile.lastModified.toLocaleString()}</span>
				</div>
			</div>
			<button 
				onclick={() => fileService.clearFile()} 
				class="bg-accent text-bg 
				       border-none 
				       px-3 py-2 rounded 
				       cursor-pointer text-sm 
				       transition-colors duration-200 
				       hover:bg-accent/80"
			>
				Clear File
			</button>
		</div>
	{/if}
</div>


