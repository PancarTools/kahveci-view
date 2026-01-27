<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { getViewerControls } from '$lib/stores/viewerControls.svelte';
	import { getNavigationStore } from '$lib/stores/navigationStore.svelte';
	import { getColorPicker } from '$lib/stores/colorPicker.svelte';
	import { logger } from '$lib/utils/logger';
	import { 
		FolderOpen, Save, Printer, FolderTree,
		Undo, Redo, MousePointer, SquareDashed, Copy, Clipboard, Scissors, Crop,
		RotateCcw, RotateCw,
		FlipHorizontal, FlipVertical,
		ZoomIn, ZoomOut, Maximize, Square,
		ChevronLeft, ChevronRight,
		Minus, WindowSquare, X
	} from '$lib/icons';

	const fileService = getFileService();
	const viewerControls = getViewerControls();
	const navStore = getNavigationStore();
	const colorPicker = getColorPicker();

	async function handleOpenImage() {
		logger.debug("Toolbar open image button clicked", "TOOLBAR");
		await fileService.openFile();
	}

	// Mock handlers for future features
	function handleSave() { logger.debug("Save clicked (mock)", "TOOLBAR"); }
	function handlePrint() { logger.debug("Print clicked (mock)", "TOOLBAR"); }
	function handleOpenFolder() { logger.debug("Open folder clicked (mock)", "TOOLBAR"); }
	function handleUndo() { logger.debug("Undo clicked (mock)", "TOOLBAR"); }
	function handleRedo() { logger.debug("Redo clicked (mock)", "TOOLBAR"); }
	function handlePointerMode() {
		colorPicker.setSelectionMode('pointer');
		logger.debug('Selection mode set to: pointer', "TOOLBAR");
	}

	function handleSelectMode() {
		colorPicker.setSelectionMode('select');
		logger.debug('Selection mode set to: select', "TOOLBAR");
	}
	function handleCopy() { logger.debug("Copy clicked (mock)", "TOOLBAR"); }
	function handlePaste() { logger.debug("Paste clicked (mock)", "TOOLBAR"); }
	function handleCut() { logger.debug("Cut clicked (mock)", "TOOLBAR"); }
	function handleCrop() { logger.debug("Crop clicked (mock)", "TOOLBAR"); }
	function handleRotateLeft() {
		logger.debug("Rotate left clicked", "TOOLBAR");
		viewerControls.rotateLeft();
	}
	function handleRotateRight() {
		logger.debug("Rotate right clicked", "TOOLBAR");
		viewerControls.rotateRight();
	}
	function handleFlipHorizontal() {
		logger.debug("Flip horizontal clicked", "TOOLBAR");
		viewerControls.flipHorizontal();
	}
	function handleFlipVertical() {
		logger.debug("Flip vertical clicked", "TOOLBAR");
		viewerControls.flipVertical();
	}

	// Zoom controls
	function handleZoomIn() {
		logger.debug("Zoom in clicked", "TOOLBAR");
		viewerControls.zoomIn();
	}
	function handleZoomOut() {
		logger.debug("Zoom out clicked", "TOOLBAR");
		viewerControls.zoomOut();
	}
	function handleFitToWindow() {
		logger.debug("Fit to window clicked", "TOOLBAR");
		viewerControls.fitToWindow();
	}
	function handleActualSize() {
		logger.debug("Actual size (100%) clicked", "TOOLBAR");
		viewerControls.actualSize();
	}

	// Navigation controls
	async function handlePrevImage() {
		logger.debug("Previous image clicked", "TOOLBAR");
		const prevPath = navStore.goPrev();
		if (prevPath) {
			await fileService.openFileByPath(prevPath, true); // Skip folder scan
		}
	}

	async function handleNextImage() {
		logger.debug("Next image clicked", "TOOLBAR");
		const nextPath = navStore.goNext();
		if (nextPath) {
			await fileService.openFileByPath(nextPath, true); // Skip folder scan
		}
	}

	// Window controls
	async function handleMinimize() { 
		const { getCurrentWindow } = await import('@tauri-apps/api/window');
		await getCurrentWindow().minimize();
	}
	async function handleMaximize() { 
		const { getCurrentWindow } = await import('@tauri-apps/api/window');
		await getCurrentWindow().toggleMaximize();
	}
	async function handleClose() { 
		const { getCurrentWindow } = await import('@tauri-apps/api/window');
		await getCurrentWindow().close();
	}

	// Window drag handler using our custom command
	async function handleDragStart(event: MouseEvent) {
		// Check if the click originated from a button or interactive element
		const target = event.target as HTMLElement;
		if (target.closest('button') || target.closest('[role="button"]')) {
			return; // Don't start drag if clicking on a button
		}

		// Prevent default behavior and stop event propagation
		event.preventDefault();
		event.stopPropagation();
		
		try {
			const { invoke } = await import('@tauri-apps/api/core');
			await invoke('start_drag');
		} catch (error) {
			console.error('Failed to start window drag:', error);
		}
	}

	// Shared button styles - minimal with hover background
	const buttonClass = `
		flex items-center justify-center
		w-8 h-8 
		text-brand-muted 
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-brand-light hover:text-brand-white rounded-md
		active:scale-95 
		disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
	`.trim().replace(/\s+/g, ' ');

	// Icon size for toolbar buttons
	const iconClass = "w-4.5 h-4.5";

	// macOS-style window control button styles with semantic colors
	const macOSCloseButtonClass = `
		flex items-center justify-center
		w-3 h-3 
		bg-traffic-red text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-red-hover hover:text-traffic-red-text rounded-full
		active:scale-90
		border border-traffic-red-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');
	
	const macOSMinimizeButtonClass = `
		flex items-center justify-center
		w-3 h-3 
		bg-traffic-yellow text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-yellow-hover hover:text-traffic-yellow-text rounded-full
		active:scale-90
		border border-traffic-yellow-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');
	
	const macOSMaximizeButtonClass = `
		flex items-center justify-center
		w-3 h-3 
		bg-traffic-green text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-green-hover hover:text-traffic-green-text rounded-full
		active:scale-90
		border border-traffic-green-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');

	// Icon size for traffic light buttons
	const trafficIconClass = "w-2.5 h-2.5";
</script>

<!-- Toolbar with custom drag handling -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div 
	class="flex items-center justify-between 
	       h-16 
	       bg-brand-darker border-b border-brand-subtle 
	       px-6 relative z-10 cursor-move"
	onmousedown={handleDragStart}
	role="application"
	tabindex="-1"
	aria-label="Application toolbar - drag to move window"
>
	<!-- Left: App Title -->
	<div class="flex items-center gap-1 flex-none" role="presentation">
		<h1 class="text-sm font-medium text-brand-muted select-none">KahveciView</h1>
	</div>

	<!-- Center: File Operations Group -->
	<div class="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 cursor-pointer" onmousedown={(e) => e.stopPropagation()} role="toolbar" aria-label="File and edit operations" tabindex="0">
		<button 
			class={buttonClass}
			onclick={handleOpenImage}
			disabled={fileService.isLoading}
			title="Open Image (Ctrl+O)"
		>
			<FolderOpen class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleSave}
			disabled={!fileService.currentFile}
			title="Save (Ctrl+S)"
		>
			<Save class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handlePrint}
			disabled={!fileService.currentFile}
			title="Print (Ctrl+P)"
		>
			<Printer class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleOpenFolder}
			title="Open Folder (Gallery View)"
		>
			<FolderTree class={iconClass} />
		</button>

		<!-- Separator -->
		<div class="w-px h-5 bg-brand-subtle mx-2"></div>

		<!-- Edit Operations Group -->
		<button 
			class={buttonClass}
			onclick={handleUndo}
			disabled={true}
			title="Undo (Ctrl+Z)"
		>
			<Undo class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRedo}
			disabled={true}
			title="Redo (Ctrl+Y)"
		>
			<Redo class={iconClass} />
		</button>

		<button 
			class={`${buttonClass} ${colorPicker.selectionMode === 'pointer' ? 'bg-brand-light text-brand-primary' : ''}`}
			onclick={handlePointerMode}
			title="Pointer Mode - Pan and navigate"
		>
			<MousePointer class={iconClass} />
		</button>

		<button 
			class={`${buttonClass} ${colorPicker.selectionMode === 'select' ? 'bg-brand-light text-brand-primary' : ''}`}
			onclick={handleSelectMode}
			title="Select Mode - Create and edit selections"
		>
			<SquareDashed class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCopy}
			disabled={!fileService.currentFile}
			title="Copy (Ctrl+C)"
		>
			<Copy class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handlePaste}
			disabled={true}
			title="Paste (Ctrl+V)"
		>
			<Clipboard class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCut}
			disabled={!fileService.currentFile}
			title="Cut (Ctrl+X)"
		>
			<Scissors class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCrop}
			disabled={!fileService.currentFile}
			title="Crop"
		>
			<Crop class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRotateLeft}
			disabled={!fileService.currentFile}
			title="Rotate Left (Ctrl+L)"
		>
			<RotateCcw class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRotateRight}
			disabled={!fileService.currentFile}
			title="Rotate Right (Ctrl+R)"
		>
			<RotateCw class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleFlipHorizontal}
			disabled={!fileService.currentFile}
			title="Flip Horizontal"
		>
			<FlipHorizontal class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleFlipVertical}
			disabled={!fileService.currentFile}
			title="Flip Vertical"
		>
			<FlipVertical class={iconClass} />
		</button>

		<!-- Separator -->
		<div class="w-px h-5 bg-brand-subtle mx-2"></div>

		<!-- Zoom Controls Group -->
		<button 
			class={buttonClass}
			onclick={handleZoomOut}
			disabled={!fileService.currentFile}
			title="Zoom Out"
		>
			<ZoomOut class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleZoomIn}
			disabled={!fileService.currentFile}
			title="Zoom In"
		>
			<ZoomIn class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleFitToWindow}
			disabled={!fileService.currentFile}
			title="Fit to Window"
		>
			<Maximize class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleActualSize}
			disabled={!fileService.currentFile}
			title="Actual Size (100%)"
		>
			<Square class={iconClass} />
		</button>

		<!-- Separator -->
		<div class="w-px h-5 bg-brand-subtle mx-2"></div>

		<!-- Navigation Controls Group -->
		<button 
			class={buttonClass}
			onclick={handlePrevImage}
			disabled={!navStore.canGoPrev}
			title="Previous Image (←)"
		>
			<ChevronLeft class={iconClass} />
		</button>

		<button 
			class={buttonClass}
			onclick={handleNextImage}
			disabled={!navStore.canGoNext}
			title="Next Image (→)"
		>
			<ChevronRight class={iconClass} />
		</button>
	</div>

	<!-- Right: macOS-style Traffic Light Controls (Windows positioning twist!) -->
	<div class="flex items-center gap-2 flex-none" onmousedown={(e) => e.stopPropagation()} role="presentation">
		<button 
			class={macOSMinimizeButtonClass}
			onclick={handleMinimize}
			title="Minimize"
		>
			<Minus class={trafficIconClass} />
		</button>
		
		<button 
			class={macOSMaximizeButtonClass}
			onclick={handleMaximize}
			title="Maximize"
		>
			<WindowSquare class={trafficIconClass} />
		</button>
		
		<button 
			class={macOSCloseButtonClass}
			onclick={handleClose}
			title="Close"
		>
			<X class={trafficIconClass} />
		</button>
	</div>
</div>