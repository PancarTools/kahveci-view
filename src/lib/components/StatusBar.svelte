<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';

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

<div class="status-bar">
	<div class="status-left">
		{#if fileService.currentFile}
			<span class="file-path" title={fileService.currentFile.path}>
				📂 {getDisplayPath(fileService.currentFile.path)}
			</span>
		{:else}
			<span class="no-file">No image loaded</span>
		{/if}
	</div>

	<div class="status-center">
		{#if fileService.currentFile}
			<div class="image-info">
				<span class="dimensions">
					📐 {fileService.currentFile.name}
				</span>
				<span class="separator">•</span>
				<span class="format">
					{fileService.currentFile.extension.toUpperCase()}
				</span>
				<span class="separator">•</span>
				<span class="size">
					{fileService.currentFile.formattedSize}
				</span>
			</div>
		{/if}
	</div>

	<div class="status-right">
		<span class="app-status">
			{#if fileService.isLoading}
				⏳ Loading...
			{:else if fileService.error}
				❌ Error
			{:else if fileService.currentFile}
				✅ Ready
			{:else}
				💤 Idle
			{/if}
		</span>
		<span class="separator">•</span>
		<span class="timestamp">{getCurrentTime()}</span>
	</div>
</div>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 32px;
		background: #1a1a1a;
		border-top: 1px solid #333333;
		padding: 0 16px;
		font-size: 12px;
		color: #cccccc;
		user-select: none;
		position: relative;
		z-index: 10;
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 0 0 auto;
		min-width: 150px;
	}

	.status-center {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		overflow: hidden;
	}

	.image-info {
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-path {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-size: 11px;
		color: #cccccc;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.no-file {
		font-style: italic;
		color: #888888;
	}

	.dimensions {
		font-weight: 500;
		color: #cccccc;
	}

	.format {
		font-weight: 600;
		color: #ffffff;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	}

	.size {
		color: #cccccc;
		font-weight: 500;
	}

	.separator {
		color: #666666;
		font-weight: normal;
	}

	.app-status {
		font-weight: 500;
	}

	.timestamp {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-size: 11px;
		color: #cccccc;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.status-bar {
			height: 28px;
			padding: 0 12px;
			font-size: 11px;
		}

		.status-left,
		.status-right {
			min-width: 100px;
		}

		.file-path {
			max-width: 120px;
			font-size: 10px;
		}

		.timestamp {
			display: none;
		}

		.image-info {
			gap: 4px;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		.status-center {
			display: none;
		}

		.status-left,
		.status-right {
			flex: 1;
		}
	}
</style>
