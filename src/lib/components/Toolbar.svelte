<script lang="ts">
	import { getFileService } from '$lib/stores/fileService.svelte';
	import { logger } from '$lib/utils/logger';
	import { 
		FolderOpen, Save, Printer, FolderTree,
		Undo, Redo, MousePointer, Copy, Clipboard, Scissors, Crop,
		RotateCcw, RotateCw,
		Minus, WindowSquare, X
	} from '$lib/icons';

	const fileService = getFileService();

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
	function handleSelectMode() { logger.debug("Select mode clicked (mock)", "TOOLBAR"); }
	function handleCopy() { logger.debug("Copy clicked (mock)", "TOOLBAR"); }
	function handlePaste() { logger.debug("Paste clicked (mock)", "TOOLBAR"); }
	function handleCut() { logger.debug("Cut clicked (mock)", "TOOLBAR"); }
	function handleCrop() { logger.debug("Crop clicked (mock)", "TOOLBAR"); }
	function handleRotateLeft() { logger.debug("Rotate left clicked (mock)", "TOOLBAR"); }
	function handleRotateRight() { logger.debug("Rotate right clicked (mock)", "TOOLBAR"); }

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

	// macOS-style window control button styles with semantic colors
	const macOSCloseButtonClass = `
		flex items-center justify-center
		w-3.5 h-3.5 
		bg-traffic-red text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-red-hover hover:text-traffic-red-text rounded-full
		active:scale-90
		border border-traffic-red-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');
	
	const macOSMinimizeButtonClass = `
		flex items-center justify-center
		w-3.5 h-3.5 
		bg-traffic-yellow text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-yellow-hover hover:text-traffic-yellow-text rounded-full
		active:scale-90
		border border-traffic-yellow-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');
	
	const macOSMaximizeButtonClass = `
		flex items-center justify-center
		w-3.5 h-3.5 
		bg-traffic-green text-transparent
		cursor-pointer transition-all duration-200 ease-out 
		hover:bg-traffic-green-hover hover:text-traffic-green-text rounded-full
		active:scale-90
		border border-traffic-green-hover/30 shadow-sm
	`.trim().replace(/\s+/g, ' ');
</script>

<!-- Toolbar with custom drag handling -->
<div 
	class="flex items-center justify-between 
	       h-16 
	       bg-brand-darker border-b border-brand-subtle 
	       px-6 relative z-10 cursor-move"
	onmousedown={handleDragStart}
	role="banner"
	aria-label="Application toolbar - drag to move window"
>
	<!-- Left: App Title -->
	<div class="flex items-center gap-1 flex-none">
        <h1 class="text-sm font-medium text-brand-muted select-none">KahveciView</h1>
	</div>

	<!-- Center: File Operations Group -->
	<div class="flex items-center gap-1 flex-none">
		<button 
			class={buttonClass}
			onclick={handleOpenImage}
			disabled={fileService.isLoading}
			title="Open Image (Ctrl+O)"
		>
			<FolderOpen class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleSave}
			disabled={!fileService.currentFile}
			title="Save (Ctrl+S)"
		>
			<Save class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handlePrint}
			disabled={!fileService.currentFile}
			title="Print (Ctrl+P)"
		>
			<Printer class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleOpenFolder}
			title="Open Folder (Gallery View)"
		>
			<FolderTree class="w-4 h-4" />
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
			<Undo class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRedo}
			disabled={true}
			title="Redo (Ctrl+Y)"
		>
			<Redo class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleSelectMode}
			title="Select Mode"
		>
			<MousePointer class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCopy}
			disabled={!fileService.currentFile}
			title="Copy (Ctrl+C)"
		>
			<Copy class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handlePaste}
			disabled={true}
			title="Paste (Ctrl+V)"
		>
			<Clipboard class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCut}
			disabled={!fileService.currentFile}
			title="Cut (Ctrl+X)"
		>
			<Scissors class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleCrop}
			disabled={!fileService.currentFile}
			title="Crop"
		>
			<Crop class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRotateLeft}
			disabled={!fileService.currentFile}
			title="Rotate Left (Ctrl+L)"
		>
			<RotateCcw class="w-4 h-4" />
		</button>

		<button 
			class={buttonClass}
			onclick={handleRotateRight}
			disabled={!fileService.currentFile}
			title="Rotate Right (Ctrl+R)"
		>
			<RotateCw class="w-4 h-4" />
		</button>
	</div>

	<!-- Right: macOS-style Traffic Light Controls (Windows positioning twist!) -->
	<div class="flex items-center gap-2 flex-none">
		<button 
			class={macOSMinimizeButtonClass}
			onclick={handleMinimize}
			title="Minimize"
		>
			<Minus class="w-2.5 h-2.5" />
		</button>
		
		<button 
			class={macOSMaximizeButtonClass}
			onclick={handleMaximize}
			title="Maximize"
		>
			<WindowSquare class="w-2.5 h-2.5" />
		</button>
		
		<button 
			class={macOSCloseButtonClass}
			onclick={handleClose}
			title="Close"
		>
			<X class="w-2.5 h-2.5" />
		</button>
	</div>
</div>