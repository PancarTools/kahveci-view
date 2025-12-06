// Zoom state store for image viewer
// Manages zoom level, pan offset, and zoom modes following Apple Preview behavior

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 10; // 1000%
const ZOOM_STEP = 1.025; // Multiplicative zoom step per wheel tick (2.5% per step for precise control)

type ZoomMode = "fit" | "actual" | "free";
type ZoomCommand = "zoomIn" | "zoomOut" | "fitToWindow" | "actualSize" | null;

interface ImageDimensions {
	width: number;
	height: number;
}

interface ContainerDimensions {
	width: number;
	height: number;
}

class ZoomState {
	// Core state
	scale = $state(1);
	offsetX = $state(0);
	offsetY = $state(0);
	mode = $state<ZoomMode>("fit");

	// Command queue for animated transitions (consumed by ImageViewer)
	pendingCommand = $state<ZoomCommand>(null);

	// Image and container dimensions (needed for calculations)
	private imageWidth = 0;
	private imageHeight = 0;
	private containerWidth = 0;
	private containerHeight = 0;

	// Derived values
	get percentage(): string {
		return `${Math.round(this.scale * 100)}%`;
	}

	get canZoomIn(): boolean {
		return this.scale < MAX_ZOOM;
	}

	get canZoomOut(): boolean {
		return this.scale > MIN_ZOOM;
	}

	get isPannable(): boolean {
		// Can only pan when image is larger than container
		const scaledWidth = this.imageWidth * this.scale;
		const scaledHeight = this.imageHeight * this.scale;
		return scaledWidth > this.containerWidth || scaledHeight > this.containerHeight;
	}

	/**
	 * Update stored dimensions for calculations
	 */
	setDimensions(image: ImageDimensions, container: ContainerDimensions) {
		this.imageWidth = image.width;
		this.imageHeight = image.height;
		this.containerWidth = container.width;
		this.containerHeight = container.height;
	}

	/**
	 * Zoom centered on a specific point (cursor position)
	 * This keeps the point under the cursor fixed while zooming
	 */
	zoomToPoint(zoomIn: boolean, cursorX: number, cursorY: number) {
		const zoomFactor = zoomIn ? ZOOM_STEP : 1 / ZOOM_STEP;
		const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.scale * zoomFactor));

		if (newScale === this.scale) return; // At zoom limit

		// Calculate new offset to keep cursor point fixed
		// Formula: newOffset = cursor - (cursor - oldOffset) * (newScale / oldScale)
		const scaleRatio = newScale / this.scale;
		const newOffsetX = cursorX - (cursorX - this.offsetX) * scaleRatio;
		const newOffsetY = cursorY - (cursorY - this.offsetY) * scaleRatio;

		this.scale = newScale;
		this.offsetX = newOffsetX;
		this.offsetY = newOffsetY;
		this.mode = "free";

		// Apply boundary clamping
		this.clampOffset();
	}

	/**
	 * Zoom in/out centered on the image center (for toolbar buttons)
	 */
	zoomCenter(zoomIn: boolean) {
		const centerX = this.containerWidth / 2;
		const centerY = this.containerHeight / 2;
		this.zoomToPoint(zoomIn, centerX, centerY);
	}

	/**
	 * Set zoom to fit image within container (maintain aspect ratio)
	 */
	setFitToWindow() {
		if (this.imageWidth === 0 || this.imageHeight === 0) return;
		if (this.containerWidth === 0 || this.containerHeight === 0) return;

		const scaleX = this.containerWidth / this.imageWidth;
		const scaleY = this.containerHeight / this.imageHeight;

		// Use the smaller scale to ensure image fits, but don't upscale small images
		this.scale = Math.min(scaleX, scaleY, 1);

		// Center the image
		const scaledWidth = this.imageWidth * this.scale;
		const scaledHeight = this.imageHeight * this.scale;
		this.offsetX = (this.containerWidth - scaledWidth) / 2;
		this.offsetY = (this.containerHeight - scaledHeight) / 2;

		this.mode = "fit";
	}

	/**
	 * Set zoom to actual size (100%, 1:1 pixel mapping)
	 */
	setActualSize() {
		if (this.imageWidth === 0 || this.imageHeight === 0) return;

		this.scale = 1;

		// Center the image at 100%
		const scaledWidth = this.imageWidth * this.scale;
		const scaledHeight = this.imageHeight * this.scale;
		this.offsetX = (this.containerWidth - scaledWidth) / 2;
		this.offsetY = (this.containerHeight - scaledHeight) / 2;

		this.mode = "actual";

		// Clamp if image is larger than container
		this.clampOffset();
	}

	/**
	 * Pan the image by delta amounts
	 */
	pan(deltaX: number, deltaY: number) {
		if (!this.isPannable) return;

		this.offsetX += deltaX;
		this.offsetY += deltaY;
		this.mode = "free";

		this.clampOffset();
	}

	/**
	 * Clamp offset to prevent image edges from going past viewport edges
	 * When image is smaller than container, center it
	 */
	clampOffset() {
		const scaledWidth = this.imageWidth * this.scale;
		const scaledHeight = this.imageHeight * this.scale;

		// Horizontal clamping
		if (scaledWidth <= this.containerWidth) {
			// Image fits horizontally - center it
			this.offsetX = (this.containerWidth - scaledWidth) / 2;
		} else {
			// Image is wider than container - clamp to edges
			const minX = this.containerWidth - scaledWidth;
			const maxX = 0;
			this.offsetX = Math.max(minX, Math.min(maxX, this.offsetX));
		}

		// Vertical clamping
		if (scaledHeight <= this.containerHeight) {
			// Image fits vertically - center it
			this.offsetY = (this.containerHeight - scaledHeight) / 2;
		} else {
			// Image is taller than container - clamp to edges
			const minY = this.containerHeight - scaledHeight;
			const maxY = 0;
			this.offsetY = Math.max(minY, Math.min(maxY, this.offsetY));
		}
	}

	/**
	 * Reset zoom state to default (fit to window)
	 */
	reset() {
		this.scale = 1;
		this.offsetX = 0;
		this.offsetY = 0;
		this.mode = "fit";
		this.imageWidth = 0;
		this.imageHeight = 0;
		this.containerWidth = 0;
		this.containerHeight = 0;
	}

	/**
	 * Get the scaled image dimensions
	 */
	getScaledDimensions(): { width: number; height: number } {
		return {
			width: this.imageWidth * this.scale,
			height: this.imageHeight * this.scale,
		};
	}

	// Command methods for animated transitions (toolbar buttons)
	requestZoomIn() {
		this.pendingCommand = "zoomIn";
	}

	requestZoomOut() {
		this.pendingCommand = "zoomOut";
	}

	requestFitToWindow() {
		this.pendingCommand = "fitToWindow";
	}

	requestActualSize() {
		this.pendingCommand = "actualSize";
	}

	clearCommand() {
		this.pendingCommand = null;
	}
}

// Singleton pattern following project conventions
const DEFAULT_ZOOM_KEY = Symbol("default_zoom_key");
export const zoomStateStore = new Map<symbol, ZoomState>();

export function getZoomState(key: symbol = DEFAULT_ZOOM_KEY): ZoomState {
	if (!zoomStateStore.has(key)) {
		zoomStateStore.set(key, new ZoomState());
	}
	return zoomStateStore.get(key)!;
}

// Export constants for use in components
export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP };
export type { ZoomMode, ZoomCommand, ImageDimensions, ContainerDimensions };
