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
	class="default-state"
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={handleOpenImage}
	onkeydown={(e) => e.key === 'Enter' && handleOpenImage()}
>
	<div class="default-content">
		<div class="welcome-section">
			<div class="icon-container">
				<div class="app-icon">🖼️</div>
			</div>
			<div class="text-content">
				<h2 class="welcome-title">Welcome to Kahveci View</h2>
				<p class="welcome-subtitle">Click here or drag & drop an image to get started</p>
			</div>
		</div>
		
		<button class="cta-button" onclick={handleOpenImage}>
			<span class="button-icon">📁</span>
			Open Image
		</button>

		<div class="supported-formats">
			<p class="formats-title">Supported formats:</p>
			<p class="formats-list">JPG, PNG, GIF, WebP, BMP, TIFF, SVG</p>
		</div>

		<div class="quick-actions">
			<div class="action-hint">
				<span class="hint-icon">⌨️</span>
				<span class="hint-text">Press Ctrl+O to open</span>
			</div>
			<div class="action-hint">
				<span class="hint-icon">🖱️</span>
				<span class="hint-text">Drag & drop supported</span>
			</div>
		</div>
	</div>
</div>

<style>
	.default-state {
		display: flex;
		align-items: center;
		justify-content: center;
        padding: 25px;
		margin: auto;
		background: #1a1a1a;
		border: 2px dashed #333333;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.default-state:hover {
		border-color: #555555;
		background: #2a2a2a;
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(255, 255, 255, 0.05);
	}

	.default-state:active {
		transform: translateY(0);
		box-shadow: 0 4px 15px rgba(255, 255, 255, 0.03);
	}

	.default-content {
		text-align: center;
		padding: 32px;
		max-width: 320px;
		width: 100%;
	}

	.welcome-section {
		margin-bottom: 24px;
	}

	.icon-container {
		margin-bottom: 16px;
	}

	.app-icon {
		font-size: 3.5rem;
		display: inline-block;
		margin: 0;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.text-content {
		margin: 0;
	}

	.welcome-title {
		margin: 0 0 8px 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.2;
	}

	.welcome-subtitle {
		margin: 0 0 24px 0;
		font-size: 0.95rem;
		color: #aaaaaa;
		line-height: 1.4;
		font-weight: 400;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: #333333;
		color: #ffffff;
		border: 1px solid #555555;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.cta-button:hover {
		background: #444444;
		border-color: #666666;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.cta-button:active {
		transform: translateY(0);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
	}

	.button-icon {
		font-size: 1.1rem;
	}

	.supported-formats {
		margin-bottom: 20px;
		padding: 12px 16px;
		background: #222222;
		border-radius: 6px;
		border: 1px solid #333333;
	}

	.formats-title {
		margin: 0 0 4px 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: #ffffff;
	}

	.formats-list {
		margin: 0;
		font-size: 0.75rem;
		color: #aaaaaa;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		letter-spacing: 0.5px;
	}

	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.action-hint {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: #888888;
		justify-content: center;
	}

	.hint-icon {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.hint-text {
		font-weight: 500;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.default-state {
			padding: 20px;
		}

		.default-content {
			padding: 30px;
		}

		.welcome-title {
			font-size: 1.3rem;
		}

		.app-icon {
			font-size: 3rem;
			margin-bottom: 1rem;
		}
	}

	@media (max-width: 480px) {
		.default-state {
			padding: 15px;
		}

		.default-content {
			padding: 20px;
		}

		.welcome-title {
			font-size: 1.2rem;
		}

		.welcome-subtitle {
			font-size: 0.9rem;
		}

		.quick-actions {
			display: none;
		}
	}
</style>
