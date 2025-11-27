<script lang="ts">
	import { onMount } from 'svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import DefaultState from '$lib/components/DefaultState.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { setupGlobalErrorHandling } from '$lib/utils/logger';

	const fileService = getFileService();

	onMount(() => {
		setupGlobalErrorHandling();
	});
</script>

<svelte:head>
	<title>Kahveci View - Modern Image Viewer</title>
	<meta name="description" content="A fast, modern image viewer built with Tauri and Svelte" />
</svelte:head>

<div class="app-layout">
	<Toolbar />
	
	<main class="main-content">
		{#if fileService.currentFile}
			<ImageViewer />
		{:else}
			<DefaultState />
		{/if}
	</main>

	<StatusBar />
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
		background: #101010;
		color: #ffffff;
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		background: #101010;
	}

	.main-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #101010;
		padding: 20px;
		overflow: hidden;
		position: relative;
	}

	/* Ensure proper scrolling on smaller screens */
	@media (max-height: 600px) {
		.main-content {
			padding: 10px;
		}
	}
</style>
