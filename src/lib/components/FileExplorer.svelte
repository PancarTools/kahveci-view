<script>
	import { getFileService } from '$lib/stores/fileService.svelte';

	const fileService = getFileService();

	async function handleOpenFile() {
		const file = await fileService.openFile();
		if (file) {
			console.log(`Opened file: ${file.name}`);
		}
	}
</script>

<div class="file-explorer">
	<div class="controls">
		<button 
			onclick={handleOpenFile} 
			disabled={fileService.isLoading}
			class="open-button"
		>
			{fileService.isLoading ? 'Opening...' : 'Open Image'}
		</button>
	</div>

	{#if fileService.error}
		<div class="error" class:validation-error={fileService.error.includes('Unsupported') || fileService.error.includes('invalid') || fileService.error.includes('reserved')}>
			<div class="error-content">
				<span class="error-icon">
					{#if fileService.error.includes('Unsupported') || fileService.error.includes('format')}
						⚠️
					{:else if fileService.error.includes('invalid') || fileService.error.includes('unsafe')}
						🚫
					{:else}
						❌
					{/if}
				</span>
				<span class="error-message">{fileService.error}</span>
			</div>
			<button onclick={() => fileService.clearError()} class="clear-error" title="Clear error">✕</button>
		</div>
	{/if}

	{#if fileService.currentFile}
		<div class="file-info">
			<h3>📁 Current File</h3>
			<div class="file-details">
				<div class="file-detail-row">
					<span class="detail-label">📄 Name:</span>
					<span class="detail-value">{fileService.currentFile.name}</span>
				</div>
				<div class="file-detail-row">
					<span class="detail-label">📂 Path:</span>
					<span class="detail-value file-path" title={fileService.currentFile.path}>{fileService.currentFile.path}</span>
				</div>
				<div class="file-detail-row">
					<span class="detail-label">🏷️ Type:</span>
					<span class="detail-value">{fileService.currentFile.extension.toUpperCase()}</span>
				</div>
				<div class="file-detail-row">
					<span class="detail-label">📏 Size:</span>
					<span class="detail-value">{fileService.currentFile.formattedSize}</span>
				</div>
				<div class="file-detail-row">
					<span class="detail-label">🕒 Modified:</span>
					<span class="detail-value">{fileService.currentFile.lastModified.toLocaleString()}</span>
				</div>
			</div>
			<button onclick={() => fileService.clearFile()} class="clear-file">Clear File</button>
		</div>
	{/if}
</div>

<style>
	.file-explorer {
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.controls {
		margin-bottom: 1rem;
	}

	.open-button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.open-button:hover:not(:disabled) {
		background: #005a9e;
	}

	.open-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		background: #ffe6e6;
		border-left: 4px solid #d63031;
		color: #d63031;
		padding: 0.75rem;
		border-radius: 4px;
		margin: 0.5rem 0;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		box-shadow: 0 2px 4px rgba(214, 48, 49, 0.1);
	}

	.error.validation-error {
		background: #fff3cd;
		border-left-color: #856404;
		color: #856404;
		box-shadow: 0 2px 4px rgba(133, 100, 4, 0.1);
	}

	.error-content {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		flex: 1;
	}

	.error-icon {
		font-size: 1.1rem;
		line-height: 1;
	}

	.error-message {
		flex: 1;
		line-height: 1.4;
	}

	.clear-error {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.clear-error:hover {
		opacity: 1;
	}

	.file-info {
		background: #f0f8ff;
		padding: 1rem;
		border-radius: 8px;
		margin: 0.5rem 0;
		border: 1px solid #e3f2fd;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.file-info h3 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
		font-size: 1.1rem;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.file-detail-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.detail-label {
		min-width: 80px;
		font-weight: 500;
		color: #555;
		font-size: 0.9rem;
	}

	.detail-value {
		flex: 1;
		color: #333;
		word-break: break-word;
		font-size: 0.9rem;
	}

	.file-path {
		font-family: monospace;
		font-size: 0.8rem;
		background: #f8f9fa;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		border: 1px solid #dee2e6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.clear-file {
		background: #e74c3c;
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.clear-file:hover {
		background: #c0392b;
	}
</style>
