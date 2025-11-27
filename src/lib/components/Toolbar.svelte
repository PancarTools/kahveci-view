<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { logger } from '$lib/utils/logger';

	const fileService = getFileService();

	async function handleOpenImage() {
		logger.debug("Toolbar open image button clicked", "TOOLBAR");
		await fileService.openFile();
	}
</script>

<div class="toolbar">
	<div class="toolbar-left">
		<button 
			class="toolbar-button open-button"
			onclick={handleOpenImage}
			disabled={fileService.isLoading}
			title="Open Image (Ctrl+O)"
		>
			<span class="button-icon">📁</span>
			<span class="button-text">Open Image</span>
		</button>
	</div>

	<div class="toolbar-center">
		<h1 class="app-title">Kahveci View</h1>
	</div>

	<div class="toolbar-right">
		<!-- Future: zoom controls, theme toggle, etc. -->
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		background: #1a1a1a;
		border-bottom: 1px solid #333333;
		padding: 0 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 10;
	}

	.toolbar-left,
	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 0 0 auto;
		min-width: 150px;
	}

	.toolbar-center {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.app-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #ffffff;
		user-select: none;
	}

	.toolbar-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border: 1px solid #333333;
		border-radius: 6px;
		background: #2a2a2a;
		color: #ffffff;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.toolbar-button:hover:not(:disabled) {
		background: #3a3a3a;
		border-color: #555555;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.toolbar-button:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.toolbar-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.button-icon {
		font-size: 16px;
		line-height: 1;
	}

	.button-text {
		white-space: nowrap;
	}

	.open-button:hover:not(:disabled) {
		background: #4a4a4a;
		border-color: #666666;
		color: #ffffff;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.toolbar {
			height: 48px;
			padding: 0 12px;
		}

		.toolbar-left,
		.toolbar-right {
			min-width: 120px;
		}

		.app-title {
			font-size: 1rem;
		}

		.toolbar-button {
			padding: 6px 12px;
			font-size: 13px;
		}

		.button-text {
			display: none;
		}

		.button-icon {
			font-size: 18px;
		}
	}
</style>
