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

<div class="flex flex-col h-screen w-screen bg-bg">
	<Toolbar />
	
	<main class="flex-1 flex items-center justify-center bg-bg p-5 overflow-hidden relative">
		{#if fileService.currentFile}
			<ImageViewer />
		{:else}
			<DefaultState />
		{/if}
	</main>

	<StatusBar />
</div>
