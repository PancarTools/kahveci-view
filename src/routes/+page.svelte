<script lang="ts">
	import { onMount } from 'svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import DefaultState from '$lib/components/DefaultState.svelte';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { setupGlobalErrorHandling } from '$lib/utils/logger';

	const fileService = getFileService();
	const navStore = getNavigationStore();

	onMount(() => {
		setupGlobalErrorHandling();
		
		// Auto-load test image after 500ms (development only)
		setTimeout(async () => {
			const testImagePath = "/Users/utkutekalmaz/Downloads/0968goz_001115/Export JPG 16Base/aaa.JPG";
			await fileService.openFileByPath(testImagePath);
		}, 500);
	});

	// Keyboard navigation handler
	async function handleKeydown(event: KeyboardEvent) {
		// Don't handle if modifier keys are pressed (except for shortcuts)
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		
		// Don't handle if user is typing in an input
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				const prevPath = navStore.goPrev();
				if (prevPath) {
					await fileService.openFileByPath(prevPath, true);
				}
				break;

			case 'ArrowRight':
				event.preventDefault();
				const nextPath = navStore.goNext();
				if (nextPath) {
					await fileService.openFileByPath(nextPath, true);
				}
				break;

			case 'Home':
				event.preventDefault();
				const firstPath = navStore.goFirst();
				if (firstPath) {
					await fileService.openFileByPath(firstPath, true);
				}
				break;

			case 'End':
				event.preventDefault();
				const lastPath = navStore.goLast();
				if (lastPath) {
					await fileService.openFileByPath(lastPath, true);
				}
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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
