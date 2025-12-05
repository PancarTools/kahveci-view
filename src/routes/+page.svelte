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
		
		// Auto-load test image after 2 seconds
		setTimeout(async () => {
			const testImagePath = "/Users/utkutekalmaz/Downloads/0968goz_001115/Export JPG 16Base/aaa.JPG";
			await fileService.openFileByPath(testImagePath);
		}, 500);
	});
</script>

<svelte:head>
	<title>KahveciView - Modern Image Viewer</title>
	<meta name="description" content="A fast, modern image viewer built with Tauri and Svelte" />
</svelte:head>

<div class="flex flex-col h-screen w-screen bg-brand-dark text-brand-white">
	<Toolbar />
	
	<main class="flex-1 flex items-center justify-center p-8 overflow-hidden relative bg-brand-dark">
		{#if fileService.currentFile}
			<ImageViewer />
		{:else}
			<DefaultState />
		{/if}
	</main>

	<StatusBar />
</div>
